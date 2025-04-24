import { supabase } from "../lib/supabase";
import { CreatorProfile, CreatorProject } from "../models/CreatorProject";
import logger from "../config/logger";
import { invalidateCache } from "../lib/cache";

export class CreatorProfileRepository {
  /**
   * Get a creator profile by username
   * @param username The username to look up
   * @param userId Optional user ID to check ownership
   */
  async getByUsername(
    username: string,
    userId?: string
  ): Promise<CreatorProfile | null> {
    try {
      if (!username) {
        logger.warn("getByUsername called with empty username");
        return null;
      }

      // First, fetch creator and their projects (without nested images/videos)
      const { data, error } = await supabase
        .from("creators")
        .select(
          `
          *,
          profile:profile_id (
            first_name,
            last_name
          ),
          projects (
            id,
            title,
            description,
            short_description,
            roles,
            client_ids,
            behance_url,
            featured,
            year,
            thumbnail_url
          )
          `
        )
        .eq("username", username)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found
          logger.info(`Creator not found for username: ${username}`);
          return null;
        }

        // More detailed logging for other errors
        logger.error(
          `Database error in getByUsername for ${username}: ${error.message}`,
          {
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );
        throw error;
      }

      // Handle case where data is null or undefined
      if (!data) {
        logger.warn(
          `No data returned for username ${username} but no error was thrown`
        );
        return null;
      }

      // Map the data to include first_name and last_name at the top level
      const creator = {
        ...data,
        first_name: data.profile?.first_name || null,
        last_name: data.profile?.last_name || null,
        // Check if the user is the owner by comparing profile_id with userId
        isOwner: userId ? data.profile_id === userId : false,
      };

      delete creator.profile; // Remove the nested profile object

      // Fetch organizations, images, and videos for projects
      if (creator.projects && creator.projects.length > 0) {
        // Fetch organizations based on client_ids
        const allClientIds = creator.projects
          .flatMap((project: any) => project.client_ids || [])
          .filter((id: string | null) => id);
        const uniqueClientIds = [...new Set(allClientIds)];
        let organizationsMap: Record<string, any> = {};

        if (uniqueClientIds.length > 0) {
          const { data: organizationsData, error: orgsError } = await supabase
            .from("organizations")
            .select("id, name, logo_url, website")
            .in("id", uniqueClientIds);

          if (orgsError) {
            logger.error(`Error fetching organizations: ${orgsError.message}`);
            // Continue without organization data
          } else if (organizationsData) {
            organizationsMap = organizationsData.reduce(
              (acc: Record<string, any>, org) => {
                acc[org.id] = org;
                return acc;
              },
              {}
            );
          }
        }

        // Map organizations back to projects (and prepare for images/videos)
        const projectIds = creator.projects.map((project: any) => project.id);
        creator.projects = creator.projects.map((project: any) => ({
          ...project,
          clients: (project.client_ids || [])
            .map((id: string) => organizationsMap[id])
            .filter((org: any) => org), // Add a 'clients' array
        }));

        // If there are projects, fetch images and videos for each project separately
        if (creator.projects && creator.projects.length > 0) {
          const projectIds = creator.projects.map((project: any) => project.id);

          // Fetch all images for all projects
          const { data: allImages, error: imagesError } = await supabase
            .from("images")
            .select(
              "id, creator_id, project_id, url, resolutions, created_at, updated_at, order, alt_text"
            )
            .in("project_id", projectIds);

          if (imagesError) {
            logger.error(
              `Error fetching project images: ${imagesError.message}`
            );
          }

          // Fetch all videos for all projects
          const { data: allVideos, error: videosError } = await supabase
            .from("videos")
            .select(
              "id, creator_id, project_id, title, vimeo_id, youtube_id, url, description, created_at, updated_at"
            )
            .in("project_id", projectIds);

          if (videosError) {
            logger.error(
              `Error fetching project videos: ${videosError.message}`
            );
          }

          // Group images and videos by project_id
          const imagesByProject: Record<string, any[]> = {};
          const videosByProject: Record<string, any[]> = {};

          if (allImages) {
            allImages.forEach((image: any) => {
              if (!imagesByProject[image.project_id]) {
                imagesByProject[image.project_id] = [];
              }
              imagesByProject[image.project_id].push(image);
            });
          }

          if (allVideos) {
            allVideos.forEach((video: any) => {
              if (!videosByProject[video.project_id]) {
                videosByProject[video.project_id] = [];
              }
              videosByProject[video.project_id].push(video);
            });
          }

          // Assign images and videos to each project
          creator.projects = creator.projects.map(
            (project: CreatorProject) => ({
              ...project, // Includes 'clients' added in the previous map
              creator_username: username,
              images: imagesByProject[project.id] || [],
              videos: videosByProject[project.id] || [],
            })
          );
        }
      }

      return creator;
    } catch (error: any) {
      logger.error(`Error in getByUsername: ${error.message}`, {
        error,
        username,
      });
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
        .select("id, creator_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        logger.error(`Error fetching project data: ${projectError.message}`);
        return false; // Project not found or other error
      }

      // Check if project exists
      if (!projectData) {
        logger.error(`Project ${projectId} not found`);
        return false;
      }

      // Get the creator's profile ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("profile_id, username")
        .eq("id", projectData.creator_id)
        .single();

      if (creatorError) {
        logger.error(`Error fetching creator data: ${creatorError.message}`);
        return false;
      }

      // Verify ownership
      if (!creatorData || creatorData.profile_id !== userId) {
        logger.warn(
          `User ${userId} attempted to delete image from project they don't own`
        );
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
        logger.error(`Error fetching image data: ${imageError.message}`);
        return false; // Image not found or other error
      }

      if (!image || !image.url) {
        logger.error(`Image ${imageId} not found or has no URL`);
        return false;
      }

      try {
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
          logger.error(
            `Error deleting image from storage: ${storageError.message}`
          );
          // Continue anyway to delete the database record
        }
      } catch (urlError) {
        logger.error(`Error parsing image URL: ${urlError}`);
        // Continue anyway to delete the database record
      }

      // Delete the image record
      const { error: deleteError } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        logger.error(`Error deleting image record: ${deleteError.message}`);
        return false;
      }

      // Invalidate related caches
      invalidateCache(`admin_project_details_${projectId}`);
      invalidateCache(`project_${projectId}`);

      if (creatorData && creatorData.username) {
        invalidateCache(`creator_username_${creatorData.username}`);
        invalidateCache(`creator_project_`);
      }

      return true;
    } catch (error: any) {
      logger.error(`Error deleting project image: ${error.message}`);
      throw error;
    }
  }
}
