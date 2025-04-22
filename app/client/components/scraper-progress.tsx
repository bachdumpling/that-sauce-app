"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRun } from "@trigger.dev/react-hooks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw } from "lucide-react";
import { TriggerProvider } from "@/providers/TriggerProvider";

// Inner component that uses the hook after TriggerProvider is established
const RunTracker = ({ handleId, onComplete }) => {
  const { run, error, mutate } = useRun(handleId, {
    refreshInterval: 200, // Poll every 200ms
  });
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("starting");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const completedCallbackFired = useRef(false);
  const progressTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Setup simulated progress when executing
  useEffect(() => {
    // Clear any existing timer when component unmounts or status changes
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, []);

  // Handle run status changes and start/stop progress simulation
  useEffect(() => {
    // If we have a run object, update the UI
    if (run) {
      // Check if state changed to executing
      if (run.isExecuting && !progressTimerRef.current) {
        // Start tracking progress simulation
        startTimeRef.current = Date.now();

        // Start a timer to update progress
        progressTimerRef.current = setInterval(() => {
          // Calculate time elapsed (capped at 20 seconds to show some movement)
          const elapsed = Date.now() - startTimeRef.current;
          const estimatedDuration = 20000; // 20 seconds estimate for full process

          // Calculate simulated progress (goes up to 90% max to leave room for completion)
          const simulatedProgress = Math.min(
            90,
            (elapsed / estimatedDuration) * 100
          );

          // Update progress state
          setProgress(simulatedProgress);
        }, 100);

        setStatus("executing");
      }

      // Use the run status to set our component status
      if (run.isExecuting) {
        setStatus("executing");
      } else if (run.isQueued) {
        setStatus("queued");
      } else if (run.isCompleted) {
        // Stop progress simulation
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        // Force progress to 100% on completion
        setProgress(100);
        setStatus("completed");
      } else if (run.isFailed) {
        // Stop progress simulation
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        setStatus("failed");
      }

      // Extract progress from metadata if available (real progress takes precedence)
      if (run.metadata && typeof run.metadata.progress === "number") {
        setProgress(run.metadata.progress);

        // Override with more specific status if available
        if (run.metadata.status) {
          setStatus(run.metadata.status);
        }
      }
    }

    // Check for completed runs - ONLY fire the callback once
    if (
      (run?.status === "SUCCESS" || run?.isSuccess) &&
      run.output &&
      onComplete &&
      !completedCallbackFired.current
    ) {
      completedCallbackFired.current = true;

      // Stop any running progress timer
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      // Set progress to 100% when complete
      setProgress(100);

      // Call the completion callback
      onComplete(run.output);
    }
  }, [run, onComplete]);

  // Determine if we should show the overlay
  const isInProgress =
    run &&
    (run.isQueued || run.isExecuting || (!run.isCompleted && !run.isFailed));
  const showOverlay = isInProgress || !run;

  // Get human-readable status
  const getDisplayStatus = () => {
    if (!run) return "Connecting...";
    if (run.isQueued) return "Waiting in queue";
    if (run.isExecuting) {
      if (progress < 10) return "Starting up";
      if (progress < 30) return "Loading page";
      if (progress < 50) return "Analyzing content";
      if (progress < 70) return "Finding media";
      if (progress < 90) return "Processing media";
      return "Finalizing";
    }
    if (run.isCompleted) return "Completed";
    if (run.isFailed) return "Failed";
    return status;
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h3 className="text-red-700 font-semibold mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (onComplete) {
                  onComplete({ success: false, error: error.message });
                }
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen overlay for loading and processing
  if (showOverlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h3 className="font-semibold text-lg mb-4">Importing Media</h3>

          <Progress value={progress} className="h-3 mb-4" />

          <div className="flex items-center mb-3">
            <Loader2 className="h-5 w-5 mr-2 animate-spin text-primary" />
            <span className="font-medium">{getDisplayStatus()}</span>
            {run?.isQueued && (
              <span className="ml-1 text-amber-600 text-sm">
                (Waiting in queue)
              </span>
            )}
          </div>

          {run?.metadata?.total && (
            <div className="text-sm text-gray-600 mb-2">
              Found {run.metadata.total} items
            </div>
          )}

          {run?.metadata?.mediaCount && (
            <div className="text-sm text-gray-600 mb-2">
              {run.metadata.mediaCount} media items extracted
            </div>
          )}

          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments. Please do not close this window.
          </p>
        </div>
      </div>
    );
  }

  // Success or failure screens
  if (run) {
    return (
      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2">Import Results</h3>

        {(run.status === "SUCCESS" || run.isSuccess) &&
          run.output?.data?.total && (
            <div className="text-sm text-gray-600 mb-2">
              Successfully imported {run.output.data.total} items
            </div>
          )}

        {(run.status === "SUCCESS" || run.isSuccess) && (
          <div className="p-2 bg-green-50 text-green-700 rounded-md mt-2">
            Scraping completed successfully!
          </div>
        )}

        {(run.status === "FAILED" || run.isFailed) && (
          <div className="p-2 bg-red-50 text-red-700 rounded-md mt-2">
            Error:{" "}
            {run.metadata && run.metadata.error
              ? run.metadata.error
              : "Unknown error"}
          </div>
        )}
      </div>
    );
  }

  return null;
};

// Component to display scraper progress
export const ScraperProgress = ({ handleId, accessToken, onComplete }) => {
  if (!accessToken) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <h3 className="text-red-700 font-semibold mb-2">Error</h3>
        <p className="text-red-600">Missing access token for scraper</p>
      </div>
    );
  }

  return (
    <TriggerProvider accessToken={accessToken}>
      <RunTracker handleId={handleId} onComplete={onComplete} />
    </TriggerProvider>
  );
};
