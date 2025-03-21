import express from "express";
import { SearchController } from "../controllers/searchController";
import { extractUser } from "../middleware/extractUser";

const router = express.Router();
const searchController = new SearchController();

// Extract user for all routes (auth optional for search)
router.use(extractUser);

/**
 * @route GET /api/search/creators
 * @desc Search for creators by query
 */
router.get("/creators", searchController.searchCreators.bind(searchController));

/**
 * @route GET /api/search/projects
 * @desc Search for projects by query
 */
router.get("/projects", searchController.searchProjects.bind(searchController));

/**
 * @route GET /api/search/media
 * @desc Search for media (images and videos) by query
 */
router.get("/media", searchController.searchMedia.bind(searchController));

export default router;
