// src/routes/scraperRoutes.ts
import { Router } from "express";
import {
  scrapeMediaFromUrl,
  getScrapeJobStatus,
} from "../controllers/scraperController";
import { extractUser } from "../middleware/extractUser";

const router = Router();

// Apply extractUser middleware
router.use(extractUser);

/**
 * @route POST /api/scraper/extract
 * @desc Scrape media from a URL
 */
router.post("/extract", scrapeMediaFromUrl);

/**
 * @route GET /api/scraper/status/:handle_id
 * @desc Get status of a scraper job
 */
router.get("/status/:handle_id", getScrapeJobStatus);

/**
 * @route POST /api/scraper/import
 * @desc Import scraped media into a project
 */
router.post("/import", (req, res) => {
  // This is implemented via the batchUploadMedia function
  // in the mediaController, so we don't need a separate endpoint
  res.status(501).json({
    success: false,
    error: "Use /api/media/batch endpoint with URL items instead",
  });
});

export default router;
