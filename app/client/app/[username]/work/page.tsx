import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverApi } from "@/lib/api";
import { ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Creator } from "@/lib/api/shared/types";
  
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
    const response = await serverApi.getCreatorByUsernameServer(username);

    if (!response.success) {
      return {
        title: "Work Not Found",
      };
    }

    const creator = response.data;

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
      const response = await serverApi.getCreatorByUsernameServer(username);

      if (!response.success) {
        return (
          <CreatorWorkError
            error={{ message: response.error }}
            username={username}
          />
        );
      }

      creator = response.data;
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
              <div className="w-full h-72 object-cover rounded-[16px] border border-gray-200 grid place-items-center">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center rounded-full p-2"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {creator.projects && creator.projects.length > 0 ? (
          creator.projects.map((project) => (
            <Link
              href={`/${username}/work/${project.id}`}
              key={project.id}
              className="group hover:opacity-90 transition-opacity"
            >
              <div className="overflow-hidden">
                {project.images && project.images.length > 0 ? (
                  <img
                    src={project.images[0].url}
                    alt={project.title}
                    className="w-full h-72 object-cover rounded-[16px] border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-72 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="pt-4">
                  <h3 className="font-medium text-lg">{project.title}</h3>
                  {project.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
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
function CreatorWorkError({ error, username }: { error: any; username: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We encountered an error while trying to load the work page for "{username}".
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
