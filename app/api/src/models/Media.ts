/**
 * Common interface for media properties
 */
export interface MediaBase {
  id: string;
  project_id: string;
  creator_id: string;
  url: string;
  order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Image media type
 */
export interface ImageMedia extends MediaBase {
  alt_text: string;
  resolutions: Record<string, string>;
  ai_analysis?: string | null;
  embedding?: number[] | null;
  analysis_status?: AnalysisStatus | null;
  analysis_error?: string | null;
}

/**
 * Video media type
 */
export interface VideoMedia extends MediaBase {
  title: string;
  description: string;
  vimeo_id?: string;
  youtube_id?: string;
  ai_analysis?: string | null;
  embedding?: number[] | null;
  analysis_status?: AnalysisStatus | null;
  analysis_error?: string | null;
}

/**
 * Media response from the API
 */
export interface MediaResponse {
  id: string;
  type: "image" | "video";
  url: string;
  projectId: string;
  creatorId: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Extended creator type with profile information
 */
export interface CreatorWithProfile {
  id: string;
  profile_id: string;
  username: string;
}

/**
 * Project media with creator information
 */
export interface ProjectMedia {
  id: string;
  images?: ImageMedia[];
  videos?: VideoMedia[];
  creator?: CreatorWithProfile;
}

/**
 * Upload options for media
 */
export interface UploadOptions {
  userId: string;
  projectId: string;
  creatorId: string;
  metadata?: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
    categories?: string[];
    type?: "image" | "video";
    youtube_id?: string;
    vimeo_id?: string;
  };
}

/**
 * Formatted media for API responses
 */
export interface FormattedMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt_text?: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  order: number;
  thumbnails?: Record<string, string>;
  creator?: {
    id: string;
    username: string;
  };
}

// Define the AnalysisStatus type based on the enum
export type AnalysisStatus = "pending" | "processing" | "success" | "failed";
