"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api/search";
import { SearchResult } from "@/components/shared/types";
import Image from "next/image";

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
    params.set("q", query);
    params.set("role", role);
    if (contentType !== "all") {
      params.set("content_type", contentType);
    }
    if (subjects.length > 0) {
      params.set("subjects", subjects.join(","));
    }
    if (hasDocuments) {
      params.set("has_docs", "true");
      if (documentsCount) {
        params.set("docs_count", documentsCount.toString());
      }
    }
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
            <div key={creator.profile.id} className="border-b pb-8">
              <div className="flex flex-col gap-8">
                {/* Creator info section */}
                <div className="flex w-full justify-between items-center">
                  {/* Creator Contact column */}
                  <div className="flex flex-col items-start gap-4">
                    {/* Avatar and name and username */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                        {/* Placeholder avatar */}
                        <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-bold text-xl">
                            {creator.profile && creator.profile.username
                              ? creator.profile.username.charAt(0).toUpperCase()
                              : "C"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {creator.profile && creator.profile.username
                            ? creator.profile.username
                            : "Creator"}
                        </h2>
                        <span className="text-sm text-gray-500">
                          @
                          {creator.profile && creator.profile.username
                            ? creator.profile.username.toLowerCase()
                            : "creator"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {creator.profile && creator.profile.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{creator.profile.location}</span>
                        </div>
                      )}
                      <span className="px-4 py-1 border rounded-md text-sm">
                        {role}
                      </span>
                      <div className="flex gap-4">
                        {/* Social icons - using globe icon as placeholder */}
                        {creator.profile &&
                          creator.profile.social_links &&
                          Object.entries(creator.profile.social_links).map(
                            ([platform, url], index) => (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100"
                              >
                                <span className="sr-only">{platform}</span>
                                {platform === "website" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                  </svg>
                                ) : platform === "linkedin" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                                  </svg>
                                ) : platform === "behance" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M10 10.2h3.3c0-.2-.1-.9-1.7-.9-1.4 0-1.7.8-1.6 .9zm7.9 1.4c-1.1 0-1.5.6-1.6 .9h3.1c-.1-.3-.4-.9-1.5-.9zm-7.9 1.8h3.3c0-.2-.3-.9-1.7-.9-1.5 0-1.7.7-1.6.9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 16h-6v-7h5.7c1.8 0 2.8.9 2.8 2.2 0 .9-.5 1.7-1.6 2 1.1.2 1.9 1 1.9 2.3 0 1.5-1.2 2.5-2.8 2.5zm8-3h-6c0 1.8 1.7 1.8 2 1.8 .3 0 .7-.1.8-.3h2.9c-.4 1.4-1.6 2.2-3.7 2.2-2.5 0-4.1-1.3-4.1-4 0-2.2 1.4-4 4.1-4 2.9 0 4 1.7 4 4.1v.2zm-3-4h-4V8h4v3z"></path>
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                  </svg>
                                )}
                              </a>
                            )
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex flex-row justify-center items-center h-full w-fit gap-2 mt-2">
                    <Link
                      href={
                        creator.profile && creator.profile.username
                          ? `/profile/${creator.profile.username}`
                          : "#"
                      }
                    >
                      <Button
                        variant="outline"
                        className="border-black hover:bg-black hover:text-white rounded-full px-8 py-6"
                        disabled={!creator.profile || !creator.profile.username}
                      >
                        View Profile
                      </Button>
                    </Link>

                    <Button
                      variant="default"
                      className="bg-black rounded-full px-8 py-6"
                    >
                      Add to Project
                    </Button>
                  </div>
                </div>

                {/* Creator projects column */}
                <div className="col-span-2">
                  <div className="flex flex-row items-end gap-4 h-60 overflow-x-auto">
                    {creator.content && creator.content.length > 0 ? (
                      creator.content.map(
                        (content, index) =>
                          index < 10 && (
                            <div
                              key={content.id}
                              className="flex-none relative"
                              style={{ height: "100%" }}
                            >
                              {content.url ? (
                                <div className="h-full">
                                  <Image
                                    src={content.url}
                                    alt={
                                      content.title ||
                                      content.project_title ||
                                      "Content"
                                    }
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="h-full w-auto object-contain"
                                    style={{ objectPosition: "bottom" }}
                                  />
                                </div>
                              ) : (
                                <div className="h-full w-40 flex items-center justify-center bg-gray-100 rounded-md">
                                  <span className="text-gray-400">
                                    No image
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                      )
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-gray-400">
                          No content available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
