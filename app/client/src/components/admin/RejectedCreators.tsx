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

const RejectedCreatorsPage = () => {
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
    } catch (err) {
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
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
    loadRejectedCreators(newPage);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  // Handle search
  const handleSearch = (e) => {
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
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "active") {
      router.push("/admin/creators");
    }
  };

  const handleGoBack = () => {
    router.push("/admin/creators");
  };

  // Format date for display
  const formatDate = (dateString) => {
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mr-2 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Creator Management</h1>
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
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <Card key={creator.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{creator.username}</CardTitle>
                  <CardDescription>
                    Rejected on {formatDate(creator.rejected_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Rejection Reason:
                      </h3>
                      <p className="text-foreground">
                        {creator.rejection_reason}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Rejected By:
                      </h3>
                      <p className="text-foreground">
                        {creator.profiles?.first_name
                          ? `${creator.profiles.first_name} ${creator.profiles.last_name || ""}`
                          : "Unknown Admin"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No rejected creators found
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
      )}
    </div>
  );
};

export default RejectedCreatorsPage;
