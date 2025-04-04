import { API_ENDPOINTS, buildApiUrl } from "./api";
import { Project } from "@/components/shared/types";
import { apiRequest } from "./client";
import { createClient } from "@/utils/supabase/client";

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
export async function getUserProjects(userId: string, page = 1, limit = 10) {
  try {
    const url = `${API_ENDPOINTS.projects}?userId=${userId}&page=${page}&limit=${limit}`;

    // Use a regular fetch instead of authenticated apiRequest for public routes
    const response = await fetch(buildApiUrl(url));
    const data = await response.json();

    return {
      success: true,
      data: data.projects || [],
    };
  } catch (error: any) {
    console.error("Error fetching user projects:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch projects. Please try again.",
    };
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProject(projectId: string) {
  try {
    const url = API_ENDPOINTS.getProject(projectId);

    // Use a regular fetch instead of authenticated apiRequest for public routes
    const response = await fetch(buildApiUrl(url));
    const data = await response.json();

    return {
      success: true,
      data: data.project,
    };
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch project. Please try again.",
    };
  }
}

/**
 * Fetch all media for a project
 */
export async function getProjectMedia(projectId: string) {
  try {
    const url = API_ENDPOINTS.getProjectMedia(projectId);

    // Use a regular fetch instead of authenticated apiRequest for public routes
    const response = await fetch(buildApiUrl(url));
    const data = await response.json();

    return {
      success: true,
      data: data.data || { media: [] },
    };
  } catch (error: any) {
    console.error("Error fetching project media:", error);
    return {
      success: false,
      error:
        error.message || "Failed to fetch project media. Please try again.",
    };
  }
}

/**
 * Create a new project
 */
export async function createProject(projectData: {
  title: string;
  description?: string;
}) {
  try {
    const url = API_ENDPOINTS.projects;

    const response = await apiRequest.post(url, projectData);

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return {
      success: false,
      error: error.message || "Failed to create project. Please try again.",
    };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  projectData: {
    title?: string;
    description?: string;
    featured?: boolean;
    year?: number;
  }
) {
  try {
    const url = `${API_ENDPOINTS.projects}/${projectId}`;

    const response = await apiRequest.put(url, projectData);

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return {
      success: false,
      error: error.message || "Failed to update project. Please try again.",
    };
  }
}

/**
 * Add media to a project
 */
export async function addProjectMedia(
  projectId: string,
  file: File,
  metadata?: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
) {
  try {
    const url = `${API_ENDPOINTS.projects}/${projectId}/media`;

    const formData = new FormData();
    formData.append("file", file);

    if (metadata?.alt_text) {
      formData.append("alt_text", metadata.alt_text);
    }

    if (metadata?.title) {
      formData.append("title", metadata.title);
    }

    if (metadata?.description) {
      formData.append("description", metadata.description);
    }

    if (metadata?.order !== undefined) {
      formData.append("order", metadata.order.toString());
    }

    // We need to use the apiRequest.post but with specific headers for FormData
    const response = await apiRequest.post(url, formData, {
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
        "Content-Type": undefined
      }
    });

    return {
      success: true,
      data: response.data.media || {},
    };
  } catch (error: any) {
    console.error("Error adding project media:", error);
    
    if (error.status === 413) {
      return {
        success: false,
        error: "File is too large. Maximum size is 50MB",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to add media. Please try again.",
    };
  }
}

/**
 * Update project media metadata
 */
export async function updateProjectMedia(
  projectId: string,
  mediaId: string,
  type: "image" | "video",
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
) {
  try {
    const url = `${API_ENDPOINTS.projects}/${projectId}/media/${mediaId}?type=${type}`;

    const response = await apiRequest.put(url, metadata);

    return {
      success: true,
      data: response.data.data?.media || {},
    };
  } catch (error: any) {
    console.error("Error updating project media:", error);
    return {
      success: false,
      error: error.message || "Failed to update media. Please try again.",
    };
  }
}

/**
 * Delete project media
 */
export async function deleteProjectMedia(
  projectId: string,
  mediaId: string,
  type: "image" | "video"
) {
  try {
    const url = `${API_ENDPOINTS.projects}/${projectId}/media/${mediaId}?type=${type}`;

    await apiRequest.delete(url);

    return {
      success: true,
      message: "Media deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project media:", error);
    return {
      success: false,
      error: error.message || "Failed to delete media",
    };
  }
}

/**
 * Delete a project
 * @param projectId - The ID of the project to delete
 * @param cascade - Whether to also delete associated media (images, videos)
 */
export async function deleteProject(
  projectId: string,
  cascade: boolean = true
) {
  try {
    const url = `${API_ENDPOINTS.projects}/${projectId}?cascade=${cascade}`;
    console.log(
      `Attempting to delete project with ID: ${projectId} (cascade: ${cascade})`
    );
    console.log(`Delete URL: ${url}`);

    await apiRequest.delete(url);

    return {
      success: true,
      message: "Project deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project:", error);

    // Check for specific error status
    if (error.status === 401) {
      return {
        success: false,
        error: "You must be logged in to delete a project",
      };
    }

    if (error.status === 403) {
      return {
        success: false,
        error: "You don't have permission to delete this project",
      };
    }

    if (error.status === 409) {
      return {
        success: false,
        error:
          "Cannot delete project with associated content. Try using cascade=true",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to delete project. Please try again.",
    };
  }
}
