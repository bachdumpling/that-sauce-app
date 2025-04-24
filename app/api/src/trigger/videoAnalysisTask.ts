import { logger, task } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import { VideoRepository } from "../repositories";
import { triggerRateLimiter, ContentType } from "../utils/triggerRateLimiter";

// Define the payload structure for video analysis
interface VideoAnalysisPayload {
  videoId: string;
  videoUrl: string;
  userId: string;
}

export const videoAnalysisTask = task({
  id: "video-analysis",
  maxDuration: 900, // 15 minutes
  run: async (payload: VideoAnalysisPayload, { ctx }) => {
    logger.info("Starting video analysis task", { payload, ctx });

    try {
      // Create repositories and services
      const videoRepository = new VideoRepository();
      const analysisService = new AnalysisService();

      // Get the video data
      const video = await videoRepository.getVideoById(payload.videoId);

      if (!video) {
        throw new Error(`Video not found with ID: ${payload.videoId}`);
      }

      // Skip if already analyzed
      if (video.ai_analysis && video.embedding) {
        logger.info(`Video ${payload.videoId} is already analyzed, skipping`);
        return {
          success: true,
          result: "Video already analyzed",
          videoId: payload.videoId,
        };
      }

      // Update video status to processing
      await videoRepository.updateVideoAnalysisStatus(
        payload.videoId,
        "processing"
      );

      // Acquire a rate limit slot for video analysis
      // Videos are more resource-intensive and may trigger additional API calls
      logger.info(
        `Waiting for rate limiting slot for video analysis of ${payload.videoId}`
      );
      await triggerRateLimiter.waitForSlot(ContentType.VIDEO);

      try {
        // Run the analysis
        await analysisService.analyzeVideo(video);

        logger.info("Video analysis completed successfully", {
          videoId: payload.videoId,
        });

        return {
          success: true,
          result: "Video analysis successful",
          videoId: payload.videoId,
        };
      } finally {
        // Always mark the task as completed to release the rate limit slot
        triggerRateLimiter.completeTask(ContentType.VIDEO);
      }
    } catch (error) {
      logger.error("Error in video analysis task", {
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      });

      // Try to update the video status to failed
      try {
        const videoRepository = new VideoRepository();
        await videoRepository.updateVideoAnalysisStatus(
          payload.videoId,
          "failed",
          error instanceof Error ? error.message : String(error)
        );
      } catch (statusError) {
        logger.error("Failed to update video status", { statusError });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      };
    }
  },
});
