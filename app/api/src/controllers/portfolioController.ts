// src/controllers/portfolioController.ts
import { Response } from "express";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { Portfolio, PortfolioWithProjects } from "../models/Portfolio";
import { EmbeddingService } from "../services/embeddingService";

export class PortfolioController {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Get portfolio details by ID
   * GET /api/portfolios/:id
   */
  async getPortfolioById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Retrieve portfolio
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .select(
          `
          id,
          creator_id,
          created_at,
          updated_at,
          creators:creator_id (
            id,
            username
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            success: false,
            error: "Portfolio not found",
          });
        }
        throw error;
      }

      // Fetch the portfolio's projects directly from the projects table
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(
          `
          id,
          title,
          description,
          featured,
          year,
          created_at
        `
        )
        .eq("portfolio_id", id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        throw projectsError;
      }

      // Get creator info from the joined data
      // Using any here to handle the dynamic response from Supabase
      const portfolioAny = portfolio as any;
      const creatorInfo = portfolioAny.creators
        ? {
            id: portfolioAny.creators.id,
            username: portfolioAny.creators.username,
          }
        : undefined;

      // Format the response with the portfolio + projects
      const response: PortfolioWithProjects = {
        ...portfolio,
        projects: projects || [],
        creator: creatorInfo,
      };

      // Remove the nested creators property from the response
      const responseAny = response as any;
      if (responseAny.creators) {
        delete responseAny.creators;
      }

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error(`Error in getPortfolioById: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve portfolio details",
      });
    }
  }

  /**
   * Update portfolio by ID - for general portfolio fields, not for projects
   * PUT /api/portfolios/:id
   * Protected: Only the creator of the portfolio or an admin can update it
   */
  async updatePortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // We don't update project_ids anymore, only other portfolio fields
      const updateData = {
        updated_at: new Date().toISOString(),
        // You can add other portfolio fields here as needed
      };

      // Update the portfolio
      const { data: updatedPortfolio, error } = await supabase
        .from("portfolios")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating portfolio: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: "Failed to update portfolio",
        });
      }

      // Update the portfolio embedding using projects in this portfolio
      try {
        // Fetch projects for embedding
        const { data: projects } = await supabase
          .from("projects")
          .select("title, description")
          .eq("portfolio_id", id);

        if (projects && projects.length > 0) {
          // Combine all project titles and descriptions for embedding
          const textForEmbedding = projects
            .map((project) => {
              return `${project.title || ""} ${project.description || ""}`;
            })
            .join(" ");

          // Generate embedding
          const embedding = await this.embeddingService.generateEmbedding(
            textForEmbedding,
            "creators"
          );

          if (embedding?.values) {
            // Update the portfolio embedding
            await supabase
              .from("portfolios")
              .update({
                embedding: embedding.values,
              })
              .eq("id", id);
          }
        }
      } catch (embeddingError) {
        // Log error but continue, as embedding is not critical for functionality
        logger.error(`Error updating portfolio embedding: ${embeddingError}`, {
          embeddingError,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Portfolio updated successfully",
        data: updatedPortfolio,
      });
    } catch (error: any) {
      logger.error(`Error in updatePortfolio: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Failed to update portfolio",
      });
    }
  }

  /**
   * Add a project to a portfolio
   * POST /api/portfolios/:id/projects/:projectId
   * Protected: Only the creator of the portfolio or an admin can add projects
   */
  async addProjectToPortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, projectId } = req.params;

      // First check if portfolio exists
      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id, creator_id")
        .eq("id", id)
        .single();

      if (portfolioError) {
        return res.status(404).json({
          success: false,
          error: "Portfolio not found",
        });
      }

      // Check if the project exists and belongs to the same creator
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id, portfolio_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      // Verify the project belongs to the same creator as the portfolio
      if (project.creator_id !== portfolio.creator_id) {
        return res.status(403).json({
          success: false,
          error: "Project does not belong to the same creator as the portfolio",
        });
      }

      // Check if the project is already in a portfolio
      if (project.portfolio_id) {
        if (project.portfolio_id === id) {
          return res.status(400).json({
            success: false,
            error: "Project is already in this portfolio",
          });
        } else {
          // Project is in a different portfolio, update it
          const { data: updatedProject, error: updateError } = await supabase
            .from("projects")
            .update({
              portfolio_id: id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          // Update the portfolio's updated_at timestamp
          await supabase
            .from("portfolios")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          return res.status(200).json({
            success: true,
            message: "Project moved to this portfolio successfully",
            data: updatedProject,
          });
        }
      }

      // Add the project to the portfolio by updating the project
      const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update({
          portfolio_id: id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the portfolio's updated_at timestamp
      await supabase
        .from("portfolios")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Update the portfolio embedding
      try {
        // Fetch projects for embedding
        const { data: projects } = await supabase
          .from("projects")
          .select("title, description")
          .eq("portfolio_id", id);

        if (projects && projects.length > 0) {
          // Combine all project titles and descriptions for embedding
          const textForEmbedding = projects
            .map((project) => {
              return `${project.title || ""} ${project.description || ""}`;
            })
            .join(" ");

          // Generate embedding
          const embedding = await this.embeddingService.generateEmbedding(
            textForEmbedding,
            "creators"
          );

          if (embedding?.values) {
            // Update the portfolio embedding
            await supabase
              .from("portfolios")
              .update({
                embedding: embedding.values,
              })
              .eq("id", id);
          }
        }
      } catch (embeddingError) {
        // Log error but continue, as embedding is not critical for functionality
        logger.error(`Error updating portfolio embedding: ${embeddingError}`, {
          embeddingError,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Project added to portfolio successfully",
        data: updatedProject,
      });
    } catch (error: any) {
      logger.error(`Error in addProjectToPortfolio: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to add project to portfolio",
      });
    }
  }

  /**
   * Remove a project from a portfolio
   * DELETE /api/portfolios/:id/projects/:projectId
   * Protected: Only the creator of the portfolio or an admin can remove projects
   */
  async removeProjectFromPortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, projectId } = req.params;

      // Check if the portfolio exists
      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id")
        .eq("id", id)
        .single();

      if (portfolioError) {
        return res.status(404).json({
          success: false,
          error: "Portfolio not found",
        });
      }

      // Check if the project exists and belongs to this portfolio
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, portfolio_id")
        .eq("id", projectId)
        .eq("portfolio_id", id)
        .single();

      if (projectError || !project) {
        return res.status(400).json({
          success: false,
          error: "Project is not in this portfolio",
        });
      }

      // Remove the project from the portfolio by setting portfolio_id to null
      const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update({
          portfolio_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the portfolio's updated_at timestamp
      await supabase
        .from("portfolios")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Update the portfolio embedding
      try {
        // Fetch remaining projects for embedding
        const { data: projects } = await supabase
          .from("projects")
          .select("title, description")
          .eq("portfolio_id", id);

        if (projects && projects.length > 0) {
          // Combine all project titles and descriptions for embedding
          const textForEmbedding = projects
            .map((project) => {
              return `${project.title || ""} ${project.description || ""}`;
            })
            .join(" ");

          // Generate embedding
          const embedding = await this.embeddingService.generateEmbedding(
            textForEmbedding,
            "creators"
          );

          if (embedding?.values) {
            // Update the portfolio embedding
            await supabase
              .from("portfolios")
              .update({
                embedding: embedding.values,
              })
              .eq("id", id);
          }
        } else {
          // If no projects left, clear the embedding
          await supabase
            .from("portfolios")
            .update({
              embedding: null,
            })
            .eq("id", id);
        }
      } catch (embeddingError) {
        // Log error but continue, as embedding is not critical for functionality
        logger.error(`Error updating portfolio embedding: ${embeddingError}`, {
          embeddingError,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Project removed from portfolio successfully",
        data: updatedProject,
      });
    } catch (error: any) {
      logger.error(`Error in removeProjectFromPortfolio: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to remove project from portfolio",
      });
    }
  }
}
