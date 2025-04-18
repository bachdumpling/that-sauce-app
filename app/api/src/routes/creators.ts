import { Router } from "express";
import { CreatorController } from "../controllers/creatorController";
import { extractUser } from "../middleware/extractUser";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { cacheMiddleware, cacheClearMiddleware } from "../lib/cache";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { Response } from "express";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const router = Router();
const creatorController = new CreatorController();

// Bind the controller methods to preserve the 'this' context
const getCreatorByUsername =
  creatorController.getCreatorByUsername.bind(creatorController);
const getProjectByTitle =
  creatorController.getProjectByTitle.bind(creatorController);
const deleteProjectImage =
  creatorController.deleteProjectImage.bind(creatorController);
const updateCreatorProfile =
  creatorController.updateCreator.bind(creatorController);
const listCreators = creatorController.listCreators.bind(creatorController);
const createCreator = creatorController.createCreator.bind(creatorController);
const getCreatorProjects =
  creatorController.getCreatorProjects.bind(creatorController);
const getCreatorPortfolio =
  creatorController.getCreatorPortfolio.bind(creatorController);

// Apply extractUser middleware but don't require authentication for public endpoints
router.use(extractUser);

// Upload profile image
router.post(
  "/:username/avatar",
  extractUser,
  uploadMiddleware, // Reuse the same middleware as media uploads
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `creator_projects_`,
    `creator_portfolio_`,
  ]),
  creatorController.uploadProfileImage.bind(creatorController)
);

// Upload profile banner
router.post(
  "/:username/banner",
  extractUser,
  uploadMiddleware,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `creator_projects_`,
    `creator_portfolio_`,
  ]),
  creatorController.uploadProfileBanner.bind(creatorController)
);

// List creators (with filtering via query params)
router.get(
  "/",
  cacheMiddleware(
    300,
    (req) =>
      `creators_list_${req.query.page || 1}_${req.query.limit || 10}_${req.query.q || ""}_${JSON.stringify(req.query.filter || {})}_${req.query.sort || ""}`
  ),
  listCreators
);

// Username check route needs to come BEFORE the /:username route to prevent parameter confusion
router.get("/username-check", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Username parameter is required",
        },
      });
    }

    // Check if the username already exists in the database
    const { data, error } = await supabase
      .from("creators")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      logger.error(`Error checking username: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Error checking username availability",
        },
      });
    }

    // If no data returned, username is available
    const isAvailable = !data;

    return res.status(200).json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable
          ? "Username is available"
          : "Username is already taken",
      },
    });
  } catch (error: any) {
    logger.error(`Error in username check: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    });
  }
});

// Create new creator (protected)
router.post(
  "/",
  extractUser,
  cacheClearMiddleware([`creators_list_`, `search_creators_`]),
  createCreator
);

// Get creator by username
router.get(
  "/:username",
  extractUser,
  cacheMiddleware(300, (req) => `creator_username_${req.params.username}`),
  getCreatorByUsername
);

// Get creator's projects
router.get(
  "/:username/projects",
  cacheMiddleware(
    300,
    (req) =>
      `creator_projects_${req.params.username}_${req.query.page || 1}_${req.query.limit || 10}_${req.query.q || ""}_${JSON.stringify(req.query.filter || {})}_${req.query.sort || ""}`
  ),
  getCreatorProjects
);

// Get creator's portfolio
router.get(
  "/:username/portfolio",
  cacheMiddleware(300, (req) => `creator_portfolio_${req.params.username}`),
  getCreatorPortfolio
);

// Get specific project by creator username and project title
router.get(
  "/:username/projects/:projectTitle",
  cacheMiddleware(
    300,
    (req) => `creator_project_${req.params.username}_${req.params.projectTitle}`
  ),
  getProjectByTitle
);

// Update creator (protected)
router.put(
  "/:username",
  extractUser,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `creator_projects_`,
    `creator_portfolio_`,
    `search_creators_`,
  ]),
  updateCreatorProfile
);

// Delete project image (owner only)
router.delete(
  "/projects/:projectId/images/:imageId",
  extractUser,
  cacheClearMiddleware([
    `creator_project_`,
    `creator_username_`,
    `creator_projects_`,
    `creator_portfolio_`,
  ]),
  deleteProjectImage
);

// Delete project video (owner only)
router.delete(
  "/projects/:projectId/videos/:videoId",
  extractUser,
  cacheClearMiddleware([
    `creator_project_`,
    `creator_username_`,
    `creator_projects_`,
    `creator_portfolio_`,
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, videoId } = req.params;
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

      // Check if the project exists
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        if (projectError.code === "PGRST116") {
          return res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Project not found",
            },
          });
        }
        logger.error(`Error fetching project data: ${projectError.message}`);
        return res.status(500).json({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Error fetching project data",
          },
        });
      }

      // Get the creator's profile ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("profile_id")
        .eq("id", projectData.creator_id)
        .single();

      if (creatorError) {
        logger.error(`Error fetching creator data: ${creatorError.message}`);
        return res.status(500).json({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Error fetching creator data",
          },
        });
      }

      // Verify ownership
      if (!creatorData || creatorData.profile_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to delete this video",
          },
        });
      }

      // Check if the video exists and belongs to the project
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .select("url")
        .eq("id", videoId)
        .eq("project_id", projectId)
        .single();

      if (videoError) {
        if (videoError.code === "PGRST116") {
          return res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Video not found",
            },
          });
        }
        throw videoError;
      }

      // If the video has a URL stored, delete the file from storage
      if (video.url) {
        try {
          const url = new URL(video.url);
          const pathParts = url.pathname.split("/");
          const filePath = pathParts
            .slice(pathParts.indexOf("media") + 1)
            .join("/");

          // Delete the video from storage
          const { error: storageError } = await supabase.storage
            .from("media")
            .remove([filePath]);

          if (storageError) {
            logger.error(`Error deleting video file: ${storageError.message}`, {
              error: storageError,
            });
            // Continue anyway to delete the database record
          }
        } catch (error) {
          logger.error("Error parsing video URL:", error);
          // Continue anyway to delete the database record
        }
      }

      // Delete the video record
      const { error: deleteError } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({
        success: true,
        data: {
          message: "Video deleted successfully",
        },
      });
    } catch (error: any) {
      logger.error(`Error deleting project video: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      });
    }
  }
);

export default router;
