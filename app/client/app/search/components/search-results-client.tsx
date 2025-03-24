"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api/search";
import { SearchResult } from "@/components/shared/types";
import { CreatorResultCard } from "@/components/shared/creator-result-card";

interface SearchResultsData {
  success: boolean;
  data: {
    results: SearchResult[];
    page: number;
    limit: number;
    total: number;
    query: string;
    content_type: "all" | "videos" | "images";
    processed_query?: string;
  };
}

interface SearchResultsClientProps {
  query: string;
  role: string;
  contentType: "all" | "videos" | "images";
  subjects: string[];
  styles: string[];
  maxBudget?: number;
  initialLimit: number;
  initialPage: number;
  hasDocuments?: boolean;
  documentsCount?: number;
}

export function SearchResultsClient({
  query,
  role,
  contentType,
  subjects,
  styles,
  maxBudget,
  initialLimit,
  initialPage,
  hasDocuments,
  documentsCount,
}: SearchResultsClientProps) {
  const router = useRouter();
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(styles || []);

  useEffect(() => {
    performSearch();
  }, [query, role, contentType, subjects, selectedStyles, page, limit]);

  // Reset refinements when role changes
  useEffect(() => {
    // Update selected styles when prop changes
    setSelectedStyles(styles || []);
    // Reset to page 1 when search parameters change
    setPage(1);
  }, [styles, role, contentType, subjects]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const data = await search({
        q: query,
        contentType,
        limit,
        page,
        role,
        subjects,
        styles: selectedStyles,
        hasDocuments,
        documentCount: documentsCount,
      });

      // Validate the response structure
      if (
        data &&
        data.success &&
        data.data &&
        Array.isArray(data.data.results)
      ) {
        setResults(data);
      } else {
        console.error("Invalid search response format:", data);
        setResults({
          success: true,
          data: {
            results: [],
            page: page,
            limit: limit,
            total: 0,
            query: query,
            content_type: contentType,
          },
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults({
        success: true,
        data: {
          results: [],
          page: page,
          limit: limit,
          total: 0,
          query: query,
          content_type: contentType,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleToggle = (style: string) => {
    const updatedStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];

    setSelectedStyles(updatedStyles);

    // Update URL with new styles
    const params = new URLSearchParams(window.location.search);
    if (updatedStyles.length > 0) {
      params.set("styles", updatedStyles.join(","));
    } else {
      params.delete("styles");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  const handleBackToSearch = () => {
    const params = new URLSearchParams();

    // Keep only essential parameters when going back to search
    params.set("q", query);
    params.set("role", role);

    // Only include content type if not the default
    if (contentType !== "all") {
      params.set("content_type", contentType);
    }

    // Only include subjects if they exist and are not empty
    if (subjects && subjects.length > 0) {
      params.set("subjects", subjects.join(","));
    }

    // Include selected styles
    if (selectedStyles.length > 0) {
      params.set("styles", selectedStyles.join(","));
    }

    // Include budget parameter if present
    if (maxBudget !== undefined) {
      params.set("max_budget", maxBudget.toString());
    }

    // Include document parameters if present
    if (hasDocuments) {
      params.set("has_docs", "true");
      if (documentsCount) {
        params.set("docs_count", documentsCount.toString());
      }
    }

    // Navigate back to search with parameters
    router.push(`/search?${params.toString()}`);
  };

  if (isLoading && !results) {
    return <Skeleton variant="creator" className="h-[800px] w-full" />;
  }

  return (
    <div className="space-y-8">
      {/* Header with search details */}
      <div className="flex items-center space-x-2">
        {/* TODO: going back from result to search should keep the same refinements as well dont remove it since they can go back and refine and
        keep searching */}
        <Button variant="ghost" onClick={handleBackToSearch}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
        </Button>
      </div>

      {/* Search summary */}
      <div className="border-b pb-6 space-y-6">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
            <p className="text-xl font-bold">{role}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Budget
            </h3>
            <div className="flex items-center mt-1">
              {maxBudget ? (
                <div className="flex items-center space-x-1 text-base">
                  <span>$ Up to {maxBudget}</span>
                  <span className="text-base text-muted-foreground ml-1">
                    /hr
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">No budget specified</p>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground">Style</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedStyles.map((style) => (
                <Button
                  key={style}
                  variant="default"
                  className="bg-black text-white"
                  onClick={() => handleStyleToggle(style)}
                >
                  {style}
                </Button>
              ))}
              {selectedStyles.length === 0 && (
                <p className="text-muted-foreground">No styles selected</p>
              )}
            </div>
          </div>
        </div>

        <div className="">
          <h3 className="text-sm font-medium text-muted-foreground">
            Description
          </h3>
          <p className="text-lg">{query}</p>
        </div>
      </div>

      {/* Results */}
      {results && results.data.results.length > 0 ? (
        <div className="space-y-14">
          {results.data.results.map((creator) => (
            <CreatorResultCard
              key={creator.profile.id}
              creator={creator}
              role={role}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-2">No results found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search criteria or explore different terms.
          </p>
          <Button onClick={handleBackToSearch}>Back to Search</Button>
        </div>
      )}
    </div>
  );
}
