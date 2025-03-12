"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/social-icon";
import {
  Globe,
  MapPin,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
} from "lucide-react";
import { ProjectCard } from "@/components/shared/project-card";
import {
  Creator,
  Project,
  Image as ImageType,
  Video as VideoType,
  ViewMode,
} from "@/components/shared/types";

interface CreatorProfileProps {
  creator: Creator;
  viewMode?: ViewMode;
  showScores?: boolean;
  onEditProfile?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onAddProject?: () => void;
  onAddMedia?: (project: Project) => void;
  onDeleteImage?: (projectId: string, imageId: string) => void;
}

export function CreatorProfile({
  creator,
  viewMode = "public",
  showScores = false,
  onEditProfile,
  onEditProject,
  onDeleteProject,
  onAddProject,
  onAddMedia,
  onDeleteImage,
}: CreatorProfileProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Get all images from all projects
  const allImages = (creator.projects || []).flatMap((project) =>
    (project.images || []).map((image) => ({
      ...image,
      projectTitle: project.title,
      projectId: project.id,
    }))
  );

  // Get all videos from all projects
  const allVideos = (creator.projects || []).flatMap((project) =>
    (project.videos || []).map((video) => ({
      ...video,
      projectTitle: project.title,
      projectId: project.id,
    }))
  );

  // Filter featured projects
  const featuredProjects = (creator.projects || []).filter(
    (project) => project.featured
  );

  // Function to open image modal
  const openImageModal = (project: Project, index: number) => {
    setSelectedProject(project);
    setSelectedImageIndex(index);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setSelectedProject(null);
    setSelectedImageIndex(null);
  };

  // Function to navigate to next image
  const nextImage = () => {
    if (!selectedProject || selectedImageIndex === null) return;
    const imageCount = selectedProject.images?.length || 0;
    setSelectedImageIndex((selectedImageIndex + 1) % imageCount);
  };

  // Function to navigate to previous image
  const prevImage = () => {
    if (!selectedProject || selectedImageIndex === null) return;
    const imageCount = selectedProject.images?.length || 0;
    setSelectedImageIndex((selectedImageIndex - 1 + imageCount) % imageCount);
  };

  return (
    <div className="w-full space-y-8">
      {/* Creator Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold">{creator.username}</h1>

          {creator.primary_role && creator.primary_role.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {creator.primary_role.map((role) => (
                <Badge key={role} variant="secondary">
                  {typeof role === 'string' ? role.replace(/-/g, " ") : role}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 text-muted-foreground">
            {creator.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{creator.location}</span>
              </div>
            )}

            {creator.years_of_experience && (
              <div className="flex items-center gap-1 ml-4">
                <span>{creator.years_of_experience} years of experience</span>
              </div>
            )}
          </div>

          {creator.bio && (
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {creator.bio}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Social links */}
          {creator.social_links &&
            Object.entries(creator.social_links).map(([platform, url]) => {
              if (!url) return null;

              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  aria-label={`${platform} profile`}
                >
                  <SocialIcon platform={platform} />
                </a>
              );
            })}

          {creator.social_links?.website && (
            <a
              href={creator.social_links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Website"
            >
              <Globe className="h-5 w-5" />
            </a>
          )}

          {/* Edit Profile Button (for owner view) */}
          {viewMode === "owner" && onEditProfile && (
            <Button variant="outline" onClick={onEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          {featuredProjects.length > 0 && (
            <TabsTrigger value="featured">Featured</TabsTrigger>
          )}
        </TabsList>

        {/* All Projects Tab */}
        <TabsContent value="projects" className="space-y-8">
          {/* Add Project Button (for owner view) */}
          {viewMode === "owner" && onAddProject && (
            <div className="flex justify-end mb-6">
              <Button onClick={onAddProject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          )}

          {(creator.projects?.length || 0) === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects available</p>

              {viewMode === "owner" && onAddProject && (
                <Button onClick={onAddProject} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {(creator.projects || []).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  showScores={showScores}
                  onEdit={onEditProject}
                  onDelete={onDeleteProject}
                  onImageClick={(index) => openImageModal(project, index)}
                  onAddMedia={onAddMedia}
                  onDeleteImage={onDeleteImage}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Featured Projects Tab */}
        {featuredProjects.length > 0 && (
          <TabsContent value="featured" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  showScores={showScores}
                  onEdit={onEditProject}
                  onDelete={onDeleteProject}
                  onImageClick={(index) => openImageModal(project, index)}
                  onAddMedia={onAddMedia}
                  onDeleteImage={onDeleteImage}
                />
              ))}
            </div>
          </TabsContent>
        )}

        {/* Images Tab */}
        <TabsContent value="images">
          {allImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images available</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
              {allImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative break-inside-avoid overflow-hidden rounded-md cursor-pointer group mb-4"
                  onClick={() => {
                    const project = creator.projects?.find(
                      (p) => p.id === image.projectId
                    );
                    if (project) {
                      const imageIndex =
                        project.images?.findIndex(
                          (img) => img.id === image.id
                        ) || 0;
                      openImageModal(project, imageIndex);
                    }
                  }}
                >
                  <div className="w-full relative">
                    <Image
                      src={image.resolutions.high_res || image.url}
                      alt={image.alt_text || image.projectTitle}
                      width={500}
                      height={500}
                      className="w-full h-auto transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      style={{ display: "block" }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">
                        {image.projectTitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          {allVideos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video">
                    <iframe
                      src={`https://player.vimeo.com/video/${video.vimeo_id}?title=0&byline=0&portrait=0`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium">
                      {video.title || "Untitled Video"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {video.projectTitle}
                    </p>
                    {/* {video.description && (
                      <p className="text-sm mt-2">{video.description}</p>
                    )} */}
                    {showScores && video.similarity_score !== undefined && (
                      <div className="flex justify-end mt-2">
                        <Badge variant="secondary">
                          Match: {(video.similarity_score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      {selectedProject &&
        selectedImageIndex !== null &&
        selectedProject.images && (
          <div className="fixed -inset-10 z-50 bg-black/90 flex items-center justify-center">
            <div className="relative w-full max-w-5xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70"
                onClick={closeImageModal}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </Button>

              <div className="relative aspect-[4/3] bg-black/30">
                <Image
                  src={
                    selectedProject.images[selectedImageIndex].resolutions
                      .high_res ||
                    selectedProject.images[selectedImageIndex].url
                  }
                  alt={
                    selectedProject.images[selectedImageIndex].alt_text ||
                    selectedProject.title
                  }
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              <div className="absolute inset-y-0 left-4 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-black/50 hover:bg-black/70"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                  <span className="sr-only">Previous</span>
                </Button>
              </div>

              <div className="absolute inset-y-0 right-4 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-black/50 hover:bg-black/70"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>

              {/* Image counter indicator */}
              {selectedProject.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full">
                  <p className="text-white text-sm">
                    {selectedImageIndex + 1} / {selectedProject.images.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
