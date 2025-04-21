// src/routes/analysisRoutes.ts
import { Router } from "express";
import { analysisController } from "../controllers/analysisController";
import { extractUser } from "../middleware/extractUser";

const router = Router();

// Apply authentication middleware
router.use(extractUser);

// Check if portfolio can be analyzed
router.get(
  "/portfolios/:portfolioId/can-analyze",
  analysisController.canAnalyzePortfolio
);

// Start portfolio analysis
router.post(
  "/portfolios/:portfolioId",
  analysisController.startPortfolioAnalysis
);

// Start project analysis
router.post(
  "/projects/:projectId",
  analysisController.startProjectAnalysis
);

// Get portfolio analysis results
router.get("/portfolios/:portfolioId", analysisController.getPortfolioAnalysis);

// Get analysis job status
router.get("/jobs/:jobId", analysisController.getJobStatus);

export default router;
