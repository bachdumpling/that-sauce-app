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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { VimeoEmbed } from "@/components/VimeoEmbed";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

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

  const firstMedia = mediaItems[0];

  const handleMediaLoad = () => {
    setIsMediaLoading(false);
  };

  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };

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
                      className={`w-full h-auto transition-transform duration-300 hover:scale-105 ${
                        isMediaLoading ? "opacity-0" : "opacity-100"
                      }`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onLoad={handleMediaLoad}
                      onError={handleMediaError}
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
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProjectMedia = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("media")
        .select("id, storage_url, file_type, metadata")
        .eq("metadata->>project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      console.error("Error fetching project media:", error);
      setFetchError(error.message || "Failed to load project media");
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchProjectMedia();
  }, [fetchProjectMedia]);

  const handleUploadComplete = (url: string, mediaEntry: MediaEntry) => {
    onUploadComplete(url, mediaEntry);
    fetchProjectMedia(); // Refresh media after upload
  };

  const handleMediaLoad = () => {
    setIsMediaLoading(false);
  };

  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };

  const handleRetry = () => {
    setFetchError(null);
    setMediaError(false);
    setIsMediaLoading(true);
    fetchProjectMedia();
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pb-4">
          {fetchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{fetchError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <FileUpload
              projectId={project.id}
              onComplete={handleUploadComplete}
              onError={onError}
            />

            {isLoading && !fetchError ? (
              <div className="space-y-4">
                <LoadingSkeleton />
                <LoadingSkeleton />
              </div>
            ) : media.length > 0 ? (
              <div className="columns-1 md:columns-2 gap-4 [&>*]:mb-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-full break-inside-avoid rounded-lg overflow-hidden bg-muted"
                  >
                    {item.file_type === "image" ? (
                      <Image
                        src={item.storage_url}
                        alt={item.metadata?.original_name || "Project image"}
                        width={1200}
                        height={800}
                        className={`w-full h-auto transition-transform duration-300 hover:scale-105 ${
                          isMediaLoading ? "opacity-0" : "opacity-100"
                        }`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onLoad={handleMediaLoad}
                        onError={handleMediaError}
                      />
                    ) : item.file_type === "video" ? (
                      <div className="aspect-video bg-black flex items-center justify-center">
                        <video
                          src={item.storage_url}
                          controls
                          className="max-h-full max-w-full"
                          onLoadedData={handleMediaLoad}
                          onError={handleMediaError}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center p-4">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.metadata?.original_name ||
                              "Unknown file type"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No media uploaded yet. Add images or videos to your project.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
