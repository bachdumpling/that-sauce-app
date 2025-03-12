"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X, ArrowLeft, ExternalLink, Edit, Save, Trash2 } from "lucide-react";
import { SocialIcon } from "@/components/ui/social-icon";
import {
  fetchCreatorDetails,
  rejectCreator,
  updateCreator,
  deleteProject,
  deleteProjectImage,
  approveCreator,
} from "@/lib/api/admin";
import { VimeoEmbed } from "@/components/ui/vimeo-embed";
import { toast } from "sonner";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import {
  CREATOR_ROLES,
  SOCIAL_PLATFORMS,
} from "@/lib/constants/creator-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatorProfile } from "@/components/shared/creator-profile";
import { Creator, Project } from "@/components/shared/types";
import { ProjectCard } from "@/components/shared/project-card";
import { Skeleton } from "@/components/ui/skeleton";
const CreatorDetailPage = ({ params }) => {
  const unwrappedParams = use(params);
  const creatorUsername = unwrappedParams?.username;
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page") || "1";
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    location: "",
    bio: "",
    primary_role: [],
    social_links: {},
    years_of_experience: "",
    work_email: "",
  });
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState({
    projectId: null,
    imageId: null,
  });
  const [isApproving, setIsApproving] = useState(false);

  // Convert arrays to options for MultiSelect
  const roleOptions = CREATOR_ROLES.map((role) => ({
    value: role,
    label: role,
  }));

  // Ensure primary_role is always an array
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    return [];
  };

  // Fetch creator details from API
  const loadCreatorDetails = async (bustCache = false) => {
    if (!creatorUsername) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchCreatorDetails(creatorUsername, bustCache);

      if (response.success) {
        setCreator(response.data);
        // Initialize edit form with creator data
        setEditForm({
          username: response.data.username || "",
          location: response.data.location || "",
          bio: response.data.bio || "",
          primary_role: ensureArray(response.data.primary_role),
          social_links: response.data.social_links || {},
          years_of_experience: response.data.years_of_experience
            ? response.data.years_of_experience.toString()
            : "",
          work_email: response.data.work_email || "",
        });
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error("Error fetching creator details:", err);
      setError("Failed to load creator details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorDetails();
  }, [creatorUsername]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Rejection reason is required");
      return;
    }

    setRejectError(null);
    setIsRejecting(true);

    try {
      const response = await rejectCreator(creatorUsername, rejectReason);

      if (response.success) {
        toast("Creator Rejected", {
          description: "The creator has been moved to the rejected list.",
        });

        setRejectDialogOpen(false);

        // Get the status filter from the URL if it exists
        const statusFilter = searchParams.get("status");

        // Create URL parameters
        const params = new URLSearchParams();
        params.set("page", currentPage);

        // Add status filter if it exists
        if (statusFilter) {
          params.set("status", statusFilter);
        }

        router.push(`/admin/creators?${params.toString()}`);
      } else {
        throw new Error(response.error || "Failed to reject creator");
      }
    } catch (err) {
      console.error("Error rejecting creator:", err);
      setRejectError(
        err.message || "Failed to reject creator. Please try again."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleGoBack = () => {
    // Get the status filter from the URL if it exists
    const statusFilter = searchParams.get("status");

    // Create URL parameters
    const params = new URLSearchParams();
    params.set("page", currentPage);

    // Add status filter if it exists
    if (statusFilter) {
      params.set("status", statusFilter);
    }

    router.push(`/admin/creators?${params.toString()}`);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset form to current creator data when entering edit mode
      setEditForm({
        username: creator.username || "",
        location: creator.location || "",
        bio: creator.bio || "",
        primary_role: ensureArray(creator.primary_role),
        social_links: creator.social_links || {},
        years_of_experience: creator.years_of_experience
          ? String(creator.years_of_experience)
          : "",
        work_email: creator.work_email || "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setEditForm((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      // Prepare data for API
      const updateData = {
        ...editForm,
        years_of_experience: editForm.years_of_experience
          ? parseInt(editForm.years_of_experience, 10)
          : null,
      };

      const response = await updateCreator(creatorUsername, updateData);

      if (response.success) {
        // Update local state with the updated creator data
        if (response.creator) {
          // Preserve the projects data since it's not returned by the update API
          setCreator((prevCreator) => ({
            ...response.creator,
            projects: prevCreator?.projects || [],
          }));
        }

        toast("Profile Updated", {
          description:
            response.message ||
            "The creator's profile has been updated successfully.",
        });

        setIsEditing(false);
      } else {
        throw new Error(response.error || "Failed to update creator profile");
      }
    } catch (err) {
      console.error("Error updating creator:", err);
      toast("Update Failed", {
        description:
          err.message || "Failed to update creator profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteProject(projectToDelete.id);
      if (response.success) {
        toast.success("Project deleted successfully");
        // Update the creator object by removing the deleted project
        setCreator((prevCreator) => ({
          ...prevCreator,
          projects: prevCreator.projects.filter(
            (p) => p.id !== projectToDelete.id
          ),
        }));
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        throw new Error(response.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error(
        err.message || "An error occurred while deleting the project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete.projectId || !imageToDelete.imageId) return;

    setIsDeletingImage(true);
    try {
      const response = await deleteProjectImage(
        imageToDelete.projectId,
        imageToDelete.imageId
      );
      if (response.success) {
        toast.success("Image deleted successfully");
        // Update the creator object by removing the deleted image
        setCreator((prevCreator) => ({
          ...prevCreator,
          projects: prevCreator.projects.map((project) => {
            if (project.id === imageToDelete.projectId) {
              return {
                ...project,
                images: project.images.filter(
                  (img) => img.id !== imageToDelete.imageId
                ),
              };
            }
            return project;
          }),
        }));
        setDeleteImageDialogOpen(false);
        setImageToDelete({ projectId: null, imageId: null });
      } else {
        throw new Error(response.error || "Failed to delete image");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error(err.message || "An error occurred while deleting the image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  // Function to open the image modal
  const openImageModal = (image) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  // Function to handle opening the delete image dialog
  const openDeleteImageDialog = (projectId, imageId) => {
    setImageToDelete({ projectId, imageId });
    setDeleteImageDialogOpen(true);
  };

  // Render projects section
  const renderProjects = () => {
    if (!creator || !creator.projects || creator.projects.length === 0) {
      return (
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-muted-foreground">No projects found.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {creator.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            viewMode="admin"
            onDelete={(project) => {
              setProjectToDelete(project);
              setDeleteDialogOpen(true);
            }}
          />
        ))}
      </div>
    );
  };

  // Add handleApprove function
  const handleApprove = async () => {
    setIsApproving(true);

    try {
      const response = await approveCreator(creatorUsername);

      if (response.success) {
        toast("Creator Approved", {
          description: "The creator has been approved successfully.",
        });

        // Refresh creator details to update the status
        await loadCreatorDetails(true);
      } else {
        throw new Error(response.error || "Failed to approve creator");
      }
    } catch (err) {
      console.error("Error approving creator:", err);
      toast.error(
        err.message || "Failed to approve creator. Please try again."
      );
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return <Skeleton variant="creator" />;
  }
  if (error || !creator) {
    return (
      <>
        <Alert variant="destructive">
          <AlertDescription>{error || "Creator not found"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleGoBack}>
          Back to Creators
        </Button>
      </>
    );
  }

  return (
    <>
      {!isEditing && creator && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Creators
            </Button>
            <div className="flex items-center gap-4">
              {creator.status && (
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    creator.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  Status:{" "}
                  {creator.status.charAt(0).toUpperCase() +
                    creator.status.slice(1)}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEditToggle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="success"
                  onClick={handleApprove}
                  disabled={isApproving || creator.status === "approved"}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isApproving
                    ? "Approving..."
                    : creator.status === "approved"
                      ? "Already Approved"
                      : "Approve Creator"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Reject Creator
                </Button>
              </div>
            </div>
          </div>

          <CreatorProfile
            creator={creator}
            viewMode="admin"
            onEditProject={(project) => handleEditProject(project)}
            onDeleteProject={(project) => {
              setProjectToDelete(project);
              setDeleteDialogOpen(true);
            }}
            onDeleteImage={openDeleteImageDialog}
          />
        </div>
      )}

      {isEditing && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleEditToggle}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Creator Profile Review</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div>
                  <div className="space-y-4 w-full max-w-md">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={editForm.username}
                        onChange={handleInputChange}
                        placeholder="Username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={editForm.location}
                        onChange={handleInputChange}
                        placeholder="Location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="years_of_experience">
                        Years of Experience
                      </Label>
                      <Input
                        id="years_of_experience"
                        name="years_of_experience"
                        type="number"
                        value={editForm.years_of_experience}
                        onChange={handleInputChange}
                        placeholder="Years of Experience"
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_email">
                        Work Email
                      </Label>
                      <Input
                        id="work_email"
                        name="work_email"
                        type="email"
                        value={editForm.work_email}
                        onChange={handleInputChange}
                        placeholder="Work Email"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  {creator.status && (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        creator.status === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {creator.status.charAt(0).toUpperCase() +
                        creator.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Bio</h3>
                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  placeholder="Creator bio"
                  rows={5}
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Primary Role</h3>
                <MultiSelect
                  options={roleOptions}
                  selected={editForm.primary_role}
                  onChange={(selected) =>
                    setEditForm((prev) => ({
                      ...prev,
                      primary_role: selected,
                    }))
                  }
                  placeholder="Select roles"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Social Links</h3>
                <div className="space-y-3">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center gap-2">
                      <SocialIcon platform={platform} className="h-5 w-5" />
                      <Input
                        placeholder={
                          platform.placeholder || `${platform.name} URL`
                        }
                        value={editForm.social_links?.[platform.id] || ""}
                        onChange={(e) =>
                          handleSocialLinkChange(platform.id, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Projects</h2>
            {renderProjects()}
          </div>
        </>
      )}

      {/* Delete Project Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Image Dialog */}
      <Dialog
        open={deleteImageDialogOpen}
        onOpenChange={setDeleteImageDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteImageDialogOpen(false)}
              disabled={isDeletingImage}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
              disabled={isDeletingImage}
            >
              {isDeletingImage ? "Deleting..." : "Delete Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="w-full p-0 overflow-hidden bg-black/80 border-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>

          <div className="w-full h-[600px] overflow-auto">
            {selectedImage && (
              <Image
                src={selectedImage.resolutions?.high_res || selectedImage.url}
                alt="Project image"
                fill
                className="object-contain p-10"
                priority
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Creator</DialogTitle>
            <DialogDescription>
              This action will remove the creator and all their content from the
              platform. Please provide a reason for the rejection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Creator</Label>
              <Input id="username" value={creator.username} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide a detailed reason for rejecting this creator"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {rejectError && (
                <p className="text-sm text-destructive">{rejectError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? "Rejecting..." : "Reject Creator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorDetailPage;
