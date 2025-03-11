"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VimeoEmbed } from "@/components/ui/vimeo-embed";
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
import {
  deleteProjectImage as adminDeleteProjectImage,
  deleteProject as adminDeleteProject,
} from "@/lib/api/admin";
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
  viewMode?: ViewMode;
  showScores?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onImageClick?: (imageIndex: number) => void;
  onAddMedia?: (project: Project) => void;
  onDeleteImage?: (projectId: string, imageId: string) => void;
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
  className = "",
}: ProjectCardProps) {
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const handleMediaLoad = () => {
    setIsMediaLoading(false);
  };

  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
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

  // Determine if we should show scores
  const shouldShowScores =
    showScores &&
    (project.vector_score !== undefined ||
      project.video_score !== undefined ||
      (project.videos &&
        project.videos.some((v) => v.similarity_score !== undefined)));

  // Function to generate URL-friendly slug from project title
  const getProjectSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  };

  // Determine if the user can delete images
  const canDeleteImages = viewMode === "admin" || viewMode === "owner";

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Project Header */}
        <div className="px-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              {viewMode === "public" ? (
                <Link
                  href={`/creator/${project.creator_username || "unknown"}/${getProjectSlug(project.title)}`}
                  className="hover:text-primary transition-colors"
                >
                  <h3 className="text-md font-semibold">{project.title}</h3>
                </Link>
              ) : viewMode === "admin" ? (
                <Link
                  href={`/creator/${project.creator_username || "unknown"}/${getProjectSlug(project.title)}`}
                  className="hover:text-primary transition-colors"
                >
                  <h3 className="text-md font-semibold">{project.title}</h3>
                </Link>
              ) : (
                <h3 className="text-md font-semibold">{project.title}</h3>
              )}
              {project.year && (
                <p className="text-sm text-muted-foreground">{project.year}</p>
              )}

              {shouldShowScores && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.vector_score !== undefined && (
                    <Badge variant="secondary">
                      Content Match: {(project.vector_score * 100).toFixed(1)}%
                    </Badge>
                  )}
                  {project.video_score !== undefined && (
                    <Badge variant="secondary">
                      Video Score: {(project.video_score * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Edit button */}
              {/* {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(project);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )} */}

              {/* Delete button */}
              {onDelete && viewMode === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(project);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {/* External link button */}
              {project.behance_url && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={project.behance_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* {project.description && (
            <p className="mt-4 text-muted-foreground">{project.description}</p>
          )} */}
        </div>

        {/* Project Images - using mt-auto to push to bottom */}
        <div className="mt-auto">
          {project.images && project.images.length > 0 && (
            <div className="p-4">
              {/* Display images (single or multiple) */}
              <div className="columns-2 sm:columns-3 gap-2 space-y-2 mt-2">
                {project.images.slice(0, 3).map((image, index) => (
                  <div
                    key={image.id}
                    className="relative break-inside-avoid overflow-hidden rounded-md cursor-pointer group mb-2"
                    onClick={() => {
                      if (onImageClick) {
                        onImageClick(index);
                      } else if (viewMode === "public") {
                        // If no click handler is provided and in public view, use the link
                        window.location.href = `/creator/${project.creator_username || "unknown"}/${getProjectSlug(project.title)}`;
                      }
                    }}
                  >
                    <div className="w-full relative">
                      <Image
                        src={image.resolutions?.low_res || image.url}
                        alt={image.alt_text || project.title}
                        width={300}
                        height={300}
                        className="w-full h-auto transition-transform group-hover:scale-105"
                        style={{ display: "block" }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-xs font-medium truncate w-full">
                          {image.alt_text || `Image ${index + 1}`}
                        </p>
                      </div>

                      {/* Delete button for admin/owner */}
                      {canDeleteImages && (
                        <div
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => handleDeleteImage(e, image.id)}
                        >
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            disabled={isDeletingImage}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Videos */}
        {project.videos && project.videos.length > 0 && (
          <div className="mt-4 p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {project.videos.map((video) => (
                <div key={video.id} className="space-y-2">
                  <VimeoEmbed
                    vimeoId={video.vimeo_id}
                    title={video.title || "Video"}
                  />

                  {video.title && (
                    <h4 className="font-medium">{video.title}</h4>
                  )}

                  {/* {video.description && (
                    <p className="text-sm text-muted-foreground">
                      {video.description}
                    </p>
                  )} */}

                  {showScores && video.similarity_score !== undefined && (
                    <div className="flex justify-end">
                      <Badge variant="secondary">
                        Match: {(video.similarity_score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Media Button (for owner view) */}
        {viewMode === "owner" && onAddMedia && (
          <div className="p-4 flex justify-center">
            <Button variant="outline" onClick={() => onAddMedia(project)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </div>
        )}

        {/* Empty State */}
        {(!project.images || project.images.length === 0) &&
          (!project.videos || project.videos.length === 0) &&
          viewMode === "owner" &&
          onAddMedia && (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="bg-muted rounded-full p-3 mb-4">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">No media yet</h4>
              <p className="text-muted-foreground mb-4">
                Add images or videos to showcase your work
              </p>
              <Button onClick={() => onAddMedia(project)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Media
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
