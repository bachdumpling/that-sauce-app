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

export interface ScrapedMedia {
  url: string;
  alt_text?: string;
  type: "image" | "video";
  order?: number;
  youtube_id?: string;
  vimeo_id?: string;
}

export interface ScrapeResponse {
  source_url: string;
  media: ScrapedMedia[];
  total: number;
}

export interface ImportResponse {
  project_id: string;
  imported_count: number;
  failed_count: number;
  media: any[];
  errors?: { url: string; error: string }[];
}
