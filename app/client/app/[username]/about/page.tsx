import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { getCreatorAction } from "@/actions/creator-actions";

interface CreatorAboutPageProps {
  params: {
    username: string;
  };
  creator?: Creator;
}

export async function generateMetadata({
  params,
}: CreatorAboutPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  try {
    const result = await getCreatorAction(username);

    if (!result.success) {
      return {
        title: "About Not Found",
      };
    }

    const creator = result.data;

    return {
      title: `About ${creator.username} | that sauce`,
      description:
        creator.bio || `Learn more about ${creator.username} on that sauce`,
    };
  } catch (error) {
    return {
      title: "About Creator",
    };
  }
}

// Error UI component
function CreatorAboutError({
  error,
  username,
}: {
  error: any;
  username: string;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We encountered an error while trying to load the about page for "
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
          <Link href={`/client/app/${username}`}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function CreatorAboutPage({
  params,
  creator,
}: CreatorAboutPageProps) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // If creator isn't provided via props, fetch it directly
  if (!creator) {
    try {
      const result = await getCreatorAction(username);

      if (!result.success) {
        return (
          <CreatorAboutError
            error={{ message: result.error }}
            username={username}
          />
        );
      }

      creator = result.data;
    } catch (error: any) {
      return <CreatorAboutError error={error} username={username} />;
    }
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">About {creator.username}</h2>

      {/* Bio section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Bio</h3>
        <p className="text-muted-foreground">
          {creator.bio || "No bio available yet."}
        </p>
      </div>

      {/* Skills section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Skills</h3>
        {creator.primary_role && creator.primary_role.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {creator.primary_role.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded-full bg-muted text-sm"
              >
                {typeof role === "string" ? role.replace(/-/g, " ") : role}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No skills listed yet.</p>
        )}
      </div>

      {/* Contact section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Contact</h3>
        <p className="text-muted-foreground">
          {creator.email || "No contact information available."}
        </p>
      </div>

      {creator.isOwner && (
        <div className="mt-10 pt-6 border-t">
          <Button>Edit About Page</Button>
        </div>
      )}
    </div>
  );
}
