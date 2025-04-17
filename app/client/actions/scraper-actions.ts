"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

/**
 * Extract media from a URL (e.g., Behance, Dribbble, etc.)
 */
export async function extractMediaFromUrlAction(url: string) {
  try {
    const response = await serverApiRequest.post(
      API_ENDPOINTS.scraper.extractMedia,
      { url }
    );

    return {
      success: true,
      data: response.data,
      message: "Media extracted successfully",
    };
  } catch (error: any) {
    console.error("Error in extractMediaFromUrlAction:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to extract media from URL",
    };
  }
}

/**
 * Import media from URL to a project
 */
export async function importMediaFromUrlAction(
  projectId: string,
  username: string,
  data: {
    url: string;
    mediaType: "image" | "video";
    metadata?: Record<string, any>;
  }
) {
  try {
    const response = await serverApiRequest.post(
      API_ENDPOINTS.scraper.importMedia,
      {
        project_id: projectId,
        url: data.url,
        media_type: data.mediaType,
        metadata: data.metadata || {},
      }
    );

    if (response.success) {
      // Revalidate project paths
      revalidatePath(`/${username}/work/${projectId}`, "page");

      return {
        success: true,
        data: response.data,
        message: "Media imported successfully",
      };
    } else {
      return {
        success: false,
        error: response.error,
        message: "Failed to import media",
      };
    }
  } catch (error: any) {
    console.error("Error in importMediaFromUrlAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An error occurred while importing media",
    };
  }
}
