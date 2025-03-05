import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch creators from the API
  const loadCreators = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchCreators(page, pagination.limit);

      if (response.success) {
        setCreators(response.data.creators);
        setPagination(response.data.pagination);
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
  };

  // Initial data load
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    setPagination((prev) => ({
      ...prev,
      page,
    }));
    loadCreators(page);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
    loadCreators(newPage);

    // Update URL with the new page parameter
    const url = new URL(window.location.href);
    url.searchParams.set("page", newPage.toString());
    router.push(url.pathname + url.search);

    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search with backend (this would require a new API endpoint)
    console.log("Searching for:", searchQuery);

    // Update URL to page 1 when searching
    const url = new URL(window.location.href);
    url.searchParams.set("page", "1");
    router.push(url.pathname + url.search);

    loadCreators(1); // Reset to first page when searching
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");

    // Update URL to page 1 when clearing search
    const url = new URL(window.location.href);
    url.searchParams.set("page", "1");
    router.push(url.pathname + url.search);

    loadCreators(1);
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

  return (
    <div className="container mx-auto py-8 px-4">
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="aspect-square bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <Card key={creator.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {creator.username}
                      </h2>
                      <div className="flex flex-col md:flex-row gap-2 text-sm text-muted-foreground mt-1">
                        {creator.location && <span>{creator.location}</span>}
                        {creator.primary_role && (
                          <span className="md:before:content-['•'] md:before:mx-2 md:before:text-muted-foreground">
                            {creator.primary_role}
                          </span>
                        )}
                      </div>

                      {creator.creative_fields &&
                        creator.creative_fields.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {creator.creative_fields.map((field) => (
                              <span
                                key={field}
                                className="bg-secondary/50 rounded-md px-2 py-1 text-xs text-muted-foreground"
                              >
                                {field.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    <Button
                      onClick={() => viewCreator(creator.id)}
                      variant="outline"
                      className="mt-2 md:mt-0"
                    >
                      Review Creator
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {creator.projects?.map((project) => (
                      <div key={project.id} className="space-y-2">
                        {project.images && project.images[0] ? (
                          <div className="aspect-square rounded-md overflow-hidden bg-muted">
                            <Image
                              src={
                                project.images[0].resolutions?.high_res ||
                                project.images[0].url
                              }
                              alt={project.title}
                              width={300}
                              height={300}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              No image
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-medium truncate">
                          {project.title}
                        </p>
                      </div>
                    ))}

                    {!creator.projects || creator.projects.length === 0 ? (
                      <div className="col-span-full text-center p-4 text-muted-foreground">
                        No projects available
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No creators found
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
    </div>
  );
};

export default CreatorManagementPage;
