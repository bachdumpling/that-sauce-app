import { Router } from "express";
import { SearchController } from "../controllers/searchController";
import { extractUser } from "../middleware/extractUser";
import { cacheMiddleware } from "../lib/cache";

const router = Router();
const searchController = new SearchController();

// Apply extractUser middleware but don't require authentication
router.use(extractUser);

// Cache search results for 5 minutes (300 seconds)
router.get(
  "/creators", 
  cacheMiddleware(300, (req) => `search_creators_${req.query.q}_${req.query.contentType || 'all'}_${req.query.limit || 5}_${req.query.page || 1}`),
  searchController.searchCreators.bind(searchController)
);

export default router;
