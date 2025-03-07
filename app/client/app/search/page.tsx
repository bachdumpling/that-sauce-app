import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchClientWrapper } from "@/components/search/search-client-wrapper";
import Link from "next/link";

const EXAMPLE_QUERIES = [
  "high fashion photographers with female models in fashion, in studio",
  "graphic designer with glitchy vaporwave aesthetics",
  "photographers experienced in film street style, cityscapes, architecture",
  "landscape photographer in the mountains",
  "product photographer in a studio",
];

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; content_type?: string };
}) {
  const initialQuery = searchParams.q || "";
  const initialContentType =
    searchParams.content_type === "videos" ? "videos" : "all";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Creative Talent</h1>
          <p className="text-muted-foreground">
            Discover photographers and creators based on their style and
            expertise
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <SearchClientWrapper
            initialQuery={initialQuery}
            initialContentType={initialContentType as "all" | "videos"}
            exampleQueries={EXAMPLE_QUERIES}
          />
        </Suspense>
      </div>
    </div>
  );
}
