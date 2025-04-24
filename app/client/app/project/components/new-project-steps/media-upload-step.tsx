import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  ArrowRight,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { ScraperProgress } from "@/components/scraper-progress";
import { ProjectCard } from "@/app/[username]/work/components/project-card";

interface MediaItem {
  id: string;
  type: "image" | "video" | "youtube" | "vimeo";
  url: string;
  file?: File;
  youtube_id?: string;
  vimeo_id?: string;
  alt_text?: string;
  order?: number;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  images?: { url: string }[];
  thumbnail_url?: string;
}

interface MediaUploadStepProps {
  showImportOption: boolean;
  projectLink: string;
  setProjectLink: (value: string) => void;
  importError: string | null;
  isImporting: boolean;
  handleImportMedia: () => void;
  handleFileDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  isLargeFile: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaLink: string;
  setMediaLink: (value: string) => void;
  handleAddMediaLink: () => void;
  mediaItems: MediaItem[];
  handleOpenMedia: (media: MediaItem) => void;
  handleRemoveMedia: (id: string) => void;
  handleProceedToDetails: () => void;
  scrapingHandleId: string | null;
  accessToken: string | null;
  onScraperComplete: (data: any) => void;
  selectedThumbnail?: string | null;
  handleSelectThumbnail?: (media: MediaItem) => void;
  project: Project;
}

export default function MediaUploadStep({
  showImportOption,
  projectLink,
  setProjectLink,
  importError,
  isImporting,
  handleImportMedia,
  handleFileDrop,
  handleDragOver,
  isLargeFile,
  handleFileSelect,
  mediaLink,
  setMediaLink,
  handleAddMediaLink,
  mediaItems,
  handleOpenMedia,
  handleRemoveMedia,
  handleProceedToDetails,
  scrapingHandleId,
  onScraperComplete,
  accessToken,
  selectedThumbnail,
  handleSelectThumbnail,
  project,
}: MediaUploadStepProps) {
  return (
    <>
      {/* Project Link Import Section - Only show if import option is enabled */}
      {showImportOption && (
        <Card>
          <CardHeader>
            <CardTitle>Import Media from URL</CardTitle>
            <CardDescription>
              Import images and videos from Behance or Dribbble projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="Paste Behance/Dribbble URL here"
                    value={projectLink}
                    onChange={(e) => setProjectLink(e.target.value)}
                  />
                  {importError && (
                    <p className="text-sm text-red-500 mt-1">{importError}</p>
                  )}
                </div>
                <Button
                  onClick={handleImportMedia}
                  disabled={isImporting || !projectLink}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Supported platforms:</strong> Behance projects,
                  Dribbble shots
                </p>
                <p>
                  <strong>What gets imported:</strong> Images, embedded videos,
                  YouTube & Vimeo links
                </p>
                <p className="italic text-2xs">
                  Note: Large projects may take a few seconds to process
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scraper Progress - Show when scraping is in progress */}
      {scrapingHandleId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
            <CardDescription>
              Real-time progress of media scraping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScraperProgress
              handleId={scrapingHandleId}
              accessToken={accessToken}
              onComplete={onScraperComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* Media Upload Section */}
      <Card className={showImportOption || scrapingHandleId ? "mt-6" : ""}>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>
            Drag and drop or browse to upload images and videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
            onClick={() => {
              // Trigger file input click
              const fileInput = document.getElementById(
                "media-upload"
              ) as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM
              (up to 5MB)
            </p>
            <input
              type="file"
              id="media-upload"
              multiple
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/webm"
              onChange={handleFileSelect}
            />
            {isLargeFile && (
              <p className="text-xs text-red-500 mt-2">
                Some files exceed the 5MB limit and were not added.
              </p>
            )}
          </div>

          {/* Embed External Media */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Add Video From Link</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="url"
                  placeholder="Paste YouTube or Vimeo URL here"
                  value={mediaLink}
                  onChange={(e) => setMediaLink(e.target.value)}
                  className="pl-9"
                />
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button onClick={handleAddMediaLink}>Add</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              We'll automatically detect if it's a YouTube or Vimeo link
            </p>
          </div>

          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Media Preview</h3>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {mediaItems.map((media, index) => (
                  <div
                    key={`${media.type}-${media.id}`}
                    className={`rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group ${
                      // For the first item, make it span 2 columns on larger screens if there are at least 3 items
                      index === 0 && mediaItems.length >= 3
                        ? "md:col-span-2 md:row-span-2"
                        : ""
                    }`}
                    onClick={() => handleOpenMedia(media)}
                  >
                    {media.type === "image" && (
                      <>
                        <img
                          src={media.url}
                          alt="Preview"
                          className={`w-full object-contain aspect-auto ${
                            selectedThumbnail === media.url
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                        />
                        {selectedThumbnail === media.url && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </>
                    )}
                    {media.type === "video" && (
                      <div className="w-full bg-black overflow-hidden">
                        <video controls src={media.url} className="w-full">
                          <source src={media.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {media.type === "youtube" && media.youtube_id && (
                      <div className="w-full bg-black overflow-hidden">
                        <div className="aspect-video w-full">
                          <YouTubeEmbed
                            youtubeId={media.youtube_id}
                            title="YouTube video"
                          />
                        </div>
                      </div>
                    )}
                    {media.type === "vimeo" && media.vimeo_id && (
                      <div className="w-full bg-black overflow-hidden">
                        <div className="aspect-video w-full">
                          <VimeoEmbed
                            vimeoId={media.vimeo_id}
                            title="Vimeo video"
                          />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        {media.type === "image" && handleSelectThumbnail && (
                          <Button
                            size="sm"
                            variant={
                              selectedThumbnail === media.url
                                ? "default"
                                : "outline"
                            }
                            className="bg-white text-black border-white hover:bg-gray-100 hover:text-black"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectThumbnail(media);
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            {selectedThumbnail === media.url
                              ? "Thumbnail"
                              : "Set as Thumbnail"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-black border-white hover:bg-gray-100 hover:text-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMedia(media.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Thumbnail Section - if a thumbnail is selected */}
              {selectedThumbnail && (
                <div className="mt-6 p-4 border border-dashed rounded-md bg-gray-50">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-medium">
                      Project Thumbnail Selected
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This image will be used as the main preview for your
                    project.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleProceedToDetails}
              className="flex items-center gap-1"
              disabled={mediaItems.length === 0}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
