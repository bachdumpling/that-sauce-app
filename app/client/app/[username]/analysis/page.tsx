import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalysisClient } from "./analysis-client";
import { Creator } from "@/client/types";
import {
  getCreatorAction,
  getCreatorPortfolio,
} from "@/actions/creator-actions";
import {
  canAnalyzePortfolio,
  getPortfolioAnalysisResults,
} from "@/actions/analysis-actions";
import { redirect } from "next/navigation";

interface CreatorAnalysisPageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({
  params,
}: CreatorAnalysisPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  try {
    const result = await getCreatorAction(username);

    if (!result.success) {
      return {
        title: "Analysis Not Found",
      };
    }

    const creator = result.data;

    return {
      title: `Portfolio Analysis for ${creator.username} | that sauce`,
      description: `AI analysis of ${creator.username}'s creative portfolio on that sauce`,
    };
  } catch (error) {
    return {
      title: "Portfolio Analysis",
    };
  }
}

export default async function CreatorAnalysisPage({
  params,
}: CreatorAnalysisPageProps) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  let creator;
  let portfolioId = null;
  let projectCount = 0;
  let canAnalyze = false;
  let analysisMessage = "";
  let analysisData = null;
  let error = null;

  // Get creator data
  try {
    const result = await getCreatorAction(username);
    if (!result.success || !result.data) {
      error = result.error || "Creator not found";
      return (
        <AnalysisClient
          username={username}
          initialData={{
            creator: null,
            portfolioId: null,
            projectCount: 0,
            canAnalyze: false,
            analysisMessage: "",
            analysisData: null,
            error: error,
          }}
        />
      );
    }

    creator = result.data;

    // Check ownership - if not, redirect
    if (!creator.isOwner) {
      redirect(`/${username}`);
    }

    // Count projects
    projectCount = creator.projects?.length || 0;

    // Get portfolio data
    const portfolio = await getCreatorPortfolio(username);
    if (portfolio.success && portfolio.data) {
      portfolioId = portfolio.data.id;

      // Check if analysis is allowed
      if (portfolioId && projectCount > 2) {
        const canAnalyzeResult = await canAnalyzePortfolio(portfolioId);

        if (canAnalyzeResult.success && canAnalyzeResult.data) {
          canAnalyze = canAnalyzeResult.data.allowed;
          if (!canAnalyze) {
            analysisMessage = canAnalyzeResult.data.message;
          }
        }

        // Get current analysis results if any
        if (portfolioId) {
          const analysisResult = await getPortfolioAnalysisResults(portfolioId);
          if (analysisResult.success) {
            analysisData = analysisResult.data;
          }
        }
      }
    }
  } catch (error: any) {
    return (
      <AnalysisClient
        username={username}
        initialData={{
          creator: null,
          portfolioId: null,
          projectCount: 0,
          canAnalyze: false,
          analysisMessage: "",
          analysisData: null,
          error: error.message || "An unexpected error occurred",
        }}
      />
    );
  }

  // Pass all data to the client component
  return (
    <AnalysisClient
      username={username}
      initialData={{
        creator,
        portfolioId,
        projectCount,
        canAnalyze,
        analysisMessage,
        analysisData,
        error: null,
      }}
    />
  );
}
