import { Router } from "express";
import { organizationController } from "../controllers/organizationController";
import { extractUser } from "../middleware/extractUser";
import { validateOrganization } from "../middleware/organizationValidation";
import { cacheClearMiddleware } from "../lib/cache";

const router = Router();

// Apply extractUser middleware to all organization routes
router.use(extractUser);

// Get all organizations
// GET /api/organizations
router.get("/", organizationController.getAll);

// Get a specific organization by ID
// GET /api/organizations/:id
router.get("/:id", organizationController.getById);

// Create a new organization
// POST /api/organizations
router.post(
  "/",
  validateOrganization,
  cacheClearMiddleware(["organization_"]),
  organizationController.create
);

// Update an organization
// PUT /api/organizations/:id
router.put(
  "/:id",
  validateOrganization,
  cacheClearMiddleware(["organization_"]),
  organizationController.update
);

// Delete an organization
// DELETE /api/organizations/:id
router.delete(
  "/:id",
  cacheClearMiddleware(["organization_"]),
  organizationController.delete
);

export default router;
