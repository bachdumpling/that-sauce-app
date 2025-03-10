// src/controllers/adminController.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { cache, invalidateCache } from "../lib/cache";
import { AuthenticatedRequest } from "../middleware/extractUser";

// Define interfaces for the data structures
interface Project {
  id: string;
  title: string;
  creator_id: string;
  description?: string;
  images?: Array<{
    id: string;
    url: string;
    resolutions: any;
  }>;
  videos?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
  }>;
  creator_username?: string;
}

interface Creator {
  id: string;
  username: string;
  location?: string;
  primary_role?: string[];
  projects?: Project[];
  bio?: string;
  profile_id?: string;
  email?: string;
  social_links?: Record<string, string>;
  years_of_experience?: number;
}

export class AdminController {
  /**
   * List all creators with pagination
   * GET /api/admin/creators
   */
  async listCreators(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const searchQuery = req.query.search as string;

      logger.info(
        `Listing creators - Page: ${page}, Limit: ${limit}, Search: "${searchQuery || ""}"`
      );

      // Build the query
      let query = supabase.from("creators").select(
        `
          id,
          username,
          location,
          primary_role
        `,
        { count: "exact" }
      );

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim() !== "") {
        const trimmedSearch = searchQuery.trim();
        logger.info(`Applying search filter: "${trimmedSearch}"`);

        // Search in multiple columns with improved pattern
        query = query.or(
          `username.ilike.%${trimmedSearch}%,location.ilike.%${trimmedSearch}%`
        );
      }

      // Apply pagination and ordering
      const {
        data: creators,
        error,
        count,
      } = await query
        .range(offset, offset + limit - 1)
        .order("username", { ascending: true });

      if (error) {
        logger.error(`Error fetching creators: ${error.message}`, { error });
        throw error;
      }

      logger.info(`Found ${count || 0} creators matching criteria`);

      // Step 2: Fetch preview images for each creator
      if (creators && creators.length > 0) {
        const creatorIds = creators.map((creator: any) => creator.id);

        // Get up to 4 projects per creator
        const { data: projectsWithImages, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            id,
            title,
            creator_id
          `
          )
          .in("creator_id", creatorIds)
          .order("created_at", { ascending: false });

        if (projectError) throw projectError;

        // Create a map of creator_id to their first 4 projects
        const creatorToProjects: Record<string, Project[]> = {};
        if (projectsWithImages && projectsWithImages.length > 0) {
          // Group projects by creator_id and take up to 4 for each creator
          projectsWithImages.forEach((project: Project) => {
            if (!creatorToProjects[project.creator_id]) {
              creatorToProjects[project.creator_id] = [];
            }

            if (creatorToProjects[project.creator_id].length < 4) {
              creatorToProjects[project.creator_id].push(project);
            }
          });
        }

        // Get all project IDs to fetch images
        const projectIds: string[] = [];
        Object.values(creatorToProjects).forEach((projects) => {
          projects.forEach((project) => {
            projectIds.push(project.id);
          });
        });

        // Fetch one image for each project
        if (projectIds.length > 0) {
          const { data: images, error: imagesError } = await supabase
            .from("images")
            .select(
              `
              id,
              url,
              resolutions,
              project_id
            `
            )
            .in("project_id", projectIds)
            .order("order", { ascending: true });

          if (imagesError) throw imagesError;

          // Create a map of project_id to its first image
          const projectToImage: Record<string, any> = {};
          if (images && images.length > 0) {
            images.forEach((image: any) => {
              if (!projectToImage[image.project_id]) {
                projectToImage[image.project_id] = image;
              }
            });
          }

          // Assign images to projects
          Object.values(creatorToProjects).forEach((projects) => {
            projects.forEach((project: Project) => {
              const image = projectToImage[project.id];
              if (image) {
                project.images = [image];
              } else {
                project.images = [];
              }
            });
          });
        }

        // Assign projects to creators
        creators.forEach((creator: any) => {
          const projects = creatorToProjects[creator.id] || [];

          // Add creator_username to each project
          projects.forEach((project: Project) => {
            project.creator_username = creator.username;
          });

          creator.projects = projects;
        });
      }

      const result = {
        creators: creators || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 0,
        },
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(`Error in listCreators: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Failed to fetch creators",
      });
    }
  }

  /**
   * Get details of a specific creator
   * GET /api/admin/creators/:id
   */
  async getCreatorDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data: creator, error } = await supabase
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
              url,
              description
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found
          return res.status(404).json({ error: "Creator not found" });
        }
        throw error;
      }

      // Add creator_username to each project
      if (creator.projects) {
        creator.projects = creator.projects.map((project: any) => ({
          ...project,
          creator_username: creator.username,
        }));
      }

      return res.status(200).json({
        success: true,
        data: creator,
      });
    } catch (error: any) {
      logger.error(`Error in getCreatorDetails: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Reject a creator
   * POST /api/admin/creators/:id/reject
   */
  async rejectCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Rejection reason is required",
        });
      }

      // First check if the creator exists
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      // Begin a transaction to move the creator to unqualified_creators table
      const { error: insertError } = await supabase
        .from("unqualified_creators")
        .insert({
          profile_id: creator.profile_id,
          username: creator.username,
          location: creator.location,
          bio: creator.bio,
          primary_role: creator.primary_role,
          social_links: creator.social_links,
          years_of_experience: creator.years_of_experience,
          rejection_reason: reason,
          rejected_by: req?.user?.id,
          rejected_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error(
          `Error inserting into unqualified_creators: ${insertError.message}`,
          {
            insertError,
          }
        );
        return res.status(500).json({
          success: false,
          error: "Failed to reject creator",
        });
      }

      // Delete the creator from the creators table
      const { error: deleteError } = await supabase
        .from("creators")
        .delete()
        .eq("id", id);

      if (deleteError) {
        logger.error(`Error deleting from creators: ${deleteError.message}`, {
          deleteError,
        });
        return res.status(500).json({
          success: false,
          error: "Failed to remove creator after rejection",
        });
      }

      // Invalidate relevant caches
      invalidateCache(`creator_details_${id}`);
      invalidateCache("creators_list_");

      return res.status(200).json({
        success: true,
        message: "Creator rejected successfully",
      });
    } catch (error: any) {
      logger.error(`Error in rejectCreator: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * List rejected creators with pagination
   * GET /api/admin/unqualified/creators
   */
  async listRejectedCreators(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Query unqualified creators
      const {
        data: creators,
        error,
        count,
      } = await supabase
        .from("unqualified_creators")
        .select(
          `
          id,
          username,
          location,
          primary_role,
          bio,
          social_links,
          years_of_experience,
          rejection_reason,
          rejected_at,
          rejected_by,
          profiles:rejected_by (
            first_name,
            last_name
          )
        `,
          { count: "exact" }
        )
        .range(offset, offset + limit - 1)
        .order("rejected_at", { ascending: false });

      if (error) throw error;

      const result = {
        creators: creators || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 0,
        },
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(`Error in listRejectedCreators: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to fetch unqualified creators",
      });
    }
  }

  /**
   * Update a creator's profile
   * PUT /api/admin/creators/:id
   */
  async updateCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        username,
        location,
        primary_role,
        bio,
        social_links,
        years_of_experience,
      } = req.body;

      // Validate required fields
      if (username && username.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Username cannot be empty",
        });
      }

      // Prepare update data
      const updateData: Partial<Creator> = {};

      if (username !== undefined) updateData.username = username;
      if (location !== undefined) updateData.location = location;
      if (primary_role !== undefined) updateData.primary_role = primary_role;
      if (bio !== undefined) updateData.bio = bio;
      if (social_links !== undefined) updateData.social_links = social_links;
      if (years_of_experience !== undefined)
        updateData.years_of_experience = years_of_experience;

      // Update the creator profile
      const { data, error } = await supabase
        .from("creators")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating creator: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to update creator profile",
        });
      }

      // Invalidate cache for this creator
      invalidateCache(`creator_details_${id}`);
      invalidateCache("creators_list_");

      return res.status(200).json({
        success: true,
        message: "Creator profile updated successfully",
        creator: data,
      });
    } catch (error: any) {
      logger.error(`Error in updateCreator: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Delete a creator
   * DELETE /api/admin/creators/:id
   */
  async deleteCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // First check if the creator exists
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("id")
        .eq("id", id)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      // Delete the creator
      const { error } = await supabase.from("creators").delete().eq("id", id);

      if (error) {
        logger.error(`Error deleting creator: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to delete creator",
        });
      }

      // Invalidate cache
      invalidateCache(`creator_details_${id}`);
      invalidateCache("creators_list_");

      return res.status(200).json({
        success: true,
        message: "Creator deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error in deleteCreator: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * List all projects with pagination and filtering
   * GET /api/admin/projects
   */
  async listProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const creatorId = req.query.creator_id as string;
      const searchQuery = req.query.search as string;

      // Build the query
      let query = supabase.from("projects").select(
        `
          id,
          title,
          description,
          created_at,
          updated_at,
          creator_id,
          creators (
            id,
            username
          )
        `,
        { count: "exact" }
      );

      // Apply filters
      if (creatorId && creatorId !== "all") {
        query = query.eq("creator_id", creatorId);
      }

      if (searchQuery && searchQuery.trim() !== "") {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      // Apply pagination and ordering
      const {
        data: projects,
        error,
        count,
      } = await query
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch preview images for each project
      if (projects && projects.length > 0) {
        const projectIds = projects.map((project: any) => project.id);

        // Get one image for each project
        const { data: images, error: imagesError } = await supabase
          .from("images")
          .select(
            `
            id,
            url,
            resolutions,
            project_id
          `
          )
          .in("project_id", projectIds)
          .order("order", { ascending: true });

        if (imagesError) throw imagesError;

        // Create a map of project_id to its first image
        const projectToImage: Record<string, any> = {};
        if (images && images.length > 0) {
          images.forEach((image: any) => {
            if (!projectToImage[image.project_id]) {
              projectToImage[image.project_id] = image;
            }
          });
        }

        // Assign images to projects
        projects.forEach((project: any) => {
          const image = projectToImage[project.id];
          if (image) {
            project.preview_image = image;
          }
        });
      }

      const result = {
        projects,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: count ? Math.ceil(count / limit) : 0,
        },
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(`Error in listProjects: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Failed to fetch projects",
      });
    }
  }

  /**
   * Get details of a specific project
   * GET /api/admin/projects/:id
   */
  async getProjectDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get the project with creator info
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          *,
          creators (
            id,
            username,
            location,
            primary_role,
            bio,
            social_links
          )
        `
        )
        .eq("id", id)
        .single();

      if (projectError) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      // Get project images
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("project_id", id)
        .order("order", { ascending: true });

      if (imagesError) throw imagesError;

      // Get project videos
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (videosError) throw videosError;

      // Combine all data
      const projectWithMedia = {
        ...project,
        images: images || [],
        videos: videos || [],
      };

      return res.status(200).json({
        success: true,
        project: projectWithMedia,
      });
    } catch (error: any) {
      logger.error(`Error in getProjectDetails: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Update a project
   * PUT /api/admin/projects/:id
   */
  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      // Validate required fields
      if (title !== undefined && title.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Title cannot be empty",
        });
      }

      // Prepare update data
      const updateData: Partial<Project> = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;

      // Update the project
      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating project: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to update project",
        });
      }

      // Invalidate cache
      invalidateCache(`admin_project_details_${id}`);
      invalidateCache("admin_projects_list_");

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        project: data,
      });
    } catch (error: any) {
      logger.error(`Error in updateProject: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Delete a project
   * DELETE /api/admin/projects/:id
   */
  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // First check if the project exists
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("id, creator_id")
        .eq("id", id)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) {
        logger.error(`Error deleting project: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to delete project",
        });
      }

      // Invalidate cache
      invalidateCache(`admin_project_details_${id}`);
      invalidateCache("admin_projects_list_");

      // Also invalidate the creator details cache
      if (project && project.creator_id) {
        invalidateCache(`creator_details_${project.creator_id}`);
      }

      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error in deleteProject: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Delete a project image
   * DELETE /api/admin/projects/:projectId/images/:imageId
   */
  async deleteProjectImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, imageId } = req.params;

      // First check if the image exists and belongs to the project
      const { data: image, error: fetchError } = await supabase
        .from("images")
        .select("id, project_id")
        .eq("id", imageId)
        .eq("project_id", projectId)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Image not found or does not belong to the specified project",
        });
      }

      // Delete the image
      const { error } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (error) {
        logger.error(`Error deleting project image: ${error.message}`, {
          error,
        });
        return res.status(500).json({
          success: false,
          error: "Failed to delete project image",
        });
      }

      // Invalidate cache
      invalidateCache(`admin_project_details_${projectId}`);

      // Also invalidate the creator details cache since it contains project data
      const { data: project } = await supabase
        .from("projects")
        .select("creator_id")
        .eq("id", projectId)
        .single();

      if (project && project.creator_id) {
        invalidateCache(`creator_details_${project.creator_id}`);
      }

      return res.status(200).json({
        success: true,
        message: "Project image deleted successfully",
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
