// src/lib/api/admin.ts
import { apiClient } from "./client";

/**
 * Fetch creators with pagination
 */
export const fetchCreators = async (page = 1, limit = 10, search?: string) => {
  const params: Record<string, any> = { page, limit };
  
  // Add search parameter if provided
  if (search && search.trim() !== '') {
    params.search = search.trim();
  }
  
  const response = await apiClient.get(`/admin/creators`, {
    params
  });
  return response.data;
};

/**
 * Fetch a single creator's details
 */
export const fetchCreatorDetails = async (creatorId: string) => {
  const response = await apiClient.get(`/admin/creators/${creatorId}`);
  return response.data;
};

/**
 * Reject a creator
 */
export const rejectCreator = async (creatorId: string, reason: string) => {
  const response = await apiClient.post(
    `/admin/creators/${creatorId}/reject`,
    {
      reason,
    }
  );
  return response.data;
};

/**
 * Fetch rejected creators with pagination
 */
export const fetchRejectedCreators = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/admin/unqualified/creators`, {
    params: { page, limit },
  });
  return response.data;
};
