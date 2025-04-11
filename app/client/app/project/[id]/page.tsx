import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { ProjectDetail } from "../components/project-detail";
import { ChevronLeft, AlertTriangle } from "lucide-react";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const projectResponse = await serverApi.getProjectByIdServer(id);

  const project = projectResponse.data.project;

  const creator = project.creators;

  return (
    <div>
      <Link
        href={`/${creator.username}/work`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to {creator.username}'s profile
      </Link>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProjectDetail project={project} creator={creator} />
      </Suspense>
    </div>
  );
}
