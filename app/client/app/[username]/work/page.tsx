import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { ProjectCard } from "./components/project-card";
import ProjectsContainer from "./components/projects-container";
import { getCreatorAction } from "@/actions/creator-actions";

interface CreatorWorkPageProps {
  params: {
    username: string;
  };
  creator?: Creator;
}

export async function generateMetadata({
  params,
}: CreatorWorkPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  try {
    const result = await getCreatorAction(username);

    if (!result.success) {
      return {
        title: "Work Not Found",
      };
    }

    const creator = result.data;

    return {
      title: `${creator.username}'s Work | that sauce`,
      description: `Explore ${creator.username}'s portfolio and creative work on that sauce.`,
    };
  } catch (error) {
    return {
      title: "Creator's Work",
    };
  }
}

export default async function CreatorWorkPage({
  params,
  creator,
}: CreatorWorkPageProps) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // If creator isn't provided via props, fetch it directly
  if (!creator) {
    try {
      const result = await getCreatorAction(username);

      if (!result.success) {
        return (
          <CreatorWorkError
            error={{ message: result.error }}
            username={username}
          />
        );
      }

      creator = result.data;
    } catch (error: any) {
      return <CreatorWorkError error={error} username={username} />;
    }
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creator.isOwner && (
          <div className="group hover:opacity-90 transition-opacity">
            <div className="overflow-hidden">
              <div className="relative w-full pb-[75%] rounded-[16px] border border-gray-200">
                <div className="absolute top-0 left-0 w-full h-full grid place-items-center">
                  <Link href="/project/new">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center rounded-full p-2"
                    >
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {creator.projects && creator.projects.length > 0 ? (
          <ProjectsContainer
            projects={creator.projects}
            isOwner={creator.isOwner}
          />
        ) : (
          <div className="col-span-3 py-12 text-center">
            <h3 className="text-lg font-medium text-muted-foreground">
              No projects yet
            </h3>
            {creator.isOwner && (
              <Button className="mt-4">Add Your First Project</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Error UI component
function CreatorWorkError({
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
        We encountered an error while trying to load the work page for "
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
