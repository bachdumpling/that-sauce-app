import { Project, ApiResponse } from "@/client/types";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

/**
 * Get all projects for the authenticated user
 */
export async function getProjects(): Promise<ApiResponse<Project[]>> {
  return apiRequest.get<Project[]>(API_ENDPOINTS.projects);
}

/**
 * Get project by ID from the client-side
 */
export async function getProjectById(
  projectId: string
): Promise<ApiResponse<Project>> {
  return apiRequest.get<Project>(API_ENDPOINTS.getProject(projectId));
}

/**
 * Create a new project
 */
export async function createProject(projectData: {
  title: string;
  description?: string;
  short_description?: string;
  roles?: string[];
  client_ids?: string[];
  year?: number;
}): Promise<ApiResponse<Project>> {
  if (!projectData.title || !projectData.title.trim()) {
    console.error("Project title is required");
    return {
      success: false,
      data: null,
      error: "Project title is required",
    };
  }

  const response = await apiRequest.post<{ project: Project }>(
    API_ENDPOINTS.projects,
    projectData
  );

  // Handle the nested project structure in the response
  if (response.success && response.data && response.data.project) {
    // Return with unwrapped project data
    return {
      success: true,
      data: response.data.project,
      error: null,
    };
  } else {
    console.error("Project creation failed:", response.error);
    return {
      success: false,
      data: null,
      error: response.error || "Failed to create project",
    };
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  projectData: Partial<Project>
): Promise<ApiResponse<Project>> {
  return apiRequest.put<Project>(
    API_ENDPOINTS.getProject(projectId),
    projectData
  );
}

/**
 * Delete project
 */
export async function deleteProject(
  projectId: string,
  cascade = false
): Promise<ApiResponse<void>> {
  return apiRequest.delete<void>(API_ENDPOINTS.getProject(projectId), {
    params: { cascade },
  });
}

/**
 * Get project's media
 */
export async function getProjectMedia(
  projectId: string,
  page = 1,
  limit = 10
): Promise<
  ApiResponse<{
    images: any[];
    videos: any[];
    total: number;
  }>
> {
  return apiRequest.get<{
    images: any[];
    videos: any[];
    total: number;
  }>(API_ENDPOINTS.getProjectMedia(projectId), {
    params: { page, limit },
  });
}
