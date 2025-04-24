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
      const projectIds = []; // Keep track of project IDs for later checking

      for (const project of projects) {
        logger.info(`Triggering analysis for project ${project.id}`);
        projectIds.push(project.id);

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

      // Wait for all project analysis triggers to complete (not the actual analyses)
      await Promise.all(projectPromises);
      logger.info(
        `All project analysis triggers completed for portfolio ${payload.portfolioId}`
      );

      // Now we need to repeatedly check the status of all projects in the portfolio
      // until they're all analyzed or until we reach a timeout

      // Wait for projects to be fully analyzed - with a timeout
      let projectsComplete = false;
      let attemptsRemaining = 10; // 10 attempts with 10-second intervals

      while (!projectsComplete && attemptsRemaining > 0) {
        // Wait 10 seconds between checks
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Get the current analyzed project count
        const analyzedProjects =
          await projectRepository.getAnalyzedProjectsForPortfolio(
            payload.portfolioId
          );

        // Check if we have the same number of analyzed projects as total projects
        // AND that all projects we triggered are in the analyzed list
        const allProjectsAnalyzed = analyzedProjects.length >= projects.length;

        // Check if all our triggered projects are in the analyzed list
        let allTriggeredProjectsFound = true;
        if (allProjectsAnalyzed) {
          // Create a set of analyzed project IDs for efficient checking
          const analyzedProjectIds = new Set(analyzedProjects.map((p) => p.id));

          // Check if each of our triggered projects is in the analyzed list
          for (const projectId of projectIds) {
            if (!analyzedProjectIds.has(projectId)) {
              allTriggeredProjectsFound = false;
              break;
            }
          }
        }

        // If all conditions are met, we're done!
        if (allProjectsAnalyzed && allTriggeredProjectsFound) {
          projectsComplete = true;
          logger.info(
            `All ${analyzedProjects.length} projects for portfolio ${payload.portfolioId} are now analyzed.`
          );
        } else {
          // Log progress
          logger.info(
            `Waiting for project analyses to complete: ${analyzedProjects.length}/${projects.length} projects analyzed. Attempts remaining: ${attemptsRemaining}`
          );
          attemptsRemaining--;
        }
      }

      if (!projectsComplete) {
        logger.warn(
          `Timeout reached waiting for all projects to be analyzed in portfolio ${payload.portfolioId}. Proceeding with available projects.`
        );
      }

      // Wait an additional 5 seconds to ensure all database updates are complete
      logger.info(
        `Waiting for final database updates to complete for portfolio ${payload.portfolioId}`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Revalidate by explicitly re-fetching analyzed projects one final time
      const finalAnalyzedProjects =
        await projectRepository.getAnalyzedProjectsForPortfolio(
          payload.portfolioId
        );
      logger.info(
        `Final check: ${finalAnalyzedProjects.length}/${projects.length} analyzed projects for portfolio ${payload.portfolioId}`
      );

      // Now analyze the portfolio using all available analyzed projects
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
