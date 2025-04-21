import { logger, task } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import { ImageRepository } from "../repositories";

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
    } catch (error) {
      logger.error("Error in image analysis task", {
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      };
    }
  },
});
