import { ApiResponse } from "@/client/types";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { Organization } from "@/client/types/project";

/**
 * Get all organizations
 */
export async function getOrganizations(): Promise<ApiResponse<Organization[]>> {
  try {
    const response = await apiRequest.get<any>(API_ENDPOINTS.organizations);

    if (response.success && response.data) {
      // Check if data is already an array (direct response)
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          error: null,
        };
      }
      
      // Check if data contains a nested data property that's an array
      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          error: null,
        };
      }
      
      // If we get here, we have a successful response but unexpected format
      console.error("Unexpected organization response format:", response.data);
      return {
        success: false,
        data: null,
        error: "Unexpected response format",
      };
    }

    return {
      success: false,
      data: null,
      error: response.error || "Failed to fetch organizations",
    };
  } catch (error) {
    console.error("Error in getOrganizations:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch organizations",
    };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(
  orgId: string
): Promise<ApiResponse<Organization>> {
  const response = await apiRequest.get<{
    success: boolean;
    data: Organization;
  }>(API_ENDPOINTS.getOrganization(orgId));

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.data,
      error: null,
    };
  }

  return {
    success: false,
    data: null,
    error: response.error || "Failed to fetch organization",
  };
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  logo_url?: string;
  website?: string;
}): Promise<ApiResponse<Organization>> {
  const response = await apiRequest.post<{
    success: boolean;
    data: Organization;
  }>(API_ENDPOINTS.organizations, data);

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.data,
      error: null,
    };
  }

  return {
    success: false,
    data: null,
    error: response.error || "Failed to create organization",
  };
}

/**
 * Update an organization
 */
export async function updateOrganization(
  orgId: string,
  data: Partial<Organization>
): Promise<ApiResponse<Organization>> {
  const response = await apiRequest.put<{
    success: boolean;
    data: Organization;
  }>(API_ENDPOINTS.getOrganization(orgId), data);

  if (response.success && response.data) {
    return {
      success: true,
      data: response.data.data,
      error: null,
    };
  }

  return {
    success: false,
    data: null,
    error: response.error || "Failed to update organization",
  };
}

/**
 * Delete an organization
 */
export async function deleteOrganization(
  orgId: string
): Promise<ApiResponse<void>> {
  return apiRequest.delete<void>(API_ENDPOINTS.getOrganization(orgId));
}
