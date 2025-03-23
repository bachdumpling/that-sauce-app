// src/routes/searchRoutes.ts
import express from "express";
import { SearchController } from "../controllers/searchController";
import { extractUser } from "../middleware/extractUser";

const router = express.Router();
const searchController = new SearchController();

// Extract user for all routes (auth optional for search)
router.use(extractUser);

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

export default router;
