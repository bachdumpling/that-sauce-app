"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/components/shared/types";
import Image from "next/image";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { ImageLightbox } from "@/components/shared/image-lightbox";

interface CreatorResultCardProps {
  creator: SearchResult;
  role: string;
}

export function CreatorResultCard({ creator, role }: CreatorResultCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="border-b pb-8">
      <div className="flex flex-col gap-8">
        {/* Creator info section */}
        <div className="flex w-full justify-between items-center">
          {/* Creator Contact column */}
          <div className="flex flex-col items-start gap-4">
            {/* Avatar and name and username */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                {/* Placeholder avatar */}
                <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-xl">
                    {creator.profile && creator.profile.username
                      ? creator.profile.username.charAt(0).toUpperCase()
                      : "C"}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {creator.profile && creator.profile.username
                    ? creator.profile.username
                    : "Creator"}
                </h2>
                <span className="text-sm text-gray-500">
                  @
                  {creator.profile && creator.profile.username
                    ? creator.profile.username.toLowerCase()
                    : "creator"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {creator.profile && creator.profile.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{creator.profile.location}</span>
                </div>
              )}
              <span className="px-4 py-1 border rounded-md text-sm">
                {role}
              </span>
              <div className="flex gap-4">
                {/* Social icons - using globe icon as placeholder */}
                {creator.profile &&
                  creator.profile.social_links &&
                  Object.entries(creator.profile.social_links).map(
                    ([platform, url], index) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100"
                      >
                        <span className="sr-only">{platform}</span>
                        {platform === "website" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        ) : platform === "linkedin" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                          </svg>
                        ) : platform === "behance" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M10 10.2h3.3c0-.2-.1-.9-1.7-.9-1.4 0-1.7.8-1.6 .9zm7.9 1.4c-1.1 0-1.5.6-1.6 .9h3.1c-.1-.3-.4-.9-1.5-.9zm-7.9 1.8h3.3c0-.2-.3-.9-1.7-.9-1.5 0-1.7.7-1.6.9zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 16h-6v-7h5.7c1.8 0 2.8.9 2.8 2.2 0 .9-.5 1.7-1.6 2 1.1.2 1.9 1 1.9 2.3 0 1.5-1.2 2.5-2.8 2.5zm8-3h-6c0 1.8 1.7 1.8 2 1.8 .3 0 .7-.1.8-.3h2.9c-.4 1.4-1.6 2.2-3.7 2.2-2.5 0-4.1-1.3-4.1-4 0-2.2 1.4-4 4.1-4 2.9 0 4 1.7 4 4.1v.2zm-3-4h-4V8h4v3z"></path>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        )}
                      </a>
                    )
                  )}
              </div>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex flex-row justify-center items-center h-full w-fit gap-2 mt-2">
            <Link
              href={
                creator.profile && creator.profile.username
                  ? `/creator/${creator.profile.username}`
                  : "#"
              }
            >
              <Button
                variant="outline"
                className="border-black hover:bg-black hover:text-white rounded-full px-8 py-6"
                disabled={!creator.profile || !creator.profile.username}
              >
                View Profile
              </Button>
            </Link>

            <Button
              variant="default"
              className="bg-black rounded-full px-8 py-6"
            >
              Add to Project
            </Button>
          </div>
        </div>

        {/* Creator projects column */}
        <div className="col-span-2">
          <div className="flex flex-row items-end gap-10 h-72 overflow-x-auto">
            {creator.content && creator.content.length > 0 ? (
              creator.content.map(
                (content, index) =>
                  index < 10 && (
                    <div
                      key={content.id}
                      className={`flex-none flex items-end ${content.type === "video" ? "h-full aspect-video" : ""}`}
                      style={{ height: "100%" }}
                    >
                      {content.type === "video" ? (
                        <div className="w-full bg-black overflow-hidden">
                          {content.youtube_id ? (
                            <div className="aspect-video">
                              <YouTubeEmbed
                                youtubeId={content.youtube_id}
                                title={content.title || "YouTube video"}
                              />
                            </div>
                          ) : content.vimeo_id ? (
                            <div className="aspect-video">
                              <VimeoEmbed
                                vimeoId={content.vimeo_id}
                                title={content.title || "Vimeo video"}
                              />
                            </div>
                          ) : content.url ? (
                            <video
                              controls
                              src={content.url}
                              className="w-full"
                            >
                              <source src={content.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="w-full h-36 flex items-center justify-center bg-gray-800 text-white">
                              <span className="text-gray-400">
                                Video not available
                              </span>
                            </div>
                          )}
                        </div>
                      ) : content.url ? (
                        <Image
                          src={content.url}
                          alt={
                            content.title || content.project_title || "Content"
                          }
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="cursor-pointer relative max-h-full w-auto object-cover object-bottom"
                          onClick={() => handleImageClick(content.url)}
                          style={{
                            display: "block",
                          }}
                        />
                      ) : (
                        <div className="h-36 w-40 flex items-center justify-center bg-gray-100 rounded-md">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                  )
              )
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-gray-400">No content available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          imageUrl={selectedImage}
        />
      )}
    </div>
  );
}
