"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, X, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchResult } from "@/components/shared/types";
import Image from "next/image";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { SocialIcon } from "@/components/ui/social-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/components/shared/types";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { ContentItem } from "@/components/shared/types";

const mockContent: ContentItem[][] = [
  // Group 1
  [
    {
      id: "1a",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/122f24195704583.6612b2513ecab.gif",
      title: "Animated Abstract Pattern",
      description: "Colorful animated geometric shapes in motion",
      score: 85,
      project_id: "p001",
      project_title: "Motion Graphics Collection",
    },
    {
      id: "1b",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/70ebac195704583.6612d838b1297.gif",
      title: "Fluid Animation",
      description: "Smooth flowing liquid animation with vibrant colors",
      score: 92,
      project_id: "p001",
      project_title: "Motion Graphics Collection",
    },
    {
      id: "1c",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/ab1ab2195704583.6612ba136f288.gif",
      title: "Dynamic Typography",
      description: "Animated text with modern effects",
      score: 88,
      project_id: "p001",
      project_title: "Motion Graphics Collection",
    },
    {
      id: "1d",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/b001c5195704583.6612d839e4870.gif",
      title: "Particle System",
      description: "Complex particle animation with dynamic movement",
      score: 90,
      project_id: "p001",
      project_title: "Motion Graphics Collection",
    },
    {
      id: "1e",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e4d28d195704583.6612d83b9558c.jpg",
      title: "Still Frame Composition",
      description: "High contrast image from animation sequence",
      score: 82,
      project_id: "p001",
      project_title: "Motion Graphics Collection",
    },
  ],

  // Group 2
  [
    {
      id: "2a",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/681e87110363433.5feb2fa7b548f.png",
      title: "Digital Interface Design",
      description: "Modern UI dashboard with data visualization",
      score: 89,
      project_id: "p002",
      project_title: "UX/UI Portfolio",
    },
    {
      id: "2b",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/hd/0c9c11110363433.5feb2fa83ed30.png",
      title: "Mobile App Concept",
      description: "Clean and minimal mobile interface design",
      score: 91,
      project_id: "p002",
      project_title: "UX/UI Portfolio",
    },
    {
      id: "2c",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/05b073110363433.5feb2fa83f319.png",
      title: "Component Library",
      description: "Consistent UI components for design system",
      score: 87,
      project_id: "p002",
      project_title: "UX/UI Portfolio",
    },
    {
      id: "2d",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e6ab5b110363433.5feb2fa83f985.png",
      title: "Website Wireframe",
      description: "Responsive layout for content-heavy platform",
      score: 84,
      project_id: "p002",
      project_title: "UX/UI Portfolio",
    },
  ],

  // Group 3
  [
    {
      id: "3a",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6b9315213795299.67b439fad2228.png",
      title: "Brand Identity",
      description: "Modern logo design with color variations",
      score: 93,
      project_id: "p003",
      project_title: "Brand Design Showcase",
    },
    {
      id: "3b",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/60c8ef186252949.6571da6da9d44.jpg",
      title: "Editorial Photography",
      description: "Stylized product photography with creative composition",
      score: 86,
      project_id: "p003",
      project_title: "Brand Design Showcase",
    },
    {
      id: "3c",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/4e8991186252949.6571da6da6b9f.jpg",
      title: "Print Design",
      description: "High-end brochure with custom typography",
      score: 88,
      project_id: "p003",
      project_title: "Brand Design Showcase",
    },
    {
      id: "3d",
      type: "image",
      url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/9dda41186252949.6571da6ed4147.jpg",
      title: "Packaging Design",
      description:
        "Sustainable product packaging with unique unboxing experience",
      score: 90,
      project_id: "p003",
      project_title: "Brand Design Showcase",
    },
  ],
];

interface CreatorResultCardProps {
  creator: SearchResult;
  role: string;
  user: User;
  creatorIndex?: number;
}

export function CreatorResultCard({
  creator,
  role,
  user,
  creatorIndex = 0,
}: CreatorResultCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const creatorUsername = creator.profile?.username || "Creator";

  // Use the creator index to determine which mockContent array to use
  const contentIndex = creatorIndex % mockContent.length;
  const creatorContent = mockContent[contentIndex];

  // Default user values to handle cases where user prop might be missing
  const firstName = user?.first_name || "Your";
  const lastName = user?.last_name || "Name";
  const email = user?.email || "your.email@example.com";
  const company = user?.company || "";

  const defaultMessage = `Hello ${creatorUsername},

We have a project that would be a good fit for you based on your portfolio. I'm looking for a ${role} to help with our upcoming campaign.

Let me know if you're interested in discussing this opportunity further.

Best regards,
${firstName} ${lastName}
${email}
${company}`;

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleContactClick = () => {
    setMessageContent(defaultMessage);
    setContactDialogOpen(true);
  };

  const handleSendMessage = () => {
    // This would normally send the message to an API
    setContactDialogOpen(false);
    // Show success message
    setSuccessDialogOpen(true);
  };

  // List of valid social platform IDs
  const validSocialPlatforms = SOCIAL_PLATFORMS.map((platform) => platform.id);

  return (
    <div className="border-b pb-8">
      <div className="flex flex-col gap-8">
        {/* Creator info section */}
        <div className="flex w-full justify-between items-center">
          {/* Creator Contact column */}
          <div className="flex flex-col items-start gap-4">
            {/* Avatar and name and username */}
            <div className="flex items-center gap-4">
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
              <div className="flex flex-col gap-1">
                <div className="flex flex-row items-center gap-4">
                  <h2 className="text-xl font-bold">
                    {creator.profile && creator.profile.username
                      ? creator.profile.username
                      : "Creator"}
                  </h2>
                  <span className="text-base text-gray-500">
                    @
                    {creator.profile && creator.profile.username
                      ? creator.profile.username.toLowerCase()
                      : "creator"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-4 py-1 border rounded-full text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {role}
                  </span>
                  {creator.profile && creator.profile.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{creator.profile.location}</span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    {/* Social icons - only show platforms from our supported list */}
                    {creator.profile &&
                      creator.profile.social_links &&
                      Object.entries(creator.profile.social_links)
                        .filter(([platform]) =>
                          validSocialPlatforms.includes(platform.toLowerCase())
                        )
                        .map(([platform, url], index) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100"
                          >
                            <span className="sr-only">{platform}</span>
                            <SocialIcon
                              platform={platform}
                              className="h-4 w-4"
                            />
                          </a>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex flex-row justify-center items-center h-full w-fit gap-2 mt-2">
            <Link
              href={
                creator.profile && creator.profile.username
                  ? `/${creator.profile.username}`
                  : "#"
              }
            >
              <Button
                variant="outline"
                className=" rounded-full px-8 py-6"
                disabled={!creator.profile || !creator.profile.username}
              >
                View Profile
              </Button>
            </Link>

            <Button
              variant="default"
              className="bg-black rounded-full px-8 py-6"
              onClick={handleContactClick}
            >
              Contact <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Creator projects column */}
        <div className="col-span-2">
          <div className="grid grid-cols-5 gap-4 h-[160px]">
            {creator.content && creator.content.length > 0 ? (
              creator.content.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-end h-full">
                  {content.type === "video" ? (
                    <div className="w-full bg-black overflow-hidden max-h-[200px]">
                      {content.youtube_id ? (
                        <div className="aspect-video w-full">
                          <YouTubeEmbed
                            youtubeId={content.youtube_id}
                            title={content.title || "YouTube video"}
                          />
                        </div>
                      ) : content.vimeo_id ? (
                        <div className="aspect-video w-full">
                          <VimeoEmbed
                            vimeoId={content.vimeo_id}
                            title={content.title || "Vimeo video"}
                          />
                        </div>
                      ) : content.url ? (
                        <video controls src={content.url} className="w-full">
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
                    <div className="relative w-full h-full flex items-end overflow-hidden max-h-[200px]">
                      <Image
                        src={content.url}
                        alt={
                          content.title || content.project_title || "Content"
                        }
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="cursor-pointer w-full object-cover object-bottom"
                        onClick={() => handleImageClick(content.url)}
                        style={{
                          display: "block",
                          maxHeight: "100%",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-36 w-full flex items-center justify-center bg-gray-100 rounded-md">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full w-full col-span-6 flex items-center justify-center">
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

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact {creatorUsername}</DialogTitle>
            <DialogDescription>
              Send a message to start the conversation with this creator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-[350px]"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </div>
          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl mb-2">Message Sent!</DialogTitle>
            <DialogDescription>
              Your message has been sent to {creatorUsername}. They will be
              notified and can respond directly to your email.
            </DialogDescription>
            <Button
              className="mt-6"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
