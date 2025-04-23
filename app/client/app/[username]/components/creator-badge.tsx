import React, { useState, useRef } from "react";
import { Loader2, Download, Share2, Code, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CreatorBadge = ({ creator }) => {
  const [selectedBadgeColor, setSelectedBadgeColor] = useState("black");
  const [isDownloading, setIsDownloading] = useState(false);
  const badgeRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  // Default values if creator info is incomplete
  const defaultValues = {
    username: creator?.username || "username",
    name:
      creator?.first_name && creator?.last_name
        ? `${creator.first_name} ${creator.last_name}`
        : creator?.username || "Creator Name",
    role: creator?.primary_role?.[0] || "Creative",
    location: creator?.location || "New York, NY",
    joinedDate: creator?.created_at
      ? new Date(creator.created_at)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "/")
      : "06/06/25",
    website: "www.that-sauce.com",
  };

  // Download badge as image
  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `that-sauce-badge-${defaultValues.username}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Badge downloaded successfully!");
    } catch (error) {
      console.error("Error downloading badge:", error);
      toast.error("Failed to download badge");
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy profile link
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_CLIENT_URL;
  const profileUrl = `${origin}/${defaultValues.username}`;
  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const scale = 2;
  const badgeUrl = `${origin}/api/badges/${defaultValues.username}/${selectedBadgeColor}?scale=${scale}`;
  const embedCode = `<iframe
        src="${badgeUrl}"
        width="${320 * scale}"
        height="${437 * scale}"
        frameborder="0"
        scrolling="no"
        style="border:none;overflow:hidden;"
      ></iframe>`;

  // Copy embed code
  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setIsCopied(true);
    toast.success("Embed code copied to clipboard!");

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Badge Preview */}
      <div className="flex flex-row justify-center items-center gap-4">
        {/* Color selector circles */}
        <div className="flex flex-col gap-4">
          <button
            className={`w-10 h-10 rounded-full border-2 ${
              selectedBadgeColor === "black"
                ? "border-that-sauce-red"
                : "border-white"
            } bg-black`}
            onClick={() => setSelectedBadgeColor("black")}
            aria-label="Black background"
          />
          <button
            className={`w-10 h-10 rounded-full border-2 ${
              selectedBadgeColor === "white"
                ? "border-that-sauce-red"
                : "border-gray-200"
            } bg-white`}
            onClick={() => setSelectedBadgeColor("white")}
            aria-label="White background"
          />
        </div>

        {/* Badge with white border */}
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="bg-white rounded-2xl shadow-lg m-4">
            <div
              ref={badgeRef}
              className="w-[320px] h-[437px] rounded-xl relative"
            >
              <Image
                src={
                  selectedBadgeColor === "black"
                    ? "/badge-black-1.jpg"
                    : "/badge-white-1.jpg"
                }
                alt={defaultValues.name}
                width={1080}
                height={1500}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-xl z-0 border border-gray-200"
              />
              {/* Badge Content */}
              <div
                className={`absolute top-0 left-0 p-6 flex flex-col h-full w-full z-10 ${
                  selectedBadgeColor === "black" ? "text-white" : "text-black"
                }`}
              >
                <div className="absolute bottom-[32%] right-6">
                  <div className="text-xs text-right">
                    @{defaultValues.username}
                  </div>
                </div>

                {/* Creator info (positioned at bottom) */}
                <div className="mt-auto space-y-4">
                  <div className="flex flex-col gap-0">
                    <h1 className="text-2xl font-medium leading-tight tracking-tight">
                      {defaultValues.name}
                    </h1>
                    <h2 className="text-lg font-light leading-tight tracking-tight">
                      {defaultValues.role}
                    </h2>
                  </div>
                  <div className="w-full flex justify-between mt-2 text-[9px] opacity-80">
                    <div>{defaultValues.location}</div>
                    <div>{defaultValues.website}</div>
                    <div>Joined: {defaultValues.joinedDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sharing & Embed Options */}
          <div className="flex flex-wrap justify-center gap-3">
            <TooltipProvider>
              {/* Download Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownloadBadge}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as Image</p>
                </TooltipContent>
              </Tooltip>

              {/* Copy Profile Link */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyProfileLink}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy profile link</p>
                </TooltipContent>
              </Tooltip>

              {/* Embed Code */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={copyEmbedCode}>
                    {isCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Code className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy iframe embed code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorBadge;
