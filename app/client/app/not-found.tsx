"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 mt-20 px-4 text-center">
      <div className="mb-8">
        <Image src="/logo.png" alt="that sauce" width={120} height={120} />
      </div>

      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>

      <p className="text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved to another
        URL.
      </p>

      <Button asChild className="mt-4">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}
