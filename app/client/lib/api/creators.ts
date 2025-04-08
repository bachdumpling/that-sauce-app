import { API_ENDPOINTS, buildApiUrl } from "./api";
import { apiRequest } from "./client";
import { Creator } from "@/components/shared/types";

/**
 * Fetch creator details by username
 */
export async function getCreatorByUsername(username: string) {
  const url = API_ENDPOINTS.getCreatorByUsername(username);

  try {
    const response = await apiRequest.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error in getCreatorByUsername:", error);

    // Handle specific error codes
    if (error.status === 404) {
      return {
        success: false,
        error: "Creator not found",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch creator",
    };
  }
}

/**
 * Fetch specific project by creator username and project title
 */
export async function getProjectByTitle(
  username: string,
  projectTitle: string
) {
  try {
    const url = API_ENDPOINTS.getProjectByTitle(username, projectTitle);
    console.log(`Fetching project: ${url}`);

    const response = await apiRequest.get(url);
    return response.data;
  } catch (error: any) {
    console.error(`Error in getProjectByTitle: ${error.message}`, error);

    // Handle specific error codes
    if (error.status === 404) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch project",
    };
  }
}

/**
 * Delete a project image (owner only)
 */
export async function deleteProjectImage(projectId: string, imageId: string) {
  try {
    const url = API_ENDPOINTS.deleteProjectImage(projectId, imageId);

    await apiRequest.delete(url);

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project image:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}

/**
 * Update a creator's own profile
 */
export async function updateCreatorProfile(
  username: string,
  data: Partial<Creator>
) {
  try {
    const url = API_ENDPOINTS.updateCreatorProfile(username);

    const response = await apiRequest.put<{
      success: boolean;
      message?: string;
      data?: any;
      error?: string;
    }>(url, data);

    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data.message || "Profile updated successfully",
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data?.error || "Failed to update profile",
      };
    }
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username: string) {
  try {
    const url = `/creators/username-check?username=${encodeURIComponent(username)}`;

    const response = await apiRequest.get(url);

    return {
      success: true,
      available: response.data.available || false,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    return {
      success: false,
      available: false,
      error: error.message || "Failed to check username availability",
    };
  }
}

// Server-side version that can be used in server components
export async function getCreatorByUsernameServer(username: string) {
  return getCreatorByUsername(username);
}

// Server-side version for project fetching that can be used in server components
export async function getProjectByTitleServer(
  username: string,
  projectTitle: string
) {
  try {
    const result = await getProjectByTitle(username, projectTitle);

    return result;
  } catch (error: any) {
    console.error(
      `Server-side error in getProjectByTitleServer: ${error.message}`,
      error
    );
    return {
      success: false,
      error: error.message || "Failed to fetch project on server",
    };
  }
}
