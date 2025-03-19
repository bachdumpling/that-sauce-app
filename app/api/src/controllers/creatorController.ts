import { Request, Response } from "express";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { CreatorProfileService } from "../services/creatorProfileService";

export class CreatorController {
  private creatorProfileService: CreatorProfileService;

  constructor() {
    this.creatorProfileService = new CreatorProfileService();
  }

  /**
   * Get creator details by username
   * GET /api/creators/:username
   */
  async getCreatorByUsername(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: "Username is required",
        });
      }

      const creator =
        await this.creatorProfileService.getCreatorByUsername(username);

      if (!creator) {
        return res.status(404).json({
          success: false,
          error: "Creator not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: creator,
      });
    } catch (error: any) {
      logger.error(`Error in getCreatorByUsername: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Get specific project by creator username and project title
   * GET /api/creators/:username/projects/:projectTitle
   */
  async getProjectByTitle(req: AuthenticatedRequest, res: Response) {
    try {
      const { username, projectTitle } = req.params;

      logger.info(
        `Fetching project by title: username=${username}, projectTitle=${projectTitle}`
      );

      if (!username || !projectTitle) {
        logger.warn(
          `Missing parameters: username=${username}, projectTitle=${projectTitle}`
        );
        return res.status(400).json({
          success: false,
          error: "Username and project title are required",
        });
      }

      const project = await this.creatorProfileService.getProjectByTitle(
        username,
        projectTitle
      );

      if (!project) {
        logger.warn(
          `Project not found for ${username} with title ${projectTitle}`
        );
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      logger.error(`Error in getProjectByTitle: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Delete a project image
   * DELETE /api/creators/projects/:projectId/images/:imageId
   */
  async deleteProjectImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId, imageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
      }

      if (!projectId || !imageId) {
        return res.status(400).json({
          success: false,
          error: "Project ID and image ID are required",
        });
      }

      const success = await this.creatorProfileService.deleteProjectImage(
        projectId,
        imageId,
        userId
      );

      if (!success) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You don't have permission to delete this image",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error: any) {
      logger.error(`Error in deleteProjectImage: ${error.message}`, {
        error,
      });
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
