// src/routes/portfolioRoutes.ts
import { Router } from "express";
import { extractUser } from "../middleware/extractUser";
import { isCreatorOrAdmin } from "../middleware/isCreatorOrAdmin";
import { PortfolioController } from "../controllers/portfolioController";
import { cacheMiddleware, cacheClearMiddleware } from "../lib/cache";

const router = Router();
const portfolioController = new PortfolioController();

/**
 * GET /api/portfolios/:id
 * Get portfolio details by ID
 */
router.get(
  "/:id",
  cacheMiddleware(3600, (req) => `portfolio_${req.params.id}`),
  portfolioController.getPortfolioById.bind(portfolioController)
);

/**
 * PUT /api/portfolios/:id
 * Update portfolio by ID
 * Protected: Only the creator of the portfolio or an admin can update it
 */
router.put(
  "/:id",
  extractUser,
  isCreatorOrAdmin,
  cacheClearMiddleware([
    "portfolio_",
    "creator_details_",
    "creator_username_",
    "creator_project_"
  ]),
  portfolioController.updatePortfolio.bind(portfolioController)
);

/**
 * POST /api/portfolios/:id/projects/:projectId
 * Add a project to a portfolio
 * Protected: Only the creator of the portfolio or an admin can add projects
 */
router.post(
  "/:id/projects/:projectId",
  extractUser,
  isCreatorOrAdmin,
  cacheClearMiddleware([
    "portfolio_",
    "creator_details_",
    "creator_username_",
    "creator_project_"
  ]),
  portfolioController.addProjectToPortfolio.bind(portfolioController)
);

/**
 * DELETE /api/portfolios/:id/projects/:projectId
 * Remove a project from a portfolio
 * Protected: Only the creator of the portfolio or an admin can remove projects
 */
router.delete(
  "/:id/projects/:projectId",
  extractUser,
  isCreatorOrAdmin,
  cacheClearMiddleware([
    "portfolio_",
    "creator_details_",
    "creator_username_",
    "creator_project_"
  ]),
  portfolioController.removeProjectFromPortfolio.bind(portfolioController)
);

export default router;
