"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus } from "lucide-react";
import TiltedCard from "@/components/ui/tilted-card";
import { Creator } from "@/components/shared/types";
import { usePathname } from "next/navigation";

interface CreatorHeaderProps {
  creator: Creator;
  username: string;
}

export function CreatorHeader({ creator, username }: CreatorHeaderProps) {
  const pathname = usePathname();
  
  // Check if we're on a project detail page - matches pattern /username/work/project-id
  const isProjectDetailPage = pathname.match(new RegExp(`/${username}/work/[^/]+$`)) !== null;
  
  if (isProjectDetailPage) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-10">
      <div className="flex flex-col items-start gap-4 py-4 pr-10 space-y-4">
        <div className="flex flex-row justify-start items-center gap-4">
          <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
            {/* Placeholder avatar */}
            <div className="h-full w-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-bold text-3xl">
                {creator.username
                  ? creator.username.charAt(0).toUpperCase()
                  : "C"}
              </span>
            </div>
          </div>
          {/* Creator name and username */}
          <div>
            <div className="flex flex-row justify-between">
              <h2 className="text-xl md:text-4xl font-medium">
                {creator.first_name && creator.last_name
                  ? `${creator.first_name} ${creator.last_name}`
                  : creator.username
                    ? creator.username
                    : "Creator"}
              </h2>
            </div>
            <span className="text-base text-gray-500">
              @
              {creator.username
                ? creator.username.toLowerCase()
                : "creator"}
            </span>
          </div>
        </div>

        <div className="flex flex-row gap-4 justify-start items-center">
          {/* Creator primary role */}
          {creator.primary_role && creator.primary_role.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {creator.primary_role.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="text-base px-4 py-2"
                >
                  {typeof role === "string"
                    ? role.replace(/-/g, " ")
                    : role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {creator.bio && (
          <p className="max-w-2xl text-muted-foreground">{creator.bio}</p>
        )}
        <div className="flex flex-row gap-4">
          <Button variant="default" className="p-6 rounded-full">
            <MessageCircle className="h-4 w-4 mr-2 mb-1" />
            Get in touch
          </Button>
          <Button variant="outline" className="p-6 rounded-full">
            <Plus className="h-4 w-4 mr-2 mb-1" />
            Add to projects
          </Button>
        </div>
      </div>

      <div className="items-center gap-3 grid place-items-center">
        {/* Lanyard */}
        <TiltedCard
          imageSrc={creator.projects?.[0]?.images?.[0]?.url}
          altText="Lanyard"
          captionText="Lanyard"
          containerHeight="350px"
          containerWidth="350px"
          imageHeight="350px"
          imageWidth="350px"
          rotateAmplitude={12}
          scaleOnHover={1.2}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={false}
          overlayContent={
            <div className="gap-2 w-full h-full">
              <p className="text-white text-4xl font-bold">
                {creator.first_name} {creator.last_name}
              </p>
              <p className="text-white text-xl font-bold">
                {creator.primary_role && creator.primary_role[0]}
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
} 