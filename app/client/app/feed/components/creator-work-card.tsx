"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
interface CreatorWorkCardProps {
  creator: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    primary_role?: string[];
    location?: string;
    avatar_url?: string;
  };
  project: {
    id: string;
    title: string;
    images?: {
      id: string;
      url: string;
    }[];
  };
  isNew?: boolean;
}

export default function CreatorWorkCard({
  creator,
  project,
  isNew = false,
}: CreatorWorkCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Check if we have a valid image URL
  const hasValidImage =
    project.images && project.images.length > 0 && project.images[0].url;

  // If no valid image, don't render anything
  if (!hasValidImage) {
    return null;
  }

  // Get image URL
  const imageUrl = project.images[0].url;

  // Get creator display name
  const creatorName =
    creator.first_name && creator.last_name
      ? `${creator.first_name} ${creator.last_name}`
      : "Creative Name";

  // Get primary role or default to "Creator"
  const primaryRole =
    creator.primary_role && creator.primary_role.length > 0
      ? creator.primary_role[0]
      : "Photographer";

  return (
    <div className="break-inside-avoid w-full">
      {/* Project Image with Link */}
      <Link
        href={`/project/${project.id}`}
        className="relative block overflow-hidden w-full"
      >
        <div className="overflow-hidden relative bg-gray-100 break-inside-avoid mb-4 m-4 shadow-lg">
          <Image
            src={imageUrl}
            alt={project.title || "Creator Work"}
            width={500}
            height={300}
            className="w-full h-auto transition-transform duration-300 hover:scale-105"
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Loading placeholder */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* "NEW" badge */}
          {isNew && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-yellow-400 text-black font-bold uppercase text-xs px-2 py-1 rounded-full transform rotate-12">
                NEW
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Creator Info */}
      {/* <div className="mt-2 mb-4 flex items-center gap-3">
        <Link href={`/${creator.username}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary">
            {creator.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-medium text-lg">
                {creator.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1">
            <Link
              href={`/${creator.username}`}
              className="font-medium text-sm hover:underline truncate"
            >
              {creatorName}
            </Link>
            <span className="text-muted-foreground text-xs">
              @{creator.username}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{primaryRole}</span>
            {creator.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-muted-foreground mr-0.5" />
                <span className="text-muted-foreground">
                  {creator.location}
                </span>
              </div>
            )}
          </div>
        </div>
      </div> */}
    </div>
  );
}
