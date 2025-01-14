import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/auth";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, googleId } = req.body;
      const user = await this.authService.findOrCreateUser(email, googleId);

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      res.json({ token, user });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      const user = await this.authService.getUserById(req.user.userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: "User not found" });
    }
  };
}
