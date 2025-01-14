export interface Creator {
  id: string;
  username: string;
  location?: string;
  bio?: string;
  primaryRole?: string;
  creativeFields: string[];
  yearsOfExperience?: number;
  socialLinks: Record<string, string>;
}

export interface Project {
  id: string;
  creatorId: string;
  portfolioId: string;
  title: string;
  description?: string;
  year?: number;
  featured: boolean;
  order?: number;
}
