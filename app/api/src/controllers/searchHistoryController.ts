// src/controllers/searchHistoryController.ts
import { Response } from "express";
import { SearchHistoryRepository } from "../repositories/SearchHistoryRepository";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";
import logger from "../config/logger";

export class SearchHistoryController {
  private searchHistoryRepo: SearchHistoryRepository;

  constructor() {
    this.searchHistoryRepo = new SearchHistoryRepository();
  }

  /**
   * Get user's search history
   * GET /api/search/history
   */
  async getSearchHistory(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user?.id) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;

      const { entries, total } = await this.searchHistoryRepo.getSearchHistory(
        req.user.id,
        limit,
        page
      );

      return sendSuccess(res, {
        history: entries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Error fetching search history:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to fetch search history",
        error,
        500
      );
    }
  }

  /**
   * Delete a search history entry
   * DELETE /api/search/history/:id
   */
  async deleteSearchEntry(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      const { id } = req.params;

      if (!id) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search history ID is required",
          null,
          400
        );
      }

      const success = await this.searchHistoryRepo.deleteSearchEntry(
        req.user.id,
        id
      );

      if (!success) {
        return sendError(
          res,
          ErrorCode.NOT_FOUND,
          "Search history entry not found or you don't have permission to delete it",
          null,
          404
        );
      }

      return sendSuccess(res, {
        message: "Search history entry deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting search history entry:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to delete search history entry",
        error,
        500
      );
    }
  }

  /**
   * Clear all search history for a user
   * DELETE /api/search/history
   */
  async clearSearchHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return sendError(
          res,
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          null,
          401
        );
      }

      const success = await this.searchHistoryRepo.clearSearchHistory(
        req.user.id
      );

      if (!success) {
        return sendError(
          res,
          ErrorCode.SERVER_ERROR,
          "Failed to clear search history",
          null,
          500
        );
      }

      return sendSuccess(res, {
        message: "Search history cleared successfully",
      });
    } catch (error) {
      logger.error("Error clearing search history:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to clear search history",
        error,
        500
      );
    }
  }

  /**
   * Get popular searches (for recommendations)
   * GET /api/search/popular
   */
  async getPopularSearches(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = Number(req.query.limit) || 5;
      const popularSearches =
        await this.searchHistoryRepo.getPopularSearches(limit);

      return sendSuccess(res, {
        searches: popularSearches.map((search) => ({
          query: search.query,
          count: search.count,
          similarity: search.similarity,
        })),
      });
    } catch (error) {
      logger.error("Error fetching popular searches:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to fetch popular searches",
        error,
        500
      );
    }
  }
}
