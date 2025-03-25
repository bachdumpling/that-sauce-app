// src/routes/searchRoutes.ts
import express from "express";
import { SearchController } from "../controllers/searchController";
import { SearchHistoryController } from "../controllers/searchHistoryController";
import { extractUser } from "../middleware/extractUser";

const router = express.Router();
const searchController = new SearchController();
const searchHistoryController = new SearchHistoryController();

// Extract user for all routes (auth optional for search)
router.use(extractUser);

// Demo search endpoint
/**
 * @route GET /api/search/demo
 * @desc Demo search endpoint for creative content
 */
router.get("/demo", searchController.demoSearch.bind(searchController));

/**
 * @route GET /api/search
 * @desc Main search endpoint for creative content
 */
router.get("/", searchController.searchCreativeContent.bind(searchController));

/**
 * @route GET /api/search/creators
 * @desc Search for creators by query (maintained for backwards compatibility)
 */
router.get("/creators", searchController.searchCreators.bind(searchController));

/**
 * @route GET /api/search/projects
 * @desc Search for projects by query (maintained for backwards compatibility)
 */
router.get("/projects", searchController.searchProjects.bind(searchController));

/**
 * @route GET /api/search/media
 * @desc Search for media (images and videos) by query (maintained for backwards compatibility)
 */
router.get("/media", searchController.searchMedia.bind(searchController));

/**
 * @route GET /api/search/enhance-prompt
 * @desc Enhance a search query with AI-powered suggestions
 */
router.get(
  "/refine",
  searchController.enhanceSearchPrompt.bind(searchController)
);

/**
 * @route GET /api/search/history
 * @desc Get user's search history
 */
router.get(
  "/history",
  searchHistoryController.getSearchHistory.bind(searchHistoryController)
);

/**
 * @route DELETE /api/search/history/:id
 * @desc Delete a specific search history entry
 */
router.delete(
  "/history/:id",
  searchHistoryController.deleteSearchEntry.bind(searchHistoryController)
);

/**
 * @route DELETE /api/search/history
 * @desc Clear all search history for a user
 */
router.delete(
  "/history",
  searchHistoryController.clearSearchHistory.bind(searchHistoryController)
);

/**
 * @route GET /api/search/popular
 * @desc Get popular searches
 */
router.get(
  "/popular",
  searchHistoryController.getPopularSearches.bind(searchHistoryController)
);

export default router;
