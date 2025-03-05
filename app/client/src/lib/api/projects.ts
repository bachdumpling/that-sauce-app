import { apiClient } from "./client";

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all projects for the current user
 */
export const fetchUserProjects = async () => {
  const response = await apiClient.get("/projects");
  return response.data;
};

/**
 * Fetch a single project by ID
 */
export const fetchProject = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
};

/**
 * Create a new project
 */
export const createProject = async (data: {
  title: string;
  description?: string;
}) => {
  const response = await apiClient.post("/projects", data);
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
  const response = await apiClient.put(`/projects/${projectId}`, data);
  return response.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

/**
 * Add media to a project
 */
export const addProjectMedia = async (
  projectId: string,
  mediaData: FormData
) => {
  const response = await apiClient.post(
    `/projects/${projectId}/media`,
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
  const response = await apiClient.delete(
    `/projects/${projectId}/media/${mediaId}`
  );
  return response.data;
};
