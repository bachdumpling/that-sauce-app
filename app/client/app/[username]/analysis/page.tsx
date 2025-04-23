import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, BarChart, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Creator } from "@/client/types";
import {
  getCreatorAction,
  getCreatorPortfolio,
} from "@/actions/creator-actions";
import {
  canAnalyzePortfolio,
  startPortfolioAnalysis,
  getPortfolioAnalysisResults,
  getAnalysisJobStatus,
} from "@/actions/analysis-actions";

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

// Error UI component
function CreatorAnalysisError({
  error,
  username,
}: {
  error: any;
  username: string;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We encountered an error while trying to load the analysis page for "
        {username}".
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Error: {error.message || "Unknown error"}
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/${username}`}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function CreatorAnalysisPage({
  params,
}: CreatorAnalysisPageProps) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  let creator;
  let portfolioId;
  let projectCount = 0;
  let canAnalyze = false;
  let analysisData = null;
  let analysisMessage = "";

  // Get creator data
  try {
    const result = await getCreatorAction(username);
    const portfolio = await getCreatorPortfolio(username);

    if (!result.success) {
      return (
        <CreatorAnalysisError
          error={{ message: result.error || "Creator not found" }}
          username={username}
        />
      );
    }

    creator = result.data;
    portfolioId = portfolio.data.id;
    // Count projects
    projectCount = creator.projects?.length || 0;

    // Check if analysis is allowed
    if (portfolioId && projectCount > 2) {
      const canAnalyzeResult = await canAnalyzePortfolio(portfolioId);

      if (canAnalyzeResult.success && canAnalyzeResult.data) {
        canAnalyze = canAnalyzeResult.data.allowed;
        if (!canAnalyze) {
          analysisMessage = canAnalyzeResult.data.message;
        }
      }
    }

    // Get current analysis results if any
    if (portfolioId) {
      const analysisResult = await getPortfolioAnalysisResults(portfolioId);
      if (analysisResult.success) {
        analysisData = analysisResult.data;
      }
    }
  } catch (error: any) {
    return <CreatorAnalysisError error={error} username={username} />;
  }

  // Calculate whether the analysis is in progress
  const isAnalysisInProgress =
    analysisData && !analysisData.has_analysis && analysisData.job;
  const analysisProgress = isAnalysisInProgress
    ? analysisData.job?.progress || 0
    : 0;
  const analysisCompleted = analysisData && analysisData.has_analysis;

  // Check if this is the portfolio owner
  const isOwner = creator.isOwner || false;

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analysis</h2>
          <p className="text-muted-foreground">
            AI insights for {creator.username}'s portfolio
          </p>
        </div>

        {isOwner && canAnalyze && projectCount > 2 && (
          <form
            action={async () => {
              "use server";
              if (portfolioId) {
                await startPortfolioAnalysis(portfolioId);
              }
            }}
          >
            <Button type="submit" disabled={isAnalysisInProgress}>
              {isAnalysisInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart className="mr-2 h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Project count warning */}
      {projectCount < 2 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not enough projects</AlertTitle>
          <AlertDescription>
            You need at least 3 projects in your portfolio to run an analysis.
            You currently have {projectCount}{" "}
            {projectCount === 1 ? "project" : "projects"}.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis not allowed message */}
      {!canAnalyze && projectCount >= 2 && analysisMessage && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis not available</AlertTitle>
          <AlertDescription>{analysisMessage}</AlertDescription>
        </Alert>
      )}

      {/* Analysis in progress */}
      {isAnalysisInProgress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analysis in progress</CardTitle>
            <CardDescription>
              We're analyzing {creator.username}'s portfolio. This may take a
              few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-right">
                {analysisProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis results */}
      {analysisCompleted && analysisData && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-generated insights for {creator.username}'s portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{analysisData.analysis}</div>
          </CardContent>
        </Card>
      )}

      {/* No analysis available */}
      {!isAnalysisInProgress && !analysisCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>No Analysis Available</CardTitle>
            <CardDescription>
              {isOwner
                ? "Run an analysis to get AI-powered insights about your portfolio."
                : `${creator.username} hasn't run a portfolio analysis yet.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Analysis provides insights on:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Creative style and strengths</li>
              <li>Technical execution</li>
              <li>Portfolio coherence</li>
              <li>Professional specializations</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
