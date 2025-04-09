import { Creator } from "./creator";

export interface ImageResolutions {
  original?: string;
  [key: string]: string | undefined;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  creator_id: string;
  url: string;
  alt_text: string;
  resolutions: ImageResolutions;
  ai_analysis: string | null;
  embedding: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  failed_analysis: boolean;
  failure_reason: string | null;
}

export interface ProjectVideo {
  id: string;
  project_id: string;
  creator_id: string;
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  ai_analysis?: string | null;
  embedding?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  creator_id: string;
  portfolio_id: string;
  title: string;
  behance_url: string;
  description: string;
  year: number | null;
  featured: boolean;
  order: number;
  ai_analysis: string;
  created_at: string;
  updated_at: string;
  creators: Creator;
  images: ProjectImage[];
  videos: ProjectVideo[];
}
