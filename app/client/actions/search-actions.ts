"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

/**
 * Search creators and projects
 */
export async function searchAction(
  query: string,
  filters?: Record<string, any>
) {
  try {
    const response = await serverApiRequest.get(API_ENDPOINTS.search, {
      q: query,
      ...filters,
    });

    return {
      success: true,
      data: response.data,
      message: "Search completed successfully",
    };
  } catch (error: any) {
    console.error("Error in searchAction:", error);
    return {
      success: false,
      error: error.message || "Search failed",
      message: "An error occurred while searching",
    };
  }
}

/**
 * Search creators specifically
 */
export async function searchCreatorsAction(
  query: string,
  filters?: Record<string, any>
) {
  try {
    const response = await serverApiRequest.get(API_ENDPOINTS.searchCreators, {
      q: query,
      ...filters,
    });

    return {
      success: true,
      data: response.data,
      message: "Creator search completed successfully",
    };
  } catch (error: any) {
    console.error("Error in searchCreatorsAction:", error);
    return {
      success: false,
      error: error.message || "Creator search failed",
      message: "An error occurred while searching for creators",
    };
  }
}

/**
 * Save search query to history
 */
export async function saveSearchHistoryAction(query: string) {
  try {
    const response = await serverApiRequest.post(API_ENDPOINTS.searchHistory, {
      query,
    });

    if (response.success) {
      // No need to revalidate paths for this action
      return {
        success: true,
        data: response.data,
        message: "Search history saved successfully",
      };
    } else {
      return {
        success: false,
        error: response.error,
        message: "Failed to save search history",
      };
    }
  } catch (error: any) {
    console.error("Error in saveSearchHistoryAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An error occurred while saving search history",
    };
  }
}

/**
 * Get popular searches
 */
export async function getPopularSearchesAction() {
  try {
    const response = await serverApiRequest.get(API_ENDPOINTS.popularSearches);

    return {
      success: true,
      data: response.data,
      message: "Popular searches retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getPopularSearchesAction:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to retrieve popular searches",
    };
  }
}
