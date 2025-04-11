// src/routes/mediaScrapeRoutes.js
const express = require("express");
const { scrapeMediaFromUrl } = require("../controllers/scraperController");
const { extractUser } = require("../middleware/extractUser");

const router = express.Router();

// Apply extractUser middleware
router.use(extractUser);

/**
 * @route POST /api/scraper/extract
 * @desc Scrape media from a URL
 */
router.post("/extract", scrapeMediaFromUrl);

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

module.exports = router;
