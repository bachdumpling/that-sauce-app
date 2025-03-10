import { Router } from "express";
import { SearchController } from "../controllers/searchController";
import { extractUser } from "../middleware/extractUser";
import { cacheMiddleware } from "../lib/cache";

const router = Router();
const searchController = new SearchController();

router.use(extractUser);
router.get("/creators", searchController.searchCreators);

export default router;
