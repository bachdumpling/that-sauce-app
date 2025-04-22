export interface Media {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  thumbnailUrl?: string;
  projectId?: string;
  creatorId: string;
  title?: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface MediaPreviewItem {
  id: string;
  type: MediaType;
  url: string;
  alt_text?: string;
  order?: number;
  youtube_id?: string;
  vimeo_id?: string;
}

export type MediaType = "image" | "video" | "youtube" | "vimeo";

export interface MediaUploadResponse {
  id: string;
  url: string;
  type: string;
  message: string;
  success: boolean;
}

export interface MediaBatchUploadResponse {
  total: number;
  uploaded: number;
  errors: any[];
  media: MediaUploadResponse[];
}

export interface ScrapedMedia {
  url: string;
  type: MediaType;
  alt_text?: string;
  order?: number;
  youtube_id?: string;
  vimeo_id?: string;
}

export interface ScrapeResponse {
  handle_id: string;
  status: "pending" | "completed" | "failed";
  url: string;
  message?: string;
}

export interface ScrapedMediaResult {
  media: ScrapedMedia[];
  total: number;
  url: string;
}

export interface ImportResponse {
  total: number;
  imported: number;
  errors: any[];
  media: MediaUploadResponse[];
}
