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
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { fetchCreators } from "@/lib/api/admin";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("active");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const previousSearchRef = useRef("");
  const previousPageRef = useRef(1);

  // Fetch creators from the API
  const loadCreators = useCallback(
    async (page = 1, search = searchQuery) => {
      // Normalize the search parameter - explicitly set to undefined if empty
      const normalizedSearch =
        search === undefined ? undefined : (search || "").trim();
      const searchParam =
        normalizedSearch === "" ? undefined : normalizedSearch;

      console.log(
        `Loading creators - Page: ${page}, Search: "${normalizedSearch || "ALL"}", Timestamp: ${Date.now()}`
      );

      setLoading(true);
      setError(null);

      try {
        console.log("Before API call to fetchCreators");
        const response = await fetchCreators(
          page,
          pagination.limit,
          searchParam
        );
        console.log("API response received:", response);

        if (response.success) {
          console.log(`Loaded ${response.data.creators.length} creators`);
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
        console.error("Error fetching creators:", err);
        setError(err.message || "An error occurred while fetching creators");
        setCreators([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, pagination.limit]
  );

  // Initial load when component mounts
  useEffect(() => {
    console.log("Component mounted - Initial load triggered");
    loadCreators(1);

    // Debug: Check if this effect is running
    return () => {
      console.log("Component unmounted - Initial load cleanup");
    };
  }, [loadCreators]);

  // Initial data load and handle URL parameter changes
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const urlSearchQuery = searchParams.get("search") || "";

    // Only reload if the search parameters have actually changed
    if (
      previousSearchRef.current === urlSearchQuery &&
      previousPageRef.current === page
    ) {
      return;
    }

    console.log(
      `URL parameters changed - Page: ${page}, Search: "${urlSearchQuery || "ALL"}"`
    );

    // Update refs with current values
    previousSearchRef.current = urlSearchQuery;
    previousPageRef.current = page;

    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    } else if (searchQuery !== "") {
      setSearchQuery("");
    }

    setPagination((prev) => ({
      ...prev,
      page,
    }));

    // Pass undefined for empty search to ensure we load all creators
    const searchParam = urlSearchQuery === "" ? undefined : urlSearchQuery;
    console.log(
      `Loading creators with searchParam: ${searchParam === undefined ? "undefined (ALL)" : `"${searchParam}"`}`
    );
    loadCreators(page, searchParam);
  }, [searchParams, searchQuery, loadCreators]);

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

    loadCreators(newPage, previousSearchRef.current);

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

    console.log(`Searching for: "${trimmedQuery || "ALL"}"`);

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
    console.log(
      `Searching with searchParam: ${searchParam === undefined ? "undefined (ALL)" : `"${searchParam}"`}`
    );
    loadCreators(1, searchParam);
  };

  // Clear search
  const clearSearch = () => {
    // Don't do anything if the search is already empty
    if (previousSearchRef.current === "") {
      return;
    }

    console.log("Clearing search - Loading ALL creators");

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
  const viewCreator = (id) => {
    // Include the current page in the URL when navigating to creator detail
    router.push(`/admin/creators/${id}?page=${pagination.page}`);
  };

  // Switch between active and rejected creators
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rejected") {
      router.push("/admin/creators/rejected");
    }
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
        <h1 className="text-2xl font-bold mb-4">Creator Management</h1>

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
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="creator" />
      ) : (
        <div className="space-y-6">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                viewMode="admin"
                onReview={() => viewCreator(creator.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No creators found.
            </div>
          )}

          {pagination.totalPages > 1 && (
            <Pagination>
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
                      (page >= pagination.page - 5 &&
                        page <= pagination.page + 5)
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
