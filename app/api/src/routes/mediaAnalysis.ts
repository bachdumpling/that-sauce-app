// src/routes/mediaAnalysis.ts
import express from "express";
import { analyzeMediaController } from "../controllers/mediaAnalysisController";
import logger from "../config/logger";

const router = express.Router();

router.post("/analyze", analyzeMediaController);

// Error handler specific to media analysis routes
router.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Media analysis error:", err);
    res.status(500).json({
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
);

export default router;
