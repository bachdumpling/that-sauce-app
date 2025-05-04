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

      const totalMediaToAnalyze =
        imagesToAnalyze.length + videosToAnalyze.length;
      const totalMediaInProject = (images?.length || 0) + (videos?.length || 0);

      // If there's no media to analyze, proceed directly to project analysis if there's any analyzed media
      if (totalMediaToAnalyze === 0) {
        logger.info(
          `No new media analyses needed for project ${payload.projectId}`
        );

        // Get already analyzed media counts
        const analyzedImages =
          await imageRepository.getAnalyzedImagesForProject(payload.projectId);
        const analyzedVideos =
          await videoRepository.getAnalyzedVideosForProject(payload.projectId);

        if (
          (analyzedImages && analyzedImages.length > 0) ||
          (analyzedVideos && analyzedVideos.length > 0)
        ) {
          logger.info(
            `Found ${analyzedImages?.length || 0} already analyzed images and ${analyzedVideos?.length || 0} already analyzed videos`
          );
          logger.info(
            `Proceeding to project analysis for ${payload.projectId}`
          );
          await analysisService.analyzeProject(payload.projectId);
          logger.info(
            `Project analysis completed successfully ${payload.projectId}`
          );

          return {
            success: true,
            result: "Project analysis successful",
            projectId: payload.projectId,
          };
        } else {
          logger.warn(
            `No analyzed media available for project ${payload.projectId}, skipping project analysis`
          );
          return {
            success: false,
            error: "No analyzed media available for project",
            projectId: payload.projectId,
          };
        }
      }

      // Track failed media for retry
      const failedImageIds = [];
      const failedVideoIds = [];

      // Try analysis with up to 1 retry
      for (let attempt = 1; attempt <= 2; attempt++) {
        logger.info(
          `Media analysis attempt ${attempt} for project ${payload.projectId}`
        );

        // For the first attempt, analyze all media
        // For the second attempt, only retry failed media
        const currentImagesToAnalyze =
          attempt === 1
            ? imagesToAnalyze
            : images?.filter((img) => failedImageIds.includes(img.id)) || [];

        const currentVideosToAnalyze =
          attempt === 1
            ? videosToAnalyze
            : videos?.filter((vid) => failedVideoIds.includes(vid.id)) || [];

        if (attempt === 2) {
          logger.info(
            `Retry attempt for ${currentImagesToAnalyze.length} failed images and ${currentVideosToAnalyze.length} failed videos`
          );
        }

        // Clear tracking arrays for this attempt
        const imageIdsToTrack = [];
        const videoIdsToTrack = [];
        const imagePromises = [];
        const videoPromises = [];

        // Trigger image analysis tasks
        if (currentImagesToAnalyze.length > 0) {
          logger.info(
            `Starting rate-limited image analysis for ${currentImagesToAnalyze.length} images`
          );

          for (const image of currentImagesToAnalyze) {
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

        // Trigger video analysis tasks
        if (currentVideosToAnalyze.length > 0) {
          logger.info(
            `Starting rate-limited video analysis for ${currentVideosToAnalyze.length} videos`
          );

          for (const video of currentVideosToAnalyze) {
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

        // Wait for all trigger operations to complete
        if (imagePromises.length > 0 || videoPromises.length > 0) {
          logger.info(
            `Successfully triggered ${imagePromises.length} image analysis tasks and ${videoPromises.length} video analysis tasks`
          );
          await Promise.all([...imagePromises, ...videoPromises]);
          logger.info(
            `Waiting for ${imagePromises.length} image and ${videoPromises.length} video analyses to complete for project ${payload.projectId}`
          );
        }

        // Now, if we have media being analyzed, wait for them to actually complete
        if (imageIdsToTrack.length > 0 || videoIdsToTrack.length > 0) {
          logger.info(
            `All triggered media analyses completed (or skipped) for project ${payload.projectId}`
          );

          // Wait for the analyses to complete with a timeout
          let attemptsRemaining = attempt === 1 ? 6 : 6; // 6 minutes for first attempt, 6 minutes for retry
          let allAnalyzesComplete = false;

          while (!allAnalyzesComplete && attemptsRemaining > 0) {
            // Wait 10 seconds between checks
            await new Promise((resolve) => setTimeout(resolve, 10000));

            // Check images
            let pendingImages = 0;
            let failedImagesThisAttempt = [];
            if (imageIdsToTrack.length > 0) {
              const analyzedImages =
                await imageRepository.getAnalyzedImagesWithIds(imageIdsToTrack);
              pendingImages = imageIdsToTrack.length - analyzedImages.length;

              // Identify which images are still pending
              failedImagesThisAttempt = imageIdsToTrack.filter(
                (id) => !analyzedImages.some((img) => img.id === id)
              );
            }

            // Check videos
            let pendingVideos = 0;
            let failedVideosThisAttempt = [];
            if (videoIdsToTrack.length > 0) {
              const analyzedVideos =
                await videoRepository.getAnalyzedVideosWithIds(videoIdsToTrack);
              pendingVideos = videoIdsToTrack.length - analyzedVideos.length;

              // Identify which videos are still pending
              failedVideosThisAttempt = videoIdsToTrack.filter(
                (id) => !analyzedVideos.some((vid) => vid.id === id)
              );
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

          // If not all analyses completed, store the failed ones for retry
          if (!allAnalyzesComplete) {
            logger.warn(
              `Timeout reached waiting for media analyses to complete for project ${payload.projectId}. Some media analyses didn't finish.`
            );

            // Store failed items for retry on second attempt
            if (attempt === 1) {
              // Get the current ID lists of items that failed
              const analyzedImages =
                await imageRepository.getAnalyzedImagesWithIds(imageIdsToTrack);
              const analyzedVideos =
                await videoRepository.getAnalyzedVideosWithIds(videoIdsToTrack);

              // Find which ones failed (not in the analyzed list)
              failedImageIds.push(
                ...imageIdsToTrack.filter(
                  (id) => !analyzedImages.some((img) => img.id === id)
                )
              );
              failedVideoIds.push(
                ...videoIdsToTrack.filter(
                  (id) => !analyzedVideos.some((vid) => vid.id === id)
                )
              );

              logger.info(
                `Marked ${failedImageIds.length} images and ${failedVideoIds.length} videos for retry`
              );
            }
          }
        }
      } // End of for-loop for attempts

      // Check if we have enough analyzed media to proceed (70% threshold)
      const analyzedImages = await imageRepository.getAnalyzedImagesForProject(
        payload.projectId
      );
      const analyzedVideos = await videoRepository.getAnalyzedVideosForProject(
        payload.projectId
      );

      const totalAnalyzedMedia =
        (analyzedImages?.length || 0) + (analyzedVideos?.length || 0);
      const percentageAnalyzed =
        totalMediaInProject > 0
          ? (totalAnalyzedMedia / totalMediaInProject) * 100
          : 0;

      logger.info(
        `Found ${analyzedImages?.length || 0} analyzed images and ${analyzedVideos?.length || 0} analyzed videos (${percentageAnalyzed.toFixed(2)}%) for project ${payload.projectId}`
      );

      // Only proceed if we have at least 70% analyzed media OR at least some analyzed media if the project has very few items
      if (
        percentageAnalyzed >= 70 ||
        (totalMediaInProject <= 3 && totalAnalyzedMedia > 0)
      ) {
        // After all media is analyzed, analyze the project itself
        logger.info(
          `Sufficient media analyzed (${percentageAnalyzed.toFixed(2)}%), proceeding with project analysis for ${payload.projectId}`
        );
        await analysisService.analyzeProject(payload.projectId);
        logger.info(
          `Project analysis completed successfully ${payload.projectId}`
        );
      } else {
        logger.warn(
          `Insufficient media analyzed (${percentageAnalyzed.toFixed(2)}% < 70%) for project ${payload.projectId}, skipping project analysis`
        );
        return {
          success: false,
          error: `Insufficient media analyzed (${percentageAnalyzed.toFixed(2)}% < 70%)`,
          projectId: payload.projectId,
        };
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
