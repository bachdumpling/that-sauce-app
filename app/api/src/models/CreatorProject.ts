export interface CreatorProfile {
  id: string;
  username: string;
  location?: string;
  bio?: string;
  primary_role?: string;
  social_links?: Record<string, string>;
  years_of_experience?: number;
  projects?: CreatorProject[];
}

export interface CreatorProject {
  id: string;
  title: string;
  description?: string;
  behance_url?: string;
  featured?: boolean;
  year?: number;
  creator_username?: string;
  images: CreatorProjectImage[];
  videos: CreatorProjectVideo[];
}

export interface CreatorProjectImage {
  id: string;
  url: string;
  alt_text?: string;
  resolutions?: any;
}

export interface CreatorProjectVideo {
  id: string;
  title?: string;
  vimeo_id?: string;
  youtube_id?: string;
  url?: string;
  description?: string;
}
