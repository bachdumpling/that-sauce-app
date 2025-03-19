import { supabase } from "../lib/supabase";
import { SearchResult, SearchQueryParams } from "../models/Search";
import logger from "../config/logger";

export class SearchRepository {
  /**
   * Match portfolios based on query embedding
   */
  async matchPortfolios(queryEmbedding: number[], limit: number): Promise<any[]> {
    const { data, error } = await supabase.rpc("match_portfolios", {
      query_embedding: queryEmbedding,
      match_threshold: 0.2,
      match_limit: limit,
    });

    if (error) {
      logger.error("Portfolio match error:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get creator details by ID
   */
  async getCreatorById(creatorId: string): Promise<any> {
    const { data, error } = await supabase
      .from("creators")
      .select(`
        id,
        username,
        location,
        bio,
        primary_role,
        social_links
      `)
      .eq("id", creatorId)
      .single();

    if (error) {
      logger.error("Creator fetch error:", error);
      throw error;
    }

    return data;
  }

  /**
   * Check if a creator has videos
   */
  async creatorHasVideos(creatorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("videos")
      .select("id", { count: "exact" })
      .eq("creator_id", creatorId)
      .limit(1);

    if (error) {
      logger.error("Video check error:", error);
      throw error;
    }

    return !!(data && data.length > 0);
  }

  /**
   * Match projects for a portfolio
   */
  async matchPortfolioProjects(
    queryEmbedding: number[],
    portfolioId: string,
    contentType: "all" | "videos" = "all"
  ): Promise<any[]> {
    const rpcName = contentType === "videos" 
      ? "match_portfolio_projects_with_videos" 
      : "match_portfolio_projects";

    const { data, error } = await supabase.rpc(rpcName, {
      query_embedding: queryEmbedding,
      target_portfolio_id: portfolioId,
      match_limit: 3,
    });

    if (error) {
      logger.error("Projects fetch error:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Match images for a project
   */
  async matchProjectImages(queryEmbedding: number[], projectId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("match_project_images", {
      query_embedding: queryEmbedding,
      target_project_id: projectId,
      match_limit: 4,
    });

    if (error) {
      logger.error("Images fetch error:", error);
      throw error;
    }

    return data || [];
  }
} 