"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialIcon } from "@/components/ui/social-icon";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import {
  Globe,
  MapPin,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  Creator,
  Project,
  Image as ImageType,
  Video as VideoType,
  ViewMode,
} from "@/components/shared/types";

interface OverviewProps {
  creator: Creator;
}

export function Overview({ creator }: OverviewProps) {
  return (
    <div className="w-full space-y-8">
      {/* Projects Masonry Grid */}
      {creator.projects && creator.projects.length > 0 && (
        <div className="mt-8">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {creator.projects.map((project) => {
              // Get the first image from each project (sorted by order if available)
              const firstImage =
                project.images && project.images.length > 0
                  ? [...project.images].sort(
                      (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)
                    )[0]
                  : null;

              return (
                <div
                  key={project.id}
                  className="overflow-hidden rounded-lg relative bg-gray-100 break-inside-avoid mb-4"
                >
                  {firstImage ? (
                    <div className="relative">
                      <Image
                        src={
                          firstImage.url ||
                          firstImage.resolutions?.high_res ||
                          firstImage.resolutions?.low_res ||
                          ""
                        }
                        alt={firstImage.alt_text || project.title || ""}
                        width={500}
                        height={300}
                        className="w-full h-auto transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
