import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projectService";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { uploadMedia } from "../utils/mediaUpload";
import { supabase } from "../lib/supabase";
// Initialize the service
const projectService = new ProjectService();

export const projectController = {
  /**
   * Get all projects for the current user
   */
  getUserProjects: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
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
  getProject: async (
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

      const project = await projectService.getProject(id, userId);
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
      const { title, description } = req.body;
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
        description
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
      const { title, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if there's anything to update
      if ((!title || title.trim() === "") && description === undefined) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // Create update data object with only defined fields
      const updateData: any = {};
      if (title && title.trim() !== "") updateData.title = title.trim();
      if (description !== undefined)
        updateData.description = description.trim();

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

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await projectService.deleteProject(id, userId);
      return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      return next(error);
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

      if (existingProject.creators.profile_id !== userId) {
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

      // Upload the file
      const mediaEntry = await uploadMedia(fileInput, {
        userId,
        projectId: id,
        creatorId: existingProject.creator_id,
      });

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
            profile_id
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

      return res.status(200).json({ message: "Media deleted successfully" });
    } catch (error) {
      return next(error);
    }
  },
};
