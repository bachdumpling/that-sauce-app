import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";

// Define a custom interface for authenticated requests
export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export const extractUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.split(" ")[1];
    console.log("token", token);

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without user
      logger.warn("Invalid auth token provided", { error });
      return next();
    }

    // Add the user to the request
    req.user = {
      id: user.id,
      email: user.email,
      // You can add more user properties here if needed
    };

    // Check if user has admin role
    if (user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && profile.role) {
        req.user.role = profile.role;
      }
    }

    next();
  } catch (error) {
    logger.error("Error extracting user from request", { error });
    next();
  }
};
