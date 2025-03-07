"use client";

import { useState, useEffect } from "react";
import { Search, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorCard } from "@/components/creator-card";
import { Toggle } from "@/components/ui/toggle";
import { useRouter, useSearchParams } from "next/navigation";
import { searchCreators } from "@/lib/api/search"; 

interface SearchResults {
  success: boolean;
  data: {
    results: Array<{
      profile: {
        id: string;
        username: string;
        location: string;
        creative_fields: string[];
        website?: string;
        social_links: Record<string, string>;
      };
      score: number;
      projects: Array<{
        id: string;
        title: string;
        behance_url?: string;
        images?: Array<{
          id: string;
          url: string;
          alt_text: string;
          resolutions: {
            high_res?: string;
            low_res?: string;
          };
        }>;
        videos?: Array<{
          id: string;
          title: string;
          vimeo_id: string;
          similarity_score: number;
        }>;
      }>;
    }>;
    page: number;
    limit: number;
    total: number;
    content_type: "all" | "videos";
  };
}

interface SearchClientWrapperProps {
  initialQuery: string;
  initialContentType: "all" | "videos";
  exampleQueries: string[];
}

export function SearchClientWrapper({
  initialQuery,
  initialContentType,
  exampleQueries,
}: SearchClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideosOnly, setShowVideosOnly] = useState(
    initialContentType === "videos"
  );

  // Perform initial search if query is provided
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialContentType);
    }
  }, [initialQuery, initialContentType]);

  const handleExampleClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query, showVideosOnly ? "videos" : "all");
    updateUrl(query, showVideosOnly ? "videos" : "all");
  };

  const performSearch = async (
    query: string,
    contentType: "all" | "videos"
  ) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await searchCreators({
        q: query,
        contentType,
      });
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrl = (query: string, contentType: "all" | "videos") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    if (contentType === "videos") {
      params.set("content_type", "videos");
    } else {
      params.delete("content_type");
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, showVideosOnly ? "videos" : "all");
    updateUrl(searchQuery, showVideosOnly ? "videos" : "all");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults(null);
    router.push("/search");
  };

  const handleToggleVideosOnly = (pressed: boolean) => {
    setShowVideosOnly(pressed);
    if (searchQuery) {
      performSearch(searchQuery, pressed ? "videos" : "all");
      updateUrl(searchQuery, pressed ? "videos" : "all");
    }
  };

  return (
    <>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="w-full pl-10 pr-10 h-12"
            placeholder="Find a photographer who specializes in..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Toggle
            pressed={showVideosOnly}
            onPressedChange={handleToggleVideosOnly}
            className="h-12 px-4"
            aria-label="Toggle video results"
          >
            <Video className="h-4 w-4 mr-2" />
            Videos Only
          </Toggle>
          <Button
            type="submit"
            className="h-12"
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      {/* Example Queries */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground px-1">Try searching for:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-sm bg-secondary/50"
              onClick={() => handleExampleClick(query)}
            >
              {query}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-32 w-full" />
            ))}
          </div>
        ) : results?.data.results.length ? (
          results.data.results.map((result) => (
            <div key={result.profile.id}>
              <CreatorCard
                result={result}
                showScores={results.data.content_type === "videos"}
              />
            </div>
          ))
        ) : searchQuery ? (
          <div className="text-center py-8 text-muted-foreground">
            No results found. Try adjusting your search terms.
          </div>
        ) : null}
      </div>
    </>
  );
}
