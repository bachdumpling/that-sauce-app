import { Card, CardContent } from "@/components/ui/card";

export function Skeleton({ className }: { className?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 animate-pulse rounded-md"
              />
            ))}
          </div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
            <div className="h-9 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
