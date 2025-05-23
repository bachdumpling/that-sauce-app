import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { ApiResponse } from "@/client/types";

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
export async function uploadMediaServer(
  projectId: string,
  formData: FormData
): Promise<ApiResponse<MediaUploadResponse>> {
  // Ensure project_id is in the formData
  if (!formData.has("project_id")) {
    formData.append("project_id", projectId);
  }

  return serverApiRequest.postFormData<MediaUploadResponse>(
    API_ENDPOINTS.media.uploadMedia,
    formData
  );
}

/**
 * Upload multiple media files to a project
 */
export async function batchUploadMediaServer(
  projectId: string,
  files: File[]
): Promise<ApiResponse<BatchMediaUploadResponse>> {
  const formData = new FormData();
  formData.append("project_id", projectId);

  // Add all files to the form data
  files.forEach((file) => {
    formData.append("files", file);
  });

  return serverApiRequest.postFormData<BatchMediaUploadResponse>(
    API_ENDPOINTS.media.batchUploadMedia,
    formData
  );
}

/**
 * Add a video link (YouTube or Vimeo) to a project
 */
export async function uploadVideoLinkServer(
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  const payload = {
    project_id: projectId,
    video_url: videoUrl,
    ...metadata,
  };

  return serverApiRequest.post<MediaUploadResponse>(
    API_ENDPOINTS.media.uploadVideoLink,
    payload
  );
}

/**
 * Delete a media item (image or video)
 */
export async function deleteMediaServer(
  mediaId: string,
  mediaType: "image" | "video" = "image"
): Promise<ApiResponse<{ message: string }>> {
  return serverApiRequest.delete<{ message: string }>(
    API_ENDPOINTS.media.deleteMedia(mediaId, mediaType)
  );
}

/**
 * Update media metadata (for images or videos)
 */
export async function updateMediaMetadataServer(
  mediaId: string,
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  const payload = {
    ...metadata,
  };

  return serverApiRequest.put<MediaUploadResponse>(
    API_ENDPOINTS.media.updateMediaMetadata(mediaId),
    payload
  );
}
