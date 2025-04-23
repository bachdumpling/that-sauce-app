"use server";

import { Creator, Project } from "@/client/types";
import { revalidatePath } from "next/cache";
import {
  getCreatorByUsernameServer,
  getCreatorProjectsServer,
  updateCreatorProfileServer,
  uploadCreatorAvatarServer,
  uploadCreatorBannerServer,
  getCreatorPortfolioServer,
} from "@/lib/api/server/creators";
import { notFound } from "next/navigation";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { createClient } from "@/utils/supabase/server";

/**
 * Get a creator by username
 */
export async function getCreatorAction(username: string) {
  try {
    const response = await getCreatorByUsernameServer(username);

    if (!response.success || !response.data) {
      console.error("Failed to fetch creator:", response.error);
      return { success: false, error: response.error || "Creator not found" };
    }

    return response;
  } catch (error: any) {
    console.error("Error in getCreatorAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Get projects for a creator
 */
export async function getCreatorProjectsAction(
  username: string,
  page = 1,
  limit = 10
) {
  try {
    const response = await getCreatorProjectsServer(username, page, limit);

    if (!response.success) {
      console.error("Failed to fetch creator projects:", response.error);
      return { success: false, error: response.error || "Projects not found" };
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error in getCreatorProjectsAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Update a creator's profile and revalidate the path
 */
export async function updateCreatorProfileAction(
  username: string,
  profileData: Partial<Creator>
) {
  try {
    const response = await updateCreatorProfileServer(username, profileData);

    if (response.success) {
      // Revalidate all possible paths related to this creator
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");
      revalidatePath(`/${username}/about`, "page");

      // If username was changed, also revalidate the new path
      if (profileData.username && profileData.username !== username) {
        revalidatePath(`/${profileData.username}`, "layout");
      }

      return {
        success: true,
        message: "Profile updated successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to update profile",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in updateCreatorProfileAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Upload a creator's avatar image
 */
export async function uploadCreatorAvatarAction(username: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await uploadCreatorAvatarServer(username, formData);

    if (response.success) {
      // Revalidate paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");
      revalidatePath(`/${username}/about`, "page");

      return {
        success: true,
        message: "Avatar uploaded successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to upload avatar",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in uploadCreatorAvatarAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Upload a creator's banner image
 */
export async function uploadCreatorBannerAction(username: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await uploadCreatorBannerServer(username, formData);

    if (response.success) {
      // Revalidate paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");
      revalidatePath(`/${username}/about`, "page");

      return {
        success: true,
        message: "Banner uploaded successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to upload banner",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in uploadCreatorBannerAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Check if a creator exists - Use in middleware or layout
 * This throws notFound() if the creator doesn't exist
 */
export async function checkCreatorExistsAction(
  username: string
): Promise<Creator> {
  try {
    const response = await getCreatorByUsernameServer(username);

    if (!response.success || !response.data) {
      console.error("Creator not found:", response.error);
      notFound();
    }

    return response.data;
  } catch (error) {
    console.error("Error checking if creator exists:", error);
    notFound();
  }
}

// Server-side in-memory cache
interface ServerCache {
  [key: string]: {
    timestamp: number;
    data: any[];
    limit: number;
  };
}

// Global cache object that persists between requests
const SERVER_CACHE: ServerCache = {};

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Fetches random creators with their latest work
 * Uses server-side in-memory cache to prevent frequent API calls
 */
export async function getRandomCreatorsWithLatestWork(limit: number = 8) {
  // Create a specific cache key for this limit value
  const cacheKey = `random_creators_${limit}`;

  // Check if we have valid cached data
  if (SERVER_CACHE[cacheKey]) {
    const cachedData = SERVER_CACHE[cacheKey];
    const currentTime = Date.now();
    const cacheAge = currentTime - cachedData.timestamp;
    const cacheAgeHours = Math.round((cacheAge / (60 * 60 * 1000)) * 10) / 10;

    // If cache is still valid (less than 12 hours old)
    if (cacheAge < CACHE_DURATION) {
      return cachedData.data;
    }
  } else {
  }

  // If no valid cache exists, fetch from API
  try {
    // Create an anonymous Supabase client that doesn't require authentication
    const supabase = await createClient();

    // Fetch approved creators using public data access
    const { data: creators, error: creatorsError } = await supabase
      .from("creators")
      .select(
        `
        id, 
        username,
        primary_role, 
        location, 
        avatar_url
        `
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit + 10);

    if (creatorsError) {
      console.error("[CreatorsCache] Error fetching creators:", creatorsError);
      return [];
    }

    if (!creators || creators.length === 0) {
      return [];
    }

    // Shuffle and limit creators
    const shuffledCreators = creators
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    // Fetch latest project for each creator
    const creatorsWithProjects = await Promise.all(
      shuffledCreators.map(async (creator) => {
        try {
          const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select(
              `
              id, 
              title,
              created_at,
              images:images(id, url)
            `
            )
            .eq("creator_id", creator.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (projectsError) {
            console.error(
              `[CreatorsCache] Error fetching projects for ${creator.username}:`,
              projectsError
            );
            return { creator, project: null };
          }

          return {
            creator,
            project: projects && projects.length > 0 ? projects[0] : null,
            // Mark some entries as "new" (those created in the last 7 days)
            isNew:
              projects &&
              projects.length > 0 &&
              new Date(projects[0].created_at).getTime() >
                Date.now() - 7 * 24 * 60 * 60 * 1000,
          };
        } catch (error) {
          console.error(
            `[CreatorsCache] Error fetching project for ${creator.username}:`,
            error
          );
          return { creator, project: null };
        }
      })
    );

    // Filter out entries where the project is null
    const result = creatorsWithProjects.filter((item) => item.project !== null);

    // Store in server-side cache
    SERVER_CACHE[cacheKey] = {
      timestamp: Date.now(),
      data: result,
      limit,
    };

    return result;
  } catch (error) {
    console.error(
      "[CreatorsCache] Error fetching creators with projects:",
      error
    );
    return [];
  }
}

/**
 * Get a creator's portfolio
 */
export async function getCreatorPortfolio(username: string) {
  const portfolio = await getCreatorPortfolioServer(username);

  return portfolio;
}
