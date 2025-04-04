"use client";

import { useState, useEffect } from "react";
import {
  Creator,
  Project,
  Image as ImageType,
} from "@/components/shared/types";
import { Overview } from "./overview";
import { updateCreatorProfile } from "@/lib/api/creators";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Plus,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import TiltedCard from "@/components/ui/tilted-card";
import { SocialIcon } from "@/components/ui/social-icon";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";

interface CreatorClientProps {
  creator: Creator;
  isOwner: boolean;
  username: string;
}

// Tab navigation component
function TabsNav({
  username,
  activeTab,
  creator,
}: {
  username: string;
  activeTab: string;
  creator: Creator;
}) {
  return (
    <div className="border-b mb-8 flex justify-between items-center">
      <div className="flex space-x-8">
        <Link
          href={`/${username}`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "overview"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </Link>
        <Link
          href={`/${username}/work`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "work"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Work
        </Link>
        <Link
          href={`/${username}/about`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "about"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          About
        </Link>
      </div>

      <div className="flex justify-end items-center gap-4">
        {/* Creator location */}
        {creator.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{creator.location}</span>
          </div>
        )}

        {creator.social_links &&
          creator.social_links &&
          Object.entries(creator.social_links)
            .filter(([platform]) =>
              SOCIAL_PLATFORMS.some((p) => p.id === platform)
            )
            .map(([platform, url], index) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center border hover:bg-gray-100"
              >
                <span className="sr-only">{platform}</span>
                <SocialIcon platform={platform} className="h-4 w-4" />
              </a>
            ))}
      </div>
    </div>
  );
}

export function CreatorClient({
  creator,
  isOwner,
  username,
}: CreatorClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [currentCreator, setCurrentCreator] = useState<Creator>(creator);

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.endsWith(`/${username}`)) return "overview";
    if (pathname.includes(`/${username}/work`)) return "work";
    if (pathname.includes(`/${username}/about`)) return "about";
    return "overview";
  };

  // Check if we're on a project detail page - matches pattern /username/work/project-id
  const isProjectDetailPage =
    pathname.match(new RegExp(`/${username}/work/[^/]+$`)) !== null;

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
            router.push(`/${updatedData.username}`);
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

  return (
    <>
      {/* Creator Header - shown on all pages except project detail */}
      {!isProjectDetailPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-10">
          <div className="flex flex-col items-start gap-4 py-4 pr-10 space-y-4">
            <div className="flex flex-row justify-start items-center gap-4">
              <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
                {/* Placeholder avatar */}
                <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-3xl">
                    {creator.username
                      ? creator.username.charAt(0).toUpperCase()
                      : "C"}
                  </span>
                </div>
              </div>
              {/* Creator name and username */}
              <div>
                <div className="flex flex-row justify-between">
                  <h2 className="text-xl md:text-4xl font-medium">
                    {creator.first_name && creator.last_name
                      ? `${creator.first_name} ${creator.last_name}`
                      : creator.username
                        ? creator.username
                        : "Creator"}
                  </h2>
                </div>
                <span className="text-base text-gray-500">
                  @
                  {creator.username
                    ? creator.username.toLowerCase()
                    : "creator"}
                </span>
              </div>
            </div>

            <div className="flex flex-row gap-4 justify-start items-center">
              {/* Creator primary role */}
              {creator.primary_role && creator.primary_role.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {creator.primary_role.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="text-base px-4 py-2"
                    >
                      {typeof role === "string"
                        ? role.replace(/-/g, " ")
                        : role}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {creator.bio && (
              <p className="max-w-2xl text-muted-foreground">{creator.bio}</p>
            )}
            <div className="flex flex-row gap-4">
              <Button variant="default" className="p-6 rounded-full">
                <MessageCircle className="h-4 w-4 mr-2 mb-1" />
                Get in touch
              </Button>
              <Button variant="outline" className="p-6 rounded-full">
                <Plus className="h-4 w-4 mr-2 mb-1" />
                Add to projects
              </Button>
            </div>
          </div>

          <div className="items-center gap-3 grid place-items-center">
            {/* Lanyard */}
            <TiltedCard
              // imageSrc="/lanyard.jpg"
              imageSrc={currentCreator.projects?.[0]?.images?.[0]?.url}
              altText="Lanyard"
              captionText="Lanyard"
              containerHeight="350px"
              containerWidth="350px"
              imageHeight="350px"
              imageWidth="350px"
              rotateAmplitude={12}
              scaleOnHover={1.2}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={false}
              overlayContent={
                <div className="gap-2 w-full h-full">
                  <p className="text-white text-4xl font-bold">
                    {creator.first_name} {creator.last_name}
                  </p>
                  <p className="text-white text-xl font-bold">
                    {creator.primary_role && creator.primary_role[0]}
                  </p>
                </div>
              }
            />
          </div>
        </div>
      )}

      <TabsNav
        creator={currentCreator}
        username={username}
        activeTab={getActiveTab()}
      />

      {/* Main content area based on active tab */}
      {getActiveTab() === "overview" && (
        <Overview creator={currentCreator} isOwner={isOwner} />
      )}

      {getActiveTab() === "work" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCreator.projects && currentCreator.projects.length > 0 ? (
            currentCreator.projects.map((project) => (
              <Link
                href={`/${username}/work/${project.id}`}
                key={project.id}
                className="group hover:opacity-90 transition-opacity"
              >
                <div className="overflow-hidden">
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0].url}
                      alt={project.title}
                      className="w-full h-72 object-cover rounded-[16px]"
                    />
                  ) : (
                    <div className="w-full h-72 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
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
            ))
          ) : (
            <div className="col-span-3 py-12 text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                No projects yet
              </h3>
              {isOwner && (
                <Button onClick={handleAddProject} className="mt-4">
                  Add Your First Project
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {getActiveTab() === "about" && (
        <div className="prose dark:prose-invert max-w-none">
          <h2>About {currentCreator.name || currentCreator.username}</h2>
          {currentCreator.bio ? (
            <p>{currentCreator.bio}</p>
          ) : (
            <p className="text-muted-foreground">No bio available.</p>
          )}

          {currentCreator.location && (
            <div className="mt-6">
              <h3>Location</h3>
              <p>{currentCreator.location}</p>
            </div>
          )}

          {currentCreator.website && (
            <div className="mt-6">
              <h3>Website</h3>
              <a
                href={
                  currentCreator.website.startsWith("http")
                    ? currentCreator.website
                    : `https://${currentCreator.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {currentCreator.website}
              </a>
            </div>
          )}
        </div>
      )}

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
