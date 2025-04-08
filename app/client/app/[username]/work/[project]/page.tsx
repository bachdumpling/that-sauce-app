import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getCreatorByUsername } from "@/lib/api/creators";
import { getProject } from "@/lib/api/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";
import { ProjectDetail } from "./components/project-detail";
import { ChevronLeft } from "lucide-react";

interface ProjectPageProps {
  params: {
    username: string;
    project: string;
  };
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const { username, project: projectId } = resolvedParams;

  console.log("Generating metadata for:", { username, projectId });

  try {
    const creatorResponse = await getCreatorByUsername(username);
    if (!creatorResponse.success) {
      console.log("Creator not found when generating metadata");
      return {
        title: "Project Not Found",
      };
    }

    const projectResponse = await getProject(projectId);
    if (!projectResponse.success) {
      console.log("Project not found when generating metadata");
      return {
        title: "Project Not Found",
      };
    }

    const project = projectResponse.data;
    const creator = creatorResponse.data;

    return {
      title: `${project.title} by ${creator.username} | that sauce`,
      description:
        project.description ||
        `View ${project.title} by ${creator.username} on that sauce`,
    };
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    return {
      title: "Project",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { username, project: projectId } = resolvedParams;

  console.log("Rendering project page with params:", { username, projectId });

  const supabase = await createClient();

  // Get the current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    console.log("Fetching creator data for username:", username);
    const creatorResponse = await getCreatorByUsername(username);
    if (!creatorResponse.success) {
      console.error("Creator not found:", creatorResponse.error);
      notFound();
    }

    console.log("Fetching project data for ID:", projectId);
    const projectResponse = await getProject(projectId);

    // Handle authentication errors
    if (!projectResponse.success) {
      console.error("Project not found:", projectResponse.error);

      // If it's an authentication error, redirect to login
      if (
        projectResponse.error &&
        (projectResponse.error.includes("Authentication") ||
          projectResponse.error.includes("log in") ||
          projectResponse.error.includes("401"))
      ) {
        console.log("Authentication error detected, redirecting to login");
        return redirect("/auth/login");
      }

      // Otherwise, show not found
      notFound();
    }

    const creator = creatorResponse.data;
    const project = projectResponse.data;

    // Check if user has a creator profile with this username
    if (user) {
      // Get the user's creator profile
      const { data: userCreator } = await supabase
        .from("creators")
        .select("username")
        .eq("profile_id", user.id)
        .single();

      // Check if the user's creator profile matches the requested username
      if (userCreator && userCreator.username === username) {
        creator.isOwner = true;
      }
    }

    console.log("Successfully fetched creator and project data");
    console.log("Creator:", creator.username);
    console.log("Project:", project.title);

    return (
      <div>
        <Link
          href={`/${username}/work`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {creator.username}'s work
        </Link>

        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ProjectDetail
            project={project}
            creator={creator}
          />
        </Suspense>
      </div>
    );
  } catch (error: any) {
    console.error("Error rendering project page:", error);

    // If it's an authentication error, redirect to login
    if (error.status === 401) {
      console.log(
        "Authentication error detected in catch block, redirecting to login"
      );
      return redirect("/auth/login");
    }

    notFound();
  }
}
