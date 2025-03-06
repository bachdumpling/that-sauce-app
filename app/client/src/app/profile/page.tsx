"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProfileProjectCard } from "@/components/ProjectCard";
import { useRouter } from "next/navigation";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import {
  fetchUserProjects,
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

export default function ProfilePage() {
  const { user, creator, isLoading, logout, refreshSession } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Track if auth refresh has been attempted
  const authRefreshAttempted = useRef(false);

  // Edit project state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete project state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Improved auth initialization that prevents multiple refresh attempts
  useEffect(() => {
    // Only attempt refresh if user is null and we haven't tried refreshing yet
    if (!user && !isLoading && !authRefreshAttempted.current) {
      authRefreshAttempted.current = true;
      
      // Try to refresh the session once
      const attemptRefresh = async () => {
        try {
          await refreshSession();
          
          // After a reasonable delay, if still no user, redirect to login
          setTimeout(() => {
            if (!user) {
              router.push("/auth/login");
            }
          }, 2000);
        } catch (err) {
          console.error("Session refresh failed:", err);
          router.push("/auth/login");
        }
      };
      
      attemptRefresh();
    }
  }, [user, isLoading, refreshSession, router]);

  // Fetch projects when creator is available
  const fetchProjects = useCallback(async () => {
    if (!creator) return;

    setIsProjectsLoading(true);
    setError(null);

    try {
      // Use the API to fetch projects
      const data = await fetchUserProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load your projects. Please try again later.");

      // Fallback to direct Supabase query if API fails
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("creator_id", creator.id)
          .order("created_at", { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
        setError(null); // Clear error if fallback succeeds
      } catch (fallbackErr) {
        console.error("Fallback fetch failed:", fallbackErr);
      }
    } finally {
      setIsProjectsLoading(false);
    }
  }, [creator]);

  useEffect(() => {
    if (creator) {
      fetchProjects();
    }
  }, [creator, fetchProjects]);

  const createProject = async (title: string, description: string) => {
    if (!user) {
      throw new Error("You must be logged in to create a project");
    }

    if (!creator) {
      throw new Error("Creator profile not found");
    }

    if (!title.trim()) {
      throw new Error("Project title is required");
    }

    try {
      // Use the API to create a project
      const data = await apiCreateProject({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Refresh projects list
      fetchProjects();

      return data;
    } catch (err) {
      console.error("Error creating project:", err);

      // Fallback to direct Supabase query if API fails
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert([
            {
              title: title.trim(),
              description: description.trim() || null,
              creator_id: creator.id,
            },
          ])
          .select();

        if (error) throw error;
        fetchProjects();
        return data;
      } catch (fallbackErr) {
        const errorMessage =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to create project";
        throw new Error(errorMessage);
      }
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

      // Refresh projects and close dialog
      fetchProjects();
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating project:", err);

      // Fallback to direct Supabase query if API fails
      try {
        const { error } = await supabase
          .from("projects")
          .update({
            title: editTitle.trim(),
            description: editDescription.trim() || null,
          })
          .eq("id", editingProject.id);

        if (error) throw error;
        fetchProjects();
        setIsEditDialogOpen(false);
      } catch (fallbackErr) {
        const errorMessage =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to update project";
        setError(errorMessage);
      }
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

      // Refresh projects and close dialog
      fetchProjects();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting project:", err);

      // Fallback to direct Supabase query if API fails
      try {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", deletingProject.id);

        if (error) throw error;
        fetchProjects();
        setIsDeleteDialogOpen(false);
      } catch (fallbackErr) {
        const errorMessage =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to delete project";
        setError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Simplified loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show a different loading state when we're attempting to recover the session
  if (!user && authRefreshAttempted.current) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Attempting to restore your session</h2>
            <p className="text-muted-foreground mb-4">
              Please wait a moment...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No user state - only show after refresh attempt
  if (!user) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
            <p className="text-muted-foreground mb-4">
              Your login session may have expired.
            </p>
            <Button onClick={() => router.push("/auth/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
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
                  <span className="font-medium">{user.email}</span>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Creator profile not found. Please complete onboarding.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full mt-4"
            >
              Sign Out
            </Button>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <CreateProjectForm onSubmit={createProject} />
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
                Create your first project to get started
              </p>
            </div>
          )}
        </div>
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
