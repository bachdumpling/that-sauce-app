// src/components/ProjectCard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import {
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { VimeoEmbed } from "@/components/VimeoEmbed";

// Common interfaces
interface MediaEntry {
  id: string;
  user_id: string;
  file_path: string;
  file_type: "image" | "video";
  storage_url: string;
  mime_type: string;
  size_bytes: number;
  metadata: {
    original_name: string;
  };
}

interface ProjectMedia {
  id: string;
  storage_url: string;
  file_type: string;
  metadata: {
    original_name: string;
  };
}

// Search result project card
interface SearchProjectCardProps {
  project: {
    id: string;
    title: string;
    description?: string | null;
    behance_url?: string;
    video_count?: number;
    vector_score?: number;
    video_score?: number;
    final_score?: number;
    images?: Array<{
      id: string;
      url: string;
      alt_text: string;
      resolutions: {
        high_res?: string;
        low_res?: string;
      };
    }>;
    videos?: Array<{
      id: string;
      title: string;
      vimeo_id: string;
      similarity_score: number;
      description?: string | null;
    }>;
  };
  className?: string;
  showScores?: boolean;
}

export function SearchProjectCard({
  project,
  className,
  showScores = false,
}: SearchProjectCardProps) {
  // Process both images and videos
  const mediaItems = [
    ...(project.images?.map((img) => ({
      id: img.id,
      type: "image" as const,
      storage_url: img.resolutions.high_res || img.url,
      metadata: { original_name: img.alt_text },
    })) || []),
    ...(project.videos?.map((video) => ({
      id: video.id,
      type: "video" as const,
      vimeo_id: video.vimeo_id,
      title: video.title,
      similarity_score: video.similarity_score,
    })) || []),
  ];

  const hasOnlyVideos = project.videos?.length && !project.images?.length;

  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:shadow-md overflow-hidden",
        className
      )}
    >
      <div className="space-y-4">
        {/* Project Info */}
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold leading-none">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              {showScores && hasOnlyVideos && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.vector_score !== undefined && (
                    <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">
                      Content Match: {(project.vector_score * 100).toFixed(1)}%
                    </span>
                  )}
                  {project.video_score !== undefined && (
                    <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">
                      Video Score: {(project.video_score * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            {project.behance_url && (
              <a
                href={project.behance_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Media Content */}
        {mediaItems.length > 0 && (
          <div className="px-4 pb-4">
            {/* Videos - Single Column */}
            {project.videos && project.videos.length > 0 && (
              <div className="space-y-4">
                {project.videos.map((video) => (
                  <div key={video.id} className="space-y-2">
                    <VimeoEmbed vimeoId={video.vimeo_id} title={video.title} />
                    {showScores && video.similarity_score && (
                      <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">
                          Match: {(video.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Images - Grid Layout */}
            {project.images && project.images.length > 0 && (
              <div className="columns-1 md:columns-2 gap-4 [&>*]:mb-4">
                {project.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative w-full break-inside-avoid rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={image.resolutions.high_res || image.url}
                      alt={image.alt_text}
                      width={1200}
                      height={800}
                      className="w-full h-auto transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Profile project card with upload functionality
interface ProfileProjectCardProps {
  project: {
    id: string;
    title: string;
    description?: string | null;
  };
  onUploadComplete: (url: string, mediaEntry: MediaEntry) => void;
  onError: (error: string) => void;
  className?: string;
}

export function ProfileProjectCard({
  project,
  onUploadComplete,
  onError,
  className,
}: ProfileProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState<ProjectMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjectMedia = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("media")
        .select("id, storage_url, file_type, metadata")
        .eq("metadata->>project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error("Error fetching project media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchProjectMedia();
    }
  }, [isExpanded, project.id]);

  const handleUploadComplete = (url: string, mediaEntry: MediaEntry) => {
    onUploadComplete(url, mediaEntry);
    fetchProjectMedia(); // Refresh media after upload
  };

  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:shadow-md",
        isExpanded && "ring-1 ring-primary/20",
        className
      )}
    >
      <CardHeader
        className={cn(
          "cursor-pointer select-none",
          "transition-colors duration-200",
          "hover:bg-muted/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold leading-none">
              {project.title}
            </CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse space-y-4 w-full">
                <div className="columns-1 md:columns-2 gap-4 [&>*]:mb-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="w-full break-inside-avoid bg-muted rounded-lg"
                      style={{ paddingBottom: "66.67%" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {media.length > 0 ? (
                <div className="columns-1 md:columns-2 gap-4 [&>*]:mb-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="relative w-full break-inside-avoid rounded-lg overflow-hidden bg-muted"
                    >
                      {item.file_type === "image" ? (
                        <Image
                          src={item.storage_url}
                          alt={item.metadata.original_name}
                          width={1200}
                          height={800}
                          className="w-full h-auto transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : item.file_type === "video" ? (
                        <video
                          src={item.storage_url}
                          className="w-full h-auto rounded-lg"
                          controls
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div
                          className="w-full flex items-center justify-center bg-muted"
                          style={{ paddingBottom: "66.67%" }}
                        >
                          <ImageIcon className="absolute w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No media available
                </div>
              )}

              <FileUpload
                projectId={project.id}
                onUploadComplete={handleUploadComplete}
                onError={onError}
              />
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
