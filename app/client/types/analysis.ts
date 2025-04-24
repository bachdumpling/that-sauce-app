// types/analysis.ts

// Types for analysis-related API responses
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

export interface AnalysisJob {
  id: string;
  portfolio_id: string;
  creator_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  status_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioAnalysisResponse {
  has_analysis: boolean;
  analysis: string | null;
  message?: string;
  job?: {
    id: string;
    status: string;
    progress: number;
    status_message?: string;
  };
}

// Map API job status to Trigger.dev run states
export type RunState =
  | "QUEUED"
  | "DELAYED"
  | "EXECUTING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED"
  | "TIMED_OUT"
  | "CRASHED"
  | "INTERRUPTED"
  | "SYSTEM_FAILURE"
  | "EXPIRED";

// Helper function to map job status to run state
export function mapJobStatusToRunState(status: string): RunState {
  switch (status) {
    case "pending":
      return "QUEUED";
    case "processing":
      return "EXECUTING";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    default:
      return "QUEUED";
  }
}

// Analysis stage information
export interface AnalysisStage {
  name: string;
  description: string;
  progressThreshold: number;
}

// Pre-defined analysis stages
export const ANALYSIS_STAGES: AnalysisStage[] = [
  {
    name: "task-triggered",
    description: "Task triggered",
    progressThreshold: 0,
  },
  {
    name: "projects-analysis",
    description: "Analyzing individual projects",
    progressThreshold: 10,
  },
  {
    name: "media-processing",
    description: "Processing media content",
    progressThreshold: 50,
  },
  {
    name: "insights-generation",
    description: "Generating portfolio insights",
    progressThreshold: 80,
  },
  {
    name: "analysis-completion",
    description: "Completing analysis",
    progressThreshold: 100,
  },
];
