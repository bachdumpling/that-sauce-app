import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projectService";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { supabase } from "../lib/supabase";
import { invalidateCache } from "../lib/cache";
import { MediaService } from "../services/mediaService";
import { UploadedFile } from "express-fileupload";
import { CreatorWithProfile, FormattedMedia } from "../models/Media";
import { ErrorCode } from "../models/ApiResponse";
import { ImageMedia, VideoMedia } from "../models/Media";
import logger from "../config/logger";

// Initialize the service
const projectService = new ProjectService();
const mediaService = new MediaService();

export const projectController = {
  /**
   * Get all projects for the current user
   */
  getUserProjects: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const projects = await projectService.getUserProjects(userId);
      return res.status(200).json({ projects });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get a specific project
   */
  getProject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const includeOrgs = req.query.includeOrganizations === "true";

      let project;
      if (includeOrgs) {
        project = await projectService.getProjectWithOrganizations(id);
      } else {
        project = await projectService.getProject(id);
      }

      return res.status(200).json({ project });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Create a new project
   */
  createProject: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { title, description, short_description, roles, client_ids, year } =
        req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
      }

      const project = await projectService.createProject(
        userId,
        title,
        description,
        short_description,
        roles,
        client_ids,
        year
      );
      return res.status(201).json({ project });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update a project
   */
  updateProject: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        short_description,
        roles,
        client_ids,
        year,
        thumbnail_url,
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if there's anything to update
      if (
        (!title || title.trim() === "") &&
        description === undefined &&
        short_description === undefined &&
        roles === undefined &&
        client_ids === undefined &&
        year === undefined &&
        thumbnail_url === undefined
      ) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // Create update data object with only defined fields
      const updateData: any = {};
      if (title && title.trim() !== "") updateData.title = title.trim();
      if (description !== undefined)
        updateData.description = description.trim();
      if (short_description !== undefined)
        updateData.short_description = short_description.trim();
      if (roles !== undefined) updateData.roles = roles;
      if (client_ids !== undefined) updateData.client_ids = client_ids;
      if (year !== undefined) updateData.year = year;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;

      const project = await projectService.updateProject(
        id,
        userId,
        updateData
      );
      return res.status(200).json({ project });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Delete a project
   */
  deleteProject: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const cascade = req.query.cascade === "true";

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get project and creator info before deletion for cache invalidation
      const { data: project } = await supabase
        .from("projects")
        .select("id, creator_id")
        .eq("id", id)
        .single();

      let creatorUsername;
      if (project?.creator_id) {
        const { data: creator } = await supabase
          .from("creators")
          .select("username")
          .eq("id", project.creator_id)
          .single();

        creatorUsername = creator?.username;
      }

      const deleteResult = await projectService.deleteProject(
        id,
        userId,
        cascade
      );

      // Check if the service layer reported an error
      if (!deleteResult.success) {
        // Log the error for debugging
        logger.error(`Failed to delete project ${id}: ${deleteResult.error}`);
        // Return a specific error response (e.g., 403 for permission, 500 for others)
        // We might need more specific error handling based on deleteResult.error
        if (deleteResult.error?.includes("permission")) {
          return res.status(403).json({
            success: false,
            error:
              "Forbidden: You don't have permission to delete this project",
          });
        }
        return res.status(500).json({
          success: false,
          error: deleteResult.error || "Failed to delete project",
        });
      }

      // Invalidate caches only on successful deletion
      if (creatorUsername) {
        invalidateCache(`creator_username_${creatorUsername}`);
      }
      invalidateCache(`project_${id}`);

      return res
        .status(200)
        .json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      // Log the caught error as well
      logger.error(
        `Unexpected error in deleteProject controller for project ${req.params.id}:`,
        error
      );
      return next(error); // Keep passing to error handler for unexpected issues
    }
  },

  /**
   * Get all media (images and videos) associated with a project.
   */
  getProjectMedia: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if project exists
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, title")
        .eq("id", id)
        .single();

      if (projectError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found",
          },
        });
      }

      // Fetch images for this project if the project exists
      const imagesResult = await projectService.getProjectImages(id);
      if (!imagesResult.success) {
        logger.error("Error fetching images:", imagesResult.error);
      }

      // Fetch videos for this project
      const videosResult = await projectService.getProjectVideos(id);
      if (!videosResult.success) {
        logger.error("Error fetching videos:", videosResult.error);
      }

      // Format the response with proper typing
      const formattedImages: FormattedMedia[] =
        imagesResult.data?.map((image: any) => ({
          id: image.id,
          type: "image" as const,
          url: image.url,
          alt_text: image.alt_text,
          created_at: image.created_at,
          updated_at: image.updated_at,
          order: image.order,
          thumbnails: image.resolutions || {},
          creator: image.creator
            ? {
                id: image.creator.id,
                username: image.creator.username,
              }
            : undefined,
        })) || [];

      const formattedVideos: FormattedMedia[] =
        videosResult.data?.map((video: any) => ({
          id: video.id,
          type: "video" as const,
          url: video.url,
          title: video.title,
          description: video.description,
          created_at: video.created_at,
          updated_at: video.updated_at,
          order: video.order,
          creator: video.creator
            ? {
                id: video.creator.id,
                username: video.creator.username,
              }
            : undefined,
        })) || [];

      // Combine and sort by order
      const allMedia = [...formattedImages, ...formattedVideos].sort(
        (a, b) => a.order - b.order
      );

      return res.status(200).json({
        success: true,
        data: {
          project_id: id,
          project_title: project.title,
          media: allMedia,
          total: allMedia.length,
          images_count: formattedImages.length,
          videos_count: formattedVideos.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add media to a project
   */
  addProjectMedia: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if the project exists and belongs to the user
      const { data: existingProject, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          *,
          creators!inner (
            id,
            profile_id
          )
        `
        )
        .eq("id", id)
        .single();

      if (projectError) {
        return next(projectError);
      }

      // Properly type the creators object
      const creator = existingProject.creators as unknown as CreatorWithProfile;

      if (creator.profile_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Handle file upload
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: "No files were uploaded" });
      }

      const fileInput = req.files.file;

      // Ensure we're working with a single file
      if (Array.isArray(fileInput)) {
        return res
          .status(400)
          .json({ error: "Please upload only one file at a time" });
      }

      // Upload the file using mediaService
      const mediaEntry = await mediaService.uploadMedia(
        fileInput as UploadedFile,
        {
          userId,
          projectId: id,
          creatorId: existingProject.creator_id,
          metadata: {
            alt_text: req.body.alt_text || fileInput.name,
            title: req.body.title || fileInput.name,
            description: req.body.description || "",
            order: req.body.order || 0,
          },
        }
      );

      // Invalidate cache
      invalidateCache(`project_${id}`);

      return res.status(201).json({ media: mediaEntry });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Delete media from a project
   */
  deleteProjectMedia: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, mediaId } = req.params;
      const mediaType = req.query.type as string;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!mediaType || (mediaType !== "image" && mediaType !== "video")) {
        return res.status(400).json({
          error: "Media type must be specified as 'image' or 'video'",
        });
      }

      // Check if the project exists and belongs to the user
      const { data: existingProject, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          *,
          creators!inner (
            id,
            profile_id,
            username
          )
        `
        )
        .eq("id", id)
        .single();

      if (projectError) {
        return next(projectError);
      }

      if (existingProject.creators.profile_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if the media exists and belongs to the project
      const tableName = mediaType === "image" ? "images" : "videos";
      const { data: media, error: mediaError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", mediaId)
        .eq("project_id", id)
        .single();

      if (mediaError) {
        return next(mediaError);
      }

      // Extract the file path from the URL
      const url = new URL(media.url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts
        .slice(pathParts.indexOf("media") + 1)
        .join("/");

      // Delete the media from storage
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([filePath]);

      if (storageError) {
        return next(storageError);
      }

      // Delete the media record
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", mediaId);

      if (deleteError) {
        return next(deleteError);
      }

      // Invalidate caches
      if (existingProject.creators.username) {
        invalidateCache(
          `creator_username_${existingProject.creators.username}`
        );
      }
      invalidateCache(`project_${id}`);

      return res.status(200).json({ message: "Media deleted successfully" });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update media properties (alt text, title, etc.)
   */
  updateProjectMedia: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, mediaId } = req.params;
      const mediaType = req.query.type as string;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      if (!mediaType || (mediaType !== "image" && mediaType !== "video")) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_MEDIA_TYPE",
            message: "Media type must be specified as 'image' or 'video'",
          },
        });
      }

      // Check if the project exists and belongs to the user
      const { data: existingProject, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          id,
          creator_id,
          creators!inner (
            id,
            profile_id,
            username
          )
        `
        )
        .eq("id", id)
        .single();

      if (projectError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project not found",
          },
        });
      }

      // Properly type the creators object
      const creator = existingProject.creators as unknown as CreatorWithProfile;

      if (creator.profile_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "You don't have permission to update media in this project",
          },
        });
      }

      // Check if the media exists and belongs to the project
      const tableName = mediaType === "image" ? "images" : "videos";
      const { data: media, error: mediaError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", mediaId)
        .eq("project_id", id)
        .single();

      if (mediaError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "MEDIA_NOT_FOUND",
            message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} not found`,
          },
        });
      }

      // Prepare update data based on media type
      const updateData: Record<string, any> = {};

      if (mediaType === "image") {
        // Update image properties
        if (req.body.alt_text !== undefined)
          updateData.alt_text = req.body.alt_text;
        if (req.body.order !== undefined)
          updateData.order = parseInt(req.body.order);
      } else {
        // Update video properties
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.description !== undefined)
          updateData.description = req.body.description;
        if (req.body.order !== undefined)
          updateData.order = parseInt(req.body.order);
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_CHANGES",
            message: "No valid fields to update",
          },
        });
      }

      // Update the media
      const { data: updatedMedia, error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", mediaId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update media",
          },
        });
      }

      // Invalidate caches
      invalidateCache(`creator_username_${creator.username}`);
      invalidateCache(`project_${id}`);

      // Format response based on media type
      let formattedMedia: FormattedMedia;

      if (mediaType === "image") {
        const imageMedia = updatedMedia as unknown as ImageMedia;
        formattedMedia = {
          id: imageMedia.id,
          type: "image",
          url: imageMedia.url,
          alt_text: imageMedia.alt_text,
          created_at: imageMedia.created_at,
          updated_at: imageMedia.updated_at,
          order: imageMedia.order,
          thumbnails: imageMedia.resolutions || {},
        };
      } else {
        const videoMedia = updatedMedia as unknown as VideoMedia;
        formattedMedia = {
          id: videoMedia.id,
          type: "video",
          url: videoMedia.url,
          title: videoMedia.title,
          description: videoMedia.description,
          created_at: videoMedia.created_at,
          updated_at: videoMedia.updated_at,
          order: videoMedia.order,
        };
      }

      return res.status(200).json({
        success: true,
        data: {
          media: formattedMedia,
          message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} updated successfully`,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
