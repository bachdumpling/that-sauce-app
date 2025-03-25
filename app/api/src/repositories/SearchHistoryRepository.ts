import { supabase } from "../lib/supabase";
import logger from "../config/logger";

export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  query: string;
  content_type: string;
  created_at: string;
  results_count: number;
  embedding?: number[];
}

export class SearchHistoryRepository {
  /**
   * Save a search query to history
   */
  async saveSearch(
    userId: string,
    query: string,
    contentType: string,
    resultsCount: number,
    embedding?: number[]
  ): Promise<SearchHistoryEntry | null> {
    const { data, error } = await supabase
      .from("search_history")
      .insert([
        {
          user_id: userId,
          query,
          content_type: contentType,
          results_count: resultsCount,
          embedding,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error("Error saving search history:", { error });
      return null;
    }

    return data;
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(
    userId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<{ entries: SearchHistoryEntry[]; total: number }> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("search_history")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching search history:", { error });
      return { entries: [], total: 0 };
    }

    return { entries: data || [], total: count || 0 };
  }

  /**
   * Delete a specific search history entry
   */
  async deleteSearchEntry(userId: string, entryId: string): Promise<boolean> {
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId); // Ensure user owns this entry

    if (error) {
      logger.error("Error deleting search history entry:", { error });
      return false;
    }

    return true;
  }

  /**
   * Clear all search history for a user
   */
  async clearSearchHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      logger.error("Error clearing search history:", { error });
      return false;
    }

    return true;
  }

  /**
   * Get popular searches (for recommendations) using vector similarity
   */
  async getPopularSearches(
    limit: number = 5
  ): Promise<{ query: string; similarity: number; count: number }[]> {
    // Use the updated RPC function that uses vector similarity
    const { data, error } = await supabase.rpc("get_popular_searches", {
      results_limit: limit,
    });

    if (error) {
      logger.error("Error fetching popular searches:", { error });
      return [];
    }

    return data || [];
  }
}
