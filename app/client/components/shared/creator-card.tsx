"use client";

import { Globe, MapPin, Edit, User, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { SocialIcon } from "@/components/ui/social-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCard } from "@/components/shared/project-card";
import { Creator, SearchResult, ViewMode } from "@/components/shared/types";
import { useState } from "react";
import Image from "next/image";
import { deleteProjectImage } from "@/lib/api/creators";
import { toast } from "sonner";

interface CreatorCardProps {
  creator: Creator | SearchResult;
  viewMode?: ViewMode;
  showScores?: boolean;
  maxProjects?: number;
  onEdit?: () => void;
  onReview?: () => void;
}

// Simple project card for search results that only shows one image
function SearchResultProjectCard({
  project,
  viewMode,
  showScores,
}: {
  project: any;
  viewMode: ViewMode;
  showScores: boolean;
}) {
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    if (!project.id || !imageId || isDeleting) return;

    if (
      confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      setIsDeleting(true);

      try {
        const response = await deleteProjectImage(project.id, imageId);

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
        setIsDeleting(false);
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
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Project Header */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-md font-semibold">{project.title}</h3>

              {/* {shouldShowScores && (
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
              )} */}
            </div>
          </div>
        </div>

        {/* Project Image - only show first image */}
        <div className="mt-auto">
          {project.images && project.images.length > 0 && (
            <div className="p-4">
              <div
                key={project.images[0].id}
                className="relative aspect-[1/1] overflow-hidden rounded-md group"
              >
                <Image
                  src={
                    project.images[0].resolutions.high_res ||
                    project.images[0].url
                  }
                  alt={project.images[0].alt_text || project.title}
                  fill
                  className={`object-cover transition-transform group-hover:scale-105 ${
                    isMediaLoading ? "opacity-0" : "opacity-100"
                  }`}
                  sizes="(max-width: 640px) 100vw, 100%"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />

                {/* Delete button for admin/owner */}
                {canDeleteImages && (
                  <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => handleDeleteImage(e, project.images[0].id)}
                  >
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CreatorCard({
  creator,
  viewMode = "public",
  showScores = false,
  maxProjects = 3,
  onEdit,
  onReview,
}: CreatorCardProps) {
  // Determine if we're dealing with a Creator or SearchResult
  const isSearchResult = "profile" in creator;

  // Extract profile data
  const profile = isSearchResult ? creator.profile : creator;
  const score = isSearchResult ? creator.score : undefined;

  // Extract projects
  const projects = isSearchResult ? creator.projects : creator.projects || [];

  // Limit the number of projects to display
  const displayProjects =
    maxProjects > 0 ? projects.slice(0, maxProjects) : projects;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/${profile.username}`}
                className="text-xl font-semibold hover:text-primary transition-colors"
              >
                {profile.username}
              </Link>
              {creator.status && (
                <div
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    creator.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {creator.status.charAt(0).toUpperCase() +
                    creator.status.slice(1)}
                </div>
              )}
            </div>

            {(profile.first_name || profile.last_name) && (
              <p className="text-sm text-muted-foreground -mt-2">
                {[profile.first_name, profile.last_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {profile.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {profile.location}
                </div>
              )}

              {profile.years_of_experience && (
                <div className="text-sm text-muted-foreground">
                  {profile.years_of_experience} years experience
                </div>
              )}

              {viewMode === "admin" && profile.work_email && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <a
                    href={`mailto:${profile.work_email}`}
                    className="hover:underline"
                  >
                    {profile.work_email}
                  </a>
                </div>
              )}
            </div>

            {profile.primary_role && profile.primary_role.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.primary_role.map((role) => (
                  <Badge key={role} variant="outline">
                    {typeof role === "string" ? role.replace(/-/g, " ") : role}
                  </Badge>
                ))}
              </div>
            )}

            {/* {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {profile.bio}
              </p>
            )} */}
          </div>

          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {/* Social links */}
            <div className="flex items-center gap-2">
              {profile.social_links &&
                Object.entries(profile.social_links).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SocialIcon platform={platform} />
                    </a>
                  );
                })}
            </div>

            {/* Action buttons based on view mode */}
            {viewMode === "owner" && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}

            {viewMode === "admin" && (
              <>
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Creator
                  </Button>
                )}
                {onReview && (
                  <Button variant="outline" size="sm" onClick={onReview}>
                    <User className="h-4 w-4 mr-2" />
                    Review Creator
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Projects */}
        {displayProjects.length > 0 && (
          <div className="mt-6 h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayProjects.map((project) =>
              isSearchResult || viewMode === "admin" ? (
                <SearchResultProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  showScores={showScores}
                />
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  showScores={showScores}
                />
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
