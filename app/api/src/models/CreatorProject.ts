export interface CreatorProfile {
  id: string;
  username: string;
  location?: string;
  bio?: string;
  primary_role?: string;
  social_links?: Record<string, string>;
  years_of_experience?: number;
  work_email?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  updated_at?: string;
  profile_id?: string;
  isOwner?: boolean;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
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
  created_at?: string;
  updated_at?: string;
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
