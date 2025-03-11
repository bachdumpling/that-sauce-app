"use client";

import CreatorDetailPage from "@/app/admin/components/creator-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function CreatorDetailPageWrapper({ params }) {
  return (
    <Suspense fallback={<Skeleton variant="creator" />}>
      <CreatorDetailPage params={params} />
    </Suspense>
  );
}
