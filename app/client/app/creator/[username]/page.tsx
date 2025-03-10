import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorProfile } from "@/components/shared/creator-profile";

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
        <CreatorProfile creator={response.data} viewMode="public" />
      </div>
    );
  } catch (error) {
    console.error("Error fetching creator:", error);
    notFound();
  }
}
