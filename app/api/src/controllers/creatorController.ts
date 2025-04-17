import { Request, Response } from "express";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { CreatorProfileService } from "../services/creatorProfileService";
import { CreatorService } from "../services/creatorService";
import { supabase } from "../lib/supabase";
import { invalidateCache } from "../lib/cache";
import { ErrorCode } from "../models/ApiResponse";
import {
  sendSuccess,
  sendError,
  createPaginationMeta,
  createFilterMeta,
  parsePaginationParams,
  parseFilterParams,
  parseSortParams,
} from "../utils/responseUtils";

/**
 * Controller for managing creator profiles and related functionality
 *
 * Note on primary_role:
 * The primary_role field is an ARRAY type in the database.
 * It should always be handled as an array in requests and responses.
 * When filtering by primary_role, we use the contains operator to match elements in the array.
 */
export class CreatorController {
  private creatorProfileService: CreatorProfileService;
  private creatorService: CreatorService;

  constructor() {
    this.creatorProfileService = new CreatorProfileService();
    this.creatorService = new CreatorService();
  }

  /**
   * List creators with filtering
   * GET /api/creators
   */
  async listCreators(req: Request, res: Response) {
    try {
      // Parse request parameters using utility functions
      const { page, limit, offset } = parsePaginationParams(req.query);
      const searchQuery = (req.query.q as string) || "";
      const filters = parseFilterParams(req.query);
      const { sortField, sortDirection } = parseSortParams(req.query);

      let query = supabase.from("creators").select(
        `
          id,
          username,
          location,
          bio,
          primary_role,
          years_of_experience,
          created_at,
          updated_at,
          profile:profile_id (
            first_name,
            last_name
          ),
          projects:projects (count)
        `,
        { count: "exact" }
      );

      // Apply search if provided
      if (searchQuery) {
        query = query.or(
          `username.ilike.%${searchQuery}%, bio.ilike.%${searchQuery}%`
        );
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key && value !== undefined) {
          // Special handling for primary_role which is an array field
          if (key === "primary_role") {
            // Case-insensitive search within the array
            query = query.or(`primary_role.ilike.%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // First get the total count
      const { count } = await query;

      // Apply pagination and sorting
      query = query
        .order(sortField, { ascending: sortDirection === "asc" })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data, error } = await query;

      if (error) {
        logger.error(`Error in listCreators: ${error.message}`, { error });
        return sendError(
          res,
          ErrorCode.SERVER_ERROR,
          "Failed to retrieve creators list",
          error.message,
          500
        );
      }

      // Format the creators data to include flattened profile info
      const formattedCreators =
        data?.map((creator: any) => {
          const { profile, ...creatorData } = creator;
          return {
            ...creatorData,
            first_name: profile ? profile.first_name || null : null,
            last_name: profile ? profile.last_name || null : null,
          };
        }) || [];

      // Calculate total pages
      const total = count || 0;

      // Create response metadata
      const meta = {
        pagination: createPaginationMeta(page, limit, total),
        filters: createFilterMeta(filters, {
          primary_role: [
            "Graphic Designer",
            "UI Designer",
            "UX Designer",
            "Creative Director",
            "Product Designer",
            "Web Designer",
            "Art Director",
            "Illustrator",
            "Motion Designer",
            "3D Artist",
            "Photographer",
            "Developer",
            "Artist",
          ],
          // Add other available filters as needed
        }),
      };

      return sendSuccess(res, formattedCreators, meta);
    } catch (error: any) {
      logger.error(`Error in listCreators: ${error.message}`, { error });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Get creator details by username
   * GET /api/creators/:username
   */
  async getCreatorByUsername(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;

      if (!username) {
        logger.warn("getCreatorByUsername called with empty username");
        return sendError(
          res,
          ErrorCode.INVALID_PARAMETER,
          "Username is required",
          null,
          400
        );
      }

      // Log the request for debugging
      logger.debug(`Fetching creator with username: ${username}`);

      try {
        // Pass the user's ID from the authenticated request if available
        const creator = await this.creatorProfileService.getCreatorByUsername(
          username,
          req.user?.id
        );

        if (!creator) {
          logger.info(`Creator not found for username: ${username}`);
          return sendError(
            res,
            ErrorCode.NOT_FOUND,
            "Creator not found",
            null,
            404
          );
        }

        return sendSuccess(res, creator);
      } catch (serviceError: any) {
        // Handle specific service errors
        logger.error(
          `Service error in getCreatorByUsername: ${serviceError.message}`,
          {
            error: serviceError,
            stack: serviceError.stack,
            username,
          }
        );

        return sendError(
          res,
          ErrorCode.SERVER_ERROR,
          "Error retrieving creator data",
          serviceError.message
        );
      }
    } catch (error: any) {
      // Handle unexpected controller errors
      logger.error(
        `Unexpected error in getCreatorByUsername controller: ${error.message}`,
        {
          error,
          stack: error.stack,
          path: req.path,
          params: req.params,
        }
      );

      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Create a new creator profile
   * POST /api/creators
   */
  async createCreator(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      const profileId = req.user.id;

      // Check if user already has a creator profile
      const existingCreator =
        await this.creatorService.getCreatorByProfileId(profileId);

      if (existingCreator) {
        return sendError(
          res,
          ErrorCode.ALREADY_EXISTS,
          "You already have a creator profile",
          null,
          409
        );
      }

      // Extract data from request body
      const {
        username,
        bio,
        location,
        primary_role,
        years_of_experience,
        work_email,
        social_links,
      } = req.body;

      // Validate required fields
      if (!username) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Username is required",
          null,
          400
        );
      }

      // Check if username is available
      const existingUsername =
        await this.creatorService.getCreatorByUsername(username);

      if (existingUsername) {
        return sendError(
          res,
          ErrorCode.USERNAME_TAKEN,
          "This username is already taken",
          null,
          409
        );
      }

      // Validate primary_role if provided
      if (primary_role !== undefined && !Array.isArray(primary_role)) {
        return sendError(
          res,
          ErrorCode.INVALID_PARAMETER,
          "primary_role must be an array",
          null,
          400
        );
      }

      // Create the creator profile
      const creatorData = {
        username,
        bio,
        location,
        primary_role: primary_role || [],
        years_of_experience,
        work_email,
        social_links: social_links || {},
        profile_id: profileId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newCreator = await this.creatorService.createOrUpdateCreator(
        profileId,
        creatorData
      );

      if (!newCreator) {
        return sendError(
          res,
          ErrorCode.CREATION_FAILED,
          "Failed to create creator profile",
          null,
          500
        );
      }

      // Get the user's profile data to include in response
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", profileId)
        .single();

      // Combine creator and profile data
      const responseData = {
        ...newCreator,
        first_name: profileData?.first_name,
        last_name: profileData?.last_name,
      };

      return sendSuccess(res, responseData, undefined, 201);
    } catch (error: any) {
      logger.error(`Error in createCreator: ${error.message}`, { error });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Get creator's projects
   * GET /api/creators/:username/projects
   */
  async getCreatorProjects(req: Request, res: Response) {
    try {
      const { username } = req.params;

      // Use the utility functions for parsing parameters
      const { page, limit, offset } = parsePaginationParams(req.query);
      const searchQuery = (req.query.q as string) || "";
      const filters = parseFilterParams(req.query);
      const { sortField, sortDirection } = parseSortParams(req.query);

      // First, get the creator by username
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("username", username)
        .single();

      if (creatorError) {
        if (creatorError.code === "PGRST116") {
          return sendError(
            res,
            ErrorCode.NOT_FOUND,
            "Creator not found",
            null,
            404
          );
        }
        throw creatorError;
      }

      // Build the query for projects
      let query = supabase
        .from("projects")
        .select(
          `
          id,
          title,
          description,
          behance_url,
          featured,
          year,
          created_at,
          updated_at,
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
        `,
          { count: "exact" }
        )
        .eq("creator_id", creator.id);

      // Apply search if provided
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%`
        );
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key && value !== undefined) {
          // Special handling for primary_role which is an array field
          if (key === "primary_role") {
            // Case-insensitive search within the array
            query = query.or(`primary_role.ilike.%${value}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Get the total count
      const { count } = await query;

      // Apply pagination and sorting
      query = query
        .order(sortField, { ascending: sortDirection === "asc" })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data: projects, error: projectsError } = await query;

      if (projectsError) {
        throw projectsError;
      }

      // Add creator_username to each project
      const formattedProjects =
        projects?.map((project) => ({
          ...project,
          creator_username: username,
        })) || [];

      // Calculate total pages
      const total = count || 0;

      // Create metadata
      const meta = {
        pagination: createPaginationMeta(page, limit, total),
        filters: createFilterMeta(filters, {
          featured: [true, false],
          year: [2020, 2021, 2022, 2023, 2024],
          // Add other available filters as needed
        }),
      };

      return sendSuccess(res, formattedProjects, meta);
    } catch (error: any) {
      logger.error(`Error in getCreatorProjects: ${error.message}`, { error });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Get creator's portfolio
   * GET /api/creators/:username/portfolio
   */
  async getCreatorPortfolio(req: Request, res: Response) {
    try {
      const { username } = req.params;

      // Get creator by username with their profile data and all projects
      const { data, error } = await supabase
        .from("creators")
        .select(
          `
          id,
          username,
          location,
          bio,
          primary_role,
          years_of_experience,
          work_email,
          social_links,
          created_at,
          updated_at,
          profile:profile_id (
            first_name,
            last_name
          ),
          projects (
            id,
            title,
            description,
            behance_url,
            featured,
            year,
            created_at,
            updated_at,
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
          return sendError(
            res,
            ErrorCode.NOT_FOUND,
            "Creator not found",
            null,
            404
          );
        }
        throw error;
      }

      if (!data) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Creator not found",
          null,
          404
        );
      }

      // Extract profile data and flatten it
      // Use type assertion to help TypeScript understand the structure
      const typedData = data as any;
      const { profile, ...creatorData } = typedData;

      // Format the portfolio response
      const portfolio = {
        ...creatorData,
        first_name: profile ? profile.first_name : null,
        last_name: profile ? profile.last_name : null,
        // Don't include email for privacy reasons unless it's specifically a work_email
        projects: (typedData.projects || []).map((project: any) => ({
          ...project,
          creator_username: username,
        })),
      };

      return sendSuccess(res, portfolio);
    } catch (error: any) {
      logger.error(`Error in getCreatorPortfolio: ${error.message}`, { error });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Update creator
   * PUT /api/creators/:username
   */
  async updateCreator(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;
      const {
        username: newUsername,
        bio,
        location,
        primary_role,
        years_of_experience,
        work_email,
        social_links,
        first_name,
        last_name,
      } = req.body;

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      // Get the creator profile to check ownership
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("id, profile_id")
        .eq("username", username)
        .single();

      if (fetchError || !creator) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Creator not found",
          null,
          404
        );
      }

      // Verify that the authenticated user is the owner of this profile
      if (creator.profile_id !== req.user.id) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          "You don't have permission to update this profile",
          null,
          403
        );
      }

      // Check for username uniqueness if changed
      if (newUsername && newUsername !== username) {
        const { data: existingUsername, error: usernameError } = await supabase
          .from("creators")
          .select("id")
          .eq("username", newUsername)
          .maybeSingle();

        if (!usernameError && existingUsername) {
          return sendError(
            res,
            ErrorCode.USERNAME_TAKEN,
            "This username is already taken",
            null,
            409
          );
        }
      }

      // Prepare creator update data
      const creatorUpdateData: any = {};
      if (newUsername !== undefined) creatorUpdateData.username = newUsername;
      if (location !== undefined) creatorUpdateData.location = location;
      if (bio !== undefined) creatorUpdateData.bio = bio;
      if (primary_role !== undefined) {
        // Validate primary_role is an array
        if (!Array.isArray(primary_role)) {
          return sendError(
            res,
            ErrorCode.INVALID_PARAMETER,
            "primary_role must be an array",
            null,
            400
          );
        }
        creatorUpdateData.primary_role = primary_role;
      }
      if (years_of_experience !== undefined)
        creatorUpdateData.years_of_experience = years_of_experience;
      if (work_email !== undefined) creatorUpdateData.work_email = work_email;
      if (social_links !== undefined)
        creatorUpdateData.social_links = social_links;

      creatorUpdateData.updated_at = new Date().toISOString();

      // Prepare profile update data (first_name and last_name)
      const profileUpdateData: any = {};
      if (first_name !== undefined) profileUpdateData.first_name = first_name;
      if (last_name !== undefined) profileUpdateData.last_name = last_name;
      if (Object.keys(profileUpdateData).length > 0) {
        profileUpdateData.updated_at = new Date().toISOString();
      }

      let updatedCreator;
      let profileData;

      // Update the creator record if there are creator fields to update
      if (Object.keys(creatorUpdateData).length > 1) {
        // > 1 because updated_at is always included
        const { data, error: updateError } = await supabase
          .from("creators")
          .update(creatorUpdateData)
          .eq("id", creator.id)
          .select()
          .single();

        if (updateError) {
          logger.error(
            `Error updating creator profile: ${updateError.message}`,
            { error: updateError }
          );
          return sendError(
            res,
            ErrorCode.UPDATE_FAILED,
            "Failed to update creator profile",
            updateError.message,
            500
          );
        }

        updatedCreator = data;
      } else {
        // Fetch the current creator data if we didn't update it
        const { data, error } = await supabase
          .from("creators")
          .select("*")
          .eq("id", creator.id)
          .single();

        if (!error) {
          updatedCreator = data;
        }
      }

      // Update the profile record if there are profile fields to update
      if (Object.keys(profileUpdateData).length > 0) {
        const { data, error: profileUpdateError } = await supabase
          .from("profiles")
          .update(profileUpdateData)
          .eq("id", creator.profile_id)
          .select("first_name, last_name")
          .single();

        if (profileUpdateError) {
          logger.error(
            `Error updating profile data: ${profileUpdateError.message}`,
            { error: profileUpdateError }
          );
          return sendError(
            res,
            ErrorCode.UPDATE_FAILED,
            "Failed to update profile data",
            profileUpdateError.message,
            500
          );
        }

        profileData = data;
      } else {
        // Get the profile data to return the full response with first_name and last_name
        const { data, error: profileFetchError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", creator.profile_id)
          .single();

        if (!profileFetchError) {
          profileData = data;
        }
      }

      let responseData = updatedCreator;

      if (profileData) {
        responseData = {
          ...updatedCreator,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
        };
      }

      // Clear cache for both old and new username
      invalidateCache(`creator_username_${username}`);
      if (newUsername && newUsername !== username) {
        invalidateCache(`creator_username_${newUsername}`);
      }

      return sendSuccess(res, {
        message: "Profile updated successfully",
        creator: responseData,
      });
    } catch (error: any) {
      logger.error(`Error in updateCreator: ${error.message}`, { error });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
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
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Username and project title are required",
          null,
          400
        );
      }

      const project = await this.creatorProfileService.getProjectByTitle(
        username,
        projectTitle
      );

      if (!project) {
        logger.warn(
          `Project not found for ${username} with title ${projectTitle}`
        );
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Project not found",
          null,
          404
        );
      }

      return sendSuccess(res, project);
    } catch (error: any) {
      logger.error(`Error in getProjectByTitle: ${error.message}`, {
        error,
      });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }

  /**
   * Delete a project image
   * DELETE /api/creators/projects/:projectId/images/:imageId
   */
  async deleteProjectImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      if (!projectId || !imageId) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Project ID and image ID are required",
          null,
          400
        );
      }

      const success = await this.creatorProfileService.deleteProjectImage(
        projectId,
        imageId,
        userId
      );

      if (!success) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          "You don't have permission to delete this image",
          null,
          403
        );
      }

      // Get the creator username to invalidate the cache
      const { data: project } = await supabase
        .from("projects")
        .select("creator_id")
        .eq("id", projectId)
        .single();

      if (project?.creator_id) {
        const { data: creator } = await supabase
          .from("creators")
          .select("username")
          .eq("id", project.creator_id)
          .single();

        if (creator?.username) {
          // Invalidate creator cache
          invalidateCache(`creator_username_${creator.username}`);

          // Also invalidate any project-specific caches
          invalidateCache(`project_${projectId}`);
        }
      }

      return sendSuccess(res, {
        message: "Image deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error in deleteProjectImage: ${error.message}`, {
        error,
      });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Internal server error",
        error.message
      );
    }
  }
}
