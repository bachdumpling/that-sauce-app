"use server";

import { revalidatePath } from "next/cache";
import {
  uploadMediaServer,
  deleteMediaServer,
  updateMediaMetadataServer,
  batchUploadMediaServer,
  uploadVideoLinkServer,
} from "@/lib/api/server/media";
import { serverApiRequest } from "@/lib/api/server/apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

/**
 * Upload media (images/videos) to a project
 */
export async function uploadMediaAction(
  username: string,
  projectId: string,
  formData: FormData
) {
  try {
    // Ensure project_id is in the formData
    formData.append("project_id", projectId);

    const response = await uploadMediaServer(projectId, formData);

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Media uploaded successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to upload media",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in uploadMediaAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Delete media from a project
 */
export async function deleteMediaAction(
  username: string,
  projectId: string,
  mediaId: string,
  mediaType: "image" | "video"
) {
  try {
    const response = await deleteMediaServer(mediaId, mediaType);

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Media deleted successfully",
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to delete media",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in deleteMediaAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Batch upload multiple media files to a project
 */
export async function batchUploadMediaAction(
  username: string,
  projectId: string,
  files: File[]
) {
  try {
    const response = await batchUploadMediaServer(projectId, files);

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Media uploaded successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to upload media",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in batchUploadMediaAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Upload a video link (YouTube or Vimeo) to a project
 */
export async function uploadVideoLinkAction(
  username: string,
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
  }
) {
  try {
    const response = await uploadVideoLinkServer(projectId, videoUrl, metadata);

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Video link added successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to add video link",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in uploadVideoLinkAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Import media from URLs to a project
 */
export async function importUrlMediaAction(
  username: string,
  projectId: string,
  urls: Array<{
    url: string;
    type: "image" | "video";
    alt_text?: string;
    order?: number;
  }>
) {
  try {
    const payload = {
      project_id: projectId,
      urls,
    };

    const response = await serverApiRequest.post(
      API_ENDPOINTS.media.importUrlMedia,
      payload
    );

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Media imported successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to import media",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in importUrlMediaAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Update media metadata (alt text, title, description, etc.)
 */
export async function updateMediaMetadataAction(
  username: string,
  projectId: string,
  mediaId: string,
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    [key: string]: any;
  }
) {
  try {
    const response = await updateMediaMetadataServer(mediaId, metadata);

    if (response.success) {
      // Revalidate relevant paths
      revalidatePath(`/${username}/work/${projectId}`, "page");

      return {
        success: true,
        message: "Media metadata updated successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to update media metadata",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in updateMediaMetadataAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}
