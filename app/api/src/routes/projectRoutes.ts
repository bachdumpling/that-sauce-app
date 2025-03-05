import express from "express";
import { projectController } from "../controllers/projectController";
import { extractUser } from "../middleware/extractUser";

const router = express.Router();

// Apply extractUser middleware to all project routes
router.use(extractUser);

// Get all projects for the current user
router.get("/", projectController.getUserProjects);

// Get a specific project
router.get("/:id", projectController.getProject);

// Create a new project
router.post("/", projectController.createProject);

// Update a project
router.put("/:id", projectController.updateProject);

// Delete a project
router.delete("/:id", projectController.deleteProject);

// Add media to a project
router.post("/:id/media", projectController.addProjectMedia);

// Delete media from a project
// Requires a 'type' query parameter that must be either 'image' or 'video'
// Example: DELETE /api/projects/:id/media/:mediaId?type=image
router.delete("/:id/media/:mediaId", projectController.deleteProjectMedia);

export default router; 