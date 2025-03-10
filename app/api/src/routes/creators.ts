import { Router } from "express";
import { CreatorController } from "../controllers/creatorController";
import { extractUser } from "../middleware/extractUser";
import { cacheMiddleware } from "../lib/cache";

const router = Router();
const creatorController = new CreatorController();

// Apply extractUser middleware but don't require authentication for public endpoints
router.use(extractUser);

// Public creator endpoints
router.get("/:username", 
  cacheMiddleware(300, (req) => `creator_username_${req.params.username}`),
  creatorController.getCreatorByUsername
);

// Get specific project by creator username and project title
router.get("/:username/projects/:projectTitle",
  cacheMiddleware(300, (req) => `creator_project_${req.params.username}_${req.params.projectTitle}`),
  creatorController.getProjectByTitle
);

// Delete project image (owner only)
router.delete("/projects/:projectId/images/:imageId",
  creatorController.deleteProjectImage
);

export default router; 