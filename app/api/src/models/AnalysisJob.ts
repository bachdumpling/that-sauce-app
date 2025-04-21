// app/api/src/models/AnalysisJob.ts

export interface AnalysisJob {
  id: string;
  portfolio_id: string;
  creator_id: string; // Although not explicitly used in repo methods, likely needed
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string | null;
  created_at: string | Date; // Supabase might return string or Date
  updated_at: string | Date;
  completed_at?: string | Date | null;
} 