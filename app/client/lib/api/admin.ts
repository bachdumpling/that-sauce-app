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
    }>(API_ENDPOINTS.admin.creatorDetails(username), data);

    console.log("API response:", response);

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
 * Reject a creator
 */
export const rejectCreator = async (username: string, reason: string) => {
  const response = await apiRequest.post<{ success: boolean }>(
    API_ENDPOINTS.admin.rejectCreator(username),
    { reason }
  );
  return response.data;
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
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  try {
    const response = await apiRequest.delete<{
      success: boolean;
      message?: string;
      error?: string;
    }>(API_ENDPOINTS.admin.projectDetails(projectId));

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
