import { logger, task } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import { VideoRepository } from "../repositories";

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
    } catch (error) {
      logger.error("Error in video analysis task", {
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      };
    }
  },
});
