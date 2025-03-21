"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileProjectCard } from "@/components/project-card";
import {
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  Project,
} from "@/lib/api/projects";
import {
  deleteProjectImage as apiDeleteProjectImage,
  deleteProjectVideo as apiDeleteProjectVideo,
} from "@/lib/api/media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "@/components/create-project-form";
import { CreatorProfile } from "@/components/shared/creator-profile";
import { Creator as CreatorType } from "@/components/shared/types";
import { toast } from "sonner";

interface ProfileClientWrapperProps {
  user: any;
  creator: any | null;
  initialProjects: Project[];
  creatorError?: string | null;
  projectsError?: string | null;
}

export function ProfileClientWrapper({
  user,
  creator,
  initialProjects,
  creatorError,
  projectsError,
}: ProfileClientWrapperProps) {
  const [profile, setProfile] = useState<any>(creator);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    creatorError || projectsError || null
  );
  const router = useRouter();

  // Project state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // TODO: Fetch profile

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    setIsProjectsLoading(true);
    setError(null);

    try {
      // Use direct Supabase query through the API
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load your projects. Please try again later.");
    } finally {
      setIsProjectsLoading(false);
    }
  }, [user]);

  // Project operations
  const createProject = async (title: string, description: string) => {
    if (!user || !creator) {
      throw new Error("You must be logged in to create a project");
    }

    if (!title.trim()) {
      throw new Error("Project title is required");
    }

    try {
      const data = await apiCreateProject({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      fetchProjects();
      return data;
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  };

  const handleProjectError = (error: string) => {
    setError(error);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    if (!editTitle.trim()) {
      setError("Project title is required");
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      await apiUpdateProject(editingProject.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });

      fetchProjects();
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    setError(null);

    try {
      await apiDeleteProject(deletingProject.id);
      fetchProjects();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteImage = async (projectId: string, imageId: string) => {
    if (!projectId || !imageId) return;

    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      try {
        const response = await apiDeleteProjectImage(projectId, imageId);
        
        if (response.success) {
          toast.success("Image deleted successfully");
          fetchProjects(); // Refresh the projects to reflect changes
        } else {
          toast.error(response.error || "Failed to delete image");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleDeleteVideo = async (projectId: string, videoId: string) => {
    if (!projectId || !videoId) return;

    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        const response = await apiDeleteProjectVideo(projectId, videoId);
        
        if (response.success) {
          toast.success("Video deleted successfully");
          fetchProjects(); // Refresh the projects to reflect changes
        } else {
          toast.error(response.error || "Failed to delete video");
        }
      } catch (error) {
        console.error("Error deleting video:", error);
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="w-full space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update your project details"
                : "Add a new project to your portfolio"}
            </DialogDescription>
          </DialogHeader>

          <CreateProjectForm
            initialTitle={editTitle}
            initialDescription={editDescription}
            onSubmit={editingProject ? handleUpdateProject : createProject}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={isEditing}
            submitLabel={editingProject ? "Update Project" : "Create Project"}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Creator Profile */}
      <CreatorProfile
        creator={{
          id: user?.id || "",
          username: profile?.username || user?.email || "Your Profile",
          location: profile?.location || "",
          bio: profile?.bio || "",
          primary_role: profile?.primary_role || [],
          social_links: profile?.social_links || {},
          years_of_experience: profile?.years_of_experience || 0,
          projects: projects || [],
        }}
        viewMode="owner"
        onEditProfile={() => {
          // TODO: Implement edit profile functionality
          alert("Edit profile functionality to be implemented");
        }}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteClick}
        onAddProject={() => {
          setEditingProject(null);
          setEditTitle("");
          setEditDescription("");
          setIsEditDialogOpen(true);
        }}
        onAddMedia={(project) => {
          // TODO: Implement add media functionality
          alert(
            `Add media to project ${project.title} functionality to be implemented`
          );
        }}
        onDeleteImage={handleDeleteImage}
        onDeleteVideo={handleDeleteVideo}
      />
    </div>
  );
}
