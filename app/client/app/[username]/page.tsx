import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreatorClient } from "./components/creator-client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { getCreatorAction } from "@/actions/creator-actions";

interface CreatorPageProps {
  params: {
    username: string;
  };
  creator?: Creator;
}

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  // 1️⃣ await params
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // 2️⃣ Fetch creator
  const result = await getCreatorAction(username);
  if (!result.success || !result.data) {
    return {
      title: "Creator Not Found",
    };
  }
  const creator = result.data;

  // 3️⃣ Build URLs
  const origin = process.env.NEXT_PUBLIC_CLIENT_URL || "https://that-sauce.com";
  const pageUrl = `${origin}/${username}`;
  // match your badge‐wrapper’s default color & scale
  const badgeUrl = `${origin}/api/badges/${username}/black?scale=2`;

  // 4️⃣ Metadata payload
  const title = `${creator.first_name} ${creator.last_name} | that sauce`;
  const description =
    creator.bio || `View ${creator.username}'s portfolio on that sauce`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: badgeUrl,
          width: 320 * 2,
          height: 437 * 2,
          alt: `That-Sauce badge for ${creator.username}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [badgeUrl],
    },
  };
}

export default async function CreatorPage({
  params,
  creator,
}: CreatorPageProps) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // If creator isn't provided via props, fetch it directly
  if (!creator) {
    try {
      const result = await getCreatorAction(username);

      if (!result.success || !result.data) {
        console.error("Failed to fetch creator:", result.error);
        return (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold mb-4">Creator not found</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              We couldn't find a creator with the username "{username}".
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        );
      }

      creator = result.data;
    } catch (error: any) {
      console.error("Error fetching creator data:", error);
      return (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-2 max-w-md">
            We encountered an error while trying to load the creator profile.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            Error: {error.message || "Unknown error"}
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      );
    }
  }

  return <CreatorClient creator={creator} username={username} />;
}
