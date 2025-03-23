// src/controllers/searchController.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { generateEmbedding } from "../lib/embedding";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { SearchQueryParams } from "../models/Search";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";
import { groupSearchResultsByCreator } from "../utils/searchUtils";

export class SearchController {
  /**
   * Search for creative content across all creators, images, and videos
   */
  async searchCreativeContent(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    try {
      // Make sure contentType is exactly one of the expected values
      let contentType = req.query.contentType || "all";
      if (!["all", "images", "videos"].includes(contentType)) {
        contentType = "all";
      }

      const { q: query } = req.query;
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;

      logger.info(`Search request initiated`, {
        query,
        contentType,
        limit,
        page,
      });

      if (!query) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          400
        );
      }

      // Generate embedding for the search query
      logger.info(`Generating embedding for query: "${query}"`);
      const queryEmbedding = await generateEmbedding(query, "creators");

      if (!queryEmbedding?.values?.length) {
        logger.warn("Failed to generate embedding for query:", query);
        return sendSuccess(res, {
          results: [],
          page,
          limit,
          total: 0,
          query,
          content_type: contentType,
        });
      }

      // Get search results using our RPC
      const { data: rawResults, error: searchError } = await supabase.rpc(
        "search_creative_content",
        {
          query_embedding: queryEmbedding.values,
          match_threshold: 0.1,
          match_limit: limit,
          content_filter: contentType,
        }
      );

      if (searchError) {
        logger.error("Search error:", searchError);
        throw searchError;
      }

      // Get the total count from the first result (all results have the same total_count)
      const totalCount =
        rawResults && rawResults.length > 0
          ? Number(rawResults[0].total_count)
          : 0;

      // Group results by creator
      const groupedResults = groupSearchResultsByCreator(rawResults || []);

      return sendSuccess(res, {
        results: groupedResults,
        page,
        limit,
        total: totalCount,
        query,
        content_type: contentType,
        processed_query: queryEmbedding.processed_text,
      });
    } catch (error) {
      logger.error("Search error:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Search failed",
        error,
        500
      );
    }
  }
  /**
   * Search for creators - uses the unified search function
   */
  async searchCreators(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }

  /**
   * Search for projects - uses the unified search function
   */
  async searchProjects(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }

  /**
   * Search for media (images and videos) - uses the unified search function
   */
  async searchMedia(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }
}
