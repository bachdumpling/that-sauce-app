import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetail } from "../components/project-detail";
import { getProjectByIdAction } from "@/actions/project-actions";
import { BackButton } from "@/components/back-button";
import { getCreatorAction } from "@/actions/creator-actions";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const projectResponse = await getProjectByIdAction(id);

  const project = projectResponse.data.project;

  const creatorResponse = await getCreatorAction(project.creators.username);

  const creator = creatorResponse.data;

  return (
    <div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProjectDetail project={project} creator={creator} />
      </Suspense>
    </div>
  );
}
