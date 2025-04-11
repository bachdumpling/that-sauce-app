import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./api";

export interface Creator {
  id: string;
  user_id: string;
  name: string;
  email: string;
  bio?: string;
  profile_image?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  username?: string;
  location?: string;
  primary_role?: string[];
  social_links?: Record<string, string>;
  years_of_experience?: number;
  work_email?: string;
}

export interface CreatorsResponse {
  creators: Creator[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalProjects: number;
  totalImages: number;
  totalVideos: number;
}

export interface SystemStats {
  creators: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  projects: {
    total: number;
  };
  media: {
    total: number;
    images: number;
    videos: number;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  project_id: string;
  project_title: string;
  creator_id: string;
  creator_username: string;
  media_type: "image" | "video";
  alt_text?: string;
  title?: string;
  description?: string;
  order?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MediaResponse {
  media: MediaItem[];
  page: number;
  limit: number;
  total: number;
}

export interface RejectedCreator {
  id: string;
  username: string;
  email: string;
  reason: string;
  rejected_at: string;
  rejected_by: string;
}

/**
 * Get system-wide statistics
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await apiRequest.get<SystemStats>(
      API_ENDPOINTS.admin.stats
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return {
      creators: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
      projects: {
        total: 0,
      },
      media: {
        total: 0,
        images: 0,
        videos: 0,
      },
    };
  }
};

/**
 * Fetch creators with pagination
 */
export const fetchCreators = async (
  page = 1,
  limit = 10,
  search?: string,
  status?: string
) => {
  const params: Record<string, any> = { page, limit };

  // Only add search parameter if it's defined and not empty
  if (search !== undefined && search !== null && search.trim() !== "") {
    params.search = search.trim();
  }

  // Add status filter if provided
  if (status !== undefined && status !== null) {
    params.status = status;
  }

  // Add a timestamp to prevent browser caching
  params._t = Date.now();

  const response = await apiRequest.get<any>(API_ENDPOINTS.admin.creators, {
    params,
  });

  return response.data;
};

/**
 * Fetch a single creator's details
 */
export const fetchCreatorDetails = async (
  username: string,
  bustCache = false
) => {
  try {
    // Add a timestamp parameter to bust the cache if needed
    const params = bustCache ? { _t: Date.now() } : {};

    const response = await apiRequest.get<{
      success: boolean;
      data: Creator;
      error?: string;
    }>(API_ENDPOINTS.admin.creatorDetails(username), { params });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to fetch creator details",
      };
    }
  } catch (error: any) {
    console.error("Error in fetchCreatorDetails:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch creator details",
    };
  }
};

/**
 * Update a creator's profile
 */
export const updateCreator = async (
  username: string,
  data: Partial<Creator>
) => {
  try {
    const response = await apiRequest.put<{
      success: boolean;
      message?: string;
      creator?: Creator;
      error?: string;
    }>(API_ENDPOINTS.admin.updateCreator(username), data);

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Creator updated successfully",
        creator: response.data.creator,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to update creator",
      };
    }
  } catch (error: any) {
    console.error("Error in updateCreator:", error);
    return {
      success: false,
      error: error.message || "Failed to update creator",
    };
  }
};

/**
 * Delete a creator
 */
export const deleteCreator = async (username: string) => {
  try {
    const response = await apiRequest.delete<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.deleteCreator(username));

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Creator deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to delete creator",
      };
    }
  } catch (error: any) {
    console.error("Error in deleteCreator:", error);
    return {
      success: false,
      error: error.message || "Failed to delete creator",
    };
  }
};

/**
 * Update a creator's status
 */
export const updateCreatorStatus = async (
  username: string,
  status: "approved" | "rejected",
  reason?: string
) => {
  try {
    const data: { status: string; reason?: string } = { status };

    if (status === "rejected" && reason) {
      data.reason = reason;
    }

    const response = await apiRequest.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.updateCreatorStatus(username), data);

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || `Creator status updated to ${status}`,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to update creator status",
      };
    }
  } catch (error: any) {
    console.error("Error in updateCreatorStatus:", error);
    return {
      success: false,
      error: error.message || "Failed to update creator status",
    };
  }
};

/**
 * Reject a creator
 */
export const rejectCreator = async (username: string, reason: string) => {
  try {
    const response = await apiRequest.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.rejectCreator(username), { reason });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Creator rejected successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to reject creator",
      };
    }
  } catch (error: any) {
    console.error("Error in rejectCreator:", error);
    return {
      success: false,
      error: error.message || "Failed to reject creator",
    };
  }
};

/**
 * Approve a creator
 */
export const approveCreator = async (username: string) => {
  try {
    const response = await apiRequest.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.approveCreator(username));

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Creator approved successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to approve creator",
      };
    }
  } catch (error: any) {
    console.error("Error in approveCreator:", error);
    return {
      success: false,
      error: error.message || "Failed to approve creator",
    };
  }
};

/**
 * Fetch projects with pagination
 */
export const fetchProjects = async (
  page = 1,
  limit = 10,
  creator_id?: string,
  status?: string
) => {
  try {
    const params: Record<string, any> = { page, limit };

    if (creator_id) {
      params.creator_id = creator_id;
    }

    if (status) {
      params.status = status;
    }

    // Add a timestamp to prevent browser caching
    params._t = Date.now();

    const response = await apiRequest.get<any>(API_ENDPOINTS.admin.projects, {
      params,
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data || { projects: [], total: 0, page, limit },
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to fetch projects",
      };
    }
  } catch (error: any) {
    console.error("Error in fetchProjects:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch projects",
    };
  }
};

/**
 * Fetch a single project's details
 */
export const fetchProjectDetails = async (projectId: string) => {
  try {
    const response = await apiRequest.get<{
      success: boolean;
      data: any;
      error?: string;
    }>(API_ENDPOINTS.admin.projectDetails(projectId));

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to fetch project details",
      };
    }
  } catch (error: any) {
    console.error("Error in fetchProjectDetails:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch project details",
    };
  }
};

/**
 * Update a project
 */
export const updateProject = async (
  projectId: string,
  projectData: {
    title?: string;
    description?: string;
    status?: string;
  }
) => {
  try {
    const response = await apiRequest.put<{
      success: boolean;
      data?: any;
      error?: string;
    }>(API_ENDPOINTS.admin.updateProject(projectId), projectData);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to update project",
      };
    }
  } catch (error: any) {
    console.error("Error in updateProject:", error);
    return {
      success: false,
      error: error.message || "Failed to update project",
    };
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  try {
    const response = await apiRequest.delete<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.deleteProject(projectId));

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Project deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to delete project",
      };
    }
  } catch (error: any) {
    console.error("Error in deleteProject:", error);
    return {
      success: false,
      error: error.message || "Failed to delete project",
    };
  }
};

/**
 * Fetch media with pagination
 */
export const fetchMedia = async (
  page = 1,
  limit = 20,
  project_id?: string,
  type?: "image" | "video"
) => {
  try {
    const params: Record<string, any> = { page, limit };

    if (project_id) {
      params.project_id = project_id;
    }

    if (type) {
      params.type = type;
    }

    // Add a timestamp to prevent browser caching
    params._t = Date.now();

    const response = await apiRequest.get<{
      success: boolean;
      data?: MediaResponse;
      error?: string;
    }>(API_ENDPOINTS.admin.media, { params });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data || { media: [], total: 0, page, limit },
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to fetch media",
      };
    }
  } catch (error: any) {
    console.error("Error in fetchMedia:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch media",
    };
  }
};

/**
 * Delete a media item
 */
export const deleteMediaItem = async (mediaId: string) => {
  try {
    const response = await apiRequest.delete<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.deleteMedia(mediaId));

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Media deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to delete media",
      };
    }
  } catch (error: any) {
    console.error("Error in deleteMediaItem:", error);
    return {
      success: false,
      error: error.message || "Failed to delete media",
    };
  }
};

/**
 * Delete a project image
 */
export const deleteProjectImage = async (
  projectId: string,
  imageId: string
) => {
  try {
    const response = await apiRequest.delete<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.deleteProjectImage(projectId, imageId));

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Image deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to delete image",
      };
    }
  } catch (error: any) {
    console.error("Error in deleteProjectImage:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
};

/**
 * Fetch rejected creators from the unqualified_creators table
 */
export const fetchRejectedCreators = async (page = 1, limit = 10) => {
  try {
    const response = await apiRequest.get(
      API_ENDPOINTS.admin.rejectedCreators,
      { params: { page, limit } }
    );

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Failed to fetch unqualified creators",
      };
    }
  } catch (error) {
    console.error("Error in fetchRejectedCreators:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch unqualified creators",
    };
  }
};

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async () => {
  const response = await apiRequest.get<{
    totalCreators: number;
    pendingCreators: number;
    approvedCreators: number;
    rejectedCreators: number;
    totalProjects: number;
  }>("/admin/stats");
  return response.data;
};

/**
 * Fetch creator statistics
 */
export const fetchCreatorStats = async (): Promise<CreatorStats> => {
  try {
    const response = await apiRequest.get<CreatorStats>(
      API_ENDPOINTS.admin.creatorStats
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching creator stats:", error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalProjects: 0,
      totalImages: 0,
      totalVideos: 0,
    };
  }
};
