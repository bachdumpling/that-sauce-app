import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import { invalidateCache } from "../lib/cache";
import { AuthenticatedRequest } from "../middleware/extractUser";
import logger from "../config/logger";

export const organizationController = {
  /**
   * Get all organizations
   */
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        logger.error("Error fetching organizations:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch organizations",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get organization by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Organization not found",
            },
          });
        }

        logger.error("Error fetching organization:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch organization",
          },
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Create a new organization
   */
  create: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name, logo_url, website } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to create an organization",
          },
        });
      }

      const { data, error } = await supabase
        .from("organizations")
        .insert([
          {
            name,
            logo_url,
            website,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error("Error creating organization:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to create organization",
          },
        });
      }

      invalidateCache("organization_list");

      return res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update an organization
   */
  update: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { name, logo_url, website } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to update an organization",
          },
        });
      }

      // Only update fields that are provided
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (logo_url !== undefined) updateData.logo_url = logo_url;
      if (website !== undefined) updateData.website = website;

      const { data, error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Organization not found",
            },
          });
        }

        logger.error("Error updating organization:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update organization",
          },
        });
      }

      invalidateCache(`organization_${id}`);
      invalidateCache("organization_list");

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Delete an organization
   */
  delete: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to delete an organization",
          },
        });
      }

      // Check if this organization is used in any projects
      const { count, error: countError } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .contains("client_ids", [id]);

      if (countError) {
        logger.error("Error checking organization references:", countError);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to check organization references",
          },
        });
      }

      if (count && count > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "REFERENCE_ERROR",
            message:
              "Cannot delete organization that is referenced by projects",
          },
        });
      }

      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting organization:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to delete organization",
          },
        });
      }

      invalidateCache(`organization_${id}`);
      invalidateCache("organization_list");

      return res.status(200).json({
        success: true,
        message: "Organization deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
};
