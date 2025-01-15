import { Router } from "express";
import { SearchController } from "../controllers/search";

const router = Router();
const searchController = new SearchController();

router.get("/creators", searchController.searchCreators);

export default router;
