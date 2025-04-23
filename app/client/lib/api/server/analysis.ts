import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "../shared/endpoints";

// Types based on API response structures
export interface CanAnalyzeResponse {
  allowed: boolean;
  message: string;
  nextAvailableTime?: string;
}

export interface AnalysisJobResponse {
  message: string;
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface PortfolioAnalysisResponse {
  has_analysis: boolean;
  analysis: string | null;
  message?: string;
  job?: {
    id: string;
    status: string;
    progress: number;
  };
}

export interface AnalysisJobStatusResponse {
  id: string;
  portfolio_id: string;
  creator_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  created_at: string;
  updated_at: string;
}

// Portfolio Analysis API
export const portfolioAnalysisApi = {
  // Check if a portfolio can be analyzed
  canAnalyze: async (portfolioId: string) => {
    return serverApiRequest.get<CanAnalyzeResponse>(
      API_ENDPOINTS.analysis.portfolioCanAnalyze(portfolioId),
      undefined,
      true
    );
  },

  // Start portfolio analysis
  startAnalysis: async (portfolioId: string) => {
    return serverApiRequest.post<AnalysisJobResponse>(
      API_ENDPOINTS.analysis.portfolioAnalysis(portfolioId),
      undefined,
      true
    );
  },

  // Get portfolio analysis results
  getResults: async (portfolioId: string) => {
    return serverApiRequest.get<PortfolioAnalysisResponse>(
      API_ENDPOINTS.analysis.portfolioAnalysis(portfolioId),
      undefined,
      true
    );
  },
};

// Project Analysis API
export const projectAnalysisApi = {
  // Start project analysis
  startAnalysis: async (projectId: string) => {
    return serverApiRequest.post<AnalysisJobResponse>(
      API_ENDPOINTS.analysis.projectAnalysis(projectId),
      undefined,
      true
    );
  },
};

// Analysis Jobs API
export const analysisJobsApi = {
  // Get analysis job status
  getStatus: async (jobId: string) => {
    return serverApiRequest.get<AnalysisJobStatusResponse>(
      API_ENDPOINTS.analysis.jobStatus(jobId),
      undefined,
      true
    );
  },
};
