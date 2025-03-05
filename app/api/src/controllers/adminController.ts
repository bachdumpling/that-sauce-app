// src/controllers/adminController.ts
import { Request, Response } from "express";
import supabase from "../lib/supabase";
import logger from "../config/logger";
import { cache, invalidateCache } from "../lib/cache";

// Define interfaces for the data structures
interface Project {
  id: string;
  title: string;
  creator_id: string;
  images?: Array<{
    id: string;
    url: string;
    resolutions: any;
  }>;
}

interface Creator {
  id: string;
  username: string;
  location?: string;
  primary_role?: string;
  creative_fields?: string[];
  projects?: Project[];
}

export class AdminController {
  /**
   * List all creators with pagination
   * GET /api/admin/creators
   */
  async listCreators(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const searchQuery = req.query.search as string;

      // Build the query
      let query = supabase.from("creators").select(
        `
          id,
          username,
          location,
          primary_role,
          creative_fields
        `,
        { count: "exact" }
      );

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim() !== "") {
        query = query.ilike("username", `%${searchQuery}%`);
      }

      // Apply pagination and ordering
      const {
        data: creators,
        error,
        count,
      } = await query
        .range(offset, offset + limit - 1)
        .order("username", { ascending: true });

      if (error) throw error;

      // Step 2: Fetch preview images for each creator
      if (creators && creators.length > 0) {
        const creatorIds = creators.map((creator: Creator) => creator.id);

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
        creators.forEach((creator: Creator) => {
          const projects = creatorToProjects[creator.id] || [];
          creator.projects = projects;
        });
      }

      const result = {
        creators: creators || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error fetching creators:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch creators",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get detailed information about a creator
   * GET /api/admin/creators/:id
   */
  async getCreatorDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Query creator with all projects and media
      const { data: creator, error } = await supabase
        .from("creators")
        .select(
          `
          id,
          username,
          location,
          bio,
          primary_role,
          creative_fields,
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
          return res.status(404).json({
            success: false,
            error: "Creator not found",
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data: creator,
      });
    } catch (error: any) {
      logger.error("Error fetching creator details:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch creator details",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Reject a creator (move to unqualified tables)
   * POST /api/admin/creators/:id/reject
   */
  async rejectCreator(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { user } = req as any; // User from auth middleware

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Rejection reason is required",
        });
      }

      // Call the stored procedure to move the creator to unqualified tables
      const { data, error } = await supabase.rpc("reject_creator", {
        p_creator_id: id,
        p_reason: reason,
        p_rejected_by: user.id,
      });

      if (error) throw error;

      // Invalidate relevant caches
      invalidateCache(`creator_${id}`);
      invalidateCache("creators_list");

      res.json({
        success: true,
        message: "Creator rejected successfully",
      });
    } catch (error: any) {
      logger.error("Error rejecting creator:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reject creator",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * List rejected creators with pagination
   * GET /api/admin/unqualified/creators
   */
  async listRejectedCreators(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Query rejected creators with count
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
          rejection_reason,
          rejected_at,
          rejected_by,
          profiles:rejected_by (
            id,
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
          totalPages: Math.ceil((count || 0) / limit),
        },
      };

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error fetching rejected creators:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch rejected creators",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}
