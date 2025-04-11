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
    vimeo_id?: string;
    youtube_id?: string;
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
  work_email?: string;
}

interface Media {
  id: string;
  url: string;
  project_id: string;
  creator_id: string;
  media_type: "image" | "video";
  alt_text?: string;
  title?: string;
  description?: string;
  order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export class AdminController {
  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getSystemStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Fetch all the stats in parallel
      const [
        totalCreatorsResult,
        pendingCreatorsResult,
        approvedCreatorsResult,
        rejectedCreatorsResult,
        totalProjectsResult,
        totalImagesResult,
        totalVideosResult,
      ] = await Promise.all([
        // Total creators
        supabase.from("creators").select("id", { count: "exact", head: true }),

        // Pending creators
        supabase
          .from("creators")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        // Approved creators
        supabase
          .from("creators")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),

        // Rejected creators (from unqualified_creators table)
        supabase
          .from("unqualified_creators")
          .select("id", { count: "exact", head: true }),

        // Total projects
        supabase.from("projects").select("id", { count: "exact", head: true }),

        // Total images - updated to use the images table
        supabase.from("images").select("id", { count: "exact", head: true }),

        // Total videos - updated to use the videos table
        supabase.from("videos").select("id", { count: "exact", head: true }),
      ]);

      // Compile the stats
      const stats = {
        creators: {
          total: totalCreatorsResult.count || 0,
          pending: pendingCreatorsResult.count || 0,
          approved: approvedCreatorsResult.count || 0,
          rejected: rejectedCreatorsResult.count || 0,
        },
        projects: {
          total: totalProjectsResult.count || 0,
        },
        media: {
          total:
            (totalImagesResult.count || 0) + (totalVideosResult.count || 0),
          images: totalImagesResult.count || 0,
          videos: totalVideosResult.count || 0,
        },
      };

      return res.json(stats);
    } catch (error) {
      logger.error("Error fetching system stats:", error);
      return res.status(500).json({
        creators: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
        projects: {
          total: 0,
        },
        media: {
          total: 0,
          images: 0,
          videos: 0,
        },
      });
    }
  }

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
      const statusFilter = req.query.status as string;

      logger.info(
        `Listing creators - Page: ${page}, Limit: ${limit}, Search: "${searchQuery || ""}", Status: "${statusFilter || "all"}"`
      );

      // Build the query
      let query = supabase.from("creators").select(
        `
          id,
          username,
          location,
          primary_role,
          status
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

      // Apply status filter if provided
      if (statusFilter && statusFilter !== "all") {
        logger.info(`Applying status filter: "${statusFilter}"`);
        query = query.eq("status", statusFilter);
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
      const { username } = req.params;

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
          work_email,
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
   * POST /api/admin/creators/:username/reject
   */
  async rejectCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;
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
        .eq("username", username)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      // Begin a transaction to move the creator and all their data to unqualified tables
      // 1. Move creator's projects to unqualified_projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("creator_id", creator.id);

      if (projectsError) {
        logger.error(
          `Error fetching creator's projects: ${projectsError.message}`,
          {
            projectsError,
          }
        );
        return res.status(500).json({
          success: false,
          error: "Failed to process creator's projects",
        });
      }

      // 2. Move creator's images to unqualified_images
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("creator_id", creator.id);

      if (imagesError) {
        logger.error(
          `Error fetching creator's images: ${imagesError.message}`,
          {
            imagesError,
          }
        );
        return res.status(500).json({
          success: false,
          error: "Failed to process creator's images",
        });
      }

      // 3. Move creator's videos to unqualified_videos
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("creator_id", creator.id);

      if (videosError) {
        logger.error(
          `Error fetching creator's videos: ${videosError.message}`,
          {
            videosError,
          }
        );
        return res.status(500).json({
          success: false,
          error: "Failed to process creator's videos",
        });
      }

      // 4. Move creator's portfolios to unqualified_portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from("portfolios")
        .select("*")
        .eq("creator_id", creator.id);

      if (portfoliosError) {
        logger.error(
          `Error fetching creator's portfolios: ${portfoliosError.message}`,
          {
            portfoliosError,
          }
        );
        return res.status(500).json({
          success: false,
          error: "Failed to process creator's portfolios",
        });
      }

      // Now insert all data into unqualified tables with rejection information
      const rejectionTimestamp = new Date().toISOString();

      // First insert creator into unqualified_creators to get the new ID
      const { data: unqualifiedCreator, error: insertError } = await supabase
        .from("unqualified_creators")
        .insert({
          profile_id: creator.profile_id,
          username: creator.username,
          location: creator.location,
          bio: creator.bio,
          primary_role: creator.primary_role,
          social_links: creator.social_links,
          years_of_experience: creator.years_of_experience,
          work_email: creator.work_email,
          rejection_reason: reason,
          rejected_by: req?.user?.id,
          rejected_at: rejectionTimestamp,
        })
        .select()
        .single();

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

      // Now we have the new unqualified_creator ID to use for foreign key references
      const unqualifiedCreatorId = unqualifiedCreator.id;

      // Create a mapping of old portfolio IDs to new unqualified portfolio IDs
      const portfolioIdMap = new Map();

      // We'll also need a mapping for projects
      const projectIdMap = new Map();

      // Insert portfolios into unqualified_portfolios with the new creator ID first
      if (portfolios && portfolios.length > 0) {
        const unqualifiedPortfolios = portfolios.map((portfolio) => {
          // Create a new object with only the fields that exist in unqualified_portfolios
          // Omit the id field to let the database generate a new one
          const {
            ai_analysis,
            embedding,
            last_updated,
            created_at,
            updated_at,
          } = portfolio;

          return {
            creator_id: unqualifiedCreatorId, // Use the new unqualified creator ID
            ai_analysis,
            embedding,
            last_updated,
            created_at,
            updated_at,
            rejected_at: rejectionTimestamp,
            rejection_reason: reason,
          };
        });

        const { data: insertedPortfolios, error: insertPortfoliosError } =
          await supabase
            .from("unqualified_portfolios")
            .insert(unqualifiedPortfolios)
            .select();

        if (insertPortfoliosError) {
          logger.error(
            `Error inserting into unqualified_portfolios: ${insertPortfoliosError.message}`,
            {
              insertPortfoliosError,
            }
          );
          return res.status(500).json({
            success: false,
            error: "Failed to move portfolios to unqualified table",
          });
        }

        // Create mapping of old portfolio IDs to new unqualified portfolio IDs
        if (insertedPortfolios) {
          portfolios.forEach((oldPortfolio, index) => {
            if (insertedPortfolios[index]) {
              portfolioIdMap.set(oldPortfolio.id, insertedPortfolios[index].id);
            }
          });
        }
      }

      // Insert projects into unqualified_projects with the new creator ID and updated portfolio IDs
      if (projects && projects.length > 0) {
        const unqualifiedProjects = projects.map((project) => {
          // Update the portfolio_id reference if it exists and has a mapping
          const newPortfolioId =
            project.portfolio_id && portfolioIdMap.has(project.portfolio_id)
              ? portfolioIdMap.get(project.portfolio_id)
              : null;

          // Create a new object with only the fields that exist in unqualified_projects
          // Omit the id field to let the database generate a new one
          const {
            title,
            behance_url,
            description,
            year,
            featured,
            order,
            ai_analysis,
            embedding,
            created_at,
            updated_at,
          } = project;

          return {
            creator_id: unqualifiedCreatorId, // Use the new unqualified creator ID
            portfolio_id: newPortfolioId, // Use the new portfolio ID or null
            title,
            behance_url,
            description,
            year,
            featured,
            order,
            ai_analysis,
            embedding,
            created_at,
            updated_at,
            rejected_at: rejectionTimestamp,
          };
        });

        const { data: insertedProjects, error: insertProjectsError } =
          await supabase
            .from("unqualified_projects")
            .insert(unqualifiedProjects)
            .select();

        if (insertProjectsError) {
          logger.error(
            `Error inserting into unqualified_projects: ${insertProjectsError.message}`,
            {
              insertProjectsError,
            }
          );
          return res.status(500).json({
            success: false,
            error: "Failed to move projects to unqualified table",
          });
        }

        // Create mapping of old project IDs to new unqualified project IDs
        if (insertedProjects) {
          projects.forEach((oldProject, index) => {
            if (insertedProjects[index]) {
              projectIdMap.set(oldProject.id, insertedProjects[index].id);
            }
          });
        }
      }

      // Insert images into unqualified_images with the new creator ID and updated project IDs
      if (images && images.length > 0) {
        const unqualifiedImages = images.map((image) => {
          // Update the project_id reference if it exists and has a mapping
          const newProjectId =
            image.project_id && projectIdMap.has(image.project_id)
              ? projectIdMap.get(image.project_id)
              : null;

          // Create a new object with only the fields that exist in unqualified_images
          // Omit the id field to let the database generate a new one
          const {
            url,
            alt_text,
            resolutions,
            ai_analysis,
            embedding,
            order,
            created_at,
            updated_at,
          } = image;

          return {
            project_id: newProjectId, // Use the new project ID
            creator_id: unqualifiedCreatorId, // Use the new unqualified creator ID
            url,
            alt_text,
            resolutions,
            ai_analysis,
            embedding,
            order,
            created_at,
            updated_at,
            rejected_at: rejectionTimestamp,
          };
        });

        const { error: insertImagesError } = await supabase
          .from("unqualified_images")
          .insert(unqualifiedImages);

        if (insertImagesError) {
          logger.error(
            `Error inserting into unqualified_images: ${insertImagesError.message}`,
            {
              insertImagesError,
            }
          );
          return res.status(500).json({
            success: false,
            error: "Failed to move images to unqualified table",
          });
        }
      }

      // Insert videos into unqualified_videos with the new creator ID and updated project IDs
      if (videos && videos.length > 0) {
        const unqualifiedVideos = videos.map((video) => {
          // Update the project_id reference if it exists and has a mapping
          const newProjectId =
            video.project_id && projectIdMap.has(video.project_id)
              ? projectIdMap.get(video.project_id)
              : null;

          // Create a new object with only the fields that exist in unqualified_videos
          // Omit the id field to let the database generate a new one
          const {
            title,
            description,
            vimeo_id,
            youtube_id,
            url,
            categories,
            ai_analysis,
            embedding,
            created_at,
            updated_at,
          } = video;

          return {
            project_id: newProjectId, // Use the new project ID
            creator_id: unqualifiedCreatorId, // Use the new unqualified creator ID
            title,
            description,
            vimeo_id,
            youtube_id,
            url,
            categories,
            ai_analysis,
            embedding,
            created_at,
            updated_at,
            rejected_at: rejectionTimestamp,
          };
        });

        const { error: insertVideosError } = await supabase
          .from("unqualified_videos")
          .insert(unqualifiedVideos);

        if (insertVideosError) {
          logger.error(
            `Error inserting into unqualified_videos: ${insertVideosError.message}`,
            {
              insertVideosError,
            }
          );
          return res.status(500).json({
            success: false,
            error: "Failed to move videos to unqualified table",
          });
        }
      }

      // Now delete the original data after successful insertion into unqualified tables

      // Delete videos
      if (videos && videos.length > 0) {
        const { error: deleteVideosError } = await supabase
          .from("videos")
          .delete()
          .eq("creator_id", creator.id);

        if (deleteVideosError) {
          logger.error(`Error deleting videos: ${deleteVideosError.message}`, {
            deleteVideosError,
          });
          // Continue with the process even if there's an error
        }
      }

      // Delete images
      if (images && images.length > 0) {
        const { error: deleteImagesError } = await supabase
          .from("images")
          .delete()
          .eq("creator_id", creator.id);

        if (deleteImagesError) {
          logger.error(`Error deleting images: ${deleteImagesError.message}`, {
            deleteImagesError,
          });
          // Continue with the process even if there's an error
        }
      }

      // Delete projects
      if (projects && projects.length > 0) {
        const { error: deleteProjectsError } = await supabase
          .from("projects")
          .delete()
          .eq("creator_id", creator.id);

        if (deleteProjectsError) {
          logger.error(
            `Error deleting projects: ${deleteProjectsError.message}`,
            {
              deleteProjectsError,
            }
          );
          // Continue with the process even if there's an error
        }
      }

      // Delete portfolios
      if (portfolios && portfolios.length > 0) {
        const { error: deletePortfoliosError } = await supabase
          .from("portfolios")
          .delete()
          .eq("creator_id", creator.id);

        if (deletePortfoliosError) {
          logger.error(
            `Error deleting portfolios: ${deletePortfoliosError.message}`,
            {
              deletePortfoliosError,
            }
          );
          // Continue with the process even if there's an error
        }
      }

      // Delete the creator from the creators table
      const { error: deleteError } = await supabase
        .from("creators")
        .delete()
        .eq("id", creator.id);

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
      invalidateCache(`creator_details_${username}`);
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
          work_email,
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
      const { username: usernameParam } = req.params;
      const {
        username,
        location,
        primary_role,
        bio,
        social_links,
        years_of_experience,
        work_email,
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
      if (work_email !== undefined) updateData.work_email = work_email;

      // Update the creator profile
      const { data, error } = await supabase
        .from("creators")
        .update(updateData)
        .eq("username", usernameParam)
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
      invalidateCache(`creator_details_${usernameParam}`);
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
      const { username } = req.params;

      // First check if the creator exists
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("id")
        .eq("username", username)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      // Delete the creator
      const { error } = await supabase
        .from("creators")
        .delete()
        .eq("id", creator.id);

      if (error) {
        logger.error(`Error deleting creator: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to delete creator",
        });
      }

      // Invalidate cache
      invalidateCache(`creator_details_${username}`);
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

  /**
   * Approve a creator
   * POST /api/admin/creators/:username/approve
   */
  async approveCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;

      // First check if the creator exists
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("id, status")
        .eq("username", username)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      // Check if the creator is already approved
      if (creator.status === "approved") {
        return res.status(400).json({
          success: false,
          error: "Creator is already approved",
        });
      }

      // Update the creator status to approved
      const { error: updateError } = await supabase
        .from("creators")
        .update({ status: "approved" })
        .eq("id", creator.id);

      if (updateError) {
        logger.error(`Error approving creator: ${updateError.message}`, {
          updateError,
        });
        return res.status(500).json({
          success: false,
          error: "Failed to approve creator",
        });
      }

      // Invalidate cache
      invalidateCache(`creator_details_${username}`);
      invalidateCache("creators_list_");

      // Invalidate any cache that might contain the creator's status
      const cacheKeys = cache.keys();
      cacheKeys.forEach((key) => {
        if (key.includes("creators_list_") || key.includes(username)) {
          invalidateCache(key);
        }
      });

      return res.status(200).json({
        success: true,
        message: "Creator approved successfully",
      });
    } catch (error: any) {
      logger.error(`Error in approveCreator: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Update creator status (approve/reject)
   * POST /api/admin/creators/:username/status
   */
  async updateCreatorStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;
      const { status, reason } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: "Username is required",
        });
      }

      if (!status || !["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Valid status (approved/rejected/pending) is required",
        });
      }

      // Get the creator
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .single();

      if (creatorError || !creator) {
        logger.error(`Error finding creator ${username}:`, creatorError);
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      if (status === "rejected") {
        if (!reason) {
          return res.status(400).json({
            success: false,
            error: "Reason is required for rejection",
          });
        }

        // First update status in creators table
        const { error: updateError } = await supabase
          .from("creators")
          .update({ status: "rejected" })
          .eq("id", creator.id);

        if (updateError) {
          logger.error(`Error updating creator status:`, updateError);
          throw updateError;
        }

        // Then add to unqualified_creators table
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
            work_email: creator.work_email,
            rejection_reason: reason,
            rejected_by: req.user?.id || "system",
            rejected_at: new Date().toISOString(),
          });

        if (insertError) {
          logger.error(`Error adding to unqualified_creators:`, insertError);
          throw insertError;
        }

        return res.json({
          success: true,
          message: `Creator ${username} has been rejected`,
          status: "rejected",
        });
      } else {
        // For approve or pending, just update the status
        const { error: updateError } = await supabase
          .from("creators")
          .update({ status })
          .eq("id", creator.id);

        if (updateError) {
          logger.error(`Error updating creator status:`, updateError);
          throw updateError;
        }

        // If previously rejected and now approved, remove from unqualified_creators
        if (status === "approved") {
          await supabase
            .from("unqualified_creators")
            .delete()
            .eq("username", creator.username);
        }

        return res.json({
          success: true,
          message: `Creator ${username} status updated to ${status}`,
          status,
        });
      }
    } catch (error) {
      logger.error("Error updating creator status:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update creator status",
      });
    }
  }

  /**
   * List all media (images and videos)
   * GET /api/admin/media
   */
  async listMedia(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const projectId = req.query.project_id as string;
      const mediaType = req.query.type as string;

      let imagesData: any[] = [];
      let videosData: any[] = [];
      let imagesCount = 0;
      let videosCount = 0;

      // Based on mediaType parameter, fetch images, videos, or both
      if (!mediaType || mediaType === "all" || mediaType === "image") {
        // Fetch images
        let imagesQuery = supabase.from("images").select(
          `
            id,
            url,
            project_id,
            creator_id,
            alt_text,
            status,
            created_at,
            updated_at,
            projects(title),
            creators(username)
            `,
          { count: "exact" }
        );

        // Apply project filter if specified
        if (projectId && projectId !== "all") {
          imagesQuery = imagesQuery.eq("project_id", projectId);
        }

        const { data: images, count } = await imagesQuery;

        if (images && images.length > 0) {
          imagesData = images.map((item: any) => ({
            id: item.id,
            url: item.url,
            project_id: item.project_id,
            project_title: item.projects?.title || "Unknown project",
            creator_id: item.creator_id,
            creator_username: item.creators?.username || "Unknown creator",
            media_type: "image",
            alt_text: item.alt_text,
            title: item.title || "",
            description: item.description || "",
            order: item.order || 0,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));
          imagesCount = count || 0;
        }
      }

      if (!mediaType || mediaType === "all" || mediaType === "video") {
        // Fetch videos
        let videosQuery = supabase.from("videos").select(
          `
            id,
            url,
            project_id,
            creator_id,
            thumbnail_url,
            status,
            created_at,
            updated_at,
            projects(title),
            creators(username)
            `,
          { count: "exact" }
        );

        // Apply project filter if specified
        if (projectId && projectId !== "all") {
          videosQuery = videosQuery.eq("project_id", projectId);
        }

        const { data: videos, count } = await videosQuery;

        if (videos && videos.length > 0) {
          videosData = videos.map((item: any) => ({
            id: item.id,
            url: item.url,
            project_id: item.project_id,
            project_title: item.projects?.title || "Unknown project",
            creator_id: item.creator_id,
            creator_username: item.creators?.username || "Unknown creator",
            media_type: "video",
            alt_text: "",
            title: item.title || "",
            description: item.description || "",
            thumbnail_url: item.thumbnail_url,
            order: item.order || 0,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));
          videosCount = count || 0;
        }
      }

      // Combine and sort data
      const combinedMedia = [...imagesData, ...videosData].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination to combined data
      const paginatedMedia = combinedMedia.slice(offset, offset + limit);
      const totalCount = imagesCount + videosCount;

      return res.json({
        media: paginatedMedia || [],
        page,
        limit,
        total: totalCount,
      });
    } catch (error) {
      logger.error("Error listing media:", error);
      return res.status(500).json({ error: "Failed to list media" });
    }
  }

  /**
   * Delete media (image or video)
   * DELETE /api/admin/media/:id
   */
  async deleteMedia(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Media ID is required",
        });
      }

      // Check if this ID exists in the database
      // Try to find in images table first
      const { data: image, error: imageError } = await supabase
        .from("images")
        .select("id, url")
        .eq("id", id)
        .single();

      // If not found in images, try videos
      if (imageError || !image) {
        const { data: video, error: videoError } = await supabase
          .from("videos")
          .select("id, url")
          .eq("id", id)
          .single();

        if (videoError || !video) {
          // Return success true with a message for UI compatibility
          // This prevents client-side errors when the media is already deleted
          return res.status(200).json({
            success: true,
            message: `Media with ID ${id} no longer exists`,
            warning: "Media not found in database",
          });
        }

        // Found in videos, delete it
        const { error: deleteVideoError } = await supabase
          .from("videos")
          .delete()
          .eq("id", id);

        if (deleteVideoError) {
          logger.error(`Error deleting video:`, deleteVideoError);
          throw deleteVideoError;
        }

        // Extract file path from the URL to delete from storage
        try {
          if (video.url) {
            const url = new URL(video.url);
            const filePath = url.pathname.replace(
              "/storage/v1/object/public/",
              ""
            );

            // Delete video from Supabase Storage
            const { error: storageError } = await supabase.storage
              .from(filePath.split("/")[0])
              .remove([filePath.split("/").slice(1).join("/")]);

            if (storageError) {
              logger.warn(
                `Could not delete video file from storage:`,
                storageError
              );
            }
          }
        } catch (storageError) {
          logger.warn(
            `Error parsing URL or deleting video from storage:`,
            storageError
          );
          // Continue anyway since the database record is deleted
        }

        return res.json({
          success: true,
          message: `Video with ID ${id} has been deleted`,
        });
      }

      // Found in images, delete it
      const { error: deleteImageError } = await supabase
        .from("images")
        .delete()
        .eq("id", id);

      if (deleteImageError) {
        logger.error(`Error deleting image:`, deleteImageError);
        throw deleteImageError;
      }

      // Extract file path from the URL to delete from storage
      try {
        const url = new URL(image.url);
        const filePath = url.pathname.replace("/storage/v1/object/public/", "");

        // Delete image from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from(filePath.split("/")[0])
          .remove([filePath.split("/").slice(1).join("/")]);

        if (storageError) {
          logger.warn(
            `Could not delete image file from storage:`,
            storageError
          );
          // Continue anyway since the database record is deleted
        }
      } catch (storageError) {
        logger.warn(
          `Error parsing URL or deleting image from storage:`,
          storageError
        );
        // Continue anyway since the database record is deleted
      }

      return res.json({
        success: true,
        message: `Image with ID ${id} has been deleted`,
      });
    } catch (error) {
      logger.error("Error deleting media:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete media",
      });
    }
  }
}
