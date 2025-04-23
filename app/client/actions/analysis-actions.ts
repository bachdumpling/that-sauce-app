"use server";

import {
  portfolioAnalysisApi,
  projectAnalysisApi,
  analysisJobsApi,
} from "@/lib/api/server/analysis";

// Portfolio Analysis Actions
export async function canAnalyzePortfolio(portfolioId: string) {
  return portfolioAnalysisApi.canAnalyze(portfolioId);
}

export async function startPortfolioAnalysis(portfolioId: string) {
  return portfolioAnalysisApi.startAnalysis(portfolioId);
}

export async function getPortfolioAnalysisResults(portfolioId: string) {
  return portfolioAnalysisApi.getResults(portfolioId);
}

// Project Analysis Actions
export async function startProjectAnalysis(projectId: string) {
  return projectAnalysisApi.startAnalysis(projectId);
}

// Analysis Jobs Actions
export async function getAnalysisJobStatus(jobId: string) {
  return analysisJobsApi.getStatus(jobId);
}
