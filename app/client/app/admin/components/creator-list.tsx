"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search,
  X,
  Users,
  Image as ImageIcon,
  Video,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  fetchCreators,
  fetchCreatorStats,
  CreatorStats,
} from "@/lib/api/admin";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatorCard } from "@/components/shared/creator-card";
import { Creator } from "@/components/shared/types";
import { Skeleton } from "@/components/ui/skeleton";

const CreatorManagementPage = () => {
  const [creators, setCreators] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [stats, setStats] = useState<CreatorStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalProjects: 0,
    totalImages: 0,
    totalVideos: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const previousSearchRef = useRef("");
  const previousPageRef = useRef(1);

  // Fetch creators from the API
  const loadCreators = useCallback(
    async (page = 1, search = searchQuery, status = statusFilter) => {
      // Normalize the search parameter - explicitly set to undefined if empty
      const normalizedSearch =
        search === undefined ? undefined : (search || "").trim();
      const searchParam =
        normalizedSearch === "" ? undefined : normalizedSearch;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchCreators(
          page,
          pagination.limit,
          searchParam,
          status !== "all" ? status : undefined
        );

        if (response.success) {
          setCreators(response.data.creators);
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages:
              response.data.pagination.totalPages ||
              response.data.pagination.pages ||
              0,
          });
        } else {
          throw new Error(response.error || "Failed to fetch creators");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching creators");
        setCreators([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, pagination.limit, statusFilter]
  );

  // Fetch creator stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const statsData = await fetchCreatorStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching creator stats:", error);
      // Keep the default values in the state
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch creators and stats on initial load
  useEffect(() => {
    loadCreators(1);
    fetchStats();
  }, [loadCreators]);

  // Initial data load and handle URL parameter changes
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const urlSearchQuery = searchParams.get("search") || "";
    const urlStatusFilter = searchParams.get("status") || "pending";

    // Only reload if the search parameters have actually changed
    if (
      previousSearchRef.current === urlSearchQuery &&
      previousPageRef.current === page &&
      statusFilter === urlStatusFilter
    ) {
      return;
    }

    // Update refs with current values
    previousSearchRef.current = urlSearchQuery;
    previousPageRef.current = page;

    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    } else if (searchQuery !== "") {
      setSearchQuery("");
    }

    if (urlStatusFilter !== statusFilter) {
      setStatusFilter(urlStatusFilter);
    }

    setPagination((prev) => ({
      ...prev,
      page,
    }));

    // Pass undefined for empty search to ensure we load all creators
    const searchParam = urlSearchQuery === "" ? undefined : urlSearchQuery;
    loadCreators(
      page,
      searchParam,
      urlStatusFilter !== "all" ? urlStatusFilter : undefined
    );
  }, [searchParams, searchQuery, loadCreators, statusFilter]);

  // Handle page change
  const handlePageChange = (newPage) => {
    // Don't do anything if the page hasn't changed
    if (previousPageRef.current === newPage) {
      return;
    }

    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));

    // Update ref with new page
    previousPageRef.current = newPage;

    // Update URL with the new page parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    // Use Next.js router to update URL without full page reload
    router.push(`${pathname}?${params.toString()}`);

    // Pass the current status filter when loading creators
    loadCreators(
      newPage,
      previousSearchRef.current,
      statusFilter !== "all" ? statusFilter : undefined
    );

    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();

    const trimmedQuery = searchQuery.trim();

    // Don't do anything if the search query hasn't changed
    if (trimmedQuery === previousSearchRef.current) {
      return;
    }

    // Update URL with search parameter and reset to page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (trimmedQuery !== "") {
      params.set("search", trimmedQuery);
    } else {
      params.delete("search");
    }

    // Update refs with new values
    previousSearchRef.current = trimmedQuery;
    previousPageRef.current = 1;

    // Use Next.js router to update URL without full page reload
    router.push(`${pathname}?${params.toString()}`);

    // Pass undefined for empty search to ensure we load all creators
    const searchParam = trimmedQuery === "" ? undefined : trimmedQuery;
    loadCreators(1, searchParam);
  };

  // Clear search
  const clearSearch = () => {
    // Don't do anything if the search is already empty
    if (previousSearchRef.current === "") {
      return;
    }

    setSearchQuery("");
    previousSearchRef.current = "";

    // Update URL to remove search parameter and reset to page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.delete("search");

    // Use Next.js router to update URL without full page reload
    router.push(`${pathname}?${params.toString()}`);

    // Load all creators (with undefined search parameter)
    loadCreators(1, undefined);
  };

  // Navigate to creator detail page
  const viewCreator = (creator) => {
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());

    // Preserve the current status filter
    if (statusFilter !== "pending") {
      params.set("status", statusFilter);
    }

    router.push(`/admin/creators/${creator.username}?${params.toString()}`);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);

    // Update URL with status parameter and reset to page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    // Use Next.js router to update URL without full page reload
    router.push(`${pathname}?${params.toString()}`);

    loadCreators(1, searchQuery, status);
  };

  // Function to open the image modal
  const openImageModal = (image, e) => {
    e.stopPropagation(); // Prevent navigating to creator detail
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Creator Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loadingStats}
            >
              {loadingStats ? "Refreshing..." : "Refresh Stats"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              {loadingStats ? (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Total Creators
                  </p>
                  <div className="h-8 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Creators
                  </p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-amber-600">
                      {stats.pending || 0} pending
                    </span>
                    <span className="text-green-600">
                      {stats.approved || 0} approved
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <FolderOpen className="h-6 w-6 text-blue-500" />
              </div>
              {loadingStats ? (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Total Projects
                  </p>
                  <div className="h-8 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Projects
                  </p>
                  <h3 className="text-2xl font-bold">{stats.totalProjects}</h3>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground">
                      {stats.approved > 0
                        ? (stats.totalProjects / stats.approved).toFixed(1)
                        : "0"}{" "}
                      per creator
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <ImageIcon className="h-6 w-6 text-purple-500" />
              </div>
              {loadingStats ? (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Images</p>
                  <div className="h-8 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Total Images</p>
                  <h3 className="text-2xl font-bold">{stats.totalImages}</h3>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground">
                      {stats.totalProjects > 0
                        ? (stats.totalImages / stats.totalProjects).toFixed(1)
                        : "0"}{" "}
                      per project
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Video className="h-6 w-6 text-orange-500" />
              </div>
              {loadingStats ? (
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Videos</p>
                  <div className="h-8 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Total Videos</p>
                  <h3 className="text-2xl font-bold">{stats.totalVideos}</h3>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground">
                      {stats.totalProjects > 0
                        ? (stats.totalVideos / stats.totalProjects).toFixed(1)
                        : "0"}{" "}
                      per project
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleStatusFilterChange("pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleStatusFilterChange("approved")}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => router.push("/admin/creators/rejected")}
            >
              Unqualified
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10 pr-10"
              placeholder="Search creators..."
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
          <Button type="submit" className="w-full sm:w-auto">Search</Button>
        </form>
      </div>

      {/* Creator list */}
      <div className="space-y-6">
        {loading ? (
          <Skeleton variant="creator" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : creators.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchQuery
                ? "No creators found matching your search."
                : "No creators found."}
            </AlertDescription>
          </Alert>
        ) : (
          creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              viewMode="admin"
              onEdit={() => viewCreator(creator)}
            />
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                className={
                  pagination.page === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 5 && page <= pagination.page + 5)
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

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="w-full p-0 overflow-hidden bg-black/80 border-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>

          <div className="w-full h-[600px] overflow-auto">
            {selectedImage && (
              <Image
                src={selectedImage.resolutions?.high_res || selectedImage.url}
                alt="Project image"
                fill
                className="object-contain p-10"
                priority
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorManagementPage;
