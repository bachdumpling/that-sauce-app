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

    // The project data is directly in response.data
    const projectData = response.data;

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

    // The API returns the project data directly in response.data
    const projectData = response.data;

    // Create a creator object with just the username
    const creator = {
      username: projectData.creator_username || username,
      user_id: null, // We don't have this from the API response
    };

    // Check if project data contains the expected fields
    if (!projectData || Object.keys(projectData).length === 0) {
      throw new Error("Project data is empty");
    }

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
    notFound();
  }
}
