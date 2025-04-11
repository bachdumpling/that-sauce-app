"use client";

import Link from "next/link";
import { ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/lib/api/client/projects";

interface Project {
  id: string;
  title: string;
  description?: string;
  images?: { url: string }[];
}

interface ProjectCardProps {
  project: Project;
  isOwner?: boolean;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ 
  project, 
  isOwner = false,
  onDelete 
}: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        setIsDeleting(true);
        
        // Always use cascade=true to ensure all associated media is deleted
        const response = await deleteProject(project.id, true);

        if (response.success) {
          // Mark this component as deleted
          setIsDeleted(true);
          
          // Notify the parent component about the deletion
          if (onDelete) {
            onDelete(project.id);
          } else {
            // If no onDelete handler was provided, refresh the route data
            router.refresh();
          }
        } else {
          console.error("Failed to delete project:", response.error);
          alert(`Error deleting project: ${response.error}`);
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("An unexpected error occurred while deleting the project.");
      } finally {
        setIsDeleting(false);
        // Close the dropdown after deletion attempt
        setIsDropdownOpen(false);
      }
    }
  };

  // Don't render if this project has been deleted
  if (isDeleted) {
    return null;
  }
  
  return (
    <Link
      href={`/project/${project.id}`}
      className={`group hover:opacity-90 transition-opacity ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="overflow-hidden">
        <div className="relative">
          {project.images && project.images.length > 0 ? (
            <img
              src={project.images[0].url}
              alt={project.title}
              className="w-full h-72 object-cover rounded-[16px] border border-gray-200"
            />
          ) : (
            <div className="w-full h-72 bg-muted flex items-center justify-center rounded-[16px] border border-gray-200">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {isOwner && (
            <div
              className={`absolute top-6 right-6 transition-opacity ${isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            >
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    onClick={(e) => e.preventDefault()}
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/project/${project.id}/edit`;
                    }}
                    disabled={isDeleting}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-500 focus:text-red-500"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

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
  );
}
