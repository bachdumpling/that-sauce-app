import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="container max-w-6xl py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8">
        The project you're looking for doesn't exist or has been removed.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
} 