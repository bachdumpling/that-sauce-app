"use client";

import { useState, useEffect } from "react";
import {
  Creator,
  Project,
  Image as ImageType,
} from "@/components/shared/types";
import { CreatorProfile } from "@/components/shared/creator-profile";
import { CreatorEditForm } from "./creator-edit-form";
import { updateCreatorProfile } from "@/lib/api/creators";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/api/projects";
import {
  uploadProjectMedia,
  deleteProjectImage,
  deleteProjectVideo,
} from "@/lib/api/media";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { DropzoneInput } from "@/components/ui/dropzone-input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface CreatorProfileWrapperProps {
  creator: Creator;
  isOwner: boolean;
  username: string;
}

export function CreatorProfileWrapper({
  creator,
  isOwner,
  username,
}: CreatorProfileWrapperProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCreator, setCurrentCreator] = useState<Creator>(creator);

  // Project management state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [forceDelete, setForceDelete] = useState(true); // Default to true for force delete

  // Media management state
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [mediaProject, setMediaProject] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmittingMedia, setIsSubmittingMedia] = useState(false);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);

  // Delete image functionality
  const [isConfirmingDeleteImage, setIsConfirmingDeleteImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [deletingImageProjectId, setDeletingImageProjectId] = useState<
    string | null
  >(null);

  // Delete video functionality
  const [isConfirmingDeleteVideo, setIsConfirmingDeleteVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [deletingVideoProjectId, setDeletingVideoProjectId] = useState<
    string | null
  >(null);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async (updatedData: Partial<Creator>) => {
    try {
      const response = await updateCreatorProfile(username, updatedData);

      if (response.success) {
        // Update the local state with the updated data
        setCurrentCreator((prev) => ({
          ...prev,
          ...updatedData,
        }));
        setIsEditing(false);

        // If username was changed, redirect to the new profile URL
        if (updatedData.username && updatedData.username !== username) {
          toast.success(
            "Profile updated successfully. Redirecting to your new profile URL..."
          );
          setTimeout(() => {
            router.push(`/creator/${updatedData.username}`);
          }, 1500);
        } else {
          toast.success("Profile updated successfully");
        }

        return true;
      } else {
        toast.error(response.error || "Failed to update profile");
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  // Project Management Functions
  const handleAddProject = () => {
    setProjectTitle("");
    setProjectDescription("");
    setSelectedProject(null);
    setIsAddingProject(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description || "");
    setIsEditingProject(true);
  };

  const handleDeleteProject = (project: Project) => {
    // Remove the media check - allow deleting projects with media
    setSelectedProject(project);
    setIsDeletingProject(true);
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      toast.error("Project title is required");
      return;
    }

    setIsSubmittingProject(true);

    try {
      if (isEditingProject && selectedProject) {
        // Update existing project
        const response = await updateProject(selectedProject.id, {
          title: projectTitle,
          description: projectDescription,
        });

        if (response.success) {
          // Update project in local state
          setCurrentCreator((prev) => ({
            ...prev,
            projects: prev.projects?.map((p) =>
              p.id === selectedProject.id
                ? { ...p, title: projectTitle, description: projectDescription }
                : p
            ),
          }));
          toast.success("Project updated successfully");
        } else {
          toast.error(response.error || "Failed to update project");
        }
      } else {
        // Create new project
        const response = await createProject({
          title: projectTitle,
          description: projectDescription,
        });

        if (response.success && response.data) {
          // Add new project to local state
          setCurrentCreator((prev) => ({
            ...prev,
            projects: [...(prev.projects || []), response.data],
          }));
          toast.success("Project created successfully");
        } else {
          toast.error(response.error || "Failed to create project");
        }
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmittingProject(false);
      setIsAddingProject(false);
      setIsEditingProject(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!selectedProject) return;

    setIsSubmittingProject(true);

    try {
      console.log(
        "Deleting project with ID:",
        selectedProject.id,
        "Force delete:",
        forceDelete
      );
      const response = await deleteProject(selectedProject.id, forceDelete);
      console.log("Delete project response:", response);

      if (response.success) {
        // Remove project from local state
        setCurrentCreator((prev) => ({
          ...prev,
          projects: prev.projects?.filter((p) => p.id !== selectedProject.id),
        }));
        toast.success("Project deleted successfully");
      } else {
        // Handle specific error cases
        if (response.error?.includes("associated content")) {
          toast.error(
            "The project couldn't be deleted because it has associated content. Try using the 'Delete project and all its content' option."
          );
        } else if (response.error?.includes("not found")) {
          // If the project can't be found, assume it's already been deleted
          setCurrentCreator((prev) => ({
            ...prev,
            projects: prev.projects?.filter((p) => p.id !== selectedProject.id),
          }));
          toast.success("Project removed from your profile");
        } else {
          toast.error(response.error || "Failed to delete project");
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmittingProject(false);
      setIsDeletingProject(false);
      setSelectedProject(null);
      setForceDelete(true); // Reset to default
    }
  };

  // Media Management Functions
  const handleAddMedia = (project: Project) => {
    setMediaProject(project);
    setSelectedFiles([]);
    setIsAddingMedia(true);
  };

  const handleFileChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUploadMedia = async () => {
    if (!mediaProject || selectedFiles.length === 0) return;

    setIsSubmittingMedia(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await uploadProjectMedia(mediaProject.id, formData);

      if (response.success && response.data) {
        // Update the project in local state with new media
        const updatedProjects = currentCreator.projects?.map((p) => {
          if (p.id === mediaProject.id) {
            return {
              ...p,
              images: [...(p.images || []), ...response.data.images],
              videos: [...(p.videos || []), ...response.data.videos],
            };
          }
          return p;
        });

        setCurrentCreator((prev) => ({
          ...prev,
          projects: updatedProjects,
        }));

        toast.success("Media uploaded successfully");
        setIsAddingMedia(false);
      } else {
        toast.error(response.error || "Failed to upload media");
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  // Handle deleting a project image
  const handleDeleteImage = (projectId: string, imageId: string) => {
    setDeletingImageProjectId(projectId);
    setDeletingImageId(imageId);
    setIsConfirmingDeleteImage(true);
  };

  // Confirm delete image
  const handleConfirmDeleteImage = async () => {
    if (!deletingImageProjectId || !deletingImageId) return;

    try {
      const response = await deleteProjectImage(
        deletingImageProjectId,
        deletingImageId
      );

      if (response.success) {
        toast.success("Image deleted successfully");

        // Update creator data to reflect the deletion
        setCurrentCreator((prev) => ({
          ...prev,
          projects: prev.projects.map((project) => {
            if (project.id === deletingImageProjectId) {
              return {
                ...project,
                images: (project.images || []).filter(
                  (image) => image.id !== deletingImageId
                ),
              };
            }
            return project;
          }),
        }));
      } else {
        toast.error(response.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingImageId(null);
      setDeletingImageProjectId(null);
      setIsConfirmingDeleteImage(false);
    }
  };

  // Handle deleting a video
  const handleDeleteVideo = (projectId: string, videoId: string) => {
    setDeletingVideoProjectId(projectId);
    setDeletingVideoId(videoId);
    setIsConfirmingDeleteVideo(true);
  };

  // Confirm delete video
  const handleConfirmDeleteVideo = async () => {
    if (!deletingVideoProjectId || !deletingVideoId) return;

    try {
      const response = await deleteProjectVideo(
        deletingVideoProjectId,
        deletingVideoId
      );

      if (response.success) {
        toast.success("Video deleted successfully");

        // Update creator data to reflect the deletion
        setCurrentCreator((prev) => ({
          ...prev,
          projects: prev.projects.map((project) => {
            if (project.id === deletingVideoProjectId) {
              return {
                ...project,
                videos: (project.videos || []).filter(
                  (video) => video.id !== deletingVideoId
                ),
              };
            }
            return project;
          }),
        }));
      } else {
        toast.error(response.error || "Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingVideoId(null);
      setDeletingVideoProjectId(null);
      setIsConfirmingDeleteVideo(false);
    }
  };

  // If editing profile, show the edit form
  if (isEditing && isOwner) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Edit Your Profile</h1>
        <CreatorEditForm
          creator={currentCreator}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <>
      <CreatorProfile
        creator={currentCreator}
        viewMode={isOwner ? "owner" : "public"}
        onEditProfile={isOwner ? handleEditProfile : undefined}
        onEditProject={isOwner ? handleEditProject : undefined}
        onDeleteProject={isOwner ? handleDeleteProject : undefined}
        onAddProject={isOwner ? handleAddProject : undefined}
        onAddMedia={isOwner ? handleAddMedia : undefined}
        onDeleteImage={isOwner ? handleDeleteImage : undefined}
        onDeleteVideo={isOwner ? handleDeleteVideo : undefined}
      />

      {/* Add/Edit Project Dialog */}
      <Dialog
        open={isAddingProject || isEditingProject}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingProject(false);
            setIsEditingProject(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingProject ? "Edit Project" : "Add New Project"}
            </DialogTitle>
            <DialogDescription>
              {isEditingProject
                ? "Update your project details below"
                : "Fill out the form to create a new project"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Project Title
              </label>
              <Input
                id="title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingProject(false);
                setIsEditingProject(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={isSubmittingProject}>
              {isSubmittingProject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditingProject ? (
                "Update Project"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Media Dialog */}
      <Dialog
        open={isAddingMedia}
        onOpenChange={(open) => {
          if (!open) setIsAddingMedia(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media to Project</DialogTitle>
            <DialogDescription>
              Upload images or videos to add to your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <DropzoneInput
              onFilesSelected={handleFileChange}
              acceptedFileTypes={{
                "image/*": [".jpeg", ".jpg", ".png", ".gif"],
                "video/*": [".mp4", ".mov", ".avi"],
              }}
              maxFiles={10}
              maxSize={10 * 1024 * 1024} // 10MB
            />

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                <ul className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm flex items-center">
                      {file.type.includes("image") ? (
                        <ImageIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <ImageIcon className="h-4 w-4 mr-2" />
                      )}
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMedia(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadMedia}
              disabled={isSubmittingMedia || selectedFiles.length === 0}
            >
              {isSubmittingMedia ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        open={isDeletingProject}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeletingProject(false);
            setForceDelete(true); // Reset when dialog closes
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <input
              type="checkbox"
              id="forceDelete"
              className="h-4 w-4 rounded border-gray-300"
              checked={forceDelete}
              onChange={(e) => setForceDelete(e.target.checked)}
            />
            <label htmlFor="forceDelete" className="text-sm">
              Delete project and all its content (images, videos)
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeletingProject(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProject}
              disabled={isSubmittingProject}
            >
              {isSubmittingProject ? (
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

      {/* Delete Media Confirmation Dialog */}
      <Dialog
        open={isDeletingMedia}
        onOpenChange={(open) => {
          if (!open) setIsDeletingMedia(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this media? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletingMedia(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteImage}
              disabled={isSubmittingMedia}
            >
              {isSubmittingMedia ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Media"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete image confirmation dialog */}
      <AlertDialog
        open={isConfirmingDeleteImage}
        onOpenChange={setIsConfirmingDeleteImage}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletingImageId(null);
                setDeletingImageProjectId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete video confirmation dialog */}
      <AlertDialog
        open={isConfirmingDeleteVideo}
        onOpenChange={setIsConfirmingDeleteVideo}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletingVideoId(null);
                setDeletingVideoProjectId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteVideo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
