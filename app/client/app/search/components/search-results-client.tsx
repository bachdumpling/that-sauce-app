"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";
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
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  useEffect(() => {
    performSearch();
  }, [query, role, contentType, subjects, page, limit]);

  // Reset refinements when role changes
  useEffect(() => {
    // Clear selected styles when role changes
    setSelectedStyles([]);
    // Reset to page 1 when search parameters change
    setPage(1);
  }, [role, contentType, subjects]);

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
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
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
        <Button variant="ghost" onClick={handleBackToSearch}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
        </Button>
      </div>

      {/* Search summary */}
      <div className="grid grid-cols-3 gap-8 border-b pb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
          <p className="text-xl font-bold">{role}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Description
          </h3>
          <p className="text-xl">{query}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Style</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {selectedStyles.map((style) => (
              <Button
                key={style}
                variant="default"
                className="bg-black text-white"
                onClick={() => handleStyleToggle(style)}
              >
                {style} <X className="h-4 w-4 ml-2" />
              </Button>
            ))}
            {selectedStyles.length === 0 && <p>No styles selected</p>}
          </div>
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
