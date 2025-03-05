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
