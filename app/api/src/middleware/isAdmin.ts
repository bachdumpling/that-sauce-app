// src/middleware/isAdmin.ts
import { Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { AuthenticatedRequest } from "./extractUser";

export const isAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has admin role in profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    if (!data || data.role !== "admin") {
      logger.warn(
        `User ${user.id} attempted to access admin endpoint without admin role`
      );
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    logger.debug(`Admin access granted to user ${user.id}`);
    next();
  } catch (error: any) {
    logger.error("Admin middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate admin status",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
