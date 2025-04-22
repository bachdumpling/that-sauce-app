import React from "react";
import EditProjectForm from "../../components/edit-project-form";
import { getProjectByIdAction } from "@/actions/project-actions";
import { getCreatorAction } from "@/actions/creator-actions";
import { ProjectDetail } from "../../components/project-detail";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";

interface ProjectPageProps {
  params: {
    id: string;
  };
}
export default async function EditProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // Fetch project data
  const projectResponse = await getProjectByIdAction(id);

  if (!projectResponse.success || !projectResponse.data) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          Failed to load project data. Please try again.
        </div>
      </div>
    );
  }

  const project = projectResponse.data.project;

  // Get username from project's creator
  const username = project?.creators?.username || "";

  // Get creator data using username
  const creatorResponse = await getCreatorAction(username);

  if (!creatorResponse.success || !creatorResponse.data) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Edit Project Details</h2>
          <EditProjectForm projectId={id} />
        </div>
      </div>
    );
  }

  const creator = {
    ...creatorResponse.data,
  };

  // Check if the user is the owner of the project
  // If not, redirect them to the project view page
  if (!creator.isOwner) {
    redirect(`/project/${id}`);
  }

  return (
    <div className="container mx-auto py-8 space-y-12">
      <BackButton fallbackPath={`/project/${id}`} />
      <h1 className="text-2xl font-bold">Edit Project: {project.title}</h1>
      {/* Edit form */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-medium mb-4">Edit Project Details</h2>
        <EditProjectForm projectId={id} />
      </div>
    </div>
  );
}
