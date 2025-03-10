import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchClientWrapper } from "./components/search-client-wrapper";

const EXAMPLE_QUERIES = [
  "high fashion photographers with female models in fashion, in studio",
  "graphic designer with glitchy vaporwave aesthetics",
  "photographers experienced in film street style, cityscapes, architecture",
  "landscape photographer in the mountains",
  "product photographer in a studio",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; content_type?: string };
}) {
  // Ensure searchParams is properly awaited
  const params = await Promise.resolve(searchParams);
  const initialQuery = params.q || "";
  const initialContentType =
    params.content_type === "videos" ? "videos" : "all";

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Creative Talent</h1>
          <p className="text-muted-foreground">
            Discover photographers and creators based on their style and
            expertise
          </p>
        </div>

        <Suspense fallback={<div className="h-[500px] w-full"><Skeleton className="h-full w-full" /></div>}>
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
