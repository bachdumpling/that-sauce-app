import { CreatorProfileRepository } from "../repositories/CreatorProfileRepository";
import { CreatorProfile, CreatorProject } from "../models/CreatorProject";
import logger from "../config/logger";
import { invalidateCache } from "../lib/cache";

export class CreatorProfileService {
  private creatorProfileRepo: CreatorProfileRepository;

  constructor() {
    this.creatorProfileRepo = new CreatorProfileRepository();
  }

  /**
   * Get creator by username
   * @param username The username to look up
   * @param userId Optional user ID to check ownership
   */
  async getCreatorByUsername(
    username: string, 
    userId?: string
  ): Promise<CreatorProfile | null> {
    try {
      return await this.creatorProfileRepo.getByUsername(username, userId);
    } catch (error) {
      logger.error(`Error in getCreatorByUsername service: ${error}`);
      throw error;
    }
  }

  /**
   * Get a specific project by creator username and project title
   */
  async getProjectByTitle(
    username: string,
    projectTitle: string
  ): Promise<CreatorProject | null> {
    try {
      return await this.creatorProfileRepo.getProjectByTitle(
        username,
        projectTitle
      );
    } catch (error) {
      logger.error(`Error in getProjectByTitle service: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a project image
   */
  async deleteProjectImage(
    projectId: string,
    imageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await this.creatorProfileRepo.deleteProjectImage(
        projectId,
        imageId,
        userId
      );

      if (result) {
        // Invalidate any cache for this project
        invalidateCache(`creator_project_`);
      }

      return result;
    } catch (error) {
      logger.error(`Error in deleteProjectImage service: ${error}`);
      throw error;
    }
  }
}
