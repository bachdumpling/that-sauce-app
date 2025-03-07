// src/routes/admin.ts
import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { extractUser } from "../middleware/extractUser";
import { isAdmin } from "../middleware/isAdmin";
import { cacheMiddleware } from "../lib/cache";

const router = Router();
const adminController = new AdminController();

// Secure all admin routes with authentication and admin role check
router.use(extractUser, isAdmin);

// Creator management routes
router.get(
  "/creators",
  cacheMiddleware(
    300,
    (req) => `creators_list_${req.query.page || 1}_${req.query.limit || 10}`
  ),
  adminController.listCreators
);

router.get(
  "/creators/:id",
  cacheMiddleware(300, (req) => `creator_details_${req.params.id}`),
  adminController.getCreatorDetails
);

// New creator management endpoints
router.put("/creators/:id", adminController.updateCreator);
router.delete("/creators/:id", adminController.deleteCreator);

// Project management routes
router.get(
  "/projects",
  cacheMiddleware(
    300,
    (req) =>
      `admin_projects_list_${req.query.page || 1}_${req.query.limit || 10}_${req.query.creator_id || "all"}`
  ),
  adminController.listProjects
);

router.get(
  "/projects/:id",
  cacheMiddleware(300, (req) => `admin_project_details_${req.params.id}`),
  adminController.getProjectDetails
);

router.put("/projects/:id", adminController.updateProject);
router.delete("/projects/:id", adminController.deleteProject);

// Project image management routes
router.delete(
  "/projects/:projectId/images/:imageId",
  adminController.deleteProjectImage
);

// Existing rejection routes
router.post("/creators/:id/reject", adminController.rejectCreator);

// Rejected creators routes
router.get(
  "/unqualified/creators",
  cacheMiddleware(
    300,
    (req) =>
      `unqualified_creators_${req.query.page || 1}_${req.query.limit || 10}`
  ),
  adminController.listRejectedCreators
);

export default router;
