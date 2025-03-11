"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchRejectedCreators } from "@/lib/api/admin";
import { Creator, ViewMode } from "@/components/shared/types";
import { CreatorCard } from "@/components/shared/creator-card";

// Define the UnqualifiedCreator interface to match the database schema
interface UnqualifiedCreator {
  id: string;
  profile_id?: string;
  username: string;
  location?: string;
  bio?: string;
  primary_role?: string[];
  social_links?: Record<string, string>;
  years_of_experience?: number;
  created_at?: string;
  updated_at?: string;
  rejected_at: string;
  rejection_reason: string;
  rejected_by: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface RejectedCreatorsResponse {
  success: boolean;
  data: {
    creators: UnqualifiedCreator[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

const RejectedCreatorsPage = () => {
  const [creators, setCreators] = useState<UnqualifiedCreator[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("rejected");
  const router = useRouter();

  // Fetch rejected creators from the API
  const loadRejectedCreators = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchRejectedCreators(page, pagination.limit);

      if (response.success) {
        setCreators(response.data.creators);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error || "Failed to fetch rejected creators");
      }
    } catch (err: any) {
      console.error("Error fetching rejected creators:", err);
      setError(
        err.message || "An error occurred while fetching rejected creators"
      );
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadRejectedCreators(pagination.page);
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
    loadRejectedCreators(newPage);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search with backend (this would require a new API endpoint)
    console.log("Searching for:", searchQuery);
    loadRejectedCreators(1); // Reset to first page when searching
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    loadRejectedCreators(1);
  };

  // Switch between active and rejected creators
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "active") {
      router.push("/admin/creators");
    }
  };

  const handleGoBack = () => {
    router.push("/admin/creators");
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Rejected Creators</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creator Management
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="active">Active Creators</TabsTrigger>
          <TabsTrigger value="rejected">Unqualified Creators</TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 pr-10"
            placeholder="Search rejected creators..."
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
        <Button type="submit">Search</Button>
      </form>

      {/* Creator list */}
      <div className="space-y-6">
        {loading ? (
          // Loading skeletons
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-24 w-full mb-4 bg-gray-200 animate-pulse rounded-md"></div>
                  <div className="h-4 w-3/4 mb-2 bg-gray-200 animate-pulse rounded-md"></div>
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded-md"></div>
                </CardContent>
              </Card>
            ))
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : creators.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchQuery
                ? "No rejected creators found matching your search."
                : "No rejected creators found."}
            </AlertDescription>
          </Alert>
        ) : (
          creators.map((creator) => {
            // Convert UnqualifiedCreator to Creator format for CreatorCard
            const formattedCreator: Creator = {
              id: creator.id,
              username: creator.username,
              location: creator.location,
              bio: creator.bio,
              primary_role: creator.primary_role,
              social_links: creator.social_links,
              years_of_experience: creator.years_of_experience,
              status: 'rejected',
              email: creator.profiles?.email,
              created_at: creator.created_at,
              updated_at: creator.updated_at
            };
            
            return (
              <Card key={creator.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <CreatorCard 
                    creator={formattedCreator} 
                    viewMode="admin"
                  />
                  
                  <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
                    <h3 className="font-medium text-red-800 mb-1">Rejection Details</h3>
                    <p className="text-sm text-red-700 mb-2">
                      <strong>Reason:</strong> {creator.rejection_reason}
                    </p>
                    <p className="text-sm text-red-700">
                      <strong>Rejected on:</strong> {formatDate(creator.rejected_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                className={
                  pagination.page === 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 &&
                    page <= pagination.page + 1)
              )
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === pagination.page}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                className={
                  pagination.page === pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default RejectedCreatorsPage;
