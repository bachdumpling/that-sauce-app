import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-6">
        Find the Perfect Creative Talent
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Discover creative professionals based on their style, experience, and
        portfolio using our AI-powered search platform.
      </p>
      <Button size="lg" asChild>
        <Link href="/search">Start Searching</Link>
      </Button>
    </div>
  );
}