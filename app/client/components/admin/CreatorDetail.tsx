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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X, ArrowLeft, ExternalLink, Edit, Save } from "lucide-react";
import { SocialIcon } from "@/components/ui/social-icon";
import {
  fetchCreatorDetails,
  rejectCreator,
  updateCreator,
} from "@/lib/api/admin";
import { VimeoEmbed } from "@/components/ui/vimeo-embed";
import { toast } from "sonner";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import {
  CREATOR_ROLES,
  SOCIAL_PLATFORMS,
} from "@/lib/constants/creator-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CreatorDetailPage = ({ params }) => {
  const unwrappedParams = use(params);
  const creatorId = unwrappedParams?.id;
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
  });
  const router = useRouter();

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
  useEffect(() => {
    const loadCreatorDetails = async () => {
      if (!creatorId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchCreatorDetails(creatorId);

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
              ? String(response.data.years_of_experience)
              : "",
          });
        } else {
          throw new Error(response.error || "Failed to fetch creator details");
        }
      } catch (err) {
        console.error("Error fetching creator details:", err);
        setError(
          err.message || "An error occurred while loading creator details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCreatorDetails();
  }, [creatorId]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Rejection reason is required");
      return;
    }

    setRejectError(null);
    setIsRejecting(true);

    try {
      const response = await rejectCreator(creatorId, rejectReason);

      if (response.success) {
        toast("Creator Rejected", {
          description: "The creator has been moved to the rejected list.",
        });

        setRejectDialogOpen(false);
        router.push(`/admin/creators?page=${currentPage}`);
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
    router.push(`/admin/creators?page=${currentPage}`);
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

      const response = await updateCreator(creatorId, updateData);

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

  if (loading) {
    return (
      <>
        <div className="flex items-center mb-6">
          <Button variant="ghost" disabled className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Creator Profile Review</h1>
        </div>

        <div className="space-y-6 animate-pulse w-full">
          <Card className="w-full">
            <CardHeader className="space-y-3">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="aspect-square bg-muted rounded-md"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
                <div className="w-full md:w-2/3 space-y-6">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-1/4"></div>
                    <div className="h-20 bg-muted rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-1/4"></div>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-8 bg-muted rounded-md w-24"
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-1/4"></div>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-10 w-10 bg-muted rounded-full"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="w-full">
                <CardHeader className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleGoBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Creator Profile Review</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEditToggle}>
                Edit Profile
                <Edit className="ml-2 h-4 w-4" />
              </Button>
              <Dialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <X className="mr-2 h-4 w-4" />
                    Reject Creator
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Creator</DialogTitle>
                    <DialogDescription>
                      This action will remove the creator and all their content
                      from the platform. Please provide a reason for the
                      rejection.
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
                        <p className="text-sm text-destructive">
                          {rejectError}
                        </p>
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
          )}
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              {isEditing ? (
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
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{creator.username}</h2>
                  <div className="flex flex-col md:flex-row gap-2 text-muted-foreground mt-1">
                    {creator.location && <span>{creator.location}</span>}
                    {creator.years_of_experience && (
                      <span className="md:before:content-['•'] md:before:mx-2 md:before:text-muted-foreground">
                        {creator.years_of_experience} years of experience
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              {creator.status && (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    creator.status === "active"
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
            {isEditing ? (
              <Textarea
                name="bio"
                value={editForm.bio}
                onChange={handleInputChange}
                placeholder="Creator bio"
                rows={5}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-line">
                {creator.bio || "No bio provided"}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Primary Role</h3>
            {isEditing ? (
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
            ) : (
              <div className="flex flex-wrap gap-2">
                {creator.primary_role && creator.primary_role.length > 0 ? (
                  creator.primary_role.map((role) => (
                    <span
                      key={role}
                      className="bg-secondary rounded-md px-2 py-1 text-sm text-muted-foreground"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">
                    No roles specified
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Social Links</h3>
            {isEditing ? (
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
            ) : (
              <div className="flex flex-wrap gap-3">
                {creator.social_links &&
                Object.keys(creator.social_links).length > 0 ? (
                  Object.entries(creator.social_links).map(
                    ([platform, url]) =>
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <SocialIcon platform={platform} className="h-5 w-5" />
                          <span className="sr-only">{platform}</span>
                        </a>
                      )
                  )
                ) : (
                  <span className="text-muted-foreground">
                    No social links provided
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Projects</h2>
      {creator.projects && creator.projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creator.projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {project.videos && project.videos.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {project.videos.map((video) => (
                      <div key={video.id} className="space-y-2">
                        <VimeoEmbed videoId={video.vimeo_id} />
                        {video.title && (
                          <p className="font-medium">{video.title}</p>
                        )}
                        {video.description && (
                          <p className="text-sm text-muted-foreground">
                            {video.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {project.images && project.images.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.images.map((image) => (
                        <div key={image.id} className="space-y-2">
                          <div className="aspect-square rounded-md overflow-hidden bg-muted">
                            <Image
                              src={image.resolutions?.high_res || image.url}
                              alt={image.alt_text || project.title}
                              width={500}
                              height={500}
                              className="object-cover w-full h-full"
                            />
                          </div>

                          {image.alt_text && (
                            <p className="text-sm text-muted-foreground">
                              {image.alt_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!project.images || project.images.length === 0) &&
                  (!project.videos || project.videos.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground">
                      No media available for this project
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No projects available for this creator
        </div>
      )}
    </>
  );
};

export default CreatorDetailPage;
