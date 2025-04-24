import { supabase } from "../lib/supabase";
import {
  Project,
  ProjectWithMedia,
  ProjectWithCreator,
} from "../models/Project";
import { ImageMedia, VideoMedia } from "../models/Media";
import { invalidateCache } from "../lib/cache";
import logger from "../config/logger";
import { AnalysisStatus } from "../models/Media";

// Define interfaces for specific analysis-related project data
export interface ProjectForAnalysis {
  id: string;
  title: string;
  description: string | null;
  ai_analysis: string | null;
}

export interface AnalyzedProjectForPortfolio {
  id: string;
  title: string;
  description: string | null;
  ai_analysis: string;
}

export class ProjectRepository {
  private tableName = "projects"; // Added tableName

  /**
   * Get projects by creator ID
   */
  async getByCreatorId(creatorId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get project by ID with media
   */
  async getById(id: string): Promise<ProjectWithMedia | null> {
    // Get the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, creators(*)")
      .eq("id", id)
      .single();

    if (projectError) throw projectError;
    if (!project) return null;

    // Get project images
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .eq("project_id", id)
      .order("order", { ascending: true });

    if (imagesError) throw imagesError;

    // Get project videos
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (videosError) throw videosError;

    return {
      ...project,
      images: images || [],
      videos: videos || [],
    };
  }

  /**
   * Create a new project
   */
  async create(
    data: Pick<
      Project,
      | "title"
      | "description"
      | "creator_id"
      | "short_description"
      | "roles"
      | "client_ids"
      | "year"
      | "thumbnail_url"
    > & {
      portfolio_id: string;
    }
  ): Promise<Project> {
    const { data: project, error } = await supabase
      .from("projects")
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    // Invalidate related caches
    invalidateCache("admin_projects_list_");

    // Get the creator information to invalidate their caches too
    try {
      const { data: creator } = await supabase
        .from("creators")
        .select("username")
        .eq("id", data.creator_id)
        .single();

      if (creator) {
        invalidateCache(`creator_username_${creator.username}`);
        invalidateCache(`creator_project_`);
      }
    } catch (error) {
      // Log but don't throw to avoid disrupting the main operation
      logger.error("Error invalidating creator caches:", error);
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    data: Partial<
      Pick<
        Project,
        | "title"
        | "description"
        | "short_description"
        | "roles"
        | "client_ids"
        | "year"
        | "thumbnail_url"
      >
    >
  ): Promise<Project> {
    const { data: project, error } = await supabase
      .from("projects")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate related caches
    invalidateCache(`admin_project_details_${id}`);
    invalidateCache(`project_${id}`);
    invalidateCache("admin_projects_list_");

    // Get the creator information to invalidate their caches too
    try {
      const { data: projectWithCreator } = await supabase
        .from("projects")
        .select("creator_id, creators!inner(username)")
        .eq("id", id)
        .single<ProjectWithCreator>();

      if (projectWithCreator?.creators?.username) {
        invalidateCache(
          `creator_username_${projectWithCreator.creators.username}`
        );
        invalidateCache(`creator_project_`);
      }
    } catch (error) {
      // Log but don't throw to avoid disrupting the main operation
      logger.error("Error invalidating creator caches:", error);
    }

    return project;
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    // First get project info to use for cache invalidation
    const { data: project } = await supabase
      .from("projects")
      .select("creator_id, creators!inner(username)")
      .eq("id", id)
      .single<ProjectWithCreator>();

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;

    // Invalidate related caches
    invalidateCache(`admin_project_details_${id}`);
    invalidateCache(`project_${id}`);
    invalidateCache("admin_projects_list_");

    // Invalidate creator caches if we have the info
    if (project?.creators?.username) {
      invalidateCache(`creator_username_${project.creators.username}`);
      invalidateCache(`creator_project_`);
    }
  }

  /**
   * Check if a project belongs to a creator
   */
  async belongsToCreator(
    projectId: string,
    creatorId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("creator_id", creatorId)
      .single();

    if (error) return false;
    return !!data;
  }

  /**
   * Get images for a project
   */
  async getProjectImages(projectId: string) {
    try {
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("*, creator:creator_id(id, username)")
        .eq("project_id", projectId)
        .order("order", { ascending: true });

      if (imagesError) {
        return { success: false, error: imagesError };
      }

      return { success: true, data: images };
    } catch (error) {
      logger.error("Error fetching project images:", error);
      return { success: false, error: "Failed to fetch project images" };
    }
  }

  /**
   * Get videos for a project
   */
  async getProjectVideos(projectId: string) {
    try {
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*, creator:creator_id(id, username)")
        .eq("project_id", projectId)
        .order("order", { ascending: true });

      if (videosError) {
        return { success: false, error: videosError };
      }

      return { success: true, data: videos };
    } catch (error) {
      logger.error("Error fetching project videos:", error);
      return { success: false, error: "Failed to fetch project videos" };
    }
  }

  // --- Methods added for Analysis Service ---

  /**
   * Get basic project details needed for analysis
   */
  async getProjectDetails(
    projectId: string
  ): Promise<Pick<Project, "id" | "title" | "description"> | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, title, description")
      .eq("id", projectId)
      .single();

    if (error) {
      logger.error(
        `Error fetching project details for analysis ${projectId}: ${error.message}`
      );
      return null;
    }
    return data;
  }

  /**
   * Get projects for a portfolio, suitable for starting analysis
   */
  async getProjectsForPortfolio(
    portfolioId: string
  ): Promise<ProjectForAnalysis[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, title, description, ai_analysis") // Select fields needed for analysis start
      .eq("portfolio_id", portfolioId);

    if (error) {
      logger.error(
        `Error fetching projects for portfolio ${portfolioId}: ${error.message}`
      );
      throw error;
    }
    return data || [];
  }

  /**
   * Get analyzed projects for a portfolio
   */
  async getAnalyzedProjectsForPortfolio(
    portfolioId: string
  ): Promise<AnalyzedProjectForPortfolio[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, title, description, ai_analysis")
      .eq("portfolio_id", portfolioId)
      .not("ai_analysis", "is", null);

    if (error) {
      logger.error(
        `Error fetching analyzed projects for portfolio ${portfolioId}: ${error.message}`
      );
      throw error;
    }
    // Filter out any potential nulls just in case and ensure ai_analysis is string
    return (
      (data?.filter(
        (p) => p.ai_analysis !== null
      ) as AnalyzedProjectForPortfolio[]) || []
    );
  }

  /**
   * Update project with AI analysis and embedding
   */
  async updateProjectAnalysis(
    projectId: string,
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
      .eq("id", projectId);

    if (error) {
      logger.error(
        `Error updating project analysis for ${projectId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Update project analysis status and optionally error message.
   */
  async updateProjectAnalysisStatus(
    projectId: string,
    status: AnalysisStatus,
    errorMessage?: string | null
  ): Promise<void> {
    const updateData: Partial<Project> = {
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
      .eq("id", projectId);

    if (error) {
      logger.error(
        `Error updating project analysis status for ${projectId}: ${error.message}`
      );
      throw error;
    }
  }
  
  /**
   * Get projects that are still being processed for a portfolio
   */
  async getPendingProjectsForPortfolio(portfolioId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("id, title")
        .eq("portfolio_id", portfolioId)
        .eq("analysis_status", "processing");

      if (error) {
        logger.error(
          `Error fetching pending projects for portfolio ${portfolioId}: ${error.message}`
        );
        return [];
      }
      return data || [];
    } catch (error) {
      logger.error(
        `Exception when fetching pending projects for portfolio ${portfolioId}: ${error}`
      );
      return [];
    }
  }
}
