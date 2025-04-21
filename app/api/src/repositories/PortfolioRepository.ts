import { supabase } from "../lib/supabase";
import { Portfolio } from "../models/Portfolio";
import logger from "../config/logger";
import { AnalysisStatus } from "../models/Media";

export class PortfolioRepository {
  private tableName = "portfolios";

  /**
   * Get portfolio by ID
   */
  async getById(id: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get portfolio by creator ID
   */
  async getByCreatorId(creatorId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Add project to portfolio
   */
  async addProject(portfolioId: string, projectId: string): Promise<boolean> {
    const { error } = await supabase.rpc("append_project_to_portfolio", {
      p_portfolio_id: portfolioId,
      p_project_id: projectId,
    });

    return !error;
  }

  /**
   * Remove project from portfolio
   */
  async removeProject(
    portfolioId: string,
    projectId: string
  ): Promise<boolean> {
    const { error } = await supabase.rpc("remove_project_from_portfolio", {
      p_portfolio_id: portfolioId,
      p_project_id: projectId,
    });

    return !error;
  }

  /**
   * Get creator ID for a given portfolio ID
   */
  async getPortfolioCreatorId(portfolioId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("creator_id")
      .eq("id", portfolioId)
      .single();

    if (error) {
      logger.error(
        `Error fetching creator ID for portfolio ${portfolioId}: ${error.message}`
      );
      return null;
    }
    return data?.creator_id || null;
  }

  /**
   * Update portfolio analysis status and optionally error message.
   */
  async updatePortfolioAnalysisStatus(
    portfolioId: string,
    status: AnalysisStatus,
    errorMessage?: string | null
  ): Promise<void> {
    const updateData: Partial<Portfolio> = {
      analysis_status: status,
      updated_at: new Date().toISOString(),
    };
    // Only include analysis_error if provided
    if (errorMessage !== undefined) {
      updateData.analysis_error = errorMessage;
    }

    const { error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq("id", portfolioId);

    if (error) {
      logger.error(
        `Error updating portfolio analysis status for ${portfolioId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Update portfolio with AI analysis and embedding
   */
  async updatePortfolioAnalysis(
    portfolioId: string,
    analysis: string,
    embedding: number[]
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        ai_analysis: analysis,
        embedding: embedding,
        analysis_status: "success",
        analysis_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolioId);

    if (error) {
      logger.error(
        `Error updating portfolio analysis for ${portfolioId}: ${error.message}`
      );
      throw error;
    }
  }
}
