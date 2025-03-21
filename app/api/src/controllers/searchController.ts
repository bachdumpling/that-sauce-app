import { Request, Response } from "express";
import { SearchService } from "../services/searchService";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { SearchQueryParams } from "../models/Search";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";

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
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          400
        );
      }

      const searchResults = await this.searchService.searchCreators(req.query);

      return sendSuccess(res, {
        results: searchResults.results,
        page: searchResults.page,
        limit: searchResults.limit,
        total: searchResults.total,
        query: searchResults.query,
        content_type: searchResults.content_type,
        processed_query: searchResults.processed_query,
      });
    } catch (error) {
      logger.error("Search creators error:", error);
      return sendError(res, ErrorCode.SERVER_ERROR, "Search failed", error, 500);
    }
  }

  async searchProjects(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query } = req.query;

      if (!query) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          400
        );
      }

      const searchResults = await this.searchService.searchProjects(req.query);

      return sendSuccess(res, {
        results: searchResults.results,
        page: searchResults.page,
        limit: searchResults.limit,
        total: searchResults.total,
        query: searchResults.query,
        content_type: searchResults.content_type,
        processed_query: searchResults.processed_query,
      });
    } catch (error) {
      logger.error("Search projects error:", error);
      return sendError(res, ErrorCode.SERVER_ERROR, "Search failed", error, 500);
    }
  }

  async searchMedia(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query } = req.query;

      if (!query) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          400
        );
      }

      const searchResults = await this.searchService.searchMedia(req.query);

      return sendSuccess(res, {
        results: searchResults.results,
        page: searchResults.page,
        limit: searchResults.limit,
        total: searchResults.total,
        query: searchResults.query,
        content_type: searchResults.content_type,
        processed_query: searchResults.processed_query,
      });
    } catch (error) {
      logger.error("Search media error:", error);
      return sendError(res, ErrorCode.SERVER_ERROR, "Search failed", error, 500);
    }
  }
}
