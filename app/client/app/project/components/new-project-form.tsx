"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Trash2, Upload, Loader2, Link, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject } from "@/lib/api/client/projects";
import { getOrganizations } from "@/lib/api/client/organizations";
import {
  batchUploadMedia,
  uploadVideoLink,
  importUrlMedia,
} from "@/lib/api/client/media";
import { extractMediaFromUrl } from "@/lib/api/client/scraper";
import { CREATOR_ROLES } from "@/lib/constants/creator-options";
import { Organization } from "@/client/types/project";

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

export default function NewProjectForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<string>("youtube");
  const [mediaLink, setMediaLink] = useState<string>("");
  const [projectLink, setProjectLink] = useState<string>("");
  const [isLargeFile, setIsLargeFile] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Project information state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [year, setYear] = useState<number | undefined>(
    new Date().getFullYear()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Client/Organization state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Format role options from the constant list
  const roleOptions: Option[] = CREATOR_ROLES.map((role) => ({
    value: role,
    label: role,
  }));

  // Load organizations on component mount
  useEffect(() => {
    async function fetchOrganizations() {
      setIsLoadingOrgs(true);
      try {
        console.log("Fetching organizations...");
        const response = await getOrganizations();
        console.log("Organization response:", response);
        
        if (response.success && response.data) {
          console.log("Setting organizations:", response.data);
          setOrganizations(response.data);
        } else {
          console.error("Failed to load organizations:", response.error);
          toast.error("Failed to load client list");
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Error loading clients");
      } finally {
        setIsLoadingOrgs(false);
      }
    }

    fetchOrganizations();
  }, []);

  // Format client options from fetched organizations
  const clientOptions: Option[] = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    // Check for file size
    const hasLargeFile = droppedFiles.some(
      (file) => file.size > 5 * 1024 * 1024
    );
    setIsLargeFile(hasLargeFile);

    if (!hasLargeFile) {
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);

      // Create media items from files
      const newMediaItems = droppedFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: isVideo ? "video" : "image",
          url: URL.createObjectURL(file),
          file,
        };
      });

      setMediaItems((prev) => [...prev, ...newMediaItems]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Check for file size
      const hasLargeFile = selectedFiles.some(
        (file) => file.size > 5 * 1024 * 1024
      );
      setIsLargeFile(hasLargeFile);

      if (!hasLargeFile) {
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

        // Create media items from files
        const newMediaItems = selectedFiles.map((file) => {
          const isVideo = file.type.startsWith("video/");
          return {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: isVideo ? "video" : "image",
            url: URL.createObjectURL(file),
            file,
          };
        });

        setMediaItems((prev) => [...prev, ...newMediaItems]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddMediaLink = () => {
    if (!mediaLink) return;

    let newMedia: MediaItem;

    if (mediaType === "youtube") {
      // Extract YouTube ID
      const youtubeRegex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = mediaLink.match(youtubeRegex);
      const youtube_id = match ? match[1] : null;

      if (!youtube_id) {
        // Handle invalid YouTube URL
        alert("Invalid YouTube URL");
        return;
      }

      newMedia = {
        id: `youtube-${Date.now()}`,
        type: "youtube",
        url: mediaLink,
        youtube_id,
      };
    } else if (mediaType === "vimeo") {
      // Extract Vimeo ID
      const vimeoRegex =
        /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|)(\d+)(?:$|\/|\?))/;
      const match = mediaLink.match(vimeoRegex);
      const vimeo_id = match ? match[1] : null;

      if (!vimeo_id) {
        // Handle invalid Vimeo URL
        alert("Invalid Vimeo URL");
        return;
      }

      newMedia = {
        id: `vimeo-${Date.now()}`,
        type: "vimeo",
        url: mediaLink,
        vimeo_id,
      };
    } else {
      return; // No more image link support
    }

    setMediaItems((prev) => [...prev, newMedia]);
    setMediaLink("");
  };

  const handleImportMedia = async () => {
    if (!projectLink) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Validate URL
      let url;
      try {
        url = new URL(projectLink);
      } catch (error) {
        throw new Error("Please enter a valid URL");
      }

      // Check if it's a supported platform
      const isBehance = url.hostname.includes("behance.net");
      const isDribbble = url.hostname.includes("dribbble.com");

      if (!isBehance && !isDribbble) {
        throw new Error(
          "Currently only Behance and Dribbble URLs are supported"
        );
      }

      toast.info("Scraping media from URL. This may take a few seconds...");

      // Extract media from external URL
      const response = await extractMediaFromUrl(projectLink);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to import media from URL");
      }

      // Handle potentially nested response structure
      const scrapeData =
        response.data.success && response.data.data
          ? response.data.data // Handle double-wrapped response
          : response.data; // Handle single-wrapped response

      if (
        !scrapeData.media ||
        !Array.isArray(scrapeData.media) ||
        scrapeData.media.length === 0
      ) {
        throw new Error("No media found at the provided URL");
      }

      // Extract project title from URL if possible
      const urlParts = projectLink.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      const suggestedTitle = lastPart
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      if (!title && suggestedTitle) {
        setTitle(suggestedTitle);
      }

      // Convert scraped media to our MediaItem format
      const importedMedia = scrapeData.media.map((item) => {
        const id = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        if (item.type === "video") {
          if (item.youtube_id) {
            return {
              id,
              type: "youtube" as const,
              url: `https://youtube.com/watch?v=${item.youtube_id}`,
              youtube_id: item.youtube_id,
              alt_text: item.alt_text,
              order: item.order,
            };
          } else if (item.vimeo_id) {
            return {
              id,
              type: "vimeo" as const,
              url: `https://vimeo.com/${item.vimeo_id}`,
              vimeo_id: item.vimeo_id,
              alt_text: item.alt_text,
              order: item.order,
            };
          }
        }

        return {
          id,
          type: item.type as "image" | "video",
          url: item.url,
          alt_text: item.alt_text,
          order: item.order,
        };
      });

      // Add to existing media items
      setMediaItems((prev) => [...prev, ...importedMedia]);

      const mediaTypeDistribution = {
        images: importedMedia.filter((m) => m.type === "image").length,
        videos: importedMedia.filter((m) => m.type === "video").length,
        youtube: importedMedia.filter((m) => m.type === "youtube").length,
        vimeo: importedMedia.filter((m) => m.type === "vimeo").length,
      };

      toast.success(
        `Imported ${importedMedia.length} media items: ` +
          Object.entries(mediaTypeDistribution)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `${count} ${type}`)
            .join(", ")
      );

      // Clear the project link field
      setProjectLink("");
    } catch (error: any) {
      console.error("Import error:", error);
      setImportError(error.message || "Failed to import media");
      toast.error(error.message || "Failed to import media");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
    // Also remove from files array if it's a file
    const mediaItem = mediaItems.find((item) => item.id === id);
    if (mediaItem && mediaItem.file) {
      setFiles((prev) => prev.filter((file) => file !== mediaItem.file));
    }
  };

  const handleOpenMedia = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  const handleCreateProject = async () => {
    // Validate required fields
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }
    
    if (!shortDescription.trim()) {
      toast.error("Short description is required");
      return;
    }
    
    if (selectedRoles.length === 0) {
      toast.error("At least one project role is required");
      return;
    }
    
    if (!year) {
      toast.error("Project year is required");
      return;
    }

    setIsSubmitting(true);
    setCurrentStep("Creating project...");

    try {
      // First, create the project
      const projectResponse = await createProject({
        title,
        description,
        short_description: shortDescription,
        roles: selectedRoles,
        client_ids: selectedClients,
        year,
      });

      if (!projectResponse.success || !projectResponse.data) {
        console.error("Project creation failed:", projectResponse);
        throw new Error(projectResponse.error || "Failed to create project");
      }

      const projectId = projectResponse.data.id;

      if (!projectId) {
        console.error("No project ID returned from API");
        throw new Error("No project ID returned from API");
      }

      // Separate local files from remote URL items
      const fileUploads = [...files]; // These are true File objects

      // Add scraped media URLs (excluding YouTube/Vimeo which are handled separately)
      const scrapedMediaItems = mediaItems
        .filter(
          (item) =>
            !item.file && // Not already a file
            item.type !== "youtube" && // Not YouTube
            item.type !== "vimeo" && // Not Vimeo
            item.url // Has a URL
        )
        .map((item) => ({
          url: item.url,
          type: item.type as "image" | "video",
          alt_text: item.alt_text,
          order: item.order,
        }));

      // Handle local file uploads first if there are any
      if (fileUploads.length > 0) {
        setCurrentStep(`Uploading ${fileUploads.length} local files...`);

        try {
          const uploadResponse = await batchUploadMedia(projectId, fileUploads);

          if (!uploadResponse.success) {
            console.error("File upload failed:", uploadResponse);
            toast.error(
              `Project created but file upload failed: ${uploadResponse.error}`
            );
          } else {
            if (
              uploadResponse.data.errors &&
              uploadResponse.data.errors.length > 0
            ) {
              toast.warning(
                `Some files failed to upload (${uploadResponse.data.errors.length} errors)`
              );
            }
          }
        } catch (uploadError: any) {
          console.error("Error during file upload:", uploadError);
          toast.error(
            `File upload error: ${uploadError.message || "Unknown error"}`
          );
        }
      }

      // Then handle scraped media URLs using the proper endpoint
      if (scrapedMediaItems.length > 0) {
        setCurrentStep(`Uploading ${scrapedMediaItems.length} media URLs...`);

        try {
          const importResponse = await importUrlMedia(
            projectId,
            scrapedMediaItems
          );

          if (!importResponse.success) {
            console.error("Media URL import failed:", importResponse);
            toast.error(`Media URL import failed: ${importResponse.error}`);
          } else {
            toast.success(`Imported ${importResponse.data.total} media items`);

            if (
              importResponse.data.errors &&
              importResponse.data.errors.length > 0
            ) {
              toast.warning(
                `${importResponse.data.errors.length} media items failed to import`
              );
            }
          }
        } catch (importError: any) {
          console.error("Error during URL import:", importError);
          toast.error(
            `URL import error: ${importError.message || "Unknown error"}`
          );
        }
      }

      // Upload any video links (YouTube or Vimeo)
      const videoLinks = mediaItems.filter(
        (item) =>
          (item.type === "youtube" && item.youtube_id) ||
          (item.type === "vimeo" && item.vimeo_id)
      );

      if (videoLinks.length > 0) {
        setCurrentStep(`Adding ${videoLinks.length} video links...`);

        let successCount = 0;
        let errorCount = 0;

        for (const videoItem of videoLinks) {
          if (!videoItem.file) {
            // Skip if it's a file that was already uploaded
            try {
              const videoResponse = await uploadVideoLink(
                projectId,
                videoItem.url,
                {
                  title: `${videoItem.type === "youtube" ? "YouTube" : "Vimeo"} video`,
                }
              );

              if (!videoResponse.success) {
                console.error("Video link upload failed:", videoResponse);
                errorCount++;
              } else {
                successCount++;
              }
            } catch (videoError: any) {
              console.error("Error adding video link:", videoError);
              errorCount++;
            }
          }
        }

        if (errorCount > 0) {
          toast.warning(
            `${successCount} video links added, ${errorCount} failed`
          );
        }
      }

      setCurrentStep("Finalizing project...");
      toast.success("Project created successfully");
      router.push(`/project/${projectId}`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setCurrentStep("");
    }
  };

  return (
    <>
      {/* Project Link Import Section */}
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
                <strong>Supported platforms:</strong> Behance projects, Dribbble
                shots
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

      {/* Media Upload Section */}
      <Card className="mt-6">
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
              Supported formats: JPG, PNG, GIF, MP4 (up to 5MB)
            </p>
            <input
              type="file"
              id="media-upload"
              multiple
              className="hidden"
              accept="image/*,video/*"
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
            <h3 className="text-sm font-medium mb-2">Add Media From Link</h3>
            <Tabs defaultValue="youtube">
              <TabsList className="mb-2">
                <TabsTrigger
                  value="youtube"
                  onClick={() => setMediaType("youtube")}
                >
                  YouTube
                </TabsTrigger>
                <TabsTrigger
                  value="vimeo"
                  onClick={() => setMediaType("vimeo")}
                >
                  Vimeo
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder={
                    mediaType === "youtube"
                      ? "Paste YouTube URL here"
                      : "Paste Vimeo URL here"
                  }
                  value={mediaLink}
                  onChange={(e) => setMediaLink(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMediaLink}>Add</Button>
              </div>
            </Tabs>
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
                      <img
                        src={media.url}
                        alt="Preview"
                        className="w-full object-contain aspect-auto"
                      />
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

                    <button
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(media.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Information Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Enter the details for your new project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-title">Project Title *</Label>
              <Input
                id="project-title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="project-short-description">
                Short Description *
              </Label>
              <Input
                id="project-short-description"
                placeholder="Brief summary of your project (max 255 characters)"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {shortDescription.length}/255 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="project-description">Full Description</Label>
              <textarea
                id="project-description"
                rows={4}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Enter detailed project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="project-year">Year *</Label>
              <Input
                id="project-year"
                type="number"
                placeholder="Project year"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={year || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  setYear(value);
                }}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="project-roles">Project Roles *</Label>
              <MultiSelect
                options={roleOptions}
                selected={selectedRoles}
                onChange={setSelectedRoles}
                placeholder="Select roles involved in this project"
              />
              {selectedRoles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  At least one role is required
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="project-clients">Clients</Label>
              {isLoadingOrgs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading clients...
                </div>
              ) : (
                <MultiSelect
                  options={clientOptions}
                  selected={selectedClients}
                  onChange={setSelectedClients}
                  placeholder="Select clients for this project (optional)"
                  emptyMessage="No clients found. Add clients in the admin panel."
                />
              )}
            </div>

            <Button
              onClick={handleCreateProject}
              className="w-full"
              disabled={
                isSubmitting || 
                !title.trim() || 
                !shortDescription.trim() || 
                !year || 
                selectedRoles.length === 0 || 
                mediaItems.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep || "Creating Project..."}
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Preview Dialog */}
      <Dialog
        open={!!selectedMedia}
        onOpenChange={(open) => {
          if (!open) setSelectedMedia(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-screen overflow-auto">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
            <DialogDescription>Preview of the selected media</DialogDescription>
          </DialogHeader>
          {selectedMedia?.type === "image" && (
            <img
              src={selectedMedia.url}
              alt="Preview"
              className="w-full h-auto"
            />
          )}
          {selectedMedia?.type === "video" && (
            <video src={selectedMedia.url} controls className="w-full h-auto" />
          )}
          {selectedMedia?.type === "youtube" && selectedMedia.youtube_id && (
            <div className="aspect-video">
              <YouTubeEmbed youtubeId={selectedMedia.youtube_id} />
            </div>
          )}
          {selectedMedia?.type === "vimeo" && selectedMedia.vimeo_id && (
            <div className="aspect-video">
              <VimeoEmbed vimeoId={selectedMedia.vimeo_id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
