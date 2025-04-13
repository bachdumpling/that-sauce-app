// src/models/Project.ts
import { ImageMedia, VideoMedia } from "./Media";

export interface Project {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  is_public: boolean;
  roles?: string[];
  client_ids?: string[];
  year?: number;
}

export interface Creator {
  id: string;
  profile_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCreator extends Project {
  creators: Creator;
  organizations?: Organization[];
}

export interface ProjectWithMedia extends Project {
  images?: ImageMedia[];
  videos?: VideoMedia[];
  creators: Creator;
  organizations?: Organization[];
}
