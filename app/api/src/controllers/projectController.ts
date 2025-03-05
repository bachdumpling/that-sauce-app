import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import { uploadMedia } from "../utils/mediaUpload";
import { AuthenticatedRequest } from "../middleware/extractUser";

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

      // First get the creator profile for the user
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("profile_id", userId)
        .single();

      if (creatorError) {
        return res.status(404).json({ error: "Creator profile not found" });
      }

      // Get all projects for the creator
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        return next(projectsError);
      }

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

      // Get the project with creator info
      const { data: project, error: projectError } = await supabase
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

      // Check if the project belongs to the user
      if (project.creators.profile_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get project images
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("project_id", id)
        .order("order", { ascending: true });

      if (imagesError) {
        return next(imagesError);
      }

      // Get project videos
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (videosError) {
        return next(videosError);
      }

      // Combine media
      const media = [
        ...(images || []).map((image) => ({ ...image, file_type: "image" })),
        ...(videos || []).map((video) => ({ ...video, file_type: "video" })),
      ];

      return res.status(200).json({
        project: {
          ...project,
          media,
        },
      });
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

      // Get the creator profile for the user
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("profile_id", userId)
        .single();

      if (creatorError) {
        return res.status(404).json({ error: "Creator profile not found" });
      }

      // Find the creator's portfolio
      let portfolio: any = null;
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id")
        .eq("creator_id", creator.id)
        .single();

      if (portfolioError) {
        // If portfolio doesn't exist, create one
        const { data: newPortfolio, error: newPortfolioError } = await supabase
          .from("portfolios")
          .insert([
            {
              creator_id: creator.id,
              project_ids: [],
            },
          ])
          .select("id")
          .single();

        if (newPortfolioError) {
          return next(newPortfolioError);
        }

        // Use the newly created portfolio
        portfolio = newPortfolio;
      } else {
        portfolio = portfolioData;
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            title: title.trim(),
            description: description?.trim() || null,
            creator_id: creator.id,
            portfolio_id: portfolio.id,
          },
        ])
        .select()
        .single();

      if (projectError) {
        return next(projectError);
      }

      // Update the portfolio's project_ids array to include the new project
      const { error: updatePortfolioError } = await supabase.rpc(
        "append_project_to_portfolio",
        {
          p_portfolio_id: portfolio.id,
          p_project_id: project.id,
        }
      );

      if (updatePortfolioError) {
        console.error(
          "Failed to update portfolio project_ids:",
          updatePortfolioError
        );
        // Continue anyway since the project was created successfully
      }

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

      // Update the project
      const updateData: any = {};

      if (title !== undefined) {
        if (title.trim() === "") {
          return res.status(400).json({ error: "Title cannot be empty" });
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description.trim() || null;
      }

      const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return next(updateError);
      }

      return res.status(200).json({ project: updatedProject });
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

      // Update the portfolio to remove this project from project_ids
      const { error: updatePortfolioError } = await supabase.rpc(
        "remove_project_from_portfolio",
        {
          p_portfolio_id: existingProject.portfolio_id,
          p_project_id: id,
        }
      );

      if (updatePortfolioError) {
        console.error(
          "Failed to update portfolio project_ids:",
          updatePortfolioError
        );
        // Continue anyway to delete the project
      }

      // Delete the project
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return next(deleteError);
      }

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
