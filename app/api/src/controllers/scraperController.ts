// src/controllers/scraperController.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/extractUser";
import logger from "../config/logger";
import { ErrorCode } from "../models/ApiResponse";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { tasks } from "@trigger.dev/sdk/v3";
import type { scraperTask } from "../trigger";

/**
 * Scrape media (images) from a URL
 */
export const scrapeMediaFromUrl = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
    const { url, project_id, auto_import } = req.body;

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

    logger.info(`Triggering scraper for URL: ${url}`);

    try {
      // Trigger the scraper task using Trigger.dev
      const handle = await tasks.trigger<typeof scraperTask>(
        "website-scraper",
        {
          url: url,
          projectId: project_id || undefined,
          userId: req.user.id,
          autoImport: auto_import || false,
        }
      );

      // Return a response to the user with the job ID
      return sendSuccess(res, {
        message: "Scraper task triggered successfully",
        handle_id: handle.id,
        status: "pending",
        url: url,
      });
    } catch (triggerError) {
      logger.error("Error triggering scraper task:", triggerError);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to trigger scraper task",
        process.env.NODE_ENV === "development"
          ? triggerError instanceof Error
            ? triggerError.message
            : String(triggerError)
          : undefined,
        500
      );
    }
  } catch (error) {
    logger.error(`Error in scrapeMediaFromUrl:`, error);

    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      "Failed to scrape media from the provided URL",
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.message
          : String(error)
        : undefined,
      500
    );
  }
};

/**
 * Get status of a scraper job
 */
export const getScrapeJobStatus = async (req: Request, res: Response) => {
  try {
    const { handle_id } = req.params;

    if (!handle_id) {
      return sendError(
        res,
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Job handle ID is required",
        null,
        400
      );
    }

    // You would need to implement a way to check the job status
    // This could be through Trigger.dev's API or by storing job statuses in your database

    // For now, return a basic response
    return sendSuccess(res, {
      message: "Job status check not implemented yet",
      handle_id: handle_id,
    });
  } catch (error) {
    logger.error(`Error getting scrape job status:`, error);
    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      "Failed to get scrape job status",
      null,
      500
    );
  }
};
