export interface SearchQueryParams {
  q: string;
  limit?: number;
  page?: number;
  contentType?: "all" | "videos";
}

export interface SearchResult {
  profile: {
    id: string;
    username: string;
    location?: string;
    bio?: string;
    primary_role?: string;
    social_links?: Record<string, string>;
  };
  projects: ProjectSearchResult[];
  score: number;
}

export interface ProjectSearchResult {
  id: string;
  title: string;
  description?: string;
  images: ImageSearchResult[];
  videos: VideoSearchResult[];
}

export interface ImageSearchResult {
  id: string;
  url: string;
  score: number;
}

export interface VideoSearchResult {
  id: string;
  url: string;
  title?: string;
  description?: string;
  score: number;
} 