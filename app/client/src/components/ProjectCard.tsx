// src/components/ProjectCard.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

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

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description?: string | null;
  };
  onUploadComplete: (url: string, mediaEntry: MediaEntry) => void;
  onError: (error: string) => void;
}

export function ProjectCard({
  project,
  onUploadComplete,
  onError,
}: ProjectCardProps) {
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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="cursor-pointer" onClick={toggleExpand}>
        <div className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-medium">{project.title}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation(); // Prevent header click
              toggleExpand();
            }}
          >
            <Upload
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading media...</div>
          ) : (
            <>
              {media.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="relative aspect-square">
                      {item.file_type === "image" ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={item.storage_url}
                            alt={item.metadata.original_name}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ) : item.file_type === "video" ? (
                        <div className="relative w-full h-full">
                          <video
                            src={item.storage_url}
                            className="w-full h-full object-cover rounded-lg"
                            controls
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
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
