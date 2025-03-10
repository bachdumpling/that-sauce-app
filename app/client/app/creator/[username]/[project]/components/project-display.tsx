"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { deleteProjectImage } from "@/lib/api/creators";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { VimeoEmbed } from "@/components/ui/vimeo-embed";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface ProjectDisplayProps {
  initialData: {
    creator: any;
    project: any;
  };
  username: string;
  projectSlug: string;
  currentUserId?: string | null;
}

export function ProjectDisplay({
  initialData,
  username,
  projectSlug,
  currentUserId,
}: ProjectDisplayProps) {
  const [projectData, setProjectData] = useState<any>(initialData.project);
  const [creator, setCreator] = useState<any>(initialData.creator);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [userId, setUserId] = useState<string | null>(currentUserId);
  const router = useRouter();

  // Fetch user data from client-side if not provided from server
  useEffect(() => {
    const fetchUser = async () => {
      if (userId) return; // Skip if we already have the user ID

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    fetchUser();
  }, [userId]);

  // Function to handle image deletion
  const handleDeleteImage = async (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!projectData?.id || !imageId || isDeletingImage) return;

    if (
      confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      setIsDeletingImage(true);

      try {
        const response = await deleteProjectImage(projectData.id, imageId);

        if (response.success) {
          toast.success("Image deleted successfully");

          // Update the UI immediately
          setProjectData({
            ...projectData,
            images: projectData.images.filter((img: any) => img.id !== imageId),
          });

          // If we deleted the last image, go back to the creator profile
          if (projectData.images.length <= 1) {
            toast.info(
              "Redirecting to profile as all images have been deleted"
            );
            setTimeout(() => {
              router.push(`/creator/${username}`);
            }, 1500);
          }
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

  // Check if the current user is the owner of this project
  const isOwner = userId && creator && creator.user_id === userId;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <Link href={`/creator/${username}`}>
          <Button variant="ghost" className="pl-0">
            <div className="flex items-center">
              <ChevronLeft className="mb-[2px] mx-2 w-4 h-4" />
              Back to {username}'s profile
            </div>
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Project Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{projectData.title}</h1>
            {projectData.year && (
              <p className="text-lg text-muted-foreground mt-1">
                {projectData.year}
              </p>
            )}
          </div>

          {projectData.behance_url && (
            <a
              href={projectData.behance_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>View on Behance</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Project Description */}
        {projectData.description && (
          <div className="prose max-w-none dark:prose-invert">
            <p>{projectData.description}</p>
          </div>
        )}

        {/* Project Images */}
        {projectData.images && projectData.images.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Images</h2>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {projectData.images.map((image: any) => (
                <div
                  key={image.id}
                  className="relative break-inside-avoid overflow-hidden rounded-md mb-4 group"
                >
                  <div className="w-full relative">
                    <Image
                      src={image.resolutions.high_res || image.url}
                      alt={image.alt_text || projectData.title}
                      width={500}
                      height={500}
                      className="w-full h-auto"
                      style={{ display: "block" }}
                    />

                    {/* Delete button for owner */}
                    {isOwner && (
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

        {/* Project Videos */}
        {projectData.videos && projectData.videos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Videos</h2>
            <div className="grid grid-cols-1 gap-8">
              {projectData.videos.map((video: any) => (
                <Card key={video.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video mb-4">
                      <VimeoEmbed
                        vimeoId={video.vimeo_id}
                        title={video.title || "Video"}
                      />
                    </div>

                    {video.title && (
                      <h3 className="text-xl font-semibold mb-2">
                        {video.title}
                      </h3>
                    )}

                    {video.description && (
                      <p className="text-muted-foreground">
                        {video.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
