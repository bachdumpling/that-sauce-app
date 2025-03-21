export interface Portfolio {
  id: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  embedding?: number[];
  ai_analysis?: Record<string, any>;
}

export interface PortfolioWithProjects extends Portfolio {
  projects: Array<{
    id: string;
    title: string;
    description?: string;
    featured?: boolean;
    year?: number;
    created_at: string;
  }>;
  creator?: {
    id: string;
    username: string;
  };
}

export interface PortfolioUpdateRequest {
  project_ids?: string[];
}

// This interface is no longer needed since we're not updating project_ids directly
// Instead we'll manage the portfolio-project relationships in the portfolio_projects table
export interface PortfolioProjectRequest {
  project_id: string;
} 