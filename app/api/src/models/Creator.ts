export interface Creator {
  id: string;
  profile_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorWithProfile extends Creator {
  profile?: {
    id: string;
    email: string;
  };
} 