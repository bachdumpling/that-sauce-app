// src/services/analysisService.ts
// Remove direct supabase import if no longer needed directly
// import { supabase } from "../lib/supabase";
import {
  GoogleGenAI,
  FileState,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";
import { createUserContent, createPartFromUri } from "@google/genai";
import { GEMINI_API_KEY } from "../config/env";
import { ANALYSIS_CONFIG } from "../config/analysisConfig";
import logger from "../config/logger";
import { RateLimiter } from "../utils/rateLimiter";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Import Repositories
import {
  AnalysisJobRepository,
  CreatorRepository,
  ImageRepository,
  PortfolioRepository,
  ProjectRepository,
  VideoRepository,
  AnalyzedProjectForPortfolio, // Import specific types if needed
  ProjectForAnalysis,
} from "../repositories";
import { ImageMedia, VideoMedia, AnalysisStatus } from "../models/Media"; // Corrected import names

export class AnalysisService {
  private genAI: GoogleGenAI;
  private imageRateLimiter: RateLimiter;
  private textRateLimiter: RateLimiter;

  // Inject repositories
  private analysisJobRepository: AnalysisJobRepository;
  private projectRepository: ProjectRepository;
  private imageRepository: ImageRepository;
  private videoRepository: VideoRepository;
  private portfolioRepository: PortfolioRepository;
  private creatorRepository: CreatorRepository;

  constructor(
    // Allow repositories to be passed in (Dependency Injection)
    analysisJobRepository: AnalysisJobRepository = new AnalysisJobRepository(),
    projectRepository: ProjectRepository = new ProjectRepository(),
    imageRepository: ImageRepository = new ImageRepository(),
    videoRepository: VideoRepository = new VideoRepository(),
    portfolioRepository: PortfolioRepository = new PortfolioRepository(),
    creatorRepository: CreatorRepository = new CreatorRepository()
  ) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    this.genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Assign injected repositories
    this.analysisJobRepository = analysisJobRepository;
    this.projectRepository = projectRepository;
    this.imageRepository = imageRepository;
    this.videoRepository = videoRepository;
    this.portfolioRepository = portfolioRepository;
    this.creatorRepository = creatorRepository;

    // Create rate limiters for different request types
    this.imageRateLimiter = new RateLimiter(
      ANALYSIS_CONFIG.RATE_LIMITS.IMAGE_REQUESTS_PER_MINUTE,
      60000 // 1 minute in ms
    );

    this.textRateLimiter = new RateLimiter(
      ANALYSIS_CONFIG.RATE_LIMITS.TEXT_REQUESTS_PER_MINUTE,
      60000 // 1 minute in ms
    );
  }

  /**
   * Start portfolio analysis
   */
  async startPortfolioAnalysis(
    portfolioId: string,
    creatorId: string,
    jobId: string
  ): Promise<void> {
    try {
      // Update job status to "processing" using repository
      await this.analysisJobRepository.updateStatus(jobId, "processing");

      // 1. Get all projects for this portfolio using repository
      const projects =
        await this.projectRepository.getProjectsForPortfolio(portfolioId);

      if (!projects || projects.length === 0) {
        await this.analysisJobRepository.updateStatus(
          jobId,
          "completed",
          "No projects found to analyze"
        );
        return;
      }

      // Track overall progress
      let progress = 0;
      const totalSteps = projects.length * 2 + 1; // Images + Videos + Projects + Portfolio
      let currentStep = 0;

      // 2. STEP 1: Analyze images and videos for each project
      logger.info(
        `Starting media analysis for ${projects.length} projects in portfolio ${portfolioId}`
      );

      const mediaPromises = [];
      for (const project of projects) {
        mediaPromises.push(this.analyzeProjectMedia(project.id));
      }

      // Wait for all media analyses to complete
      await Promise.all(mediaPromises);

      // Update progress after all media analyses complete
      currentStep += projects.length;
      progress = (currentStep / totalSteps) * 100;
      await this.analysisJobRepository.updateProgress(jobId, progress);

      // 3. STEP 2: Analyze each project
      logger.info(
        `Starting project analysis for ${projects.length} projects in portfolio ${portfolioId}`
      );

      const projectPromises = [];
      for (const project of projects) {
        // Only analyze if not already done (check ai_analysis from initial fetch)
        if (!project.ai_analysis) {
          projectPromises.push(this.analyzeProject(project.id));
        } else {
          logger.info(
            `Skipping project analysis for ${project.id} as it's already analyzed.`
          );
        }
      }

      // Wait for all project analyses to complete
      await Promise.all(projectPromises);

      // Update progress after all project analyses complete
      currentStep += projects.length;
      progress = (currentStep / totalSteps) * 100;
      await this.analysisJobRepository.updateProgress(jobId, progress);

      // 4. STEP 3: Wait an additional 5 seconds to ensure database updates are complete
      logger.info(
        `Waiting for any final database updates before portfolio analysis for ${portfolioId}`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Re-fetch all analyzed projects to ensure we have the latest data
      const analyzedProjects =
        await this.projectRepository.getAnalyzedProjectsForPortfolio(
          portfolioId
        );
      logger.info(
        `Re-fetched ${analyzedProjects.length} analyzed projects for portfolio ${portfolioId}`
      );

      // 5. STEP 4: Analyze portfolio
      logger.info(`Starting analysis for portfolio ${portfolioId}`);
      const portfolioAnalysis = await this.analyzePortfolio(portfolioId);
      if (!portfolioAnalysis) {
        // Log specific error within analyzePortfolio
        await this.analysisJobRepository.updateStatus(
          jobId,
          "failed",
          "Failed to generate portfolio analysis" // Keep generic msg or fetch specific?
        );
        return;
      }

      currentStep++;
      progress = 100;
      await this.analysisJobRepository.updateProgress(jobId, progress);

      // Mark job as completed using repository
      await this.analysisJobRepository.updateStatus(jobId, "completed");
      logger.info(`Portfolio analysis job ${jobId} completed successfully.`);
    } catch (error: any) {
      logger.error(
        `Error in portfolio analysis job ${jobId}: ${error.message}`
      );
      await this.analysisJobRepository.updateStatus(
        jobId,
        "failed",
        error.message
      );
    }
  }

  /**
   * Analyze all media for a project
   */
  private async analyzeProjectMedia(projectId: string): Promise<void> {
    try {
      // Get all images using repository
      const images = await this.imageRepository.getImagesForProject(projectId);

      // Get all videos using repository
      const videos = await this.videoRepository.getVideosForProject(projectId);

      // Process each image
      if (images && images.length > 0) {
        logger.info(
          `Analyzing ${images.length} images for project ${projectId}`
        );
        for (const image of images) {
          // Check if analysis or embedding is missing
          if (!image.ai_analysis || !image.embedding) {
            await this.analyzeImage(image); // Pass the full image object
          } else {
            logger.info(
              `Skipping image analysis for ${image.id} as it's already analyzed.`
            );
          }
        }
      }

      // Process each video
      if (videos && videos.length > 0) {
        logger.info(
          `Analyzing ${videos.length} videos for project ${projectId}`
        );
        for (const video of videos) {
          // Check if analysis or embedding is missing
          if (!video.ai_analysis || !video.embedding) {
            await this.analyzeVideo(video); // Pass the full video object
          } else {
            logger.info(
              `Skipping video analysis for ${video.id} as it's already analyzed.`
            );
          }
        }
      }
    } catch (error) {
      logger.error(`Error analyzing project media for ${projectId}: ${error}`);
      // Continue with other projects rather than failing the whole process
    }
  }

  /**
   * Analyze a single image
   */
  private async analyzeImage(image: ImageMedia): Promise<void> {
    try {
      logger.info(`Starting analysis for image ${image.id}`);
      // Skip if already analyzed (redundant check, but safe)
      if (image.ai_analysis && image.embedding) {
        logger.warn(
          `analyzeImage called for already analyzed image ${image.id}`
        );
        return;
      }

      // Get the image URL
      const imageUrl = await this.getHighestResUrl(image);
      if (!imageUrl) {
        logger.warn(`No valid URL found for image ${image.id}`);
        return;
      }

      // Rate limit API calls
      await this.imageRateLimiter.acquire();

      // Set status to processing
      await this.imageRepository.updateImageAnalysisStatus(
        image.id,
        "processing"
      );

      // Generate image analysis using @google/genai SDK
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg", // Consider making mimeType dynamic if needed
          data: await this.urlToBase64(imageUrl),
        },
      };
      const prompt = ANALYSIS_CONFIG.PROMPTS.IMAGE_ANALYSIS;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash", // Ensure model exists
        contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
      });

      const analysis = result.text ?? ""; // Handle potentially undefined text
      if (!analysis) {
        logger.warn(
          `Image analysis generated empty response for image ${image.id}.`
        );
        // Decide how to handle - fail, or proceed with empty analysis?
        // For now, treat as failure.
        throw new Error("Image analysis returned empty/undefined text.");
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(analysis);

      if (!embedding) {
        logger.error(`Failed to generate embedding for image ${image.id}`);
        await this.imageRepository.updateImageAnalysisStatus(
          image.id,
          "failed",
          "Embedding generation failed"
        );
        return; // Don't update DB if embedding failed
      }

      // Update the database using repository
      await this.imageRepository.updateImageAnalysis(
        image.id,
        analysis,
        embedding
      );

      logger.info(`Successfully analyzed image ${image.id}`);
    } catch (error) {
      logger.error(`Error analyzing image ${image.id}: ${error}`);
      // Update status to failed on error
      await this.imageRepository.updateImageAnalysisStatus(
        image.id,
        "failed",
        error instanceof Error ? error.message : String(error)
      );
      // Continue with other images rather than failing the whole process
    }
  }

  /**
   * Analyze a single video
   */
  private async analyzeVideo(video: VideoMedia): Promise<void> {
    // Use VideoMedia type
    let videoPath: string | null = null; // Define here for cleanup scope
    try {
      logger.info(`Starting analysis for video ${video.id}`);
      // Skip if already analyzed (redundant check, but safe)
      if (video.ai_analysis && video.embedding) {
        logger.warn(
          `analyzeVideo called for already analyzed video ${video.id}`
        );
        return;
      }

      // Determine video source for processing
      let videoUrl: string | null = null;
      let isExternalVideo = false;

      if (video.vimeo_id) {
        videoUrl = `https://vimeo.com/${video.vimeo_id}`;
        isExternalVideo = true;
      } else if (video.youtube_id) {
        videoUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
        isExternalVideo = true;
      } else if (
        video.url &&
        (video.url.startsWith("http://") || video.url.startsWith("https://"))
      ) {
        videoUrl = video.url;
        // Check if this is a Supabase storage URL (adjust if needed)
        isExternalVideo = !(
          video.url.includes(".supabase.co/") ||
          video.url.includes(".supabase.in/")
        ); // More robust check
      }

      if (!videoUrl) {
        logger.error(`No valid URL found for video ${video.id}`);
        return; // Cannot proceed without a URL
      }

      logger.info(`Processing video ${video.id} from URL: ${videoUrl}`);

      // Set status to processing before download
      await this.videoRepository.updateVideoAnalysisStatus(
        video.id,
        "processing"
      );

      // Create temporary directory for downloads if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create a timestamp-based filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const outputPath = path.join(
        tempDir,
        `video_${video.id}_${timestamp}.mp4`
      );
      videoPath = outputPath; // Assign path for cleanup

      if (isExternalVideo) {
        // For external videos (Vimeo, YouTube), we need to download them
        logger.info(`Downloading external video ${video.id} from ${videoUrl}`);
        const downloadResult = await this.downloadVideo(videoUrl, outputPath);

        if (!downloadResult.success) {
          logger.error(
            `Failed to download video ${video.id}: ${downloadResult.error}`
          );
          // Don't fall back to metadata - just return as failed
          // Cleanup potentially partially created file
          await this.videoRepository.updateVideoAnalysisStatus(
            video.id,
            "failed",
            `Download failed: ${downloadResult.error}`
          );
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return;
        }
        logger.info(`External video ${video.id} downloaded to ${outputPath}`);
      } else {
        // For Supabase storage videos, we can download directly
        try {
          logger.info(
            `Downloading video ${video.id} from Supabase storage: ${videoUrl}`
          );
          const response = await fetch(videoUrl);

          if (!response.ok || !response.body) {
            // Check response.body
            throw new Error(
              `Failed to fetch video: ${response.status} ${response.statusText}`
            );
          }

          // Revert to arrayBuffer for simpler handling
          const arrayBuffer = await response.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
          logger.info(`Storage video ${video.id} downloaded to ${outputPath}`);
        } catch (error) {
          logger.error(
            `Failed to download video ${video.id} from storage: ${error}`
          );
          // Cleanup potentially partially created file
          await this.videoRepository.updateVideoAnalysisStatus(
            video.id,
            "failed",
            `Storage download failed: ${error instanceof Error ? error.message : String(error)}`
          );
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return; // Don't fall back to metadata - just return as failed
        }
      }

      // Verify the downloaded video
      if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
        logger.error(
          `Failed to download valid video file ${video.id} to ${videoPath}`
        );
        // Cleanup is handled in finally block now
        return; // Don't fall back to metadata - just return as failed
      }

      logger.info(
        `Video ${video.id} downloaded to: ${videoPath}, size: ${fs.statSync(videoPath).size}, proceeding with analysis`
      );

      // Analyze the downloaded video
      const analysis = await this.analyzeVideoContent(videoPath);

      if (!analysis) {
        logger.error(`Failed to analyze video content for ${video.id}`);
        // Cleanup is handled in finally block
        return;
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(analysis);
      if (!embedding) {
        logger.error(`Failed to generate embedding for video ${video.id}`);
        // Cleanup is handled in finally block
        await this.videoRepository.updateVideoAnalysisStatus(
          video.id,
          "failed",
          "Embedding generation failed"
        );
        return; // Don't update DB if embedding failed
      }

      // Update the database using repository
      await this.videoRepository.updateVideoAnalysis(
        video.id,
        analysis,
        embedding
      );

      logger.info(`Successfully analyzed video ${video.id}`);
    } catch (error) {
      logger.error(`Error analyzing video ${video.id}: ${error}`);
      // Continue with other videos rather than failing the whole process
      await this.videoRepository.updateVideoAnalysisStatus(
        video.id,
        "failed",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      // Ensure temporary file cleanup happens even if errors occur mid-process
      if (videoPath && fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
          logger.info(`Temporary video file cleaned up: ${videoPath}`);
        } catch (cleanupError) {
          logger.warn(
            `Failed to clean up temporary file ${videoPath}: ${cleanupError}`
          );
        }
      }
    }
  }

  /**
   * Download a video from a URL using yt-dlp
   */
  private async downloadVideo(
    url: string,
    outputPath: string
  ): Promise<{ success: boolean; error?: string }> {
    // (Keep existing implementation - no direct DB calls)
    return new Promise((resolve) => {
      try {
        logger.info(`Starting download from URL: ${url}`);
        logger.info(`Output path: ${outputPath}`);

        // Create temp directory if it doesn't exist
        const tempDir = path.dirname(outputPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Prepare yt-dlp command
        const ytdlpOptions = [
          "--format",
          "bestvideo[height<=480]+bestaudio/best[height<=480]", // Limit resolution slightly
          "--merge-output-format",
          "mp4",
          "--quiet",
          "--no-playlist",
          "--ignore-errors",
          "-o",
          outputPath,
          "--socket-timeout",
          "30", // Add timeout
          url,
        ];

        // Execute yt-dlp command
        const downloadProcess = spawn("yt-dlp", ytdlpOptions);

        let stderr = "";
        downloadProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        // Add stdout logging for debugging if needed
        // downloadProcess.stdout.on('data', (data) => {
        //   logger.debug(`yt-dlp stdout: ${data}`);
        // });

        downloadProcess.on("error", (spawnError) => {
          logger.error(`Failed to start yt-dlp process: ${spawnError}`);
          resolve({
            success: false,
            error: `Failed to spawn yt-dlp: ${spawnError.message}`,
          });
        });

        downloadProcess.on("close", (code) => {
          if (code !== 0) {
            logger.error(`yt-dlp process exited with code ${code}: ${stderr}`);
            resolve({
              success: false,
              error: `Exit code ${code}: ${stderr || "Unknown error"}`,
            });
            return;
          }

          // Verify file exists and has content
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            logger.info(`Video downloaded successfully to ${outputPath}`);
            resolve({ success: true });
          } else {
            logger.error(
              `yt-dlp exited successfully but output file is missing or empty: ${outputPath}`
            );
            // Check if stderr has clues
            if (stderr.includes("requested format not available")) {
              resolve({
                success: false,
                error: `Requested format not available.`,
              });
            } else {
              resolve({
                success: false,
                error:
                  "Downloaded file is empty or doesn't exist. Stderr: " +
                  stderr,
              });
            }
          }
        });
      } catch (error) {
        logger.error(`Error in downloadVideo setup: ${error}`);
        resolve({ success: false, error: String(error) });
      }
    });
  }

  /**
   * Analyze video content using Gemini Vision
   */
  private async analyzeVideoContent(videoPath: string): Promise<string | null> {
    try {
      const videoSizeBytes = fs.statSync(videoPath).size;
      const maxSizeMBInline = 18;
      const maxSizeBytesInline = maxSizeMBInline * 1024 * 1024;
      const maxSizeGBFileAPI = 2;
      const maxSizeBytesFileAPI = maxSizeGBFileAPI * 1024 * 1024 * 1024;

      const prompt = ANALYSIS_CONFIG.PROMPTS.VIDEO_CONTENT_ANALYSIS;

      let result: any; // Define result variable here

      // Rate limit API calls (use image limiter as it processes frames)
      await this.imageRateLimiter.acquire();

      if (videoSizeBytes < maxSizeBytesInline) {
        // --- Inline Data Method (< 18MB) ---
        logger.info(
          `Analyzing video content for ${videoPath} using inline data (size: ${(videoSizeBytes / (1024 * 1024)).toFixed(2)} MB).`
        );

        const videoBytes = fs.readFileSync(videoPath);
        const base64Video = videoBytes.toString("base64");

        const contentParts = [
          {
            inlineData: {
              mimeType: "video/mp4",
              data: base64Video,
            },
          },
          { text: prompt },
        ];

        result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: contentParts }],
        });
      } else if (videoSizeBytes < maxSizeBytesFileAPI) {
        // --- File API Method (18MB to 2GB) ---
        logger.info(
          `Analyzing video content for ${videoPath} using File API (size: ${(videoSizeBytes / (1024 * 1024)).toFixed(2)} MB).`
        );

        // 1. Upload the file using @google/genai files api
        logger.info(`Uploading video file via File API: ${videoPath}`);
        const uploadedFile = await this.genAI.files.upload({
          file: videoPath,
          config: {
            mimeType: "video/mp4",
            displayName: path.basename(videoPath),
          },
        });
        logger.info(
          `File uploaded successfully, URI: ${uploadedFile.uri}, Name: ${uploadedFile.name}`
        );

        // 2. Wait for processing
        logger.info("Waiting for video processing via File API...");
        let fetchedFile = await this.genAI.files.get({
          name: uploadedFile.name ?? "",
        });
        let attempts = 0;
        const maxAttempts = 60; // Increase timeout (e.g., 10 minutes: 60 * 10 seconds)
        const pollIntervalMs = 10000; // 10 seconds

        while (
          fetchedFile.state === FileState.PROCESSING &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          fetchedFile = await this.genAI.files.get({
            name: uploadedFile.name ?? "",
          });
          attempts++;
          logger.debug(
            `Still processing video (File API), state: ${fetchedFile.state}, attempt ${attempts}/${maxAttempts}`
          );
        }

        if (fetchedFile.state === FileState.FAILED) {
          throw new Error(
            `File API video processing failed. Final state: ${fetchedFile.state}`
          );
        }
        if (fetchedFile.state !== FileState.ACTIVE) {
          throw new Error(
            `File API video processing timed out or ended in unexpected state: ${fetchedFile.state || "Unknown"}`
          );
        }

        logger.info("File API video processing complete and file is active!");

        // 3. Generate content using the file reference
        const fileDataPart = {
          fileData: {
            mimeType: uploadedFile.mimeType!, // Assert non-null as we set it on upload
            fileUri: uploadedFile.uri ?? "", // Add null coalescing operator to handle potential undefined
          },
        };

        result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [fileDataPart, { text: prompt }] }],
        });
      } else {
        // --- File Too Large (> 2GB) ---
        throw new Error(
          `Video file ${videoPath} (${(videoSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB) exceeds the File API limit of ${maxSizeGBFileAPI}GB.`
        );
      }

      // --- Process result (common for both methods) ---
      const analysis = result.text ?? ""; // Handle potentially undefined text
      if (!analysis) {
        logger.warn(
          `Video analysis generated empty response for video ${videoPath}.`
        );
        throw new Error("Video analysis returned empty/undefined text.");
      }
      logger.info(
        `Successfully generated video content analysis for ${videoPath}`
      );
      return analysis;
    } catch (error) {
      logger.error(`Error in analyzeVideoContent for ${videoPath}: ${error}`);
      // Rethrow the error so the caller (analyzeVideo) can update the status
      throw error;
    }
  }

  /**
   * Analyze a complete project
   */
  private async analyzeProject(projectId: string): Promise<void> {
    try {
      // Get project details using repository
      const project = await this.projectRepository.getProjectDetails(projectId);

      if (!project) {
        logger.error(
          `Project details not found for ID: ${projectId} during analysis.`
        );
        return; // Cannot proceed without project details
      }

      // Get all analyzed images using repository
      const images =
        await this.imageRepository.getAnalyzedImagesForProject(projectId);

      // Get all analyzed videos using repository
      const videos =
        await this.videoRepository.getAnalyzedVideosForProject(projectId);

      // Combine all analyses as context
      const mediaAnalyses = [
        ...(images || []).map((img) => img.ai_analysis),
        ...(videos || []).map((vid) => vid.ai_analysis),
      ].filter(Boolean); // Ensure only non-null/empty analyses are included

      if (mediaAnalyses.length === 0) {
        logger.warn(
          `No analyzed media found for project ${projectId}, skipping project analysis.`
        );
        // Optionally, update project status or log differently?
        return;
      }

      logger.info(
        `Generating analysis for project ${projectId} using ${mediaAnalyses.length} media items.`
      );

      // Set status to processing
      await this.projectRepository.updateProjectAnalysisStatus(
        projectId,
        "processing"
      );

      // Rate limit API calls
      await this.textRateLimiter.acquire();

      // Generate project analysis
      const mediaContext = mediaAnalyses.join("\n\n---\n\n"); // Add separator
      const projectContext = `
Project Title: ${project.title}
Project Description: ${project.description || "No description provided"}

Number of analyzed media items: ${mediaAnalyses.length}

Media analysis summaries:
${mediaContext}
    `;

      const prompt = ANALYSIS_CONFIG.PROMPTS.PROJECT_ANALYSIS;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { role: "user", parts: [{ text: prompt + "\n\n" + projectContext }] },
        ],
      });

      const analysis = result.text ?? ""; // Handle potentially undefined text
      if (!analysis) {
        logger.warn(
          `Project analysis generated empty response for project ${projectId}.`
        );
        throw new Error("Project analysis returned empty/undefined text.");
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(analysis);

      if (!embedding) {
        logger.error(`Failed to generate embedding for project ${projectId}`);
        await this.projectRepository.updateProjectAnalysisStatus(
          projectId,
          "failed",
          "Embedding generation failed"
        );
        return; // Don't update DB if embedding fails
      }

      // Update the project using repository
      await this.projectRepository.updateProjectAnalysis(
        projectId,
        analysis,
        embedding
      );

      logger.info(`Successfully analyzed project ${projectId}`);
    } catch (error) {
      logger.error(`Error analyzing project ${projectId}: ${error}`);
      await this.projectRepository.updateProjectAnalysisStatus(
        projectId,
        "failed",
        error instanceof Error ? error.message : String(error)
      );
      // Continue with other aspects rather than failing the whole process
    }
  }

  /**
   * Analyze the entire portfolio
   */
  private async analyzePortfolio(portfolioId: string): Promise<string | null> {
    try {
      // Explicitly re-fetch all analyzed projects for this portfolio
      // This ensures we capture any projects that were analyzed during the current job
      const projects =
        await this.projectRepository.getAnalyzedProjectsForPortfolio(
          portfolioId
        );

      logger.info(
        `Re-fetched ${projects.length} analyzed projects for portfolio ${portfolioId}`
      );

      if (!projects || projects.length === 0) {
        logger.warn(
          `No analyzed projects found for portfolio ${portfolioId}, cannot analyze portfolio.`
        );
        return null;
      }
      // Get creator ID using repository
      const creatorId =
        await this.portfolioRepository.getPortfolioCreatorId(portfolioId);

      if (!creatorId) {
        logger.error(`Could not find creator ID for portfolio ${portfolioId}`);
        return null;
      }

      // Get creator details using repository
      const creator = await this.creatorRepository.getCreatorDetails(creatorId);

      if (!creator) {
        logger.warn(
          `Creator details not found for ID: ${creatorId} (portfolio ${portfolioId})`
        );
        // Proceed without creator context? Or return null? Decide based on requirements.
        // For now, proceed without it, context builder handles null creator.
      }

      logger.info(
        `Generating analysis for portfolio ${portfolioId} using ${projects.length} analyzed projects.`
      );

      // Create context for portfolio analysis
      // Pass AnalyzedProjectForPortfolio[] and the fetched creator object
      const context = this.preparePortfolioContext(projects, creator);

      // Generate portfolio analysis (uses GenAI directly, no change needed here)
      const portfolioAnalysis = await this.generatePortfolioAnalysis(context);
      if (!portfolioAnalysis) {
        // Error logged within generatePortfolioAnalysis
        return null;
      }

      // Generate embedding (uses GenAI directly, no change needed here)
      const embedding = await this.generateEmbedding(portfolioAnalysis);
      if (!embedding) {
        logger.error(
          `Failed to generate embedding for portfolio ${portfolioId}`
        );
        await this.portfolioRepository.updatePortfolioAnalysisStatus(
          portfolioId,
          "failed",
          "Embedding generation failed"
        );
        return null; // Don't update DB if embedding fails
      }

      // Update portfolio with analysis using repository
      await this.portfolioRepository.updatePortfolioAnalysis(
        portfolioId,
        portfolioAnalysis,
        embedding
      );

      logger.info(`Successfully analyzed portfolio ${portfolioId}`);
      return portfolioAnalysis;
    } catch (error) {
      logger.error(`Error analyzing portfolio ${portfolioId}: ${error}`);
      await this.portfolioRepository.updatePortfolioAnalysisStatus(
        portfolioId,
        "failed",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Helper function to get highest resolution URL from image
   */
  public async getHighestResUrl(image: ImageMedia): Promise<string | null> {
    // (Keep existing implementation - no direct DB calls)
    try {
      // Prioritize higher resolutions if available
      if (
        image.resolutions &&
        typeof image.resolutions === "object" &&
        Object.keys(image.resolutions).length > 0
      ) {
        const sizes = Object.keys(image.resolutions)
          .map((key) => parseInt(key))
          .filter((key) => !isNaN(key)); // Ensure keys are numbers

        if (sizes.length > 0) {
          const maxSize = Math.max(...sizes).toString();
          const url = image.resolutions[maxSize];

          if (
            url &&
            typeof url === "string" &&
            (url.startsWith("http://") || url.startsWith("https://"))
          ) {
            logger.debug(
              `Using resolution ${maxSize} URL for image ${image.id}`
            );
            return url;
          } else {
            logger.warn(
              `Resolution URL for size ${maxSize} is invalid for image ${image.id}: ${url}`
            );
          }
        }
      }

      // Fall back to the original URL
      if (
        image.url &&
        typeof image.url === "string" &&
        (image.url.startsWith("http://") || image.url.startsWith("https://"))
      ) {
        logger.debug(`Falling back to base URL for image ${image.id}`);
        return image.url;
      }

      logger.warn(`No valid URL could be determined for image ${image.id}`);
      return null;
    } catch (error) {
      logger.error(
        `Error getting highest resolution URL for image ${image.id}: ${error}`
      );
      return null;
    }
  }

  /**
   * Helper function to convert URL to base64 for Gemini Vision API
   */
  private async urlToBase64(url: string): Promise<string> {
    // (Keep existing implementation - no direct DB calls)
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString("base64");
    } catch (error) {
      logger.error(`Error converting image URL to base64 (${url}): ${error}`);
      throw error; // Re-throw to be caught by caller
    }
  }

  /**
   * Prepare portfolio context from projects with creator info
   */
  // Update type hints for clarity
  private preparePortfolioContext(
    projects: AnalyzedProjectForPortfolio[],
    creator: { username: string; primary_role: any; bio: string | null } | null
  ): string {
    // (Keep existing implementation - pure function)
    let context = `Analyzing a professional portfolio of ${projects.length} projects:\n\n`;

    // Add creator info if available
    if (creator) {
      context += `Creator: ${creator.username}\n`;
      if (creator.primary_role)
        // Ensure primary_role is stringified safely, handling potential undefined from stringify
        context += `Primary Role: ${JSON.stringify(creator.primary_role) ?? "Not specified"}\n`;
      if (creator.bio) context += `Bio: ${creator.bio}\n\n`;
    } else {
      context += `Creator information not available.\n\n`;
    }

    // Add project info
    context += "Analyzed Projects:\n";
    for (const project of projects) {
      // ai_analysis should always be present based on getAnalyzedProjectsForPortfolio logic
      context += `\n---\n`;
      context += `Project: ${project.title}\n`;
      context += `Description: ${project.description || "No description provided"}\n`;
      context += `AI Analysis Summary: ${project.ai_analysis || "No AI analysis available"}\n`; // Add fallback value
    }
    context += `\n---\n`;

    return context;
  }

  /**
   * Generate portfolio analysis using Gemini
   */
  private async generatePortfolioAnalysis(
    context: string
  ): Promise<string | null> {
    try {
      // Rate limit API calls
      await this.textRateLimiter.acquire();

      const prompt = ANALYSIS_CONFIG.PROMPTS.PORTFOLIO_ANALYSIS;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { role: "user", parts: [{ text: prompt + "\n\n" + context }] },
        ],
      });

      const analysis = result.text ?? ""; // Handle potentially undefined text
      if (!analysis) {
        logger.warn(`Portfolio analysis generated empty response.`);
        // Returning null as per original logic on failure
        return null;
      }
      logger.info("Successfully generated portfolio analysis.");
      return analysis;
    } catch (error) {
      logger.error(`Error generating portfolio analysis: ${error}`);
      return null;
    }
  }

  /**
   * Generate embedding for search
   */
  private async generateEmbedding(content: string): Promise<number[] | null> {
    try {
      // Rate limit API calls
      await this.textRateLimiter.acquire();

      const result = await this.genAI.models.embedContent({
        model: "text-embedding-004", // Use appropriate embedding model
        contents: [content], // Pass content within a contents array
      });

      // Safely access embeddings
      if (
        result.embeddings &&
        result.embeddings.length > 0 &&
        result.embeddings[0].values
      ) {
        return result.embeddings[0].values;
      } else {
        logger.warn(
          `Embedding generation did not return valid embeddings for content.`
        );
        return null;
      }
    } catch (error) {
      logger.error(`Error generating embedding: ${error}`);
      return null;
    }
  }

  /**
   * Check if reanalysis is allowed
   */
  async canReanalyze(portfolioId: string): Promise<{
    allowed: boolean;
    message: string;
    nextAvailableTime?: Date;
  }> {
    // Get the portfolio's last analysis job using repository
    const lastJob =
      await this.analysisJobRepository.getLastJobForPortfolio(portfolioId);

    if (!lastJob) {
      return { allowed: true, message: "First analysis" };
    }

    // Check time since last analysis
    const lastAnalysisTime = new Date(lastJob.created_at); // Assuming created_at is string | Date
    const now = new Date();
    const hoursSinceLastAnalysis =
      (now.getTime() - lastAnalysisTime.getTime()) / (1000 * 60 * 60);

    if (
      hoursSinceLastAnalysis <
      ANALYSIS_CONFIG.TIME_LIMITS.MIN_HOURS_BETWEEN_ANALYSES
    ) {
      const nextAvailableTime = new Date(
        lastAnalysisTime.getTime() +
          ANALYSIS_CONFIG.TIME_LIMITS.MIN_HOURS_BETWEEN_ANALYSES *
            60 *
            60 *
            1000
      );

      return {
        allowed: false,
        message: `Too soon since last analysis. Please wait ${Math.ceil(
          ANALYSIS_CONFIG.TIME_LIMITS.MIN_HOURS_BETWEEN_ANALYSES -
            hoursSinceLastAnalysis
        )} more hours.`,
        nextAvailableTime,
      };
    }

    // Check for monthly limit using repository
    const monthlyJobCount =
      await this.analysisJobRepository.countJobsInLastMonth(portfolioId);

    if (monthlyJobCount >= ANALYSIS_CONFIG.TIME_LIMITS.MAX_ANALYSES_PER_MONTH) {
      return {
        allowed: false,
        message: `Monthly analysis limit reached (${ANALYSIS_CONFIG.TIME_LIMITS.MAX_ANALYSES_PER_MONTH} per month). Please try again later.`,
      };
    }

    return { allowed: true, message: "Analysis allowed" };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    // Consider defining a proper AnalysisJob type/interface
    // Get job details using repository
    const job = await this.analysisJobRepository.getJobById(jobId);
    if (!job) {
      // Throw specific error or return null based on expected behavior
      throw new Error(`Analysis job with ID ${jobId} not found.`);
    }
    return job;
  }
}
