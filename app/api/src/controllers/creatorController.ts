import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { invalidateCache } from "../lib/cache";

export class CreatorController {
  /**
   * Get creator details by username
   * GET /api/creators/:username
   */
  async getCreatorByUsername(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: "Username is required",
        });
      }

      // Find the creator by username
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select(
          `
          id,
          username,
          location,
          bio,
          primary_role,
          social_links,
          years_of_experience,
          projects (
            id,
            title,
            description,
            behance_url,
            featured,
            year,
            images (
              id, 
              url,
              alt_text,
              resolutions
            ),
            videos (
              id,
              title,
              vimeo_id,
              youtube_id,
              url,
              description
            )
          )
        `
        )
        .eq("username", username)
        .single();

      if (creatorError) {
        if (creatorError.code === "PGRST116") {
          // Record not found
          return res.status(404).json({
            success: false,
            error: "Creator not found",
          });
        }
        throw creatorError;
      }

      // Add creator_username to each project
      if (creator.projects) {
        creator.projects = creator.projects.map((project) => ({
          ...project,
          creator_username: username,
        }));
      }

      return res.status(200).json({
        success: true,
        data: creator,
      });
    } catch (error: any) {
      logger.error(`Error in getCreatorByUsername: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Get specific project by creator username and project title
   * GET /api/creators/:username/projects/:projectTitle
   */
  async getProjectByTitle(req: AuthenticatedRequest, res: Response) {
    try {
      const { username, projectTitle } = req.params;

      logger.info(
        `Fetching project by title: username=${username}, projectTitle=${projectTitle}`
      );

      if (!username || !projectTitle) {
        logger.warn(
          `Missing parameters: username=${username}, projectTitle=${projectTitle}`
        );
        return res.status(400).json({
          success: false,
          error: "Username and project title are required",
        });
      }

      // First, find the creator by username
      logger.info(`Looking up creator: ${username}`);
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id, username")
        .eq("username", username)
        .single();

      if (creatorError) {
        if (creatorError.code === "PGRST116") {
          logger.warn(`Creator not found: ${username}`);
          return res.status(404).json({
            success: false,
            error: "Creator not found",
          });
        }
        logger.error(`Error fetching creator: ${creatorError.message}`, {
          error: creatorError,
        });
        throw creatorError;
      }

      logger.info(`Found creator: ${creator.username} (${creator.id})`);

      // Get all projects for this creator
      const { data: allProjects, error: allProjectsError } = await supabase
        .from("projects")
        .select(
          `
          id,
          title,
          description,
          behance_url,
          featured,
          year,
          images (
            id, 
            url,
            alt_text,
            resolutions
          ),
          videos (
            id,
            title,
            vimeo_id,
            youtube_id,
            url,
            description
          )
        `
        )
        .eq("creator_id", creator.id);

      if (allProjectsError) {
        logger.error(
          `Error fetching all projects: ${allProjectsError.message}`,
          { error: allProjectsError }
        );
        throw allProjectsError;
      }

      if (!allProjects || allProjects.length === 0) {
        logger.warn(`No projects found for creator: ${creator.username}`);
        return res.status(404).json({
          success: false,
          error: "No projects found for this creator",
        });
      }

      logger.info(
        `Found ${allProjects.length} projects for creator ${creator.username}`
      );

      // Log all project titles to help with debugging
      logger.info(`Available projects:`, {
        projects: allProjects.map((p) => `${p.id}: ${p.title}`),
      });

      // Normalize the project title for search
      const normalizedTitle = projectTitle.replace(/-/g, " ").toLowerCase();
      logger.info(
        `Looking for project with normalized title: "${normalizedTitle}"`
      );

      // Try different matching strategies

      // 1. Exact match (case insensitive)
      let project = allProjects.find(
        (p) => p.title.toLowerCase() === normalizedTitle
      );

      // 2. If no exact match, try slug match (convert title to slug and compare)
      if (!project) {
        logger.info(`No exact match found, trying slug matching`);
        project = allProjects.find((p) => {
          const projectSlug = p.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");
          return projectSlug === projectTitle.toLowerCase();
        });
      }

      // 3. If still no match, try partial match
      if (!project) {
        logger.info(`No slug match found, trying partial matching`);
        project = allProjects.find(
          (p) =>
            p.title.toLowerCase().includes(normalizedTitle) ||
            normalizedTitle.includes(p.title.toLowerCase())
        );
      }

      // 4. If still no match, just return the first project
      if (!project && allProjects.length > 0) {
        logger.warn(`No matching project found, returning first project`);
        project = allProjects[0];
      }

      if (!project) {
        logger.warn(
          `No project found for creator ${creator.username} after all matching attempts`
        );
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      logger.info(`Found project: ${project.title} (${project.id})`);

      // Add creator_username to the project
      const projectWithUsername = {
        ...project,
        creator_username: username,
      };

      return res.status(200).json({
        success: true,
        data: {
          creator: {
            id: creator.id,
            username: creator.username,
          },
          project: projectWithUsername,
        },
      });
    } catch (error: any) {
      logger.error(`Error in getProjectByTitle: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Delete a project image (owner only)
   * DELETE /api/creators/projects/:projectId/images/:imageId
   */
  async deleteProjectImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // First check if the project exists and belongs to the user
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      // Check if the project belongs to a creator owned by the user
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id, user_id")
        .eq("id", project.creator_id)
        .single();

      if (creatorError || creator.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to delete this image",
        });
      }

      // Check if the image exists and belongs to the project
      const { data: image, error: imageError } = await supabase
        .from("images")
        .select("id, project_id")
        .eq("id", imageId)
        .eq("project_id", projectId)
        .single();

      if (imageError) {
        return res.status(404).json({
          success: false,
          error: "Image not found or does not belong to the specified project",
        });
      }

      // Delete the image
      const { error: deleteError } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        logger.error(`Error deleting project image: ${deleteError.message}`, {
          error: deleteError,
        });
        return res.status(500).json({
          success: false,
          error: "Failed to delete project image",
        });
      }

      // Invalidate cache for the creator
      invalidateCache(`creator_username_${creator.id}`);

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error in deleteProjectImage: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
