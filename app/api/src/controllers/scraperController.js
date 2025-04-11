// src/controllers/mediaScrapeController.js
const logger = require("../config/logger").default;
const { sendError, sendSuccess } = require("../utils/responseUtils");
const { ErrorCode } = require("../models/ApiResponse");
const { createScraper } = require("../services/scraperService");

/**
 * Scrape media (images) from a URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const scrapeMediaFromUrl = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user?.id) {
      return sendError(
        res,
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        null,
        401
      );
    }

    // Get URL from request
    const { url } = req.body;

    if (!url) {
      return sendError(
        res,
        ErrorCode.MISSING_REQUIRED_FIELD,
        "URL is required",
        null,
        400
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return sendError(
        res,
        ErrorCode.INVALID_PARAMETER,
        "Invalid URL format",
        null,
        400
      );
    }

    logger.info(`Scraping media from URL: ${url}`);

    try {
      // Create the appropriate scraper based on the URL
      const scraper = createScraper(url);

      // Perform the scrape operation
      const result = await scraper.scrape();

      // Check if the result already has a success property (indicating it's already formatted)
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        "data" in result
      ) {
        // Extract the actual data we need
        const { data } = result;
        logger.info(`Successfully scraped ${data.total} items from ${url}`);

        // Send just the data part without double-wrapping
        return sendSuccess(res, data);
      } else {
        // If the result is not pre-formatted, use it directly
        logger.info(`Successfully scraped data from ${url}`);
        return sendSuccess(res, result);
      }
    } catch (error) {
      logger.error(`Error during scraping process: ${error.message}`, {
        error,
      });
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to scrape media from the provided URL",
        process.env.NODE_ENV === "development" ? error.message : undefined,
        500
      );
    }
  } catch (error) {
    logger.error(`Error scraping media from URL: ${error.message}`, { error });

    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      "Failed to scrape media from the provided URL",
      process.env.NODE_ENV === "development" ? error.message : undefined,
      500
    );
  }
};

module.exports = {
  scrapeMediaFromUrl,
};
