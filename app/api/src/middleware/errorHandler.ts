import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Unhandled Error:", err);

  // Handle Supabase errors
  if (err.code) {
    switch (err.code) {
      case "PGRST116": // No rows returned
        return res.status(404).json({ error: "Resource not found" });
      case "23505": // Unique violation
        return res.status(409).json({ error: "Resource already exists" });
      case "23503": // Foreign key violation
        return res.status(400).json({ error: "Invalid reference" });
      case "42P01": // Undefined table
        return res.status(500).json({ error: "Internal server error" });
      case "42703": // Undefined column
        return res.status(500).json({ error: "Internal server error" });
      default:
        break;
    }
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Handle authentication errors
  if (err.name === "AuthenticationError") {
    return res.status(401).json({ error: err.message });
  }

  // Handle authorization errors
  if (err.name === "AuthorizationError") {
    return res.status(403).json({ error: err.message });
  }

  // Handle not found errors
  if (err.name === "NotFoundError") {
    return res.status(404).json({ error: err.message });
  }

  // Handle other errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({ error: message });
};
