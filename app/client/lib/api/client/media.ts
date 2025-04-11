import { ApiResponse } from "@/client/types";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";

/**
 * Interface for media upload response
 */
interface MediaUploadResponse {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  projectId: string;
  creatorId: string;
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    file_size?: number;
    mime_type?: string;
    original_filename?: string;
    order?: number;
    youtube_id?: string;
    vimeo_id?: string;
  };
  created_at: string;
}

/**
 * Interface for batch media upload response
 */
interface BatchMediaUploadResponse {
  media: MediaUploadResponse[];
  total: number;
  message: string;
}

/**
 * Upload a single media file to a project
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
): Promise<ApiResponse<MediaUploadResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("project_id", projectId);

  // Add optional metadata
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
  }

  return apiRequest.postFormData<MediaUploadResponse>(
    API_ENDPOINTS.media.uploadMedia,
    formData
  );
}

/**
 * Upload multiple media files to a project
 */
export async function batchUploadMedia(
  projectId: string,
  files: Array<File>
): Promise<ApiResponse<BatchMediaUploadResponse>> {
  // Validate projectId before making the request
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    console.error("Invalid project ID provided:", projectId);
    return {
      success: false,
      data: null,
      error: "Invalid project ID provided. Cannot upload files.",
    };
  }

  // Validate files array
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.error("No files provided for upload");
    return {
      success: false,
      data: null,
      error: "No files provided for upload",
    };
  }

  const formData = new FormData();
  formData.append("project_id", projectId);

  // Add files to the form data
  files.forEach((file) => {
    formData.append("files", file);
  });

  return apiRequest.postFormData<BatchMediaUploadResponse>(
    API_ENDPOINTS.media.batchUploadMedia,
    formData
  );
}

/**
 * Import media from URLs to a project
 */
export async function importUrlMedia(
  projectId: string,
  urls: Array<string | { url: string; metadata?: Record<string, any> }>
): Promise<ApiResponse<BatchMediaUploadResponse>> {
  // Validate projectId
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    console.error("Invalid project ID provided:", projectId);
    return {
      success: false,
      data: null,
      error: "Invalid project ID provided. Cannot import media.",
    };
  }

  // Validate URLs array
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    console.error("No URLs provided for import");
    return {
      success: false,
      data: null,
      error: "No URLs provided for import",
    };
  }

  // Format the payload
  const payload = {
    project_id: projectId,
    urls: urls,
  };

  return apiRequest.post<BatchMediaUploadResponse>(
    API_ENDPOINTS.media.importUrlMedia,
    payload
  );
}

/**
 * Add a video link (YouTube or Vimeo) to a project
 */
export async function uploadVideoLink(
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  // Validate projectId before making the request
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
    console.error("Invalid project ID provided:", projectId);
    return {
      success: false,
      data: null,
      error: "Invalid project ID provided. Cannot add video link.",
    };
  }

  // Validate video URL
  if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.trim()) {
    console.error("Invalid video URL provided");
    return {
      success: false,
      data: null,
      error: "Invalid video URL provided",
    };
  }

  const payload = {
    project_id: projectId,
    video_url: videoUrl,
    ...metadata,
  };

  return apiRequest.post<MediaUploadResponse>(
    API_ENDPOINTS.media.uploadVideoLink,
    payload
  );
}

/**
 * Delete a media item (image or video)
 */
export async function deleteMedia(
  mediaId: string
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest.delete<{ message: string }>(
    API_ENDPOINTS.media.deleteMedia(mediaId)
  );
}

/**
 * Update media metadata (for images or videos)
 */
export async function updateMediaMetadata(
  mediaId: string,
  mediaType: "image" | "video" | "youtube" | "vimeo",
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  const payload = {
    media_type: mediaType,
    ...metadata,
  };

  return apiRequest.put<MediaUploadResponse>(
    API_ENDPOINTS.media.updateMediaMetadata(mediaId),
    payload
  );
}
