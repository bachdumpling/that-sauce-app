import { logger, task, tasks } from "@trigger.dev/sdk/v3";
import { AnalysisService } from "../services/analysisService";
import { AnalysisJobRepository, ProjectRepository } from "../repositories";
import { projectAnalysisTask } from "./projectAnalysisTask";

// Define the payload structure for portfolio analysis
interface PortfolioAnalysisPayload {
  portfolioId: string;
  userId: string;
  jobId: string;
}

export const portfolioAnalysisTask = task({
  id: "portfolio-analysis",
  maxDuration: 1200, // 20 minutes
  run: async (payload: PortfolioAnalysisPayload, { ctx }) => {
    logger.info("Starting portfolio analysis task", { payload, ctx });

    try {
      // Create repositories and services
      const analysisJobRepository = new AnalysisJobRepository();
      const projectRepository = new ProjectRepository();
      const analysisService = new AnalysisService();

      // Update job status to "processing"
      await analysisJobRepository.updateStatus(payload.jobId, "processing");

      // Get all projects for this portfolio
      const projects = await projectRepository.getProjectsForPortfolio(
        payload.portfolioId
      );

      if (!projects || projects.length === 0) {
        await analysisJobRepository.updateStatus(
          payload.jobId,
          "completed",
          "No projects found to analyze"
        );
        return {
          success: true,
          status: "completed",
          message: "No projects found to analyze",
          portfolioId: payload.portfolioId,
          jobId: payload.jobId,
        };
      }

      logger.info(
        `Found ${projects.length} projects to analyze for portfolio ${payload.portfolioId}`
      );

      // Track progress
      let progress = 0;
      const totalSteps = projects.length + 1; // Projects + Portfolio analysis
      let currentStep = 0;

      // Trigger project analysis tasks for each project
      const projectPromises = [];
      for (const project of projects) {
        logger.info(`Triggering analysis for project ${project.id}`);

        const projectPromise = tasks
          .trigger<typeof projectAnalysisTask>("project-analysis", {
            projectId: project.id,
            userId: payload.userId,
          })
          .then(async (result) => {
            // Update progress after each project completes
            currentStep++;
            progress = (currentStep / totalSteps) * 100;
            await analysisJobRepository.updateProgress(payload.jobId, progress);
            return result;
          });

        projectPromises.push(projectPromise);
      }

      // Wait for all project analyses to complete
      await Promise.all(projectPromises);

      // Now analyze the portfolio after all projects are analyzed
      logger.info(`Starting analysis for portfolio ${payload.portfolioId}`);
      const portfolioAnalysis = await analysisService.analyzePortfolio(
        payload.portfolioId
      );

      if (!portfolioAnalysis) {
        await analysisJobRepository.updateStatus(
          payload.jobId,
          "failed",
          "Failed to generate portfolio analysis"
        );
        return {
          success: false,
          status: "failed",
          message: "Failed to generate portfolio analysis",
          portfolioId: payload.portfolioId,
          jobId: payload.jobId,
        };
      }

      // Update final progress and status
      await analysisJobRepository.updateProgress(payload.jobId, 100);
      await analysisJobRepository.updateStatus(payload.jobId, "completed");

      logger.info("Portfolio analysis job completed", {
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
        status: "completed",
      });

      return {
        success: true,
        status: "completed",
        message: "Portfolio analysis completed successfully",
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
      };
    } catch (error) {
      logger.error("Error in portfolio analysis task", {
        error: error instanceof Error ? error.message : String(error),
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
      });

      // Try to update job status to failed if there was an error
      try {
        const analysisJobRepository = new AnalysisJobRepository();
        await analysisJobRepository.updateStatus(
          payload.jobId,
          "failed",
          error instanceof Error ? error.message : String(error)
        );
      } catch (statusError) {
        logger.error("Failed to update job status", { statusError });
      }

      return {
        success: false,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
      };
    }
  },
});
