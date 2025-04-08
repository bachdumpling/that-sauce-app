import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorClient } from "./components/creator-client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/components/shared/types";

interface CreatorPageProps {
  params: {
    username: string;
  };
  creator?: Creator;
}

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  try {
    const response = await getCreatorByUsername(username);

    if (!response.success) {
      return {
        title: "Creator Not Found",
      };
    }

    const creator = response.data;

    return {
      title: `${creator.username} | that sauce`,
      description:
        creator.bio || `View ${creator.username}'s portfolio on that sauce`,
    };
  } catch (error) {
    return {
      title: "Creator Profile",
    };
  }
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
      const response = await getCreatorByUsername(username);

      creator = response.data;
    } catch (error: any) {
      console.error("Error fetching creator data:", error);
    }
  }

  return (
    <CreatorClient
      creator={creator}
      username={username}
    />
  );
}
