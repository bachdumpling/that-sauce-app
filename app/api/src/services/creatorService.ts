import { CreatorRepository } from "../repositories/CreatorRepository";
import { Creator } from "../models/Creator";

export class CreatorService {
  private creatorRepo: CreatorRepository;

  constructor() {
    this.creatorRepo = new CreatorRepository();
  }

  /**
   * Get creator by profile ID
   */
  async getCreatorByProfileId(profileId: string): Promise<Creator | null> {
    return this.creatorRepo.getByProfileId(profileId);
  }

  /**
   * Get creator by username
   */
  async getCreatorByUsername(username: string): Promise<Creator | null> {
    return this.creatorRepo.getByUsername(username);
  }

  /**
   * Create or update creator profile
   */
  async createOrUpdateCreator(
    profileId: string,
    data: Partial<Creator>
  ): Promise<Creator | null> {
    // Check if creator exists
    const existingCreator = await this.creatorRepo.getByProfileId(profileId);

    if (existingCreator) {
      // Update existing creator
      return this.creatorRepo.update(existingCreator.id, {
        ...data,
        profile_id: profileId, // Ensure profile_id doesn't change
      });
    } else {
      // Create new creator
      return this.creatorRepo.create({
        ...data,
        profile_id: profileId,
      });
    }
  }

  /**
   * Update creator profile
   */
  async updateCreator(
    profileId: string,
    data: Partial<Creator>
  ): Promise<Creator | null> {
    const creator = await this.creatorRepo.getByProfileId(profileId);
    
    if (!creator) {
      throw new Error("Creator not found");
    }

    return this.creatorRepo.update(creator.id, data);
  }
} 