// src/trigger/scraperTask.ts
import { logger, task } from "@trigger.dev/sdk/v3";
import { createScraper } from "../services/scraperService";
import type { ScraperResult } from "../services/scraperService";

// Define the payload structure for the scraper task
interface ScraperPayload {
  url: string;
  projectId?: string;
  userId: string;
  autoImport?: boolean;
}

export const scraperTask = task({
  id: "website-scraper",
  // Set a much higher timeout than the Vercel 60-second limit
  // This allows for complex scraping operations
  maxDuration: 120, // 2 minutes (adjust as needed)

  run: async (payload: ScraperPayload, { ctx, run }) => {
    logger.info("Starting website scraper task", { payload, ctx });

    try {
      // Create the appropriate scraper based on URL
      const scraper = createScraper(payload.url);

      // Perform the scrape operation
      const result = (await scraper.scrape()) as ScraperResult;

      logger.info(
        `Successfully scraped ${result.total} items from ${payload.url}`
      );

      // If autoImport is true and we have a projectId, we could
      // add logic here to automatically import the scraped media into the project

      return {
        success: true,
        data: result,
        url: payload.url,
        total: result.total,
      };
    } catch (error) {
      logger.error("Error in scraper task", {
        error: error instanceof Error ? error.message : String(error),
        url: payload.url,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: payload.url,
      };
    }
  },
});
