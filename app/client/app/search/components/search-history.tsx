"use client";

import { useState, useEffect } from "react";
import {
  SearchHistoryEntry,
  getSearchHistory,
  deleteSearchHistoryEntry,
  clearSearchHistory,
} from "@/lib/api/search";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Clock, X, Trash2, LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export function SearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (err) {
        console.error("Error checking authentication:", err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch search history
  const fetchHistory = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await getSearchHistory();
      // console.log("Search history response:", response);

      if (response && Array.isArray(response.history)) {
        setHistory(response.history);
      } else {
        console.error("Invalid history format:", response);
        setHistory([]);
        setError("Received invalid history data format");
      }
    } catch (err) {
      if (
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized")
      ) {
        setError("You need to be logged in to view your search history.");
      } else {
        setError("Failed to load search history. Please try again later.");
      }
      console.error("Error fetching search history:", err);
      // Ensure history is always an array even on error
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a single history entry
  const handleDeleteEntry = async (id: string) => {
    if (!id) return;

    try {
      setError(null);
      await deleteSearchHistoryEntry(id);
      // Remove the deleted entry from the state
      setHistory(history.filter((entry) => entry.id !== id));
    } catch (err) {
      setError("Failed to delete entry. Please try again.");
      console.error("Error deleting search history entry:", err);
    }
  };

  // Clear all search history
  const handleClearHistory = async () => {
    try {
      setError(null);
      await clearSearchHistory();
      setHistory([]);
    } catch (err) {
      setError("Failed to clear history. Please try again.");
      console.error("Error clearing search history:", err);
    }
  };

  // Execute search from history
  const handleSearchFromHistory = (query: string, contentType: string = "all") => {
    // Include both required parameters: role and content_type 
    // Using contentType from the search history entry if it's not "all"
    const contentTypeParam = contentType && contentType !== "all" 
      ? `&content_type=${contentType}` 
      : "";
      
    router.push(`/search/results?q=${encodeURIComponent(query)}&role=designer${contentTypeParam}`);
    return undefined;
  };

  // Fetch history when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else if (isAuthenticated === false) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Show login prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Search History</CardTitle>
          <CardDescription>Your recent searches on That Sauce</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-center space-y-4">
            <LogIn className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-xl font-semibold">
              Sign in to view your search history
            </h3>
            <p className="text-muted-foreground max-w-md">
              Your search history is only available when you're signed in. Sign
              in to keep track of your searches.
            </p>
            <Link href="/auth/login">
              <Button className="mt-2">Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Search History</span>
          <div className="flex gap-2">
            {process.env.NODE_ENV !== "production" && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                className="text-xs"
              >
                Refresh History
              </Button>
            )}
            {history && history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear search history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your entire search history.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory}>
                      Yes, clear all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardTitle>
        <CardDescription>Your recent searches on That Sauce</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-destructive text-center p-4">{error}</div>
        ) : !history || history.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No search history found. Start searching to see your history here.
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 group"
              >
                <button
                  onClick={() => handleSearchFromHistory(entry.query, entry.content_type)}
                  className="flex items-center flex-1 text-left"
                >
                  <span className="font-medium">{entry.query}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({entry.results_count} results)
                  </span>
                  <span className="ml-auto flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(entry.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(entry.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
