import { API_ENDPOINTS, buildApiUrl } from "./api";
import { apiRequest } from "./client";
import { createClient } from "@/utils/supabase/client";

/**
 * Get media details by ID
 */
export async function getMediaDetails(mediaId: string) {
  try {
    const url = buildApiUrl(API_ENDPOINTS.media.getMedia(mediaId));

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          `Failed to get media details: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
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
    const url = buildApiUrl(API_ENDPOINTS.media.updateMediaMetadata(mediaId));

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to update media metadata",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          `Failed to update media metadata: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
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
    const url = buildApiUrl(API_ENDPOINTS.media.deleteMedia(mediaId));

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to delete media",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized. Please log in again to perform this action.",
        };
      }

      return {
        success: false,
        error:
          errorData.error || `Failed to delete media: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Media deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting media:", error);
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
    const url = buildApiUrl(API_ENDPOINTS.media.uploadMedia);

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

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to upload media",
      };
    }

    // Only set the Authorization header, let the browser set the Content-Type for FormData
    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 413) {
        return {
          success: false,
          error: "File is too large. Maximum size is 50MB",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to upload media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Error uploading media:", error);
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
    const url = buildApiUrl(API_ENDPOINTS.media.batchUploadMedia);

    const formData = new FormData();
    formData.append("project_id", projectId);

    // Append each file to the FormData
    files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to upload media",
      };
    }

    // Only set the Authorization header, let the browser set the Content-Type for FormData
    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 413) {
        return {
          success: false,
          error: "Files are too large. Maximum total size is 50MB",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to upload media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Error batch uploading media:", error);
    return {
      success: false,
      error: error.message || "Failed to upload media. Please try again.",
    };
  }
}

/**
 * Upload a video link (YouTube or Vimeo) to a project
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
    const url = buildApiUrl(API_ENDPOINTS.media.uploadVideoLink);

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        error: "You must be logged in to upload a video link",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const payload = {
      project_id: projectId,
      video_url: videoUrl,
      title: metadata?.title,
      description: metadata?.description,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          `Failed to upload video link: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Error uploading video link:", error);
    return {
      success: false,
      error: error.message || "Failed to upload video link. Please try again.",
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
    const url = buildApiUrl(API_ENDPOINTS.projectMedia(projectId));

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      // Do not set Content-Type header when uploading files with FormData
    });

    if (!response.ok) {
      if (response.status === 413) {
        return {
          success: false,
          error: "Files are too large. Maximum total size is 20MB",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `Failed to upload media: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || { images: [], videos: [] },
    };
  } catch (error: any) {
    console.error("Error uploading project media:", error);
    return {
      success: false,
      error: error.message || "Failed to upload media. Please try again.",
    };
  }
}

/**
 * Delete a project image - Legacy method
 */
export async function deleteProjectImage(projectId: string, imageId: string) {
  try {
    const url = buildApiUrl(
      API_ENDPOINTS.deleteProjectImage(projectId, imageId)
    );
    console.log(`Deleting image with ID ${imageId} from project ${projectId}`);
    console.log(`Delete URL: ${url}`);

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      console.error("No active session found for image deletion");
      return {
        success: false,
        error: "You must be logged in to delete an image",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    console.log(`Delete image response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error response data:`, errorData);

      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized. Please log in again to perform this action.",
        };
      }

      return {
        success: false,
        error:
          errorData.error || `Failed to delete image: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}

/**
 * Delete a project video - Legacy method
 */
export async function deleteProjectVideo(projectId: string, videoId: string) {
  try {
    const url = buildApiUrl(
      API_ENDPOINTS.deleteProjectVideo(projectId, videoId)
    );
    console.log(`Deleting video with ID ${videoId} from project ${projectId}`);
    console.log(`Delete URL: ${url}`);

    // Get authentication token from Supabase
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      console.error("No active session found for video deletion");
      return {
        success: false,
        error: "You must be logged in to delete a video",
      };
    }

    // Attach the authorization header with the session token
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    console.log(`Delete video response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error response data:`, errorData);

      if (response.status === 401) {
        return {
          success: false,
          error: "Unauthorized. Please log in again to perform this action.",
        };
      }

      return {
        success: false,
        error:
          errorData.error || `Failed to delete video: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Video deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return {
      success: false,
      error: error.message || "Failed to delete video",
    };
  }
}
