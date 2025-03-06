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
export const fetchCreatorDetails = async (creatorId: string) => {
  const response = await apiRequest.get<Creator>(
    API_ENDPOINTS.admin.creatorDetails(creatorId)
  );
  return response.data;
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
 * Fetch rejected creators with pagination
 */
export const fetchRejectedCreators = async (page = 1, limit = 10) => {
  const response = await apiRequest.get<CreatorsResponse>(
    API_ENDPOINTS.admin.rejectedCreators,
    { params: { page, limit } }
  );
  return response.data;
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
