import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorClient } from "../components/creator-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";

interface WorkPageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
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
      title: `${creator.username}'s Work | that sauce`,
      description: `View ${creator.username}'s projects and work on that sauce`,
    };
  } catch (error) {
    return {
      title: "Creator Work",
    };
  }
}

export default async function WorkPage({ params }: WorkPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;
  const supabase = await createClient();

  // Get the current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has a creator profile with this username
  let isOwner = false;

  if (user) {
    // Get the user's creator profile
    const { data: userCreator } = await supabase
      .from("creators")
      .select("username")
      .eq("profile_id", user.id)
      .single();

    // Check if the user's creator profile matches the requested username
    if (userCreator && userCreator.username === username) {
      isOwner = true;
    }
  }

  try {
    const response = await getCreatorByUsername(username);

    if (!response.success) {
      notFound();
    }

    return (
      <CreatorClient
        creator={response.data}
        isOwner={isOwner}
        username={username}
      />
    );
  } catch (error) {
    console.error("Error fetching creator:", error);
    notFound();
  }
}
