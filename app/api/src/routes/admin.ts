// src/routes/admin.ts
import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { extractUser } from "../middleware/extractUser";
import { isAdmin } from "../middleware/isAdmin";
import { cacheMiddleware, cacheClearMiddleware } from "../lib/cache";

const router = Router();
const adminController = new AdminController();

// Secure all admin routes with authentication and admin role check
router.use(extractUser, isAdmin);

// System stats endpoint
router.get(
  "/stats",
  cacheMiddleware(60, () => "admin_system_stats"),
  adminController.getSystemStats
);

// Creator management routes
router.get(
  "/creators",
  cacheMiddleware(
    300,
    (req) =>
      `creators_list_${req.query.page || 1}_${req.query.limit || 10}_${req.query.search || ""}_${req.query.status || "all"}`
  ),
  adminController.listCreators
);

router.get(
  "/creators/:username",
  cacheMiddleware(300, (req) => `creator_details_${req.params.username}`),
  adminController.getCreatorDetails
);

router.put(
  "/creators/:username",
  cacheClearMiddleware([
    `creator_details_`,
    `creators_list_`,
    `creator_username_`,
    `creator_project_`,
    `search_creators_`,
  ]),
  adminController.updateCreator
);

router.delete(
  "/creators/:username",
  cacheClearMiddleware([
    `creator_details_`,
    `creators_list_`,
    `creator_username_`,
    `creator_project_`,
    `search_creators_`,
  ]),
  adminController.deleteCreator
);

// Creator status management (approve/reject)
router.post(
  "/creators/:username/status",
  cacheClearMiddleware([
    `creator_details_`,
    `creators_list_`,
    `creator_username_`,
    `unqualified_creators_`,
  ]),
  adminController.updateCreatorStatus
);

// Legacy approve/reject endpoints for backward compatibility
router.post(
  "/creators/:username/approve",
  cacheClearMiddleware([
    `creator_details_`,
    `creators_list_`,
    `creator_username_`,
    `unqualified_creators_`,
  ]),
  adminController.approveCreator
);

router.post(
  "/creators/:username/reject",
  cacheClearMiddleware([
    `creator_details_`,
    `creators_list_`,
    `creator_username_`,
    `unqualified_creators_`,
  ]),
  adminController.rejectCreator
);

// Project management routes
router.get(
  "/projects",
  cacheMiddleware(
    300,
    (req) =>
      `admin_projects_list_${req.query.page || 1}_${req.query.limit || 10}_${req.query.creator_id || "all"}_${req.query.status || "all"}`
  ),
  adminController.listProjects
);

router.get(
  "/projects/:id",
  cacheMiddleware(300, (req) => `admin_project_details_${req.params.id}`),
  adminController.getProjectDetails
);

router.put(
  "/projects/:id",
  cacheClearMiddleware([
    `admin_project_details_`,
    `admin_projects_list_`,
    `creator_project_`,
    `creator_username_`,
  ]),
  adminController.updateProject
);

router.delete(
  "/projects/:id",
  cacheClearMiddleware([
    `admin_project_details_`,
    `admin_projects_list_`,
    `creator_project_`,
    `creator_username_`,
  ]),
  adminController.deleteProject
);

// Media management routes
router.get(
  "/media",
  cacheMiddleware(
    300,
    (req) =>
      `admin_media_list_${req.query.page || 1}_${req.query.limit || 10}_${req.query.project_id || "all"}_${req.query.type || "all"}`
  ),
  adminController.listMedia
);

router.delete(
  "/media/:id",
  cacheClearMiddleware([
    `admin_project_details_`,
    `creator_project_`,
    `creator_username_`,
    `admin_media_list_`,
    `creator_details_`,
    `search_creators_`,
    `creators_list_`,
  ]),
  adminController.deleteMedia
);

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
