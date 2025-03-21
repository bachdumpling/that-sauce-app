import express from "express";
import { projectController } from "../controllers/projectController";
import { extractUser } from "../middleware/extractUser";
import { cacheClearMiddleware } from "../lib/cache";
import {
  validateProject,
  validateMedia,
  validateMediaDelete,
  validateMediaUpdate,
} from "../middleware/projectValidation";

const router = express.Router();

// Apply extractUser middleware to all project routes
router.use(extractUser);

/**
 * PUBLIC ROUTES
 * These routes are accessible without authentication but the user info
 * is still extracted if available via the extractUser middleware
 */

// List projects with filtering, pagination and search
// GET /api/projects
router.get("/", projectController.getUserProjects);

// Get a specific project by ID
// GET /api/projects/:id
router.get("/:id", projectController.getProject);

// Get all media (images + videos) for a project
// GET /api/projects/:id/media
router.get("/:id/media", projectController.getProjectMedia);

/**
 * PROTECTED ROUTES
 * These routes require authentication
 */

// Create a new project (requires authentication)
// POST /api/projects
router.post(
  "/",
  validateProject,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_projects_list_`,
  ]),
  projectController.createProject
);

// Update a project (requires authentication and ownership)
// PUT /api/projects/:id
router.put(
  "/:id",
  validateProject,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_project_details_`,
    `admin_projects_list_`,
  ]),
  projectController.updateProject
);

// Delete a project (requires authentication and ownership)
// DELETE /api/projects/:id
router.delete(
  "/:id",
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_project_details_`,
    `admin_projects_list_`,
  ]),
  projectController.deleteProject
);

/**
 * MEDIA MANAGEMENT ROUTES
 * These routes handle project media (images and videos)
 */

// Add media to a project (requires authentication and ownership)
// POST /api/projects/:id/media
router.post(
  "/:id/media",
  validateMedia,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_project_details_`,
  ]),
  projectController.addProjectMedia
);

// Delete media from a project (requires authentication and ownership)
// Requires a 'type' query parameter that must be either 'image' or 'video'
// DELETE /api/projects/:id/media/:mediaId?type=image
router.delete(
  "/:id/media/:mediaId",
  validateMediaDelete,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_project_details_`,
  ]),
  projectController.deleteProjectMedia
);

// Update media properties (alt text, title, etc.)
// PUT /api/projects/:id/media/:mediaId
router.put(
  "/:id/media/:mediaId",
  validateMediaUpdate,
  cacheClearMiddleware([
    `creator_username_`,
    `creator_project_`,
    `admin_project_details_`,
  ]),
  projectController.updateProjectMedia
);

export default router;
