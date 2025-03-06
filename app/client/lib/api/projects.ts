import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./api";

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch all projects for the current user
 */
export const fetchUserProjects = async (page = 1, limit = 10) => {
  const response = await apiRequest.get<ProjectsResponse>(
    API_ENDPOINTS.projects,
    { params: { page, limit } }
  );
  return response.data;
};

/**
 * Fetch a single project by ID
 */
export const fetchProject = async (projectId: string) => {
  const response = await apiRequest.get<Project>(
    `${API_ENDPOINTS.projects}/${projectId}`
  );
  return response.data;
};

/**
 * Create a new project
 */
export const createProject = async (data: {
  title: string;
  description?: string;
}) => {
  const response = await apiRequest.post<Project>(API_ENDPOINTS.projects, data);
  return response.data;
};

/**
 * Update an existing project
 */
export const updateProject = async (
  projectId: string,
  data: {
    title?: string;
    description?: string;
  }
) => {
  const response = await apiRequest.put<Project>(
    `${API_ENDPOINTS.projects}/${projectId}`,
    data
  );
  return response.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  const response = await apiRequest.delete<{ success: boolean }>(
    `${API_ENDPOINTS.projects}/${projectId}`
  );
  return response.data;
};

/**
 * Add media to a project
 */
export const addProjectMedia = async (
  projectId: string,
  mediaData: FormData
) => {
  const response = await apiRequest.post<ProjectMedia>(
    API_ENDPOINTS.projectMedia(projectId),
    mediaData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Delete media from a project
 */
export const deleteProjectMedia = async (
  projectId: string,
  mediaId: string
) => {
  const response = await apiRequest.delete<{ success: boolean }>(
    `${API_ENDPOINTS.projectMedia(projectId)}/${mediaId}`
  );
  return response.data;
};

/**
 * Fetch all media for a project
 */
export const fetchProjectMedia = async (projectId: string) => {
  const response = await apiRequest.get<ProjectMedia[]>(
    API_ENDPOINTS.projectMedia(projectId)
  );
  return response.data;
};
