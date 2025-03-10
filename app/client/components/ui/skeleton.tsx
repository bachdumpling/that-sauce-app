import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SkeletonVariant =
  | "default"
  | "search"
  | "creator"
  | "admin"
  | "project";

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {variant === "default" && <DefaultSkeleton />}
      {variant === "search" && <SearchSkeleton />}
      {variant === "creator" && <CreatorProfileSkeleton />}
      {variant === "admin" && <AdminSkeleton />}
      {variant === "project" && <ProjectSkeleton />}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-md" />
            ))}
          </div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Search Form */}
      <form className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <div className="w-full h-12 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-12 w-[120px] bg-gray-200 rounded" />
          <div className="h-12 w-[100px] bg-gray-200 rounded" />
        </div>
      </form>

      {/* Example Queries */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 bg-gray-200 rounded w-[180px]" />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Creator Info */}
                <div className="p-6 md:w-1/3 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full" />
                    <div className="space-y-1">
                      <div className="h-5 bg-gray-200 rounded w-32" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  </div>
                </div>

                {/* Projects */}
                <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-border">
                  <div className="p-4 border-b border-border">
                    <div className="h-5 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-2">
                        <div className="aspect-video bg-gray-200 rounded-md" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreatorProfileSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse overflow-hidden w-full">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div className="space-y-3 w-full md:w-2/3">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 bg-muted rounded-md w-20"></div>
                  ))}
                </div>
              </div>
              <div className="h-10 bg-muted rounded w-32 mt-2 md:mt-0"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="aspect-square bg-muted rounded-md"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-gray-200 rounded flex-1" />
        <div className="h-10 w-10 bg-gray-200 rounded" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-12 bg-gray-200 rounded-t" />
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 my-1 mx-4" />
            ))}
          <div className="h-12 bg-gray-200 rounded-b flex items-center justify-center">
            <div className="flex gap-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-8 w-8 bg-gray-100 rounded" />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="aspect-video bg-gray-200 rounded-md" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-md" />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
