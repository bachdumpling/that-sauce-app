import cors from "cors";
import { Express } from "express";

export const setupCors = (app: Express) => {
  const defaultOrigins =
    process.env.NODE_ENV === "development"
      ? [
          "http://localhost:3000",
          "https://api.that-sauce.com",
          "https://that-sauce.com",
          "https://www.that-sauce.com",
        ]
      : [
          "https://api.that-sauce.com",
          "https://that-sauce.com",
          "https://www.that-sauce.com",
        ];

  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || defaultOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
  };

  // Enable pre-flight requests for all routes
  app.options("*", cors(corsOptions));

  // Apply CORS middleware
  app.use(cors(corsOptions));

  // Ensure CORS headers are sent even for errors
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (defaultOrigins.includes(origin) ||
        process.env.ALLOWED_ORIGINS?.includes(origin))
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }
    next();
  });
};
