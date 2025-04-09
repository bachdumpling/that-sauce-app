import { apiRequest } from "./apiClient";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api/shared/endpoints";
import { ApiResponse, Creator, Project } from "@/lib/api/shared/types";

/**
 * Get creator by username from the client-side
 */
export async function getCreatorByUsernameClient(
  username: string
): Promise<ApiResponse<Creator>> {
  return apiRequest.get<Creator>(API_ENDPOINTS.getCreatorByUsername(username));
}

/**
 * Get creator's projects from the client-side
 */
export async function getCreatorProjectsClient(
  username: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ projects: Project[]; total: number }>> {
  const url = buildApiUrl(
    API_ENDPOINTS.getCreatorByUsername(username) + "/projects",
    {
      page,
      limit,
    }
  );

  return apiRequest.get<{ projects: Project[]; total: number }>(url);
}

/**
 * Update creator profile from the client-side
 */
export async function updateCreatorProfileClient(
  username: string,
  profileData: Partial<Creator>
): Promise<ApiResponse<Creator>> {
  return apiRequest.put<Creator>(
    API_ENDPOINTS.updateCreatorProfile(username),
    profileData
  );
}

/**
 * Get project by title from a specific creator
 */
export async function getProjectByTitleClient(
  username: string,
  projectTitle: string
): Promise<ApiResponse<Project>> {
  return apiRequest.get<Project>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );
}
