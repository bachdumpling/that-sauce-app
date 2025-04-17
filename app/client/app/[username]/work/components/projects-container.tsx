"use client";

import { useState } from "react";
import { ProjectCard } from "./project-card";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  title: string;
  description?: string;
  images?: { url: string }[];
}

interface ProjectsContainerProps {
  projects: Project[];
  isOwner: boolean;
}

export default function ProjectsContainer({
  projects: initialProjects,
  isOwner,
}: ProjectsContainerProps) {
  const [projects, setProjects] = useState(initialProjects);
  const pathname = usePathname();

  // Extract username from pathname
  const username = pathname.split("/")[1]; // Gets the username from "/username/work"

  const handleProjectDelete = (deletedProjectId: string) => {
    setProjects(projects.filter((project) => project.id !== deletedProjectId));
  };

  if (projects.length === 0) {
    return (
      <div className="col-span-3 py-12 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          No projects yet
        </h3>
        {isOwner && (
          <a href="/project/new">
            <Button className="mt-4">Add Your First Project</Button>
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isOwner={isOwner}
          onDelete={handleProjectDelete}
          username={username}
        />
      ))}
    </>
  );
}
