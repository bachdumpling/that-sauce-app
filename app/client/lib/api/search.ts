import { API_ENDPOINTS, buildApiUrl } from "./api";
import { apiRequest } from "./client";

/**
 * Interface for search parameters matching the unified search API
 */
interface SearchParams {
  q: string; // Required search query
  page?: number; // Page number for pagination
  limit?: number; // Maximum number of results
  contentType?: "all" | "videos" | "images"; // Filter by content type
  role?: string; // Filter by creator role
  subjects?: string[]; // Subject categories/focus areas
  styles?: string[]; // Style preferences
  maxBudget?: number; // Maximum budget per hour
  hasDocuments?: boolean; // Whether uploaded docs were provided
  documentCount?: number; // Number of documents uploaded
}

/**
 * Interface for search prompt enhancement parameters
 */
interface EnhanceSearchPromptParams {
  query: string;
}

/**
 * Interface for search history parameters
 */
interface SearchHistoryParams {
  page?: number;
  limit?: number;
}

/**
 * Interface for search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  query: string;
  content_type: string;
  created_at: string;
  results_count: number;
}

/**
 * Interface for search history response
 */
export interface SearchHistoryResponse {
  history: SearchHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Interface for popular search
 */
export interface PopularSearch {
  query: string;
  count: number;
  similarity?: number;
}

/**
 * Unified search function that uses the main search API endpoint
 * @see API documentation in /app/api/docs/search-api.md
 */
export async function search(params: SearchParams) {
  try {
    const queryParams = {
      q: params.q,
      page: params.page || 1,
      limit: params.limit || 10,
      content_type: params.contentType || "all",
      role: params.role,
      subjects: params.subjects ? params.subjects.join(",") : undefined,
      styles: params.styles ? params.styles.join(",") : undefined,
      min_budget: params.minBudget,
      max_budget: params.maxBudget,
      has_documents: params.hasDocuments ? "true" : undefined,
      document_count: params.documentCount,
    };

    const response = await apiRequest.get(API_ENDPOINTS.search, {
      params: queryParams,
    });

    console.log("Search API response:", response);

    // Check if the data is nested within a data property
    if (response.data && response.data.data) {
      return response.data;
    }

    // Wrap the response in a success object if it's not already wrapped
    if (response.data && !response.data.hasOwnProperty("success")) {
      return {
        success: true,
        data: response.data,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw new Error(`Search failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Legacy search function for creators - uses unified search function
 * @deprecated Use search() instead
 */
export async function searchCreators(params: SearchParams) {
  // Forward to unified search for backward compatibility
  return search(params);
}

/**
 * Server-side version of the search function
 */
export async function searchServer(params: SearchParams) {
  try {
    return await search(params);
  } catch (error) {
    console.error("Server-side search error:", error);
    // Return a default response structure on error
    return {
      success: false,
      data: {
        results: [],
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        query: params.q,
        content_type: params.contentType || "all",
      },
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Server-side version that can be used in server components (legacy)
 * @deprecated Use searchServer() instead
 */
export async function searchCreatorsServer(params: SearchParams) {
  return searchServer(params);
}

/**
 * Enhances a search query by generating helpful refinement options
 * Uses the Gemini AI to suggest ways to improve the search
 */
export async function enhanceSearchPrompt(params: EnhanceSearchPromptParams) {
  try {
    const response = await apiRequest.get(API_ENDPOINTS.enhanceSearchPrompt, {
      params: { query: params.query },
    });

    return response.data;
  } catch (error) {
    console.error("Search prompt enhancement error:", error);
    throw new Error(
      `Search prompt enhancement failed: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Gets the user's search history
 * @param params Optional parameters for pagination
 * @returns Search history with pagination details
 */
export async function getSearchHistory(
  params: SearchHistoryParams = {}
): Promise<SearchHistoryResponse> {
  try {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
    };

    const response = await apiRequest.get(API_ENDPOINTS.searchHistory, {
      params: queryParams,
    });

    // The API returns data in { data: { history: [...], pagination: {...} } } format
    // Check the response structure to ensure compatibility
    if (response && response.data) {
      // If response has a data.data structure (nested data)
      if (response.data.data && response.data.data.history) {
        return response.data.data;
      }

      // If response has a direct data.history structure
      if (response.data.history) {
        return response.data;
      }
    }

    // Fallback to empty response
    console.error("Unexpected search history response format:", response);
    return {
      history: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        pages: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching search history:", error);
    throw new Error(
      `Failed to fetch search history: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Deletes a specific search history entry
 * @param id The ID of the search history entry to delete
 * @returns Success message
 */
export async function deleteSearchHistoryEntry(
  id: string
): Promise<{ message: string }> {
  try {
    const response = await apiRequest.delete(
      API_ENDPOINTS.searchHistoryEntry(id)
    );

    // Check for different response formats
    if (response.data.data && response.data.data.message) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error deleting search history entry:", error);
    throw new Error(
      `Failed to delete search history entry: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Clears all search history for the current user
 * @returns Success message
 */
export async function clearSearchHistory(): Promise<{ message: string }> {
  try {
    const response = await apiRequest.delete(API_ENDPOINTS.searchHistory);

    // Check for different response formats
    if (response.data.data && response.data.data.message) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error clearing search history:", error);
    throw new Error(
      `Failed to clear search history: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Gets popular searches for recommendations
 * @param limit Number of popular searches to retrieve
 * @returns List of popular searches with counts
 */
export async function getPopularSearches(
  limit: number = 5
): Promise<{ searches: PopularSearch[] }> {
  try {
    const response = await apiRequest.get(API_ENDPOINTS.popularSearches, {
      params: { limit },
    });

    // Check for different response formats
    if (response.data.data && response.data.data.searches) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    throw new Error(
      `Failed to fetch popular searches: ${error.message || "Unknown error"}`
    );
  }
}
