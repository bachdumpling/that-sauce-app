import { logger, task, tasks } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import {
  ProjectRepository,
  ImageRepository,
  VideoRepository,
} from "../repositories";
import { imageAnalysisTask } from "./imageAnalysisTask";
import { videoAnalysisTask } from "./videoAnalysisTask";

// Define the payload structure for project analysis
interface ProjectAnalysisPayload {
  projectId: string;
  userId: string;
}

export const projectAnalysisTask = task({
  id: "project-analysis",
  maxDuration: 600, // 10 minutes
  run: async (payload: ProjectAnalysisPayload, { ctx }) => {
    logger.info("Starting project analysis task", { payload, ctx });

    try {
      // Create repositories and services
      const projectRepository = new ProjectRepository();
      const imageRepository = new ImageRepository();
      const videoRepository = new VideoRepository();
      const analysisService = new AnalysisService();

      // Get all images and videos for this project
      const images = await imageRepository.getImagesForProject(
        payload.projectId
      );
      const videos = await videoRepository.getVideosForProject(
        payload.projectId
      );

      logger.info(
        `Found ${images?.length || 0} images and ${videos?.length || 0} videos for project ${payload.projectId}`
      );

      // Trigger analysis tasks for each image
      const imagePromises = [];
      if (images && images.length > 0) {
        for (const image of images) {
          // Skip if already analyzed
          if (image.ai_analysis && image.embedding) {
            logger.info(
              `Skipping image analysis for ${image.id} as it's already analyzed.`
            );
            continue;
          }

          logger.info(`Triggering analysis for image ${image.id}`);
          const imageUrl = await analysisService.getHighestResUrl(image);

          if (!imageUrl) {
            logger.warn(
              `No valid URL found for image ${image.id}, skipping analysis.`
            );
            continue;
          }

          const imagePromise = tasks.trigger<typeof imageAnalysisTask>(
            "image-analysis",
            {
              imageId: image.id,
              imageUrl: imageUrl,
              userId: payload.userId,
            }
          );

          imagePromises.push(imagePromise);
        }
      }

      // Trigger analysis tasks for each video
      const videoPromises = [];
      if (videos && videos.length > 0) {
        for (const video of videos) {
          // Skip if already analyzed
          if (video.ai_analysis && video.embedding) {
            logger.info(
              `Skipping video analysis for ${video.id} as it's already analyzed.`
            );
            continue;
          }

          logger.info(`Triggering analysis for video ${video.id}`);

          // Determine video URL
          let videoUrl = null;
          if (video.vimeo_id) {
            videoUrl = `https://vimeo.com/${video.vimeo_id}`;
          } else if (video.youtube_id) {
            videoUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
          } else if (video.url) {
            videoUrl = video.url;
          }

          if (!videoUrl) {
            logger.warn(
              `No valid URL found for video ${video.id}, skipping analysis.`
            );
            continue;
          }

          const videoPromise = tasks.trigger<typeof videoAnalysisTask>(
            "video-analysis",
            {
              videoId: video.id,
              videoUrl: videoUrl,
              userId: payload.userId,
            }
          );

          videoPromises.push(videoPromise);
        }
      }

      // Wait for all media analyses to complete
      await Promise.all([...imagePromises, ...videoPromises]);

      // After all media is analyzed, analyze the project itself
      logger.info("Starting project analysis", {
        projectId: payload.projectId,
      });
      await analysisService.analyzeProject(payload.projectId);

      logger.info("Project analysis completed successfully", {
        projectId: payload.projectId,
      });

      return {
        success: true,
        result: "Project analysis successful",
        projectId: payload.projectId,
      };
    } catch (error) {
      logger.error("Error in project analysis task", {
        error: error instanceof Error ? error.message : String(error),
        projectId: payload.projectId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        projectId: payload.projectId,
      };
    }
  },
});
