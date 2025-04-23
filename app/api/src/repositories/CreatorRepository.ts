import { supabase } from "../lib/supabase";
import { Creator, CreatorWithProfile } from "../models/Creator";
import { Portfolio } from "../models/Portfolio";
import { invalidateCache } from "../lib/cache";
import logger from "../config/logger";

export class CreatorRepository {
  /**
   * Get creator by profile ID
   */
  async getByProfileId(profileId: string): Promise<Creator | null> {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get creator by username
   */
  async getByUsername(username: string): Promise<Creator | null> {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get creator by ID with profile data
   */
  async getById(id: string): Promise<CreatorWithProfile | null> {
    const { data, error } = await supabase
      .from("creators")
      .select(
        `
        *,
        profile:profiles(id, email)
      `
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Create new creator
   */
  async create(data: Partial<Creator>): Promise<Creator | null> {
    // Add timestamps if not provided
    if (!data.created_at) data.created_at = new Date().toISOString();
    if (!data.updated_at) data.updated_at = new Date().toISOString();

    const { data: creator, error } = await supabase
      .from("creators")
      .insert(data)
      .select()
      .single();

    if (error) return null;

    // Invalidate related caches
    invalidateCache("creators_list_");
    invalidateCache(`search_creators_`);

    return creator;
  }

  /**
   * Update creator
   */
  async update(id: string, data: Partial<Creator>): Promise<Creator | null> {
    // Always update the updated_at timestamp
    data.updated_at = new Date().toISOString();

    const { data: updatedCreator, error } = await supabase
      .from("creators")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return null;

    // Invalidate related caches
    if (updatedCreator) {
      invalidateCache(`creator_details_${updatedCreator.username}`);
      invalidateCache(`creator_username_${updatedCreator.username}`);
      invalidateCache("creators_list_");
      invalidateCache(`creator_project_`);
      invalidateCache(`search_creators_`);
    }

    return updatedCreator;
  }

  /**
   * Delete creator
   */
  async delete(id: string): Promise<boolean> {
    // First get creator info for cache invalidation
    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("creators").delete().eq("id", id);

    if (error) return false;

    // Invalidate related caches
    if (creator) {
      invalidateCache(`creator_details_${creator.username}`);
      invalidateCache(`creator_username_${creator.username}`);
      invalidateCache("creators_list_");
      invalidateCache(`creator_project_`);
      invalidateCache(`search_creators_`);
    }

    return true;
  }

  /**
   * Get portfolio for creator
   */
  async getPortfolio(creatorId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get or create portfolio for creator
   */
  async getOrCreatePortfolio(creatorId: string): Promise<Portfolio | null> {
    // First try to get existing portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (!portfolioError && portfolioData) {
      return portfolioData;
    }

    // If not found, create a new portfolio
    const { data: newPortfolio, error: newPortfolioError } = await supabase
      .from("portfolios")
      .insert([
        {
          creator_id: creatorId,
          project_ids: [],
        },
      ])
      .select()
      .single();

    if (newPortfolioError) return null;
    return newPortfolio;
  }

  /**
   * Get creator details for analysis context
   */
  async getCreatorDetails(creatorId: string): Promise<{
    username: string;
    primary_role: any;
    bio: string | null;
  } | null> {
    const { data, error } = await supabase
      .from("creators")
      .select("username, primary_role, bio")
      .eq("id", creatorId)
      .single();

    if (error) {
      logger.error(
        `Error fetching creator details for ${creatorId}: ${error.message}`
      );
      return null;
    }
    return data;
  }
}
