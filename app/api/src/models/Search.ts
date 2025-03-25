export interface SearchQueryParams {
  q: string;
  limit?: number;
  page?: number;
  contentType?: "all" | "videos" | "images";
}

export interface MediaContent {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  description?: string;
  score: number;
  project_id: string;
  project_title: string;
  youtube_id?: string;
  vimeo_id?: string;
}

export interface CreatorWithContent {
  profile: {
    id: string;
    username: string;
    location?: string;
    bio?: string;
    primary_role?: string[];
    social_links?: Record<string, string>;
    work_email?: string;
  };
  score: number;
  content: MediaContent[];
}

export interface SearchResponse {
  results: CreatorWithContent[];
  page: number;
  limit: number;
  total: number;
  query: string;
  content_type: string;
  processed_query?: string;
}
