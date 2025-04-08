/**
 * Common interfaces for creators and projects
 */

export interface Creator {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  location?: string;
  bio?: string;
  primary_role?: string[];
  social_links?: Record<string, string>;
  years_of_experience?: number;
  projects?: Project[];
  status?: "pending" | "approved";
  email?: string;
  work_email?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  profile_id?: string;
  isOwner?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  behance_url?: string;
  featured?: boolean;
  year?: number;
  images?: Image[];
  videos?: Video[];
  creator_id?: string;
  creator_username?: string;
  created_at?: string;
  updated_at?: string;

  // Search-specific fields
  vector_score?: number;
  video_score?: number;
  final_score?: number;
}

export interface Image {
  id: string;
  url: string;
  alt_text?: string;
  resolutions: {
    high_res?: string;
    low_res?: string;
  };
  project_id?: string;
  created_at?: string;
}

export interface Video {
  id: string;
  title?: string;
  vimeo_id?: string;
  youtube_id?: string;
  url?: string;
  description?: string;
  similarity_score?: number;
  project_id?: string;
  created_at?: string;
}

export interface SearchResult {
  profile: {
    id: string;
    username: string;
    location?: string;
    primary_role?: string[];
    website?: string;
    social_links?: Record<string, string>;
    work_email?: string;
    bio?: string;
  };
  score?: number;
  content: ContentItem[];
}

export interface ContentItem {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  description?: string;
  score?: number;
  project_id?: string;
  project_title?: string;
  youtube_id?: string;
  vimeo_id?: string;
}

export interface MediaEntry {
  id: string;
  user_id: string;
  file_path: string;
  file_type: "image" | "video";
  storage_url: string;
  mime_type: string;
  size_bytes: number;
  metadata: {
    original_name: string;
  };
}

export type ViewMode = "public" | "owner" | "admin";
