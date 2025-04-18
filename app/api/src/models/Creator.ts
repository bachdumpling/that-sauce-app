export interface Creator {
  id: string;
  profile_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  primary_role?: string;
  years_of_experience?: number;
  work_email?: string;
  social_links?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreatorWithProfile extends Creator {
  profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  first_name?: string;
  last_name?: string;
  projects?: any[];
}
