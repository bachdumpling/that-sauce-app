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

// Helper function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  if (!array) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};

export function Overview({ creator }: OverviewProps) {
  return (
    <div className="w-full space-y-8">
      {/* Projects Masonry Grid */}
      {creator.projects && creator.projects.length > 0 && (
        <div className="mt-8">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {creator.projects.map((project) => {
              // Filter images with a valid URL and shuffle them
              const availableImages =
                project.images?.filter(
                  (img) =>
                    img.url ||
                    img.resolutions?.high_res ||
                    img.resolutions?.low_res
                ) || [];
              // Select up to 3 random images
              const selectedImages = shuffleArray(availableImages).slice(0, 3);

              return (
                <div key={project.id}>
                  {selectedImages.length > 0 ? (
                    // Map over the selected images and render them
                    selectedImages.map((image, index) => (
                      <div
                        key={image.id || index}
                        className="overflow-hidden rounded-lg bg-gray-100 break-inside-avoid mb-4 relative block"
                      >
                        {" "}
                        {/* Use block to stack images */}
                        <Image
                          src={
                            image.url ||
                            image.resolutions?.high_res ||
                            image.resolutions?.low_res ||
                            ""
                          }
                          alt={
                            image.alt_text ||
                            project.title ||
                            `Project image ${index + 1}`
                          }
                          width={500}
                          height={300}
                          className="w-full h-auto transition-transform duration-300 hover:scale-105 block"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: "cover" }}
                          priority={index === 0}
                        />
                      </div>
                    ))
                  ) : (
                    // Fallback if no images are available
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
