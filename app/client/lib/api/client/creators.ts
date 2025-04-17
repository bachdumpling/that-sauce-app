import { apiRequest } from "./apiClient";
import { ApiResponse, Creator, Project } from "@/client/types";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api/shared/endpoints";

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

/**
 * Get creator by username
 */
export async function getCreatorByUsername(
  username: string
): Promise<ApiResponse<Creator>> {
  return apiRequest.get<Creator>(API_ENDPOINTS.getCreatorByUsername(username));
}

/**
 * Get creator's projects
 */
export async function getCreatorProjects(
  username: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ projects: Project[]; total: number }>> {
  const url = buildApiUrl(
    API_ENDPOINTS.getCreatorByUsername(username) + "/projects",
    { page, limit }
  );

  return apiRequest.get<{ projects: Project[]; total: number }>(url);
}

/**
 * Update creator profile
 */
export async function updateCreatorProfile(
  username: string,
  profileData: Partial<Creator>
): Promise<ApiResponse<Creator>> {
  return apiRequest.put<Creator>(
    API_ENDPOINTS.updateCreatorProfile(username),
    profileData
  );
}

/**
 * Get project by title
 */
export async function getProjectByTitle(
  username: string,
  projectTitle: string
): Promise<ApiResponse<Project>> {
  return apiRequest.get<Project>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );
}
