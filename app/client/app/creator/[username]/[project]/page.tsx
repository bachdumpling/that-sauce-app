import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProjectByTitleServer } from "@/lib/api/creators";
import { ProjectDisplay } from "./components/project-display";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";

interface ProjectPageProps {
  params: {
    username: string;
    project: string;
  };
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  // Ensure params is properly awaited
  const resolvedParams = await Promise.resolve(params);
  const { username, project } = resolvedParams;
  const projectTitle = project.replace(/-/g, " ");

  try {
    const response = await getProjectByTitleServer(username, project);

    if (!response.success) {
      return {
        title: "Project Not Found",
      };
    }

    const { project: projectData } = response.data;

    return {
      title: `${projectData.title} by ${username} | that sauce`,
      description:
        projectData.description ||
        `View ${projectData.title} by ${username} on that sauce`,
    };
  } catch (error) {
    return {
      title: "Project Details",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Ensure params is properly awaited
  const resolvedParams = await Promise.resolve(params);
  const { username, project } = resolvedParams;

  // Get the current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id || null;

  try {
    const response = await getProjectByTitleServer(username, project);

    if (!response.success) {
      notFound();
    }

    const { creator, project: projectData } = response.data;

    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Suspense fallback={<Skeleton variant="project" />}>
          <ProjectDisplay
            initialData={{ creator, project: projectData }}
            username={username}
            projectSlug={project}
            currentUserId={currentUserId}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    notFound();
  }
}
