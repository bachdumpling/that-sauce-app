import { logger, task } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import { ImageRepository } from "../repositories";
import { triggerRateLimiter, ContentType } from "../utils/triggerRateLimiter";

// Define the payload structure for image analysis
interface ImageAnalysisPayload {
  imageId: string;
  imageUrl: string;
  userId: string;
}

export const imageAnalysisTask = task({
  id: "image-analysis",
  maxDuration: 300, // 5 minutes
  run: async (payload: ImageAnalysisPayload, { ctx }) => {
    logger.info("Starting image analysis task", { payload, ctx });

    try {
      // Create repositories and services
      const imageRepository = new ImageRepository();
      const analysisService = new AnalysisService();

      // Get the image data
      const image = await imageRepository.getImageById(payload.imageId);

      if (!image) {
        throw new Error(`Image not found with ID: ${payload.imageId}`);
      }

      // Skip if already analyzed
      if (image.ai_analysis && image.embedding) {
        logger.info(`Image ${payload.imageId} is already analyzed, skipping`);
        return {
          success: true,
          result: "Image already analyzed",
          imageId: payload.imageId,
        };
      }

      // Update image status to processing
      await imageRepository.updateImageAnalysisStatus(
        payload.imageId,
        "processing"
      );

      // Acquire a rate limit slot for image analysis
      logger.info(
        `Waiting for rate limiting slot for image analysis of ${payload.imageId}`
      );
      await triggerRateLimiter.waitForSlot(ContentType.IMAGE);

      try {
        // Run the analysis
        await analysisService.analyzeImage(image);

        logger.info("Image analysis completed successfully", {
          imageId: payload.imageId,
        });

        return {
          success: true,
          result: "Image analysis successful",
          imageId: payload.imageId,
        };
      } finally {
        // Always mark the task as completed to release the rate limit slot
        triggerRateLimiter.completeTask(ContentType.IMAGE);
      }
    } catch (error) {
      logger.error("Error in image analysis task", {
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      });

      // Try to update the image status to failed
      try {
        const imageRepository = new ImageRepository();
        await imageRepository.updateImageAnalysisStatus(
          payload.imageId,
          "failed",
          error instanceof Error ? error.message : String(error)
        );
      } catch (statusError) {
        logger.error("Failed to update image status", { statusError });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      };
    }
  },
});
