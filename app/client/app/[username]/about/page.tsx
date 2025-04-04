import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorClient } from "../components/creator-client";
import { createClient } from "@/utils/supabase/server";

interface AboutPageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
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
      title: `About ${creator.username} | that sauce`,
      description:
        creator.bio || `Learn about ${creator.username} on that sauce`,
    };
  } catch (error) {
    return {
      title: "About Creator",
    };
  }
}

export default async function AboutPage({ params }: AboutPageProps) {
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
