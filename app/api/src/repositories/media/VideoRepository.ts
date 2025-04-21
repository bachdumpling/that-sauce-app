import { supabase } from "../../lib/supabase";
import logger from "../../config/logger";
import { VideoMedia, AnalysisStatus } from "../../models/Media";

export class VideoRepository {
  private tableName = "videos";

  async getVideosForProject(projectId: string): Promise<VideoMedia[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        "*, ai_analysis, embedding"
      )
      .eq("project_id", projectId);

    if (error) {
      logger.error(
        `Error fetching videos for project ${projectId}: ${error.message}`
      );
      throw error;
    }
    return data || [];
  }

  async getAnalyzedVideosForProject(
    projectId: string
  ): Promise<Pick<VideoMedia, "id" | "ai_analysis">[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, ai_analysis")
      .eq("project_id", projectId)
      .not("ai_analysis", "is", null);

    if (error) {
      logger.error(
        `Error fetching analyzed videos for project ${projectId}: ${error.message}`
      );
      throw error;
    }
    return data || [];
  }

  /**
   * Update video analysis status and optionally error message.
   */
  async updateVideoAnalysisStatus(
    videoId: string,
    status: AnalysisStatus,
    errorMessage?: string | null
  ): Promise<void> {
    const updateData: Partial<VideoMedia> = {
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
      .eq("id", videoId);

    if (error) {
      logger.error(
        `Error updating video analysis status for ${videoId}: ${error.message}`
      );
      throw error;
    }
  }

  async updateVideoAnalysis(
    videoId: string,
    analysis: string,
    embedding: number[]
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        ai_analysis: analysis,
        embedding: embedding,
        analysis_status: "success", // Set status to success on successful analysis update
        analysis_error: null, // Clear any previous error
        updated_at: new Date().toISOString(), // Keep updated_at consistent
      })
      .eq("id", videoId);

    if (error) {
      logger.error(
        `Error updating video analysis for ${videoId}: ${error.message}`
      );
      throw error;
    }
  }
}
