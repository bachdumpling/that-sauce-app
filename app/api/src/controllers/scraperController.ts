// src/controllers/scraperController.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/extractUser";
import logger from "../config/logger";
import { ErrorCode } from "../models/ApiResponse";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { tasks } from "@trigger.dev/sdk/v3";
import type { scraperTask } from "../trigger/scraperTask";

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
      logger.info(
        `Attempting to trigger scraper task with params: ${JSON.stringify({
          url,
          projectId: project_id || undefined,
          userId: req.user.id,
          autoImport: auto_import || false,
        })}`
      );

      const handle = await tasks.trigger<typeof scraperTask>(
        "website-scraper",
        {
          url: url,
          projectId: project_id || undefined,
          userId: req.user.id,
          autoImport: auto_import || false,
        }
      );

      logger.info(
        `Scraper task triggered successfully with handle ID: ${handle.id}`
      );

      // Return a response to the user with the job ID
      return sendSuccess(res, {
        message: "Scraper task triggered successfully",
        handle_id: handle.id,
        status: "pending",
        url: url,
        publicAccessToken: handle.publicAccessToken,
      });
    } catch (triggerError) {
      logger.error("Error triggering scraper task:", {
        error:
          triggerError instanceof Error
            ? {
                message: triggerError.message,
                name: triggerError.name,
                stack: triggerError.stack,
              }
            : String(triggerError),
        url,
        userId: req.user.id,
        projectId: project_id,
      });

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
