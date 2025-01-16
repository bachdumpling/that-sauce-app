// src/components/ProjectCard.tsx
import Image from "next/image";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

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

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="space-y-3">
      <a
        href={project?.behance_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="mb-4">
          <h3 className="font-medium text-sm truncate">{project.title}</h3>
        </div>

        {/* Main Image */}
        <div className="aspect-auto overflow-hidden rounded-lg bg-secondary/50 relative h-[500px] w-full">
          {project.images?.[0] ? (
            <Image
              src={
                project.images[0].resolutions?.high_res || project.images[0].url
              }
              alt={project.images[0].alt_text || project.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              quality={100}
            />
          ) : (
            <LoadingSkeleton />
          )}
        </div>
      </a>

      {/* Thumbnail Gallery */}
      {project.images && project.images.length > 1 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {project.images.slice(1, 3).map((image) => (
            <div
              key={image.id.toString()}
              className="aspect-auto overflow-hidden rounded-lg bg-secondary/50 relative h-[300px]"
            >
              {image ? (
                <Image
                  src={image.resolutions?.low_res || image.url}
                  alt={image.alt_text || `${project.title} thumbnail`}
                  fill
                  sizes="(max-width: 768px) 33vw, 20vw"
                  className="object-cover object-center"
                  loading="lazy"
                  quality={100}
                />
              ) : (
                <LoadingSkeleton />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
