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
export async function getUserProjects(page = 1, limit = 10) {
  try {
    const url = buildApiUrl(API_ENDPOINTS.projects, { page, limit });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to fetch projects: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to fetch project: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}/media`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to fetch project media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || { media: [] },
    };
  } catch (error: any) {
    console.error("Error fetching project media:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch project media. Please try again.",
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
    const url = buildApiUrl(API_ENDPOINTS.projects);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to create project: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}`);

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      console.error("No active session found for project update");
      return {
        success: false,
        error: "You must be logged in to update a project",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to update project: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}/media`);
    
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

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to add media to a project",
      };
    }

    // Only set the Authorization header, let the browser set the Content-Type for FormData
    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 413) {
        return {
          success: false,
          error: "File is too large. Maximum size is 50MB",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to add media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.media || {},
    };
  } catch (error: any) {
    console.error("Error adding project media:", error);
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}/media/${mediaId}`, { type });
    
    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to update media metadata",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to update media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data?.media || {},
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
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}/media/${mediaId}`, { type });
    
    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to delete media",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized. Please log in again to perform this action.",
        };
      }

      return {
        success: false,
        error: errorData.error || `Failed to delete media: ${response.statusText}`,
      };
    }

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
    // Add cascade parameter to allow deleting associated content
    const url = buildApiUrl(`${API_ENDPOINTS.projects}/${projectId}`, {
      cascade,
    });
    console.log(
      `Attempting to delete project with ID: ${projectId} (cascade: ${cascade})`
    );
    console.log(`Delete URL: ${url}`);

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      console.error("No active session found, user is not authenticated");
      return {
        success: false,
        error: "You must be logged in to delete a project",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    // Using fetch with auth headers
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    console.log(`Delete project response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error response data:`, errorData);

      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized. Please log in again to perform this action.",
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: "You don't have permission to delete this project.",
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error:
            "Project not found. It may have been already deleted or doesn't exist.",
        };
      }

      if (response.status === 500) {
        // Suggest using cascade option if it's not already set
        const errorMsg = cascade
          ? "Server error: The project couldn't be deleted due to a server issue."
          : "Server error: The project couldn't be deleted because it has associated content. Try setting cascade=true to delete all associated content.";

        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: false,
        error:
          errorData.error || `Failed to delete project: ${response.statusText}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || "Project deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      error: error.message || "Failed to delete project. Please try again.",
    };
  }
}
