import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorProfile } from "@/components/shared/creator-profile";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatorPageProps {
  params: {
    username: string;
  };
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

export default async function CreatorPage({ params }: CreatorPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  try {
    const response = await getCreatorByUsername(username);

    if (!response.success) {
      notFound();
    }

    return (
      <div className="container max-w-6xl py-8">
        <Suspense fallback={<Skeleton variant="creator" />}>
          <CreatorProfile creator={response.data} viewMode="public" />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error fetching creator:", error);
    notFound();
  }
}
