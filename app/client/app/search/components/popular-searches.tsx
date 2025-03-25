"use client";

import { useState, useEffect } from "react";
import { PopularSearch, getPopularSearches } from "@/lib/api/search";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PopularSearches() {
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch popular searches
  const fetchPopularSearches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPopularSearches(5); // Get top 5 popular searches
      setPopularSearches(response.searches || []);
    } catch (err) {
      if (
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized")
      ) {
        // For popular searches, we might still want to show a generic message
        // instead of an auth error since this could be public data
        setError("Unable to load popular searches right now.");
      } else {
        setError("Failed to load popular searches.");
      }
      console.error("Error fetching popular searches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search click
  const handleSearchClick = (query: string) => {
    router.push(`/search/results?q=${encodeURIComponent(query)}`);
  };

  // Retry loading
  const handleRetry = () => {
    fetchPopularSearches();
  };

  useEffect(() => {
    fetchPopularSearches();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Popular Searches
        </CardTitle>
        <CardDescription>See what others are searching for</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center space-y-3 p-4">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        ) : popularSearches.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No popular searches found.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 py-2"
                onClick={() => handleSearchClick(search.query)}
                title={search.similarity !== undefined ? `Similarity: ${(search.similarity * 100).toFixed(1)}%` : undefined}
              >
                {search.query}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({search.count})
                </span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
