"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { SocialIcon } from "@/components/ui/social-icon";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { Creator } from "@/components/shared/types";
import { usePathname } from "next/navigation";

interface TabsNavProps {
  creator: Creator;
  username: string;
}

export function TabsNav({ creator, username }: TabsNavProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.endsWith(`/${username}`)) return "overview";
    if (pathname.includes(`/${username}/work`)) return "work";
    if (pathname.includes(`/${username}/about`)) return "about";
    return "overview";
  };
  
  const activeTab = getActiveTab();

  return (
    <div className="border-b mb-8 flex justify-between items-center">
      <div className="flex space-x-8">
        <Link
          href={`/${username}`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "overview"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </Link>
        <Link
          href={`/${username}/work`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "work"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Work
        </Link>
        <Link
          href={`/${username}/about`}
          className={`py-4 px-1 font-medium text-lg ${
            activeTab === "about"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          About
        </Link>
      </div>

      <div className="flex justify-end items-center gap-4">
        {/* Creator location */}
        {creator.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{creator.location}</span>
          </div>
        )}

        {creator.social_links &&
          Object.entries(creator.social_links)
            .filter(([platform]) =>
              SOCIAL_PLATFORMS.some((p) => p.id === platform)
            )
            .map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center border hover:bg-gray-100"
              >
                <span className="sr-only">{platform}</span>
                <SocialIcon platform={platform} className="h-4 w-4" />
              </a>
            ))}
      </div>
    </div>
  );
} 