"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { notFound } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Get all organizations
 */
export async function getOrganizationsAction() {
  try {
    const response = await serverApiRequest.get(API_ENDPOINTS.organizations);

    return {
      success: true,
      data: response.data,
      message: "Organizations retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getOrganizationsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to retrieve organizations",
    };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationAction(orgId: string) {
  try {
    const response = await serverApiRequest.get(
      API_ENDPOINTS.getOrganization(orgId)
    );

    if (!response.success || !response.data) {
      console.error("Failed to fetch organization:", response.error);
      return {
        success: false,
        error: response.error || "Organization not found",
      };
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error in getOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to retrieve organization",
    };
  }
}

/**
 * Create an organization
 */
export async function createOrganizationAction(orgData: Partial<Organization>) {
  try {
    const response = await serverApiRequest.post(
      API_ENDPOINTS.organizations,
      orgData
    );

    if (response.success) {
      // No specific path to revalidate for now
      return {
        success: true,
        data: response.data,
        message: "Organization created successfully",
      };
    } else {
      return {
        success: false,
        error: response.error,
        message: "Failed to create organization",
      };
    }
  } catch (error: any) {
    console.error("Error in createOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An error occurred while creating the organization",
    };
  }
}

/**
 * Update an organization
 */
export async function updateOrganizationAction(
  orgId: string,
  orgData: Partial<Organization>
) {
  try {
    const response = await serverApiRequest.put(
      API_ENDPOINTS.getOrganization(orgId),
      orgData
    );

    if (response.success) {
      // Revalidate the organization page
      revalidatePath(`/organization/${orgId}`, "layout");

      return {
        success: true,
        data: response.data,
        message: "Organization updated successfully",
      };
    } else {
      return {
        success: false,
        error: response.error,
        message: "Failed to update organization",
      };
    }
  } catch (error: any) {
    console.error("Error in updateOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An error occurred while updating the organization",
    };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganizationAction(orgId: string) {
  try {
    const response = await serverApiRequest.delete(
      API_ENDPOINTS.getOrganization(orgId)
    );

    if (response.success) {
      // Revalidate the organizations list page
      revalidatePath("/organizations", "page");

      return {
        success: true,
        message: "Organization deleted successfully",
      };
    } else {
      return {
        success: false,
        error: response.error,
        message: "Failed to delete organization",
      };
    }
  } catch (error: any) {
    console.error("Error in deleteOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An error occurred while deleting the organization",
    };
  }
}

/**
 * Check if organization exists (throws notFound if not)
 */
export async function checkOrganizationExistsAction(
  orgId: string
): Promise<Organization> {
  try {
    const response = await serverApiRequest.get(
      API_ENDPOINTS.getOrganization(orgId)
    );

    if (!response.success || !response.data) {
      console.error("Organization not found:", response.error);
      notFound();
    }

    return response.data;
  } catch (error) {
    console.error("Error checking if organization exists:", error);
    notFound();
  }
}
