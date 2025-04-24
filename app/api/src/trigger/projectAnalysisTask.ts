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

      // Filter to only get media that needs analysis
      const imagesToAnalyze =
        images?.filter((img) => !img.ai_analysis || !img.embedding) || [];
      const videosToAnalyze =
        videos?.filter((vid) => !vid.ai_analysis || !vid.embedding) || [];

      logger.info(
        `Filtered to ${imagesToAnalyze.length} images and ${videosToAnalyze.length} videos that need analysis for project ${payload.projectId}`
      );

      // Trigger analysis tasks for each image
      const imagePromises = [];
      const imageIdsToTrack = []; // Keep track of images we're analyzing

      if (imagesToAnalyze.length > 0) {
        logger.info(
          `Starting rate-limited image analysis for ${imagesToAnalyze.length} images`
        );

        for (const image of imagesToAnalyze) {
          logger.info(`Triggering analysis for image ${image.id}`);
          imageIdsToTrack.push(image.id);

          const imageUrl = await analysisService.getHighestResUrl(image);

          if (!imageUrl) {
            logger.warn(
              `No valid URL found for image ${image.id}, skipping analysis.`
            );
            continue;
          }

          logger.info("tasks.trigger()");
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
      const videoIdsToTrack = []; // Keep track of videos we're analyzing

      if (videosToAnalyze.length > 0) {
        logger.info(
          `Starting rate-limited video analysis for ${videosToAnalyze.length} videos`
        );

        for (const video of videosToAnalyze) {
          logger.info(`Triggering analysis for video ${video.id}`);
          videoIdsToTrack.push(video.id);

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

      // First, wait for all trigger operations to complete
      if (imagePromises.length > 0 || videoPromises.length > 0) {
        logger.info(
          `Successfully triggered ${imagePromises.length} image analysis tasks and ${videoPromises.length} video analysis tasks`
        );
        await Promise.all([...imagePromises, ...videoPromises]);
        logger.info(
          `Waiting for ${imagePromises.length} image and ${videoPromises.length} video analyses to complete for project ${payload.projectId}`
        );
      } else {
        logger.info(
          `No new media analyses needed for project ${payload.projectId}`
        );
      }

      // Now, if we have media being analyzed, we need to wait for them to actually complete
      // We'll check the database repeatedly until all media is analyzed or until timeout
      if (imageIdsToTrack.length > 0 || videoIdsToTrack.length > 0) {
        logger.info(
          `All triggered media analyses completed (or skipped) for project ${payload.projectId}`
        );

        // Wait for the analyses to complete with a timeout
        let attemptsRemaining = 30; // 5 minutes with 10-second intervals
        let allAnalyzesComplete = false;

        while (!allAnalyzesComplete && attemptsRemaining > 0) {
          // Wait 10 seconds between checks
          await new Promise((resolve) => setTimeout(resolve, 10000));

          // Check images
          let pendingImages = 0;
          if (imageIdsToTrack.length > 0) {
            const analyzedImages =
              await imageRepository.getAnalyzedImagesWithIds(imageIdsToTrack);
            pendingImages = imageIdsToTrack.length - analyzedImages.length;
          }

          // Check videos
          let pendingVideos = 0;
          if (videoIdsToTrack.length > 0) {
            const analyzedVideos =
              await videoRepository.getAnalyzedVideosWithIds(videoIdsToTrack);
            pendingVideos = videoIdsToTrack.length - analyzedVideos.length;
          }

          // Log progress
          logger.info(
            `Waiting for media analyses: ${pendingImages} images and ${pendingVideos} videos still pending. Attempts remaining: ${attemptsRemaining}`
          );

          // Check if all complete
          if (pendingImages === 0 && pendingVideos === 0) {
            allAnalyzesComplete = true;
            logger.info(
              `All media for project ${payload.projectId} has been successfully analyzed!`
            );
          } else {
            attemptsRemaining--;
          }
        }

        if (!allAnalyzesComplete) {
          logger.warn(
            `Timeout reached while waiting for media analyses to complete for project ${payload.projectId}. Some media analyses may not have completed.`
          );
        }

        // Wait an additional 5 seconds for any final database updates
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // Get final analyzed media counts
      const analyzedImages = await imageRepository.getAnalyzedImagesForProject(
        payload.projectId
      );
      const analyzedVideos = await videoRepository.getAnalyzedVideosForProject(
        payload.projectId
      );
      logger.info(
        `Found ${analyzedImages?.length || 0} analyzed images and ${analyzedVideos?.length || 0} analyzed videos for project ${payload.projectId} after waiting.`
      );

      // Only attempt project analysis if we have at least some analyzed media
      if (
        (analyzedImages && analyzedImages.length > 0) ||
        (analyzedVideos && analyzedVideos.length > 0)
      ) {
        // After all media is analyzed, analyze the project itself
        logger.info(
          `Waiting for rate limiting slot for project analysis of ${payload.projectId}`
        );
        logger.info(
          `Attempting to call analysisService.analyzeProject ${payload.projectId}`
        );
        await analysisService.analyzeProject(payload.projectId);
        logger.info(
          `Project analysis completed successfully ${payload.projectId}`
        );
      } else {
        logger.warn(
          `No analyzed media available for project ${payload.projectId}, skipping project analysis`
        );
      }

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
