"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import {
  ExternalLink,
  Edit,
  Trash2,
  Video,
  ImageIcon,
  Plus,
} from "lucide-react";
import { Project, ViewMode } from "@/components/shared/types";
import { deleteProjectImage } from "@/lib/api/creators";
import { deleteProjectVideo } from "@/lib/api/media";
import { deleteProject } from "@/lib/api/projects";
import {
  deleteProjectImage as adminDeleteProjectImage,
  deleteProject as adminDeleteProject,
} from "@/lib/api/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectCardProps {
  project: Project;
  viewMode?: ViewMode;
  showScores?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onImageClick?: (imageIndex: number) => void;
  onAddMedia?: (project: Project) => void;
  onDeleteImage?: (projectId: string, imageId: string) => void;
  onDeleteVideo?: (projectId: string, videoId: string) => void;
  className?: string;
}

export function ProjectCard({
  project,
  viewMode = "public",
  showScores = false,
  onEdit,
  onDelete,
  onImageClick,
  onAddMedia,
  onDeleteImage,
  onDeleteVideo,
  className = "",
}: ProjectCardProps) {
  const router = useRouter();
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showVideoDeleteDialog, setShowVideoDeleteDialog] = useState(false);

  const handleMediaLoad = () => {
    setIsMediaLoading(false);
  };

  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };

  // Function to generate URL-friendly slug from project title
  const getProjectSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  };

  // Function to handle image deletion
  const handleDeleteImage = async (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!project.id || !imageId || isDeletingImage) return;

    // If onDeleteImage prop is provided, use it instead of the default behavior
    if (onDeleteImage) {
      onDeleteImage(project.id, imageId);
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      setIsDeletingImage(true);

      try {
        let response;

        // Use the appropriate API function based on viewMode
        if (viewMode === "admin") {
          response = await adminDeleteProjectImage(project.id, imageId);
        } else {
          response = await deleteProjectImage(project.id, imageId);
        }

        if (response.success) {
          toast.success("Image deleted successfully");
          // Reload the page to reflect the changes
          window.location.reload();
        } else {
          toast.error(response.error || "Failed to delete image");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsDeletingImage(false);
      }
    }
  };

  // Function to prepare for video deletion
  const prepareDeleteVideo = (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!project.id || isDeletingVideo) return;

    // If onDeleteVideo prop is provided, use it instead of the default behavior
    if (onDeleteVideo) {
      onDeleteVideo(project.id, videoId);
      return;
    }

    // Otherwise, use the internal delete flow with dialog
    setSelectedVideoId(videoId);
    setShowVideoDeleteDialog(true);
  };

  // Function to handle video deletion
  const handleDeleteVideo = async () => {
    if (!project.id || !selectedVideoId || isDeletingVideo) return;

    setIsDeletingVideo(true);

    try {
      const response = await deleteProjectVideo(project.id, selectedVideoId);

      if (response.success) {
        toast.success("Video deleted successfully");

        // Update the UI without refreshing the page
        if (onDeleteVideo) {
          // If the parent component provided a callback, use it
          onDeleteVideo(project.id, selectedVideoId);
        } else {
          // Otherwise, update the local state to reflect the deletion
          // (though this would require the parent to refresh the project data)
          // We'll rely on the parent to handle updating the UI
          toast.success("Video deleted successfully");
        }
      } else {
        toast.error(response.error || "Failed to delete video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeletingVideo(false);
      setSelectedVideoId(null);
      setShowVideoDeleteDialog(false);
    }
  };

  // Function to handle project deletion
  const handleDeleteProject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!project.id || isDeletingProject) return;

    // If onDelete prop is provided, use it instead of the default behavior
    if (onDelete) {
      onDelete(project);
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this entire project? This action cannot be undone and will delete all associated images and videos."
      )
    ) {
      setIsDeletingProject(true);

      try {
        let response;

        // Use the appropriate API function based on viewMode
        if (viewMode === "admin") {
          response = await adminDeleteProject(project.id);
        } else {
          response = await deleteProject(project.id);
        }

        if (response.success) {
          toast.success("Project deleted successfully");
          // Redirect to creator profile page or refresh
          if (project.creator_username) {
            router.push(`/${project.creator_username}`);
          } else {
            window.location.reload();
          }
        } else {
          toast.error(response.error || "Failed to delete project");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsDeletingProject(false);
      }
    }
  };

  // Determine if we should show scores
  const shouldShowScores =
    showScores &&
    (project.vector_score !== undefined ||
      project.video_score !== undefined ||
      (project.videos &&
        project.videos.some((v) => v.similarity_score !== undefined)));

  // Determine if the user can delete images
  const canDeleteImages = viewMode === "admin" || viewMode === "owner";
  return (
    <Card className={`overflow-hidden border-none shadow-md ${className}`}>
      <CardContent className="p-0">
        {/* Project Header */}
        <div className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              {project.creator_username ? (
                <Link
                  href={`/${project.creator_username}/${getProjectSlug(project.title)}`}
                  className="group"
                >
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                </Link>
              ) : (
                <h3 className="text-xl font-semibold">{project.title}</h3>
              )}

              {project.description && (
                <p className="mt-2 text-muted-foreground">
                  {project.description}
                </p>
              )}

              {showScores && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.vector_score !== undefined && (
                    <Badge variant="secondary">
                      Images: {(project.vector_score * 100).toFixed(1)}%
                    </Badge>
                  )}
                  {project.video_score !== undefined && (
                    <Badge variant="secondary">
                      Videos: {(project.video_score * 100).toFixed(1)}%
                    </Badge>
                  )}
                  {project.final_score !== undefined && (
                    <Badge variant="outline">
                      Overall: {(project.final_score * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {project.behance_url && (
                <a
                  href={project.behance_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="sr-only">View on Behance</span>
                </a>
              )}

              {/* Edit button (for owner or admin) */}
              {viewMode !== "public" && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(project);
                  }}
                >
                  <Edit className="h-5 w-5" />
                  <span className="sr-only">Edit project</span>
                </Button>
              )}

              {/* Delete project button (for owner or admin) */}
              {viewMode !== "public" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteProject}
                  disabled={isDeletingProject}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Delete project</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Project Media */}
        <div className="grid grid-cols-1 gap-6 p-6 pt-0">
          {/* Images Section */}
          {project.images && project.images.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images ({project.images.length})
                </h4>

                {viewMode !== "public" && onAddMedia && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onAddMedia(project);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Media
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.images.slice(0, 6).map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-md cursor-pointer group"
                    onClick={() => onImageClick && onImageClick(index)}
                  >
                    {isMediaLoading && (
                      <div className="absolute inset-0 bg-muted animate-pulse" />
                    )}
                    {mediaError ? (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          Image unavailable
                        </p>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={image.resolutions.high_res || image.url}
                          alt={image.alt_text || project.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          onLoad={handleMediaLoad}
                          onError={handleMediaError}
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        {/* Overlay with delete button */}
                        {viewMode !== "public" && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDeleteImage(e, image.id)}
                              disabled={isDeletingImage}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {project.images.length > 6 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => onImageClick && onImageClick(0)}
                  >
                    View all {project.images.length} images
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Videos Section */}
          {project.videos && project.videos.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos ({project.videos.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.videos.map((video) => (
                  <div
                    key={video.id}
                    className="relative overflow-hidden rounded-md bg-muted"
                  >
                    <div className="aspect-video">
                      {video.youtube_id ? (
                        <YouTubeEmbed
                          youtubeId={video.youtube_id}
                          title={video.title || "Video"}
                        />
                      ) : video.vimeo_id ? (
                        <VimeoEmbed
                          vimeoId={video.vimeo_id}
                          title={video.title || "Video"}
                        />
                      ) : video.url ? (
                        <video
                          controls
                          src={video.url}
                          className="w-full h-full object-cover"
                          poster={
                            project.images?.[0]?.resolutions?.high_res ||
                            project.images?.[0]?.url
                          }
                        >
                          <source src={video.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">
                            Video unavailable
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium text-sm">
                          {video.title || "Untitled Video"}
                        </h5>
                        {viewMode !== "public" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => prepareDeleteVideo(e, video.id)}
                            disabled={isDeletingVideo}
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showScores && video.similarity_score !== undefined && (
                        <div className="flex justify-end mt-2">
                          <Badge variant="secondary">
                            Match: {(video.similarity_score * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for no media */}
          {(!project.images || project.images.length === 0) &&
            (!project.videos || project.videos.length === 0) && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No media available</p>
                {viewMode !== "public" && onAddMedia && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      onAddMedia(project);
                    }}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Media
                  </Button>
                )}
              </div>
            )}
        </div>
      </CardContent>

      {/* Video Delete Dialog */}
      {showVideoDeleteDialog && (
        <AlertDialog
          open={showVideoDeleteDialog}
          onOpenChange={setShowVideoDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Video Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this video? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVideo}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
