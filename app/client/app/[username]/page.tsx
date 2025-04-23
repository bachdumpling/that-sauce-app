import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreatorClient } from "./components/creator-client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { getCreatorAction } from "@/actions/creator-actions";
import { getDisplayName } from "@/utils/display-name";
export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  const result = await getCreatorAction(username);
  if (!result.success || !result.data) {
    return {
      title: "Creator Not Found",
    };
  }
  const creator = result.data;

  const displayName = getDisplayName(creator);

  const origin = process.env.NEXT_PUBLIC_CLIENT_URL || "https://that-sauce.com";
  const pageUrl = `${origin}/${username}`;
  const badgeUrl = `${origin}/api/badges/${username}/black?scale=1.5`;

  return {
    title: `${displayName} | that sauce`,
    description: `View ${displayName}'s portfolio on That Sauce`,

    openGraph: {
      title: `${displayName} | that sauce`,
      description: `Portfolio of ${displayName} on That Sauce`,
      url: pageUrl,
      images: [
        {
          url: badgeUrl,
          width: 320 * 2,
          height: 437 * 2,
          alt: `That-Sauce badge for ${displayName}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${displayName} | that sauce`,
      description: `Portfolio of ${displayName} on That Sauce`,
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
