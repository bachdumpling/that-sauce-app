import { supabase } from "../lib/supabase";
import { Creator, CreatorWithProfile } from "../models/Creator";
import { Portfolio } from "../models/Portfolio";

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
   * Create a new creator
   */
  async create(data: Partial<Creator>): Promise<Creator | null> {
    const { data: creator, error } = await supabase
      .from("creators")
      .insert([data])
      .select()
      .single();

    if (error) return null;
    return creator;
  }

  /**
   * Update a creator
   */
  async update(id: string, data: Partial<Creator>): Promise<Creator | null> {
    const { data: creator, error } = await supabase
      .from("creators")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return null;
    return creator;
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
}
