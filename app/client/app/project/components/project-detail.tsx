"use client";

import { useState } from "react";
import {
  Creator,
  Project,
  Image as ImageType,
  Video,
} from "@/components/shared/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Edit, Trash2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateProject, deleteProject } from "@/lib/api/client/projects";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";

interface ProjectDetailProps {
  project: Project;
  creator: Creator;
}

export function ProjectDetail({ project, creator }: ProjectDetailProps) {
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<
    ((ImageType | Video) & { type: "image" | "video" }) | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");

  // Get all media (images and videos) from the project
  const allMedia = [
    ...(project.images || []).map((img) => ({
      ...img,
      type: "image" as const,
    })),
    ...(project.videos || []).map((vid) => ({
      ...vid,
      type: "video" as const,
    })),
  ];

  const handleOpenMedia = (
    media: (ImageType | Video) & { type: "image" | "video" }
  ) => {
    setSelectedMedia(media);
  };

  const handleEditProject = () => {
    setIsEditing(true);
  };

  const handleDeleteProject = () => {
    setIsDeletingProject(true);
  };

  const handleSaveProject = async () => {
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updateProject(project.id, {
        title,
        description,
      });

      if (response.success) {
        toast.success("Project updated successfully");
        router.refresh();
        setIsEditing(false);
      } else {
        toast.error(response.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    setIsSubmitting(true);

    try {
      const response = await deleteProject(project.id, true);

      if (response.success) {
        toast.success("Project deleted successfully");
        router.push(`/${creator.username}/work`);
      } else {
        toast.error(response.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setIsDeletingProject(false);
    }
  };

  return (
    <div>
      {/* Project Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl truncate">
              {project.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            By {creator.name || creator.username}
          </p>
        </div>

        {creator.isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEditProject}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Masonry Grid for Media */}
      {allMedia.length > 0 ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {allMedia.map((media, index) => (
            <div
              key={`${media.type}-${media.id}`}
              className={`rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                // For the first item, make it span 2 columns on larger screens if there are at least 3 items
                index === 0 && allMedia.length >= 3
                  ? "md:col-span-2 md:row-span-2"
                  : ""
              }`}
              onClick={() => handleOpenMedia(media)}
            >
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={`${project.title} - Image ${index + 1}`}
                  className="w-full object-contain aspect-auto"
                />
              ) : (
                <div className="w-full bg-black overflow-hidden">
                  {media.youtube_id ? (
                    <div className="aspect-video w-full">
                      <YouTubeEmbed
                        youtubeId={media.youtube_id}
                        title={project.title || "YouTube video"}
                      />
                    </div>
                  ) : media.vimeo_id ? (
                    <div className="aspect-video w-full">
                      <VimeoEmbed
                        vimeoId={media.vimeo_id}
                        title={project.title || "Vimeo video"}
                      />
                    </div>
                  ) : media.url ? (
                    <video controls src={media.url} className="w-full">
                      <source src={media.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-36 flex items-center justify-center bg-gray-800 text-white">
                      <span className="text-gray-400">Video not available</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-md">
          <p className="text-muted-foreground">
            No media available for this project.
          </p>
        </div>
      )}

      {/* Media Viewer Dialog */}
      {selectedMedia && (
        <Dialog
          open={!!selectedMedia}
          onOpenChange={(open) => !open && setSelectedMedia(null)}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{project.title}</DialogTitle>
              {project.description && (
                <DialogDescription>{project.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="p-2 flex justify-center items-center">
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.url}
                  alt={project.title}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-h-[80vh] max-w-full"
                  autoPlay
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Project Dialog */}
      <Dialog
        open={isEditing}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to your project information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium mb-2 block"
              >
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description (optional)"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog
        open={isDeletingProject}
        onOpenChange={(open) => !open && setIsDeletingProject(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone, and all associated media will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeletingProject(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteProject}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
