import { Router } from "express";
import { AuthController } from "../controllers/auth";
import { authenticate } from "../middleware/auth";
import { validateLogin } from "../middleware/validate";

const router = Router();
const authController = new AuthController();

router.post("/login", validateLogin, authController.login);
router.get("/me", authenticate, authController.getMe);

export default router;
