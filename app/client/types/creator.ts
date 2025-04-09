export interface Creator {
  id: string;
  bio: string;
  status: "pending" | "active" | "inactive";
  location: string;
  username: string;
  created_at: string;
  profile_id: string;
  updated_at: string;
  work_email: string;
  last_scraped: string | null;
  primary_role: string[];
  social_links: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    pinterest?: string;
  };
  portfolio_scraped: boolean;
  years_of_experience: number;
  isOwner?: boolean;
  email?: string;
  projects?: any[]; // We'll refine this type as needed
}
