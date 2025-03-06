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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "@/components/create-project-form";

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
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(creatorError || projectsError || null);
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

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    setIsProjectsLoading(true);
    setError(null);

    try {
      // Use direct Supabase query through the API
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/sign-in');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column - User Info & Create Project */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Your Profile</h2>
          {creator ? (
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Username:</span>{" "}
                <span className="font-medium">@{creator.username}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{user?.email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Creator profile not found. Please complete onboarding.
              </p>
              {user && (
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{user.email}</span>
                </p>
              )}
              <Button
                size="sm"
                onClick={() => router.push("/onboarding")}
                className="mt-2"
              >
                Complete Onboarding
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full mt-4"
          >
            Sign Out
          </Button>
        </div>

        <div className="bg-card rounded-lg border p-6">
          {creator ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const description = formData.get('description') as string;
                createProject(title, description)
                  .then(() => {
                    e.currentTarget.reset();
                  })
                  .catch((err) => {
                    setError(err.message);
                  });
              }} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Project title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Project description (optional)"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Project
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                You need a creator profile to create projects
              </p>
              <Button onClick={() => router.push("/onboarding")} size="sm">
                Complete Onboarding
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Projects */}
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={isProjectsLoading}
          >
            {isProjectsLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProjectsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-muted animate-pulse h-32 rounded-lg"
              />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <ProfileProjectCard
                  project={project}
                  onUploadComplete={() => fetchProjects()}
                  onError={handleProjectError}
                />
                <div className="absolute top-6 right-16 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background"
                    onClick={() => handleEditProject(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-background text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border rounded-lg p-8 text-center">
            <h3 className="font-medium mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">
              {creator
                ? "Create your first project to get started"
                : "Complete onboarding to create projects"}
            </p>
            {!creator && (
              <Button onClick={() => router.push("/onboarding")} size="sm">
                Complete Onboarding
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to your project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Project title"
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Project description (optional)"
                rows={3}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={isEditing || !editTitle.trim()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
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
              disabled={isDeleting}
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
    </div>
  );
} 