"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CreatorWorkError({
  error,
  username,
}: {
  error: any;
  username: string;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We encountered an error while trying to load the work for "{username}".
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Error: {error.message || "Unknown error"}
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/client/app/${username}`}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
}
