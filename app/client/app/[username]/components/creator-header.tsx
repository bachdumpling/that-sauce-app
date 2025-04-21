"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Pencil,
  Share,
  MapPin,
  Upload,
  Camera,
} from "lucide-react";
import TiltedCard from "@/components/ui/tilted-card";
import { Creator } from "@/client/types";
import { usePathname } from "next/navigation";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { SocialIcon } from "@/components/ui/social-icon";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadCreatorBannerAction } from "@/actions/creator-actions";
import Image from "next/image";

interface CreatorHeaderProps {
  creator: Creator;
  username: string;
}

export function CreatorHeader({ creator, username }: CreatorHeaderProps) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Check if we're on a project detail page - matches pattern /username/work/project-id
  const isProjectDetailPage =
    pathname.match(new RegExp(`/${username}/work/[^/]+$`)) !== null;

  // Custom event to trigger the profile edit dialog in creator-client.tsx
  const handleEditProfile = () => {
    // Dispatch a custom event that will be caught by creator-client.tsx
    window.dispatchEvent(new Event("edit-creator-profile"));
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const result = await uploadCreatorBannerAction(username, file);

      if (result.success) {
        toast.success("Banner uploaded successfully");
        // No need to refresh page, Next.js will revalidate
      } else {
        throw new Error(result.message || "Failed to upload banner");
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload banner"
      );
    } finally {
      setIsUploading(false);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBannerClick = () => {
    if (creator?.isOwner && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isProjectDetailPage) {
    return null;
  }

  if (!creator) {
    return <LoadingAnimation />;
  }

  return (
    <div className="flex flex-row gap-10 p-8">
      <div className="flex-1 flex-col items-start justify-center space-y-6">
        <div className="flex flex-row justify-start items-center gap-4">
          <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
            {/* Placeholder avatar */}
            <div className="h-full w-full bg-gray-300 flex items-center justify-center">
              {creator?.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-gray-600 font-bold text-3xl">
                  {creator?.username
                    ? creator.username.charAt(0).toUpperCase()
                    : "C"}
                </span>
              )}
            </div>
          </div>
          {/* Creator name and username */}
          <div>
            <div className="flex flex-row justify-between">
              <h2 className="text-xl md:text-4xl font-medium">
                {creator?.first_name && creator?.last_name
                  ? `${creator?.first_name} ${creator?.last_name}`
                  : creator?.username
                    ? creator?.username
                    : "Creator"}
              </h2>
            </div>
            <span className="text-base text-gray-500">
              @{creator?.username ? creator?.username.toLowerCase() : "creator"}
            </span>
          </div>
        </div>

        {creator?.bio && (
          <p className="max-w-2xl text-muted-foreground">{creator?.bio}</p>
        )}

        <div className="flex flex-row gap-4 justify-start items-center">
          {/* Creator primary role */}
          {creator?.primary_role && creator?.primary_role?.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {creator?.primary_role?.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="text-base px-4 py-2 font-medium"
                >
                  {typeof role === "string" ? role.replace(/-/g, " ") : role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Creator location */}
          {creator?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{creator?.location}</span>
            </div>
          )}

          {creator?.social_links &&
            Object.entries(creator?.social_links)
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

        {creator?.isOwner ? (
          <div className="flex flex-row gap-4">
            <Button
              variant="default"
              className="p-6 rounded-full"
              onClick={handleEditProfile}
            >
              <Pencil className="h-4 w-4 mr-2 mb-1" />
              Edit profile
            </Button>
            <Button variant="outline" className="p-6 rounded-full">
              <Share className="h-4 w-4 mr-2 mb-1" />
              Share profile
            </Button>
          </div>
        ) : (
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
        )}
      </div>

      <div
        className="items-center grid place-items-center aspect-[4/3] max-w-[600px] w-full justify-self-center relative"
        onMouseEnter={() => creator?.isOwner && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadBanner}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
        />

        {/* Lanyard */}
        <TiltedCard
          imageSrc={
            creator?.banner_url || creator?.projects?.[0]?.images?.[0]?.url
          }
          altText="Lanyard"
          captionText={creator?.isOwner ? "Click to upload banner" : "Lanyard"}
          fullSize={true}
          rotateAmplitude={12}
          scaleOnHover={1.1}
          showMobileWarning={false}
          showTooltip={creator?.isOwner}
          displayOverlayContent={creator?.isOwner && isHovering}
          overlayContent={
            creator?.isOwner ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-black/70 p-4 rounded-lg">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                      <p className="text-white text-lg">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-white mb-2 mx-auto" />
                      <p className="text-white text-xl font-semibold text-center">
                        Upload Banner
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="gap-2 w-full h-full">
                <p className="text-white text-4xl font-bold">
                  {creator?.first_name} {creator?.last_name}
                </p>
                <p className="text-white text-xl font-bold">
                  {creator?.primary_role && creator?.primary_role[0]}
                </p>
              </div>
            )
          }
          className={creator?.isOwner && !isUploading ? "cursor-pointer" : ""}
          onClick={
            creator?.isOwner && !isUploading ? handleBannerClick : undefined
          }
        />
      </div>
    </div>
  );
}
