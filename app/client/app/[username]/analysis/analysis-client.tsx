"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Creator } from "@/client/types";
import {
  startPortfolioAnalysis,
  getAnalysisJobStatus,
  getPortfolioAnalysisResults,
} from "@/actions/analysis-actions";
import { toast } from "sonner";

interface AnalysisClientProps {
  username: string;
  initialData: {
    creator: Creator | null;
    portfolioId: string | null;
    projectCount: number;
    canAnalyze: boolean;
    analysisMessage: string;
    analysisData: any;
    error: string | null;
  };
}

export function AnalysisClient({ username, initialData }: AnalysisClientProps) {
  const router = useRouter();

  // State initialized with server data
  const [creator, setCreator] = useState<Creator | null>(initialData.creator);
  const [portfolioId, setPortfolioId] = useState<string | null>(
    initialData.portfolioId
  );
  const [projectCount, setProjectCount] = useState(initialData.projectCount);
  const [canAnalyze, setCanAnalyze] = useState(initialData.canAnalyze);
  const [analysisMessage, setAnalysisMessage] = useState(
    initialData.analysisMessage
  );
  const [analysisData, setAnalysisData] = useState<any>(
    initialData.analysisData
  );
  const [error, setError] = useState<string | null>(initialData.error);

  // Client-side state
  const [isAnalysisInProgress, setIsAnalysisInProgress] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [currentRunState, setCurrentRunState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state based on initial data
  useEffect(() => {
    if (analysisData) {
      // Check if analysis is in progress
      const isInProgress =
        analysisData && !analysisData.has_analysis && analysisData.job;

      setIsAnalysisInProgress(isInProgress);

      if (isInProgress) {
        // Set job ID and status
        setJobId(analysisData.job?.id);
        setJobStatus(analysisData.job?.status);
        setAnalysisProgress(analysisData.job?.progress || 0);

        // Map status to run state
        if (analysisData.job?.status === "pending") {
          setCurrentRunState("QUEUED");
        } else if (analysisData.job?.status === "processing") {
          setCurrentRunState("EXECUTING");
        }
      }

      setAnalysisCompleted(analysisData && analysisData.has_analysis);
    }
  }, [analysisData]);

  // Poll for job status when in progress
  useEffect(() => {
    let intervalId: any = null;

    if (isAnalysisInProgress && jobId) {
      // Poll every 3 seconds
      intervalId = setInterval(async () => {
        try {
          // Check job status
          const jobStatusResult = await getAnalysisJobStatus(jobId);

          if (jobStatusResult.success && jobStatusResult.data) {
            const jobData = jobStatusResult.data;
            setJobStatus(jobData.status);
            setAnalysisProgress(jobData.progress || 0);

            // Map status to run state
            if (jobData.status === "pending") {
              setCurrentRunState("QUEUED");
            } else if (jobData.status === "processing") {
              setCurrentRunState("EXECUTING");
            } else if (jobData.status === "completed") {
              setCurrentRunState("COMPLETED");
              setAnalysisCompleted(true);
              setIsAnalysisInProgress(false);

              // Refresh analysis data
              if (portfolioId) {
                const analysisResult =
                  await getPortfolioAnalysisResults(portfolioId);
                if (analysisResult.success) {
                  setAnalysisData(analysisResult.data);
                }
              }

              // Clear interval
              clearInterval(intervalId);
              intervalId = null;
            } else if (jobData.status === "failed") {
              setCurrentRunState("FAILED");
              setIsAnalysisInProgress(false);

              // Clear interval
              clearInterval(intervalId);
              intervalId = null;

              toast.error("Analysis failed. Please try again later.");
            }
          }
        } catch (error) {
          console.error("Error polling job status:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAnalysisInProgress, jobId, portfolioId]);

  // Start analysis function
  const handleStartAnalysis = async () => {
    if (!portfolioId) {
      toast.error("Portfolio not found");
      return;
    }

    try {
      const result = await startPortfolioAnalysis(portfolioId);

      if (result.success) {
        setIsAnalysisInProgress(true);
        setJobId(result.data.job_id);
        setJobStatus(result.data.status);
        setCurrentRunState("QUEUED");
        setAnalysisProgress(0);

        toast.success("Analysis started successfully");
      } else {
        throw new Error(result.error || "Failed to start analysis");
      }
    } catch (error: any) {
      console.error("Error starting analysis:", error);
      toast.error(error.message || "Failed to start analysis");
    }
  };

  // Get status icon based on run state
  const getStatusIcon = (state: string | null) => {
    switch (state) {
      case "QUEUED":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "EXECUTING":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Get status description based on run state
  const getStatusDescription = (state: string | null) => {
    switch (state) {
      case "QUEUED":
        return "Your analysis is queued and will start soon.";
      case "EXECUTING":
        return "Analyzing your portfolio. This might take a few minutes.";
      case "COMPLETED":
        return "Analysis completed successfully.";
      case "FAILED":
        return "Analysis failed. Please try again later.";
      default:
        return "No active analysis.";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading analysis data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-2 max-w-md">
          We encountered an error while trying to load the analysis page for "
          {username}".
        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md">
          Error: {error}
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

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analysis</h2>
          <p className="text-muted-foreground">
            AI insights for {username}'s portfolio
          </p>
        </div>

        {creator?.isOwner && canAnalyze && projectCount > 2 && (
          <Button onClick={handleStartAnalysis} disabled={isAnalysisInProgress}>
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
        )}
      </div>

      {/* Project count warning */}
      {projectCount < 3 && (
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
      {!canAnalyze && projectCount >= 3 && analysisMessage && (
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
            <div className="flex items-center gap-2">
              {getStatusIcon(currentRunState)}
              <CardTitle>Analysis in progress</CardTitle>
            </div>
            <CardDescription>
              {getStatusDescription(currentRunState)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={analysisProgress} className="w-full h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Run status: {currentRunState || "Unknown"}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {analysisProgress}% complete
                  </span>
                </div>
              </div>

              {/* Progress stages */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Analysis Stages:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${analysisProgress > 0 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <span className="text-sm">Task triggered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${analysisProgress > 10 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <span className="text-sm">
                      Analyzing individual projects
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${analysisProgress > 50 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <span className="text-sm">Processing media content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${analysisProgress > 80 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <span className="text-sm">
                      Generating portfolio insights
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${analysisProgress >= 100 ? "bg-green-500" : "bg-gray-300"}`}
                    ></div>
                    <span className="text-sm">Completing analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Analysis can take several minutes to complete. You can leave this
            page and come back later.
          </CardFooter>
        </Card>
      )}

      {/* Analysis results */}
      {analysisCompleted && analysisData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Analysis Results</CardTitle>
            </div>
            <CardDescription>
              AI-generated insights for {username}'s portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">
                  AI Portfolio Summary
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{`${analysisData.analysis}`}</ReactMarkdown>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleStartAnalysis}
                disabled={isAnalysisInProgress}
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reanalyze Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No analysis available */}
      {!isAnalysisInProgress && !analysisCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>No Analysis Available</CardTitle>
            <CardDescription>
              {creator?.isOwner
                ? "Run an analysis to get AI-powered insights about your portfolio."
                : `${username} hasn't run a portfolio analysis yet.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Portfolio analysis provides insights on:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Creative style and strengths</li>
                <li>Technical execution</li>
                <li>Portfolio coherence</li>
                <li>Professional specializations</li>
                <li>Target audience and industry fit</li>
              </ul>

              {creator?.isOwner && canAnalyze && projectCount >= 3 && (
                <div className="bg-muted p-4 rounded-md mt-6">
                  <h3 className="text-sm font-medium mb-2">How it works:</h3>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Click "Start Analysis" to begin</li>
                    <li>Our AI analyzes each project in your portfolio</li>
                    <li>
                      The system processes images, videos, and descriptions
                    </li>
                    <li>AI generates insights about your creative work</li>
                    <li>
                      Results are stored in your profile for future reference
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
