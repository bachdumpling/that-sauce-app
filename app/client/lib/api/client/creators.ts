import { clientApiRequest } from "./apiClient";
import { ApiResponse, Creator, Project } from "@/client/types";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api/shared/endpoints";

/**
 * Get creator by username
 */
export async function getCreatorByUsername(
  username: string
): Promise<ApiResponse<Creator>> {
  return clientApiRequest.get<Creator>(
    API_ENDPOINTS.getCreatorByUsername(username)
  );
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

  return clientApiRequest.get<{ projects: Project[]; total: number }>(url);
}

/**
 * Update creator profile
 */
export async function updateCreatorProfile(
  username: string,
  profileData: Partial<Creator>
): Promise<ApiResponse<Creator>> {
  return clientApiRequest.put<Creator>(
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
  return clientApiRequest.get<Project>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );
}
