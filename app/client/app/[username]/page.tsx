import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCreatorByUsername } from "@/lib/api/creators";
import { CreatorClient } from "./components/creator-client";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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

// Error UI component
function CreatorError({ error, username }: { error: any; username: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We encountered an error while trying to load the creator profile for "
        {username}".
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Error: {error.message || "Unknown error"}
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">Search Creators</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function CreatorPage({ params }: CreatorPageProps) {
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
      if (response.error === "Creator not found") {
        notFound();
      }

      // For other types of errors, show error UI
      return (
        <CreatorError error={{ message: response.error }} username={username} />
      );
    }

    return (
      <CreatorClient
        creator={response.data}
        isOwner={isOwner}
        username={username}
      />
    );
  } catch (error: any) {
    console.error("Error fetching creator:", error);
    // Show custom error UI instead of notFound
    return <CreatorError error={error} username={username} />;
  }
}
