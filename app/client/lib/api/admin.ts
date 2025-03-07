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
}

export interface CreatorsResponse {
  creators: Creator[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch creators with pagination
 */
export const fetchCreators = async (page = 1, limit = 10, search?: string) => {
  const params: Record<string, any> = { page, limit };

  // Add search parameter if provided
  if (search && search.trim() !== "") {
    params.search = search.trim();
  }

  const response = await apiRequest.get<CreatorsResponse>(
    API_ENDPOINTS.admin.creators,
    { params }
  );
  return response.data;
};

/**
 * Fetch a single creator's details
 */
export const fetchCreatorDetails = async (creatorId: string, bustCache = false) => {
  try {
    // Add a timestamp parameter to bust the cache if needed
    const params = bustCache ? { _t: Date.now() } : {};
    
    const response = await apiRequest.get<{
      success: boolean;
      data: Creator;
      error?: string;
    }>(API_ENDPOINTS.admin.creatorDetails(creatorId), { params });

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
  creatorId: string,
  data: Partial<Creator>
) => {
  try {
    const response = await apiRequest.put<{
      success: boolean;
      message?: string;
      creator?: Creator;
      error?: string;
    }>(API_ENDPOINTS.admin.creatorDetails(creatorId), data);

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
export const rejectCreator = async (creatorId: string, reason: string) => {
  const response = await apiRequest.post<{ success: boolean }>(
    API_ENDPOINTS.admin.rejectCreator(creatorId),
    { reason }
  );
  return response.data;
};

/**
 * Approve a creator
 */
export const approveCreator = async (creatorId: string) => {
  const response = await apiRequest.post<{ success: boolean }>(
    `${API_ENDPOINTS.admin.creators}/${creatorId}/approve`
  );
  return response.data;
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
