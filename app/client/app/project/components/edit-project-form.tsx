"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// Import server actions
import {
  updateProjectAction,
  getProjectByIdAction,
} from "@/actions/project-actions";
import { getOrganizationsAction } from "@/actions/organization-actions";
import {
  batchUploadMediaAction,
  uploadVideoLinkAction,
  deleteMediaAction,
} from "@/actions/media-actions";
import {
  Organization,
  Project,
  ProjectImage,
  ProjectVideo,
} from "@/client/types/project";
import { CREATOR_ROLES } from "@/lib/constants/creator-options";
import MediaUploadStep from "./new-project-steps/media-upload-step";
import ProjectDetailsStep from "./new-project-steps/project-details-step";
import { Loader2, ImageIcon } from "lucide-react";
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

interface EditProjectFormProps {
  projectId: string;
}

export default function EditProjectForm({ projectId }: EditProjectFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [mediaLink, setMediaLink] = useState<string>("");
  const [isLargeFile, setIsLargeFile] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(
    null
  );

  // Project loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form step state - Default to project details since we show project preview above
  const [formStep, setFormStep] = useState<number>(2); // 1 = Media upload, 2 = Project details

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

  // Load organizations and project data on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setIsLoadingOrgs(true);
      try {
        // Fetch project data
        const projectResponse = await getProjectByIdAction(projectId);
        if (projectResponse.success && projectResponse.data) {
          const project = projectResponse.data.project;

          // Set project details
          setTitle(project.title || "");
          setDescription(project.description || "");
          setShortDescription(project.short_description || "");
          setSelectedRoles(project.roles || []);
          setSelectedClients(project.client_ids || []);
          setYear(project.year || new Date().getFullYear());

          // Convert project media to mediaItems
          const newMediaItems: MediaItem[] = [];

          // Add images
          if (project.images && project.images.length > 0) {
            project.images.forEach((image: ProjectImage) => {
              newMediaItems.push({
                id: image.id,
                type: "image",
                url: image.url,
                alt_text: image.alt_text,
                order: image.order,
              });

              // If this image is the thumbnail, select it
              if (project.thumbnail_url === image.url) {
                setSelectedThumbnail(image.id);
              }
            });
          }

          // Add videos
          if (project.videos && project.videos.length > 0) {
            project.videos.forEach((video: ProjectVideo) => {
              if (
                video.url.includes("youtube.com") ||
                video.url.includes("youtu.be")
              ) {
                // Extract YouTube ID
                const youtubeId = video.url.includes("youtu.be/")
                  ? video.url.split("youtu.be/")[1]?.split("?")[0]
                  : video.url.includes("v=")
                    ? video.url.split("v=")[1]?.split("&")[0]
                    : undefined;

                if (youtubeId) {
                  newMediaItems.push({
                    id: video.id,
                    type: "youtube",
                    url: video.url,
                    youtube_id: youtubeId,
                    order: video.order,
                  });
                }
              } else if (video.url.includes("vimeo.com")) {
                // Extract Vimeo ID
                const vimeoId = video.url
                  .split("vimeo.com/")[1]
                  ?.split("?")[0]
                  .split("/")[0];

                if (vimeoId) {
                  newMediaItems.push({
                    id: video.id,
                    type: "vimeo",
                    url: video.url,
                    vimeo_id: vimeoId,
                    order: video.order,
                  });
                }
              } else {
                // Regular video
                newMediaItems.push({
                  id: video.id,
                  type: "video",
                  url: video.url,
                  order: video.order,
                });
              }
            });
          }

          setMediaItems(newMediaItems);
        } else {
          setLoadError("Failed to load project data");
          toast.error("Failed to load project");
        }

        // Fetch organizations
        const orgsResponse = await getOrganizationsAction();
        if (orgsResponse.success && orgsResponse.data) {
          setOrganizations(orgsResponse.data);
        } else {
          console.error("Failed to load organizations:", orgsResponse.message);
          toast.error("Failed to load client list");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoadError("Error loading project data");
        toast.error("Error loading project");
      } finally {
        setIsLoading(false);
        setIsLoadingOrgs(false);
      }
    }

    fetchData();
  }, [projectId]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    // Supported file types
    const supportedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const supportedVideoTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/webm",
    ];
    const supportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

    // Check for file size and type
    const hasLargeFile = droppedFiles.some(
      (file) => file.size > 5 * 1024 * 1024
    );

    // Filter out unsupported file types
    const invalidFiles = droppedFiles.filter(
      (file) => !supportedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
      toast.error(
        `Unsupported file type(s): ${invalidFileNames}. Supported types: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM`
      );
    }

    // Filter to only valid files
    const validFiles = droppedFiles.filter(
      (file) =>
        supportedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
    );

    setIsLargeFile(hasLargeFile);

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);

      // Create media items from files
      const newMediaItems = validFiles.map((file) => {
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

      // Supported file types
      const supportedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const supportedVideoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-ms-wmv",
        "video/webm",
      ];
      const supportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

      // Check for file size and type
      const hasLargeFile = selectedFiles.some(
        (file) => file.size > 5 * 1024 * 1024
      );

      // Filter out unsupported file types
      const invalidFiles = selectedFiles.filter(
        (file) => !supportedTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
        toast.error(
          `Unsupported file type(s): ${invalidFileNames}. Supported types: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM`
        );
      }

      // Filter to only valid files
      const validFiles = selectedFiles.filter(
        (file) =>
          supportedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
      );

      setIsLargeFile(hasLargeFile);

      if (validFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);

        // Create media items from files
        const newMediaItems = validFiles.map((file) => {
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
    if (!mediaLink.trim()) return;

    // Check if it's a YouTube link
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const youtubeMatch = mediaLink.match(youtubeRegex);

    // Check if it's a Vimeo link
    const vimeoRegex =
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?))/i;
    const vimeoMatch = mediaLink.match(vimeoRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      // Add YouTube item
      const youtubeId = youtubeMatch[1];
      setMediaItems((prev) => [
        ...prev,
        {
          id: `youtube-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "youtube",
          url: mediaLink,
          youtube_id: youtubeId,
        },
      ]);
      setMediaLink("");
    } else if (vimeoMatch && vimeoMatch[3]) {
      // Add Vimeo item
      const vimeoId = vimeoMatch[3];
      setMediaItems((prev) => [
        ...prev,
        {
          id: `vimeo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: "vimeo",
          url: mediaLink,
          vimeo_id: vimeoId,
        },
      ]);
      setMediaLink("");
    } else {
      // Not a recognized video link
      toast.error("Please enter a valid YouTube or Vimeo URL");
    }
  };

  const handleRemoveMedia = async (id: string) => {
    // Check if this is an existing media or a newly added one
    const isNewFile = id.startsWith("file-");
    const isNewYouTube = id.startsWith("youtube-");
    const isNewVimeo = id.startsWith("vimeo-");

    // For newly added media, just remove it from the state
    if (isNewFile || isNewYouTube || isNewVimeo) {
      setMediaItems((prev) => prev.filter((item) => item.id !== id));

      // Also remove from files if it's a file
      if (isNewFile) {
        setFiles((prev) =>
          prev.filter((file) => !id.startsWith(`file-${Date.now()}`))
        );
      }
      return;
    }

    // Otherwise, it's an existing media that needs to be deleted from the server
    try {
      // Find the media item to know its type
      const mediaItem = mediaItems.find((item) => item.id === id);
      if (!mediaItem) return;

      // Get media type
      const mediaType = mediaItem.type === "image" ? "image" : "video";

      // Get current user's username
      const username = window.location.pathname.split("/")[1] || "";

      // Delete the media
      const response = await deleteMediaAction(
        username,
        projectId,
        id,
        mediaType
      );

      if (response.success) {
        // Remove from state after successful deletion
        setMediaItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Media removed successfully");
      } else {
        toast.error(response.message || "Failed to remove media");
      }
    } catch (error: any) {
      console.error("Error removing media:", error);
      toast.error("Error removing media");
    }
  };

  const handleOpenMedia = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  const handleSelectThumbnail = (media: MediaItem) => {
    if (!media || !media.id) {
      console.error("Invalid media item passed to handleSelectThumbnail");
      toast.error("Failed to select thumbnail: Invalid item");
      return;
    }
    setSelectedThumbnail(media.id);
    toast.success("Selected as project thumbnail");
  };

  const handleProceedToDetails = () => {
    setFormStep(2);
  };

  const handleGoBackToMedia = () => {
    setFormStep(1);
  };

  const handleUpdateProject = async () => {
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
    setCurrentStep("Updating project...");

    try {
      // Get current user's username
      const username = window.location.pathname.split("/")[1] || "";

      // First, update the project with basic info and potentially thumbnail URL
      const projectData: Partial<Project> & { thumbnail_url?: string } = {
        title,
        description,
        short_description: shortDescription,
        roles: selectedRoles,
        client_ids: selectedClients,
        year,
      };

      // Add thumbnail_url if a thumbnail is selected
      if (selectedThumbnail) {
        // This lookup uses the ID stored in selectedThumbnail
        const selectedMediaItem = mediaItems.find(
          (item) => item.id === selectedThumbnail
        );

        if (
          selectedMediaItem &&
          selectedMediaItem.type === "image" &&
          selectedMediaItem.url
        ) {
          projectData.thumbnail_url = selectedMediaItem.url;
        }
      }

      const projectResponse = await updateProjectAction(
        username,
        projectId,
        projectData
      );

      if (!projectResponse.success || !projectResponse.data) {
        console.error("Project update failed:", projectResponse);
        throw new Error(projectResponse.message || "Failed to update project");
      }

      // Upload any new files if they exist
      let newUploadedThumbnailId = null;
      if (files.length > 0) {
        setCurrentStep("Uploading media files...");
        const fileUploads = [...files]; // These are true File objects

        const mediaUploadResponse = await batchUploadMediaAction(
          username,
          projectId,
          fileUploads
        );

        if (!mediaUploadResponse.success) {
          console.error("Media upload failed:", mediaUploadResponse);
          throw new Error(
            mediaUploadResponse.message || "Failed to upload media"
          );
        } else {
          // No secondary thumbnail update needed, as URL is handled in the first update
          // Log success/errors from the upload itself
          if (
            mediaUploadResponse.data?.images ||
            mediaUploadResponse.data?.videos
          ) {
          }
          if (
            mediaUploadResponse.data?.errors &&
            mediaUploadResponse.data.errors.length > 0
          ) {
            toast.warning(
              `Some new media failed to upload: ${mediaUploadResponse.data.errors.length} errors`
            );
          }
        }
      }

      // Upload any new YouTube/Vimeo links
      const newVideoLinks = mediaItems.filter(
        (item) =>
          (item.type === "youtube" || item.type === "vimeo") &&
          item.id.startsWith(`${item.type}-${Date.now()}`)
      );

      if (newVideoLinks.length > 0) {
        setCurrentStep("Adding video links...");

        for (const videoItem of newVideoLinks) {
          const videoResponse = await uploadVideoLinkAction(
            username,
            projectId,
            videoItem.url,
            {
              title:
                videoItem.type === "youtube" ? "YouTube Video" : "Vimeo Video",
            }
          );

          if (!videoResponse.success) {
            console.error("Video link upload failed:", videoResponse);
            toast.error(`Failed to add ${videoItem.type} video`);
          }
        }
      }

      // Success
      toast.success("Project updated successfully");
      router.push(`/project/${projectId}`);
    } catch (error: any) {
      console.error("Error in updating project:", error);
      toast.error(error.message || "Failed to update project");
    } finally {
      setIsSubmitting(false);
      setCurrentStep("");
    }
  };

  // If still loading project data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  // If error loading project
  if (loadError) {
    return (
      <div className="py-4">
        <p className="text-red-500 text-sm">{loadError}</p>
      </div>
    );
  }

  // Construct the project object for the preview
  const projectPreview: Project = {
    id: projectId,
    title: title,
    description: shortDescription, // Or use description if you prefer
    images: mediaItems
      .filter((item) => item.type === "image")
      .map((item) => ({ url: item.url })), // Map to expected structure
    thumbnail_url: mediaItems.find((item) => item.id === selectedThumbnail)
      ?.url, // Find the URL of the selected thumbnail
  };

  return (
    <>
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setFormStep(1)}
          className={`px-4 py-2 text-sm font-medium ${
            formStep === 1
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Edit Media
        </button>
        <button
          onClick={() => setFormStep(2)}
          className={`px-4 py-2 text-sm font-medium ${
            formStep === 2
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Edit Details
        </button>
      </div>

      {/* Project Card Preview */}
      <div className="max-w-lg mx-auto mb-8">
        <ProjectCard project={projectPreview} isPreview={true} />
      </div>

      {formStep === 1 ? (
        <MediaUploadStep
          showImportOption={false} // No import option for edit
          projectLink={""}
          setProjectLink={() => {}}
          importError={null}
          isImporting={false}
          handleImportMedia={() => {}}
          handleFileDrop={handleFileDrop}
          handleDragOver={handleDragOver}
          isLargeFile={isLargeFile}
          handleFileSelect={handleFileSelect}
          mediaLink={mediaLink}
          setMediaLink={setMediaLink}
          handleAddMediaLink={handleAddMediaLink}
          mediaItems={mediaItems}
          handleOpenMedia={handleOpenMedia}
          handleRemoveMedia={handleRemoveMedia}
          handleProceedToDetails={handleProceedToDetails}
          scrapingHandleId={null}
          onScraperComplete={() => {}}
          accessToken={null}
          selectedThumbnail={selectedThumbnail}
          handleSelectThumbnail={handleSelectThumbnail}
          project={projectPreview} // Pass the constructed project object
        />
      ) : (
        <ProjectDetailsStep
          title={title}
          setTitle={setTitle}
          shortDescription={shortDescription}
          setShortDescription={setShortDescription}
          description={description}
          setDescription={setDescription}
          year={year}
          setYear={setYear}
          selectedRoles={selectedRoles}
          setSelectedRoles={setSelectedRoles}
          selectedClients={selectedClients}
          setSelectedClients={setSelectedClients}
          isLoadingOrgs={isLoadingOrgs}
          organizations={organizations}
          handleGoBackToMedia={handleGoBackToMedia}
          handleCreateProject={handleUpdateProject}
          isSubmitting={isSubmitting}
          currentStep={currentStep}
          customButtonText="Update Project"
          customTitle="Edit Project Details"
          customDescription="Update your project information"
        />
      )}

      {/* Media Preview Dialog */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-4">
              {selectedMedia.type === "image" && (
                <>
                  <img
                    src={selectedMedia.url}
                    alt="Preview"
                    className="max-w-full max-h-[80vh] mx-auto"
                  />
                  <div className="flex justify-end mt-4">
                    <button
                      className={`flex items-center px-3 py-1.5 rounded text-sm ${
                        selectedThumbnail === selectedMedia.id
                          ? "bg-primary text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                      onClick={() => handleSelectThumbnail(selectedMedia)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {selectedThumbnail === selectedMedia.id
                        ? "Selected as Thumbnail"
                        : "Set as Thumbnail"}
                    </button>
                  </div>
                </>
              )}
              {selectedMedia.type === "video" && (
                <video
                  controls
                  autoPlay
                  src={selectedMedia.url}
                  className="max-w-full max-h-[80vh] mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedMedia.type === "youtube" && selectedMedia.youtube_id && (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedMedia.youtube_id}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              )}
              {selectedMedia.type === "vimeo" && selectedMedia.vimeo_id && (
                <div className="aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${selectedMedia.vimeo_id}`}
                    title="Vimeo video player"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
