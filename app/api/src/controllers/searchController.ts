import { Request, Response } from "express";
import { SearchService } from "../services/searchService";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { SearchQueryParams } from "../models/Search";

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  async searchCreators(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      const searchResults = await this.searchService.searchCreators(req.query);

      res.json({
        success: true,
        data: {
          results: searchResults.results,
          page: searchResults.page,
          limit: searchResults.limit,
          total: searchResults.total,
          query: searchResults.query,
          content_type: searchResults.content_type,
          processed_query: searchResults.processed_query,
        },
      });
    } catch (error) {
      logger.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: "Search failed",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
