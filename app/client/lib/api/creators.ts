import { API_ENDPOINTS, buildApiUrl } from "./api";
import { apiRequest } from "./client";
import { Creator } from "@/components/shared/types";

/**
 * Fetch creator details by username
 */
export async function getCreatorByUsername(username: string) {
  const url = buildApiUrl(API_ENDPOINTS.getCreatorByUsername(username));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 404) {
        console.log("Creator not found:", username);
        return {
          success: false,
          error: "Creator not found",
        };
      } else if (response.status === 500) {
        console.error("Server error when fetching creator:", username);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
        return {
          success: false,
          error: errorData.error || "An unexpected server error occurred",
        };
      }

      // For other error types
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`Failed to fetch creator (${response.status}):`, errorText);
      throw new Error(`Failed to fetch creator: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in getCreatorByUsername:", error);
    throw error;
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
    const url = buildApiUrl(
      API_ENDPOINTS.getProjectByTitle(username, projectTitle)
    );

    console.log(`Fetching project: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Project not found: ${username}/${projectTitle}`);
        return {
          success: false,
          error: "Project not found",
        };
      }
      const errorText = await response.text();
      console.error(
        `Failed to fetch project: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch project: ${response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Error in getProjectByTitle: ${error.message}`, error);
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
    const url = buildApiUrl(
      API_ENDPOINTS.deleteProjectImage(projectId, imageId)
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error:
          errorData.error || `Failed to delete image: ${response.statusText}`,
      };
    }

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
    const url = buildApiUrl(
      `/creators/username-check?username=${encodeURIComponent(username)}`
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      success: response.ok,
      available: data.available || false,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    return {
      success: false,
      available: false,
      message: error.message || "Failed to check username availability",
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
