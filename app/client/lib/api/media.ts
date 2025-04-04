import { API_ENDPOINTS, buildApiUrl } from "./api";
import { apiRequest } from "./client";
import { createClient } from "@/utils/supabase/client";

/**
 * Get media details by ID
 */
export async function getMediaDetails(mediaId: string) {
  try {
    const url = API_ENDPOINTS.media.getMedia(mediaId);
    
    const response = await apiRequest.get(url);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error getting media details:", error);
    return {
      success: false,
      error: error.message || "Failed to get media details. Please try again.",
    };
  }
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(mediaId: string, metadata: any) {
  try {
    const url = API_ENDPOINTS.media.updateMediaMetadata(mediaId);
    
    const response = await apiRequest.put(url, metadata);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error updating media metadata:", error);
    return {
      success: false,
      error:
        error.message || "Failed to update media metadata. Please try again.",
    };
  }
}

/**
 * Delete media (unified method for both images and videos)
 */
export async function deleteMedia(mediaId: string) {
  try {
    const url = API_ENDPOINTS.media.deleteMedia(mediaId);
    
    await apiRequest.delete(url);
    
    return {
      success: true,
      message: "Media deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting media:", error);
    
    if (error.status === 401) {
      return {
        success: false,
        error: "Unauthorized. Please log in again to perform this action.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to delete media",
    };
  }
}

/**
 * Upload media (images/videos) to a project
 */
export async function uploadMedia(
  projectId: string,
  file: File,
  metadata?: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
) {
  try {
    const url = API_ENDPOINTS.media.uploadMedia;

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("file", file);

    if (metadata?.alt_text) {
      formData.append("alt_text", metadata.alt_text);
    }

    if (metadata?.title) {
      formData.append("title", metadata.title);
    }

    if (metadata?.description) {
      formData.append("description", metadata.description);
    }

    if (metadata?.order !== undefined) {
      formData.append("order", metadata.order.toString());
    }

    // We need to use the apiRequest.post but with specific headers for FormData
    const response = await apiRequest.post(url, formData, {
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
        "Content-Type": undefined
      }
    });
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error uploading media:", error);
    
    if (error.status === 413) {
      return {
        success: false,
        error: "File is too large. Maximum size is 50MB",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to upload media. Please try again.",
    };
  }
}

/**
 * Batch upload multiple media files to a project
 */
export async function batchUploadMedia(projectId: string, files: File[]) {
  try {
    const url = API_ENDPOINTS.media.batchUploadMedia;

    const formData = new FormData();
    formData.append("project_id", projectId);

    // Append each file to the FormData
    files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Use apiRequest with FormData
    const response = await apiRequest.post(url, formData, {
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
        "Content-Type": undefined
      }
    });
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error batch uploading media:", error);
    
    if (error.status === 413) {
      return {
        success: false,
        error: "Files are too large. Maximum total size is 50MB",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to upload media. Please try again.",
    };
  }
}

/**
 * Upload a video via URL (YouTube, Vimeo, etc.)
 */
export async function uploadVideoLink(
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
  }
) {
  try {
    const url = API_ENDPOINTS.media.uploadVideoLink;
    
    const data = {
      project_id: projectId,
      video_url: videoUrl,
      ...metadata
    };
    
    const response = await apiRequest.post(url, data);
    
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error adding video link:", error);
    return {
      success: false,
      error: error.message || "Failed to add video link. Please try again.",
    };
  }
}

// Legacy methods for backward compatibility

/**
 * Upload media (images/videos) to a project - Legacy method
 */
export async function uploadProjectMedia(
  projectId: string,
  formData: FormData
) {
  try {
    const url = API_ENDPOINTS.projectMedia(projectId);

    // Use apiRequest with FormData
    const response = await apiRequest.post(url, formData, {
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
        "Content-Type": undefined
      }
    });

    return {
      success: true,
      data: response.data.data || { images: [], videos: [] },
    };
  } catch (error: any) {
    console.error("Error uploading project media:", error);
    
    if (error.status === 413) {
      return {
        success: false,
        error: "Files are too large. Maximum total size is 20MB",
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to upload media. Please try again.",
    };
  }
}

/**
 * Delete a project image (legacy method)
 */
export async function deleteProjectImage(projectId: string, imageId: string) {
  try {
    const url = API_ENDPOINTS.deleteProjectImage(projectId, imageId);
    
    await apiRequest.delete(url);
    
    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project image:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}

/**
 * Delete a project video (legacy method)
 */
export async function deleteProjectVideo(projectId: string, videoId: string) {
  try {
    const url = API_ENDPOINTS.deleteProjectVideo(projectId, videoId);
    
    await apiRequest.delete(url);
    
    return {
      success: true,
      message: "Video deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project video:", error);
    return {
      success: false,
      error: error.message || "Failed to delete video",
    };
  }
}
