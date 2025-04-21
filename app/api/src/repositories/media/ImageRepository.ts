import { supabase } from "../../lib/supabase";
import logger from "../../config/logger";
import { ImageMedia, AnalysisStatus } from "../../models/Media";

export class ImageRepository {
  private tableName = "images";

  async getImageById(imageId: string): Promise<ImageMedia | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", imageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return null;
      }
      logger.error(`Error fetching image with ID ${imageId}: ${error.message}`);
      throw error;
    }
    return data;
  }

  async getImagesForProject(projectId: string): Promise<ImageMedia[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*, ai_analysis, embedding")
      .eq("project_id", projectId);

    if (error) {
      logger.error(
        `Error fetching images for project ${projectId}: ${error.message}`
      );
      throw error;
    }
    return data || [];
  }

  async getAnalyzedImagesForProject(
    projectId: string
  ): Promise<Pick<ImageMedia, "id" | "ai_analysis">[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, ai_analysis")
      .eq("project_id", projectId)
      .not("ai_analysis", "is", null);

    if (error) {
      logger.error(
        `Error fetching analyzed images for project ${projectId}: ${error.message}`
      );
      throw error;
    }
    return data || [];
  }

  /**
   * Update image analysis status and optionally error message.
   */
  async updateImageAnalysisStatus(
    imageId: string,
    status: AnalysisStatus,
    errorMessage?: string | null
  ): Promise<void> {
    const updateData: Partial<ImageMedia> = {
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
      .eq("id", imageId);

    if (error) {
      logger.error(
        `Error updating image analysis status for ${imageId}: ${error.message}`
      );
      throw error;
    }
  }

  async updateImageAnalysis(
    imageId: string,
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
      .eq("id", imageId);

    if (error) {
      logger.error(
        `Error updating image analysis for ${imageId}: ${error.message}`
      );
      throw error;
    }
  }
}
