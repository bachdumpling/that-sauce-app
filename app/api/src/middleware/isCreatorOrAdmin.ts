import { Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { AuthenticatedRequest } from "./extractUser";

/**
 * Middleware to check if the user is the creator of the portfolio or an admin
 */
export const isCreatorOrAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // User must be authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Admin users can bypass checks
    if (req.user.role === "admin" || req.user.role === "super_admin") {
      return next();
    }

    const portfolioId = req.params.id;

    // Get the portfolio
    const { data: portfolio, error } = await supabase
      .from("portfolios")
      .select("creator_id")
      .eq("id", portfolioId)
      .single();

    if (error) {
      logger.error(`Error checking portfolio ownership: ${error.message}`, {
        error,
      });
      return res.status(404).json({
        success: false,
        error: "Portfolio not found",
      });
    }

    // Check if the logged-in user is the creator
    if (portfolio.creator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to modify this portfolio",
      });
    }

    next();
  } catch (error: any) {
    logger.error(`Error in isCreatorOrAdmin: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
