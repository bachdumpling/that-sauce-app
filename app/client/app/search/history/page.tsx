import { Metadata } from "next";
import { SearchHistory } from "../components/search-history";
import { PopularSearches } from "../components/popular-searches";

export const metadata: Metadata = {
  title: "Search History | That Sauce",
  description: "View your search history and popular searches on That Sauce",
};

export default function SearchHistoryPage() {
  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6">Search Insights</h1>

      <div className="flex flex-col gap-6">
        <div className="flex-1">
          <SearchHistory />
        </div>

        <div className="flex-1">
          <PopularSearches />
        </div>
      </div>
    </div>
  );
}
