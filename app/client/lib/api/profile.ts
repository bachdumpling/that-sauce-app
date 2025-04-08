import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./api";

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  // Add other profile fields as needed
}

/**
 * Update user profile information
 */
export async function updateProfile(data: ProfileUpdateData) {
  try {
    const response = await apiRequest.put<{
      success: boolean;
      message?: string;
      data?: any;
      error?: string;
    }>('/profile', data);

    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data.message || "Profile updated successfully",
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data?.error || "Failed to update profile",
      };
    }
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
} 