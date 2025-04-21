// src/controllers/analysisController.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { AnalysisService } from "../services/analysisService";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";
import { tasks } from "@trigger.dev/sdk/v3";
import type { portfolioAnalysisTask, projectAnalysisTask } from "../trigger";

const analysisService = new AnalysisService();

export class AnalysisController {
  /**
   * Check if portfolio can be analyzed
   * GET /api/analysis/portfolios/:portfolioId/can-analyze
   */
  async canAnalyzePortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      const { portfolioId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      // Verify portfolio ownership
      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolios")
        .select("creator_id")
        .eq("id", portfolioId)
        .single();

      if (portfolioError) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Portfolio not found",
          null,
          404
        );
      }

      // Verify ownership or admin
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("profile_id")
        .eq("id", portfolio.creator_id)
        .single();

      if (creatorError || creator.profile_id !== userId) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          "You don't have permission to analyze this portfolio",
          null,
          403
        );
      }

      // Check reanalysis limits
      const canReanalyze = await analysisService.canReanalyze(portfolioId);

      return sendSuccess(res, canReanalyze);
    } catch (error) {
      logger.error("Error checking if portfolio can be analyzed:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Error checking analysis eligibility",
        error,
        500
      );
    }
  }

  /**
   * Start analysis of a portfolio
   * POST /api/analysis/portfolios/:portfolioId
   */
  async startPortfolioAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const { portfolioId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      // Check if the portfolio exists
      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id, creator_id")
        .eq("id", portfolioId)
        .single();

      if (portfolioError) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Portfolio not found",
          null,
          404
        );
      }

      // Verify ownership or admin
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("profile_id")
        .eq("id", portfolio.creator_id)
        .single();

      if (creatorError || creator.profile_id !== userId) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          "You don't have permission to analyze this portfolio",
          null,
          403
        );
      }

      // Check if reanalysis is allowed
      const canReanalyze = await analysisService.canReanalyze(portfolioId);
      if (!canReanalyze.allowed) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          canReanalyze.message,
          null,
          403
        );
      }

      // Check if there's already an in-progress job
      const { data: existingJob } = await supabase
        .from("analysis_jobs")
        .select("id, status")
        .eq("portfolio_id", portfolioId)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingJob && existingJob.length > 0) {
        return sendSuccess(res, {
          message: "Analysis is already in progress",
          job_id: existingJob[0].id,
          status: existingJob[0].status,
        });
      }

      // Create a new analysis job
      const { data: job, error: jobError } = await supabase
        .from("analysis_jobs")
        .insert({
          portfolio_id: portfolioId,
          creator_id: portfolio.creator_id,
          status: "pending",
        })
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      // Trigger the portfolio analysis task using Trigger.dev
      try {
        const handle = await tasks.trigger<typeof portfolioAnalysisTask>(
          "portfolio-analysis",
          {
            portfolioId: portfolioId,
            userId: creator.profile_id,
            jobId: job.id,
          }
        );

        logger.info(
          `Portfolio analysis job ${job.id} triggered via Trigger.dev (handle: ${handle.id})`,
          {
            portfolioId,
            jobId: job.id,
            triggerHandleId: handle.id,
          }
        );
      } catch (triggerError) {
        logger.error("Error triggering portfolio analysis task:", triggerError);
        // Update job status to failed if trigger fails
        await supabase
          .from("analysis_jobs")
          .update({
            status: "failed",
            status_message: `Failed to start analysis: ${triggerError instanceof Error ? triggerError.message : String(triggerError)}`,
          })
          .eq("id", job.id);
      }

      return sendSuccess(res, {
        message: "Portfolio analysis started",
        job_id: job.id,
        status: "pending",
      });
    } catch (error) {
      logger.error("Error starting portfolio analysis:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Error starting portfolio analysis",
        error,
        500
      );
    }
  }

  /**
   * Start analysis of a single project
   * POST /api/analysis/projects/:projectId
   */
  async startProjectAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      // Check if the project exists and verify ownership
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Project not found",
          null,
          404
        );
      }

      // Verify creator ownership
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("profile_id")
        .eq("id", project.creator_id)
        .single();

      if (creatorError || creator.profile_id !== userId) {
        return sendError(
          res,
          ErrorCode.FORBIDDEN,
          "You don't have permission to analyze this project",
          null,
          403
        );
      }

      // Create a new analysis job
      const { data: job, error: jobError } = await supabase
        .from("analysis_jobs")
        .insert({
          project_id: projectId,
          creator_id: project.creator_id,
          status: "pending",
        })
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      // Trigger the project analysis task using Trigger.dev
      try {
        const handle = await tasks.trigger<typeof projectAnalysisTask>(
          "project-analysis",
          {
            projectId: projectId,
            userId: creator.profile_id,
          }
        );

        logger.info(
          `Project analysis job ${job.id} triggered via Trigger.dev (handle: ${handle.id})`,
          {
            projectId,
            jobId: job.id,
            triggerHandleId: handle.id,
          }
        );
      } catch (triggerError) {
        logger.error("Error triggering project analysis task:", triggerError);
        // Update job status to failed if trigger fails
        await supabase
          .from("analysis_jobs")
          .update({
            status: "failed",
            status_message: `Failed to start analysis: ${triggerError instanceof Error ? triggerError.message : String(triggerError)}`,
          })
          .eq("id", job.id);
      }

      return sendSuccess(res, {
        message: "Project analysis started",
        job_id: job.id,
        status: "pending",
      });
    } catch (error) {
      logger.error("Error starting project analysis:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Error starting project analysis",
        error,
        500
      );
    }
  }

  /**
   * Get status of an analysis job
   * GET /api/analysis/jobs/:jobId
   */
  async getJobStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;

      const jobStatus = await analysisService.getJobStatus(jobId);

      if (!jobStatus) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Analysis job not found",
          null,
          404
        );
      }

      return sendSuccess(res, jobStatus);
    } catch (error) {
      logger.error("Error getting job status:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Error retrieving job status",
        error,
        500
      );
    }
  }

  /**
   * Get portfolio analysis results
   * GET /api/analysis/portfolios/:portfolioId
   */
  async getPortfolioAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const { portfolioId } = req.params;

      // Check if the portfolio exists
      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id, creator_id, ai_analysis")
        .eq("id", portfolioId)
        .single();

      if (portfolioError) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Portfolio not found",
          null,
          404
        );
      }

      // Check for ongoing analysis
      const { data: activeJob } = await supabase
        .from("analysis_jobs")
        .select("id, status, progress")
        .eq("portfolio_id", portfolioId)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (activeJob && activeJob.length > 0) {
        return sendSuccess(res, {
          message: "Analysis in progress",
          has_analysis: portfolio.ai_analysis !== null,
          analysis: portfolio.ai_analysis || null,
          job: activeJob[0],
        });
      }

      // Return analysis results
      return sendSuccess(res, {
        has_analysis: portfolio.ai_analysis !== null,
        analysis: portfolio.ai_analysis || null,
      });
    } catch (error) {
      logger.error("Error getting portfolio analysis:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Error retrieving portfolio analysis",
        error,
        500
      );
    }
  }
}

export const analysisController = new AnalysisController();
