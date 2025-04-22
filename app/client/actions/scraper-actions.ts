"use server";

import { revalidatePath } from "next/cache";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { extractMediaFromUrlServer } from "@/lib/api/server/scraper";

/**
 * Extracts media from an external URL using the scraper service
 * Returns a handle ID that can be used with Trigger.dev's useRun hook
 */
export async function extractMediaFromUrlAction(
  url: string,
  projectId?: string,
  autoImport: boolean = false
) {
  try {
    const response = await extractMediaFromUrlServer(
      url,
      projectId,
      autoImport
    );

    // Return the publicAccessToken if available
    return {
      success: response.success,
      data: {
        ...response.data,
        // Include publicAccessToken if it exists in the response
        publicAccessToken: response.data?.publicAccessToken,
      },
      message: response.message,
    };
  } catch (error: any) {
    console.error("Error in extractMediaFromUrlAction:", error);
    return {
      success: false,
      error: error.message || "Failed to extract media",
      message: "An error occurred while extracting media from the URL",
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
