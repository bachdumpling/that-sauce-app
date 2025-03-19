import { SearchRepository } from "../repositories/SearchRepository";
import { SearchResult, SearchQueryParams } from "../models/Search";
import { EmbeddingService } from "../services/embeddingService";
import logger from "../config/logger";

export class SearchService {
  private searchRepo: SearchRepository;
  private embeddingService: EmbeddingService;

  constructor() {
    this.searchRepo = new SearchRepository();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Search for creators based on query
   */
  async searchCreators(params: SearchQueryParams): Promise<{
    results: SearchResult[];
    processed_query?: string;
    total: number;
    page: number;
    limit: number;
    query: string;
    content_type: string;
  }> {
    try {
      const { q: query, contentType = "all" } = params;
      const limit = params.limit || 5;
      const page = params.page || 1;
      
      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query, "creators");

      if (!queryEmbedding?.values?.length) {
        logger.warn("Failed to generate embedding for query:", query);
        return {
          results: [],
          page,
          limit,
          total: 0,
          query,
          content_type: contentType,
        };
      }

      // Get matching portfolios
      const matches = await this.searchRepo.matchPortfolios(queryEmbedding.values, limit);

      // Process each matching portfolio
      const results = await Promise.all(
        (matches || []).map(async (match: any) => {
          // Retrieve creator details
          const creator = await this.searchRepo.getCreatorById(match.creator_id);

          // When searching for videos, check that the creator has at least one video
          if (contentType === "videos") {
            const hasVideos = await this.searchRepo.creatorHasVideos(creator.id);
            if (!hasVideos) {
              // Skip this creator if no videos are found
              return null;
            }
          }

          // Retrieve matching projects for the portfolio
          const projects = await this.searchRepo.matchPortfolioProjects(
            queryEmbedding.values, 
            match.id,
            contentType as any
          );

          // Process each project
          const processedProjects = await Promise.all(
            (projects || []).map(async (project: any) => {
              let images = [];
              if (contentType !== "videos") {
                images = await this.searchRepo.matchProjectImages(
                  queryEmbedding.values, 
                  project.id
                );
              }

              // For video searches, the RPC returns aggregated videos in the "matched_videos" field
              const videos = project.matched_videos || [];

              return {
                ...project,
                images,
                videos,
                matched_videos: undefined, // Remove raw field
              };
            })
          );

          return {
            profile: creator,
            projects: processedProjects || [],
            score: match.final_score,
          };
        })
      );

      // Remove any creators that were skipped (returned null)
      const filteredResults = results.filter((result) => result !== null);

      return {
        results: filteredResults as SearchResult[],
        page,
        limit,
        total: filteredResults.length,
        query,
        content_type: contentType,
        processed_query: queryEmbedding.processed_text,
      };
    } catch (error) {
      logger.error("Search service error:", error);
      throw error;
    }
  }
}
