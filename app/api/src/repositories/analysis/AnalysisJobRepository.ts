import { supabase } from "../../lib/supabase";
import logger from "../../config/logger";
import { AnalysisJob } from "../../models/AnalysisJob";

export class AnalysisJobRepository {
  private tableName = "analysis_jobs";

  async updateStatus(
    jobId: string,
    status: AnalysisJob["status"],
    error?: string
  ): Promise<void> {
    const updateData: Partial<AnalysisJob> = { status };

    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    if (error) {
      updateData.error = error;
    }

    const { error: updateError } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq("id", jobId);

    if (updateError) {
      logger.error(
        `Error updating job status for ${jobId}: ${updateError.message}`
      );
      throw updateError;
    }
  }

  async updateProgress(jobId: string, progress: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ progress })
      .eq("id", jobId);

    if (error) {
      logger.error(
        `Error updating job progress for ${jobId}: ${error.message}`
      );
      throw error;
    }
  }

  async getLastJobForPortfolio(
    portfolioId: string
  ): Promise<AnalysisJob | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to return null if not found

    if (error) {
      logger.error(
        `Error fetching last job for portfolio ${portfolioId}: ${error.message}`
      );
      throw error;
    }
    return data;
  }

  async countJobsInLastMonth(portfolioId: string): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true }) // Use head: true for count only
      .eq("portfolio_id", portfolioId)
      .gt("created_at", monthAgo.toISOString());

    if (error) {
      logger.error(
        `Error counting monthly jobs for portfolio ${portfolioId}: ${error.message}`
      );
      throw error;
    }
    return count ?? 0;
  }

  async getJobById(jobId: string): Promise<AnalysisJob | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      logger.error(`Error fetching job by ID ${jobId}: ${error.message}`);
      throw error;
    }
    return data;
  }
}
