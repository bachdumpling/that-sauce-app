"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useSearchParams } from "next/navigation";

// Configure NProgress
NProgress.configure({
  minimum: 0.1,
  showSpinner: false,
  trickleSpeed: 200,
  easing: "ease",
  speed: 500,
});

interface ProgressBarProps {
  // Minimum delay in ms before showing the progress bar
  delay?: number;
}

export const ProgressBar = ({ delay = 300 }: ProgressBarProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let routeChangeStarted = false;

    // When route changes, start the progress bar after delay
    const handleRouteChangeStart = () => {
      routeChangeStarted = true;
      timer = setTimeout(() => {
        if (routeChangeStarted) {
          NProgress.start();
        }
      }, delay);
    };

    const handleRouteChangeComplete = () => {
      routeChangeStarted = false;
      clearTimeout(timer);
      NProgress.done();
    };

    // Monitor route changes by watching pathname and searchParams
    handleRouteChangeStart();

    return () => {
      clearTimeout(timer);
      handleRouteChangeComplete();
    };
  }, [pathname, searchParams, delay]);

  return null; // This component doesn't render anything
};

// Export a function to handle fetch requests with progress
export const startFetchProgress = (delay = 300) => {
  let timer: NodeJS.Timeout;
  let isStarted = false;

  timer = setTimeout(() => {
    isStarted = true;
    NProgress.start();
  }, delay);

  return () => {
    clearTimeout(timer);
    if (isStarted) {
      NProgress.done();
    }
  };
};
