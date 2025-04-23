import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreatorClient } from "./components/creator-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { getCreatorAction } from "@/actions/creator-actions";

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
  const badgeUrl = `${origin}/api/badges/${username}/black?scale=1.5`;

  // 4️⃣ Metadata payload
  const title = `${creator.first_name} ${creator.last_name} | that sauce`;
  const description = `View ${creator.username}'s portfolio on that sauce`;

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

interface CreatorPageProps {
  params: {
    username: string;
  };
  creator?: Creator;
}

export default async function CreatorPage({
  params,
  creator,
}: CreatorPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  if (!creator) {
    try {
      const result = await getCreatorAction(username);

      if (!result.success || !result.data) {
        // This is the only place where notFound() should be called
        return notFound();
      }

      creator = result.data;
    } catch (error) {
      console.error("Failed to fetch creator:", error);
      return notFound();
    }
  }

  return <CreatorClient creator={creator} username={username} />;
}
