"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface BackButtonProps {
  fallbackPath: string;
  fallbackText: string;
  className?: string;
}

export function BackButton({
  fallbackPath,
  fallbackText,
  className = "",
}: BackButtonProps) {
  const router = useRouter();
  const [displayText, setDisplayText] = useState(fallbackText);
  const [useHistory, setUseHistory] = useState(false);

  useEffect(() => {
    // Check if we have history to go back to
    if (window.history.length > 1) {
      setUseHistory(true);

      // Try to get referrer information if available
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          const pathSegments = referrerUrl.pathname.split("/").filter(Boolean);

          if (pathSegments.length > 0) {
            // Get the last meaningful segment
            const lastSegment = pathSegments[pathSegments.length - 1];

            // Make it more readable by replacing dashes/underscores with spaces and capitalizing
            const formattedSegment = lastSegment
              .replace(/-|_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());

            setDisplayText(formattedSegment);
          }
        } catch (e) {
          // Fallback to default if URL parsing fails
          console.error("Error parsing referrer URL:", e);
        }
      }
    }
  }, []);

  const handleGoBack = () => {
    if (useHistory) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleGoBack}
      className={`inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 p-0 ${className}`}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Back!
    </Button>
  );
}
