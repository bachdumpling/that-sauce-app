// src/components/ProjectCard.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { Upload } from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  title: string;
  behance_url?: string;
  images: Array<{
    id: string;
    url: string;
    alt_text: string;
    resolutions: {
      high_res?: string;
      low_res?: string;
    };
  }>;
}

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

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-medium">{project.title}</h3>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <Upload
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <FileUpload
            projectId={project.id}
            onUploadComplete={onUploadComplete}
            onError={onError}
          />
        </CardContent>
      )}
    </Card>
  );
}
