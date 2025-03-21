import { SearchRepository } from "../repositories/SearchRepository";
import {
  SearchResult,
  SearchQueryParams,
  ProjectSearchResult,
  ImageSearchResult,
  VideoSearchResult,
} from "../models/Search";
import {
  EmbeddingService,
  type SearchType,
} from "../services/embeddingService";
import logger from "../config/logger";

// Define MediaSearchResult type
interface MediaSearchResult {
  id: string;
  type: "image" | "video";
  url: string;
  alt_text?: string;
  title?: string;
  description?: string;
  project_id: string;
  project_title: string;
  creator_id: string;
  creator_username: string;
  score: number;
}

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
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        query,
        "creators"
      );

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
      const matches = await this.searchRepo.matchPortfolios(
        queryEmbedding.values,
        limit
      );

      // Process each matching portfolio
      const results = await Promise.all(
        (matches || []).map(async (match: any) => {
          // Retrieve creator details
          const creator = await this.searchRepo.getCreatorById(
            match.creator_id
          );

          // When searching for videos, check that the creator has at least one video
          if (contentType === "videos") {
            const hasVideos = await this.searchRepo.creatorHasVideos(
              creator.id
            );
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

  /**
   * Search for projects based on query
   */
  async searchProjects(params: SearchQueryParams): Promise<{
    results: ProjectSearchResult[];
    processed_query?: string;
    total: number;
    page: number;
    limit: number;
    query: string;
    content_type: string;
  }> {
    try {
      const { q: query, contentType = "all" } = params;
      const limit = params.limit || 10;
      const page = params.page || 1;

      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        query,
        "projects"
      );

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

      // Get matching projects directly (not through portfolios)
      const projects = await this.searchRepo.searchProjects(
        queryEmbedding.values,
        limit,
        (page - 1) * limit, // Calculate offset
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

          // For video searches, get videos for the project
          let videos = [];
          if (contentType === "all" || contentType === "videos") {
            videos = await this.searchRepo.getProjectVideos(project.id);
          }

          // Get creator basic info
          const creator = await this.searchRepo.getCreatorById(
            project.creator_id
          );

          return {
            ...project,
            images,
            videos,
            creator: {
              id: creator.id,
              username: creator.username,
            },
          };
        })
      );

      // Get the total count from the search repository
      const total = await this.searchRepo.countProjects(
        queryEmbedding.values,
        contentType as any
      );

      return {
        results: processedProjects as ProjectSearchResult[],
        page,
        limit,
        total,
        query,
        content_type: contentType,
        processed_query: queryEmbedding.processed_text,
      };
    } catch (error) {
      logger.error("Project search service error:", error);
      throw error;
    }
  }

  /**
   * Search for media (images and videos) based on query
   */
  async searchMedia(params: SearchQueryParams): Promise<{
    results: MediaSearchResult[];
    processed_query?: string;
    total: number;
    page: number;
    limit: number;
    query: string;
    content_type: string;
  }> {
    try {
      const { q: query, contentType = "all" } = params;
      const limit = params.limit || 20;
      const page = params.page || 1;

      // Generate embedding for the search query
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        query,
        "media"
      );

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

      logger.info("Query processed", {
        original: query,
        processed: queryEmbedding.processed_text,
        type: "media",
      });

      let results: MediaSearchResult[] = [];
      let total = 0;

      // Search images if not specifically looking for videos
      if (contentType !== "videos") {
        try {
          const images = await this.searchRepo.matchImages(
            queryEmbedding.values,
            contentType === "all" ? limit / 2 : limit,
            (page - 1) * (contentType === "all" ? limit / 2 : limit)
          );

          logger.info(`Retrieved ${images?.length || 0} images from search`);

          if (images && images.length > 0) {
            // Process image results with project and creator info
            const processedImages = await Promise.all(
              images.map(async (image: any) => {
                try {
                  // Get project info
                  const project = await this.searchRepo.getProjectById(
                    image.project_id
                  );
                  // Get creator info
                  const creator = await this.searchRepo.getCreatorById(
                    image.creator_id
                  );

                  return {
                    id: image.id,
                    type: "image" as const,
                    url: image.url,
                    alt_text: image.alt_text,
                    project_id: image.project_id,
                    project_title: project?.title || "Unknown Project",
                    creator_id: image.creator_id,
                    creator_username: creator?.username || "Unknown Creator",
                    score: image.score,
                  };
                } catch (imageProcessError) {
                  logger.error("Error processing image:", imageProcessError);
                  return null;
                }
              })
            );

            // Filter out any null results from processing errors
            const validProcessedImages = processedImages.filter(
              (img) => img !== null
            ) as MediaSearchResult[];
            results = [...results, ...validProcessedImages];

            try {
              total += await this.searchRepo.countMatchingImages(
                queryEmbedding.values
              );
            } catch (countError) {
              logger.error("Error counting images:", countError);
            }
          }
        } catch (imageSearchError) {
          logger.error("Images search error:", imageSearchError);
          // Continue execution to try videos search
        }
      }

      // Search videos if not specifically looking for images
      if (contentType !== "images") {
        try {
          const videos = await this.searchRepo.matchVideos(
            queryEmbedding.values,
            contentType === "all" ? limit / 2 : limit,
            (page - 1) * (contentType === "all" ? limit / 2 : limit)
          );

          logger.info(`Retrieved ${videos?.length || 0} videos from search`);

          if (videos && videos.length > 0) {
            // Process video results with project and creator info
            const processedVideos = await Promise.all(
              videos.map(async (video: any) => {
                try {
                  // Get project info
                  const project = await this.searchRepo.getProjectById(
                    video.project_id
                  );
                  // Get creator info
                  const creator = await this.searchRepo.getCreatorById(
                    video.creator_id
                  );

                  return {
                    id: video.id,
                    type: "video" as const,
                    url: video.url,
                    title: video.title,
                    description: video.description,
                    project_id: video.project_id,
                    project_title: project?.title || "Unknown Project",
                    creator_id: video.creator_id,
                    creator_username: creator?.username || "Unknown Creator",
                    score: video.score,
                  };
                } catch (videoProcessError) {
                  logger.error("Error processing video:", videoProcessError);
                  return null;
                }
              })
            );

            // Filter out any null results from processing errors
            const validProcessedVideos = processedVideos.filter(vid => vid !== null) as MediaSearchResult[];
            results = [...results, ...validProcessedVideos];
            
            try {
              total += await this.searchRepo.countMatchingVideos(queryEmbedding.values);
            } catch (countError) {
              logger.error("Error counting videos:", countError);
            }
          }
        } catch (videoSearchError) {
          logger.error("Videos search error:", videoSearchError);
          // Continue execution to return the results we have
        }
      }

      // Sort results by score (highest first)
      results.sort((a, b) => b.score - a.score);

      return {
        results,
        page,
        limit,
        total,
        query,
        content_type: contentType,
        processed_query: queryEmbedding.processed_text,
      };
    } catch (error) {
      logger.error("Media search service error:", error);
      throw error;
    }
  }
}
