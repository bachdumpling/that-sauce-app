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
    <div className="border-b mb-8 flex justify-center items-center">
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
    </div>
  );
}
