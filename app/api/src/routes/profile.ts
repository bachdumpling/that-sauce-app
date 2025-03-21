import { Router } from "express";
import { extractUser, AuthenticatedRequest } from "../middleware/extractUser";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { Response } from "express";
import { cacheClearMiddleware } from "../lib/cache";

const router = Router();

// Apply authentication middleware
router.use(extractUser);

/**
 * Update user profile
 * PUT /api/profile
 */
router.put(
  "/", 
  cacheClearMiddleware([
    `creator_username_`, 
    `creator_project_`, 
    `creator_details_`,
    `search_creators_`
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const { first_name, last_name } = req.body;

      // Prepare update data
      const updateData: any = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      updateData.updated_at = new Date();

      // Update the profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", req.user.id)
        .select()
        .single();

      if (updateError) {
        logger.error(`Error updating profile: ${updateError.message}`, { error: updateError });
        return res.status(500).json({
          success: false,
          error: "Failed to update profile",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      logger.error(`Error in updateProfile: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

export default router; 