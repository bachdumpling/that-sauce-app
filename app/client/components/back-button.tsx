"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface BackButtonProps {
  fallbackPath: string;
  className?: string;
}

export function BackButton({ fallbackPath, className = "" }: BackButtonProps) {
  const router = useRouter();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if we have browser history to go back to
    setHasHistory(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (hasHistory) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleGoBack}
      className={`inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 p-0 pl-2 pr-4 ${className}`}
    >
      <ChevronLeft className="h-4 w-4 mr-1 mb-1" />
      Back
    </Button>
  );
}
