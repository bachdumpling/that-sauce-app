// src/components/CreatorCard.tsx
import { Globe } from "lucide-react";
import Link from "next/link";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { SearchProjectCard } from "@/components/ProjectCard";

interface CreatorCardProps {
  result: {
    profile: {
      id: string;
      username: string;
      location?: string;
      creative_fields?: string[];
      website?: string;
      social_links?: Record<string, string>;
    };
    score?: number;
    projects: Array<{
      id: string;
      title: string;
      behance_url?: string;
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
      }>;
    }>;
  };
  showScores?: boolean;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ result, showScores }) => {
  const { profile, score, projects } = result;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/creator/${profile.id}`}
                className="text-xl font-semibold hover:text-primary transition-colors"
              >
                {profile.username}
              </Link>
              {score !== undefined && (
                <span className="text-sm text-muted-foreground">
                  Match: {(score * 100).toFixed(0)}%
                </span>
              )}
            </div>
            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" /> {profile.location}
              </p>
            )}
            {profile.creative_fields && profile.creative_fields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.creative_fields.map((field) => (
                  <div
                    key={field}
                    className="bg-secondary/50 rounded-md px-2 py-1 text-sm text-muted-foreground"
                  >
                    {field.replace(/-/g, " ")}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            {Object.entries(profile.social_links || {}).map(
              ([platform, url]) => {
                if (!url || platform === "website") return null;
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
              }
            )}
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <SearchProjectCard 
                key={project.id} 
                project={project} 
                showScores={showScores}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
