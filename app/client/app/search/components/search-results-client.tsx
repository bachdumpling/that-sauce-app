"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api/search";
import { SearchResult } from "@/components/shared/types";
import { CreatorResultCard } from "@/components/shared/creator-result-card";
import { Filter } from "lucide-react";
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
  const [searchParams, setSearchParams] = useState({
    query,
    contentType,
    role,
    subjects: subjects || [],
    styles: selectedStyles,
    maxBudget,
    hasDocuments,
    documentsCount,
  });

  // Initial search when component mounts
  useEffect(() => {
    performSearch();
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When search parameters change, update the search params state
  useEffect(() => {
    // Only update search params and trigger a new search if something meaningful changed
    const newParams = {
      query,
      contentType,
      role,
      subjects: subjects || [],
      styles: selectedStyles,
      maxBudget,
      hasDocuments,
      documentsCount,
    };

    // Check if anything important has changed
    const hasChanges =
      searchParams.query !== newParams.query ||
      searchParams.contentType !== newParams.contentType ||
      searchParams.role !== newParams.role ||
      searchParams.maxBudget !== newParams.maxBudget ||
      JSON.stringify(searchParams.subjects) !==
        JSON.stringify(newParams.subjects) ||
      JSON.stringify(searchParams.styles) !== JSON.stringify(newParams.styles);

    if (hasChanges) {
      setSearchParams(newParams);
      performSearch();
    }
  }, [
    query,
    role,
    contentType,
    subjects,
    selectedStyles,
    maxBudget,
    page,
    limit,
  ]);

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
        maxBudget,
        hasDocuments,
        documentCount: documentsCount,
      });

      // Validate the response structure
      if (
        data &&
        data.success !== false &&
        data.data &&
        Array.isArray(data.data.results)
      ) {
        setResults(data);
      } else if (data && data.success === false) {
        // Handle error response
        console.error("Search error:", data.error || "Unknown error");
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
      <div className="flex items-center justify-between space-x-2 mb-6">
        {/* TODO: going back from result to search should keep the same refinements as well dont remove it since they can go back and refine and
        keep searching */}
        <Button variant="ghost" onClick={handleBackToSearch}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
        </Button>
        <Button variant="outline" size="sm" className="rounded-full px-4 py-6">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Search summary */}
      <div className="flex flex-row items-center gap-6 pb-10">
        <div className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-[16px] w-full h-full">
          <div className="flex w-full">
            <div className="p-4 border-r border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400">Role</h3>
              <div className="flex h-full items-center gap-2">
                <p className="text-lg font-semibold">{role}</p>
              </div>
            </div>

            <div className="p-4 border-r border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400">Description</h3>
              <div className="flex h-full items-center gap-2">
                <p className="text-md">{query}</p>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-zinc-400">Style</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStyles.map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-200 border-none rounded-full"
                  >
                    {style}
                  </Button>
                ))}
                {selectedStyles.length === 0 && (
                  <p className="text-zinc-400">No styles selected</p>
                )}
              </div>
            </div>
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
