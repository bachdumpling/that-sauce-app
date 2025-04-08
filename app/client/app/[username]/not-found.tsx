import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreatorNotFound() {
  return (
    <div className="container max-w-6xl py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4">Creator Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        We couldn't find the creator you're looking for. They may have changed
        their username or their profile might not exist.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">Search Creators</Link>
        </Button>
      </div>
    </div>
  );
}
