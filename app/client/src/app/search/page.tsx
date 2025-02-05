// src/app/search/page.tsx
"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCreators } from "@/lib/utils/api";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { CreatorCard } from "@/components/CreatorCard";

const EXAMPLE_QUERIES = [
  "high fashion photographers",
  "portrait photographers monochrome aesthetic",
  "film photographers street style nyc architecture",
];

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
        images: Array<{
          id: string;
          url: string;
          alt_text: string;
          resolutions: {
            high_res?: string;
            low_res?: string;
          };
        }>;
      }>;
    }>;
    page: number;
    limit: number;
    total: number;
  };
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExampleClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await searchCreators({
        q: query,
      });
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Creative Talent</h1>
          <p className="text-muted-foreground">
            Discover photographers and creators based on their style and
            expertise
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2"
        >
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
          <Button
            type="submit"
            className="h-12"
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Example Queries */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground px-1">
            Try searching for:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((query, index) => (
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
            <LoadingSkeleton />
          ) : results?.data.results.length ? (
            results.data.results.map((result) => (
              <CreatorCard key={result.profile.id} result={result} />
            ))
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found. Try adjusting your search terms.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
