import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Express } from "express";

export const setupSecurity = (app: Express) => {
  // Basic security headers
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
    message: "Too many requests from this IP, please try again later.",
  });

  app.use(limiter);
};
