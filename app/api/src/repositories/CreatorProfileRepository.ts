import { supabase } from "../lib/supabase";
import { CreatorProfile, CreatorProject } from "../models/CreatorProject";
import logger from "../config/logger";

export class CreatorProfileRepository {
  /**
   * Get a creator profile by username
   */
  async getByUsername(username: string): Promise<CreatorProfile | null> {
    try {
      const { data, error } = await supabase
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

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found
          return null;
        }
        throw error;
      }

      // Add creator_username to each project
      if (data.projects) {
        data.projects = data.projects.map((project) => ({
          ...project,
          creator_username: username,
        }));
      }

      return data;
    } catch (error) {
      logger.error(`Error fetching creator by username: ${error}`);
      throw error;
    }
  }

  /**
   * Get a specific project by creator username and project title
   */
  async getProjectByTitle(
    username: string,
    projectTitle: string
  ): Promise<CreatorProject | null> {
    try {
      // First, find the creator by username
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id, username")
        .eq("username", username)
        .single();

      if (creatorError) {
        if (creatorError.code === "PGRST116") {
          return null; // Creator not found
        }
        throw creatorError;
      }

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
        throw allProjectsError;
      }

      if (!allProjects || allProjects.length === 0) {
        return null; // No projects found
      }

      // Normalize the project title for search
      const normalizedTitle = projectTitle.replace(/-/g, " ").toLowerCase();

      // Try different matching strategies
      // 1. Exact match (case insensitive)
      let project = allProjects.find(
        (p) => p.title.toLowerCase() === normalizedTitle
      );

      // 2. If no exact match, try slug match
      if (!project) {
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
        project = allProjects.find(
          (p) =>
            p.title.toLowerCase().includes(normalizedTitle) ||
            normalizedTitle.includes(p.title.toLowerCase())
        );
      }

      // 4. If still no match, just return the first project
      if (!project && allProjects.length > 0) {
        project = allProjects[0];
      }

      if (!project) {
        return null;
      }

      // Add creator_username to the project
      return {
        ...project,
        creator_username: username,
      };
    } catch (error) {
      logger.error(`Error fetching project by title: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a project image
   */
  async deleteProjectImage(
    projectId: string,
    imageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if the project exists and belongs to the user
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          id,
          creators!inner (
            id,
            profile_id
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (projectError) {
        throw projectError;
      }
      // Verify ownership
      if (projectData.creators[0].profile_id !== userId) {
        return false; // Unauthorized
      }

      // Check if the image exists and belongs to the project
      const { data: image, error: imageError } = await supabase
        .from("images")
        .select("url")
        .eq("id", imageId)
        .eq("project_id", projectId)
        .single();

      if (imageError) {
        throw imageError;
      }

      // Extract the file path from the URL
      const url = new URL(image.url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts
        .slice(pathParts.indexOf("media") + 1)
        .join("/");

      // Delete the image from storage
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete the image record
      const { error: deleteError } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      logger.error(`Error deleting project image: ${error}`);
      throw error;
    }
  }
}
