"use server";

import { Creator, Project } from "@/client/types";
import { revalidatePath } from "next/cache";
import {
  getCreatorByUsernameServer,
  getCreatorProjectsServer,
  updateCreatorProfileServer,
  uploadCreatorAvatarServer,
  uploadCreatorBannerServer,
} from "@/lib/api/server/creators";
import { notFound } from "next/navigation";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

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

    return { success: true, data: response.data };
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
