import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Mail,
  Briefcase,
  Share2,
  LogOut,
  User,
  Pencil,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import {
  CREATOR_ROLES,
  SOCIAL_PLATFORMS,
} from "@/lib/constants/creator-options";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import Link from "next/link";
import { SocialIcon } from "@/components/ui/social-icon";
import { toast } from "sonner";
import { uploadCreatorAvatarAction } from "@/actions/creator-actions";
import Image from "next/image";
import CreatorBadge from "./creator-badge";

// Map CREATOR_ROLES to the format required by MultiSelect
const ROLE_OPTIONS = CREATOR_ROLES.map((role) => ({
  value: role,
  label: role,
}));

export default function ProfileEditDialog({
  isOpen,
  onClose,
  profileForm,
  handleFormChange,
  handlePrimaryRoleChange,
  handleProfileUpdate,
  isSubmitting,
}) {
  const bioLength = profileForm.bio?.length || 0;
  const [activeTab, setActiveTab] = useState("profile");
  const [roleSelectError, setRoleSelectError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Wrapper for handlePrimaryRoleChange to add validation
  const handleRoleChange = (selectedRoles) => {
    if (selectedRoles.length > 3) {
      setRoleSelectError("You can select a maximum of 3 roles");
      return;
    }

    setRoleSelectError("");
    handlePrimaryRoleChange(selectedRoles);
  };

  // Wrapper for handleProfileUpdate to clear errors before submission
  const handleSubmit = () => {
    setRoleSelectError("");
    handleProfileUpdate();
  };

  // Social links handler - creates controlled inputs for all social platforms
  const handleSocialLinkChange = (e) => {
    handleFormChange(e);
  };

  // Avatar upload handler
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploadingAvatar(true);

    try {
      const result = await uploadCreatorAvatarAction(
        profileForm.username,
        file
      );

      if (result.success) {
        // Update the form with the new avatar URL
        handleFormChange({
          target: {
            name: "avatar_url",
            value: result.data.avatar_url,
          },
        });

        toast.success("Profile picture updated successfully");
      } else {
        throw new Error(result.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture"
      );
    } finally {
      setIsUploadingAvatar(false);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl min-h-[60vh] p-0">
        <DialogHeader className="p-0">
          <DialogTitle className="sr-only">Edit Profile</DialogTitle>
          <DialogDescription className="sr-only">
            Edit your profile information and settings
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[60vh] py-4">
          {/* Left column - Tabs */}
          <div className="w-48 border-r flex flex-col p-4 gap-4">
            {/* User Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                />
                <div className="h-20 w-20 rounded-full bg-gray-300 overflow-hidden">
                  {profileForm.avatar_url ? (
                    <Image
                      src={profileForm.avatar_url}
                      alt="Profile"
                      width={60}
                      height={60}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-6 text-gray-500" />
                  )}
                </div>
                <button
                  className="cursor-pointer bg-gray-500 absolute right-0 bottom-0 rounded-full h-8 w-8 flex items-center justify-center"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  type="button"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab === "profile" ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Profile Info
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab === "social" ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => setActiveTab("social")}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Social Links
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab === "share" ? "bg-accent text-accent-foreground" : ""}`}
              onClick={() => setActiveTab("share")}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Badge
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start text-destructive ${activeTab === "logout" ? "bg-accent" : ""}`}
              onClick={() => setActiveTab("logout")}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>

          {/* Right column - Content */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[60vh] w-full">
            {activeTab === "profile" && (
              <div className="grid gap-4">
                <div className="space-x-2 flex">
                  <Label>Edit Profile</Label>
                  <p className="text-xs text-gray-500">
                    Edit your profile information
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      value={profileForm.username}
                      className="pr-10"
                      placeholder="@username"
                      disabled
                    />
                    <Link href={`/edit-username`}>
                      <button className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-row gap-2 w-full">
                  <div className="flex flex-col space-y-2 w-full">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={profileForm.first_name}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="flex flex-col space-y-2 w-full">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={profileForm.last_name}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="location"
                      name="location"
                      value={profileForm.location}
                      onChange={handleFormChange}
                      className="pl-12"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_email">Work Email</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="work_email"
                      name="work_email"
                      type="email"
                      value={profileForm.work_email}
                      onChange={handleFormChange}
                      className="pl-12"
                      placeholder="your@workemail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="primary_role">Primary Role</Label>
                    {roleSelectError ? (
                      <p className="text-xs text-red-500">{roleSelectError}</p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Select up to 3 primary roles
                      </p>
                    )}
                  </div>
                  <MultiSelect
                    className="h-fit"
                    options={ROLE_OPTIONS}
                    selected={profileForm.primary_role}
                    onChange={handleRoleChange}
                    placeholder="Select your roles"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="bio">Bio</Label>
                    <span className="text-xs text-gray-500">
                      {bioLength}/68
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleFormChange}
                    maxLength={68}
                    rows={3}
                  />
                </div>

                <DialogFooter className="absolute bottom-4 right-4">
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            )}

            {activeTab === "social" && (
              <div className="grid gap-4">
                <div className="space-y-4">
                  <div className="space-x-2 flex">
                    <Label>Social Links</Label>
                    <p className="text-xs text-gray-500">
                      Connect your social profiles
                    </p>
                  </div>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="relative mt-3">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <SocialIcon
                          platform={platform}
                          className="h-4 w-4 text-gray-500"
                        />
                      </div>
                      <Input
                        id={`social_${platform.id}`}
                        name={`social_${platform.id}`}
                        value={profileForm.social_links?.[platform.id] || ""}
                        onChange={handleSocialLinkChange}
                        className="pl-12"
                        placeholder={platform.placeholder}
                      />
                    </div>
                  ))}
                </div>

                <DialogFooter className="absolute bottom-4 right-4">
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            )}

            {activeTab === "share" && (
              <div className="py-4 flex flex-col">
                <h3 className="text-lg font-medium mb-4">Share Your Badge</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Share your That Sauce creator badge on social media or add it
                  to your website.
                </p>

                <div className="mt-2">
                  <CreatorBadge creator={profileForm} />
                </div>
              </div>
            )}

            {activeTab === "logout" && (
              <div className="py-16 text-center">
                <LogOut className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-medium mb-4">Log Out</h3>
                <Button variant="destructive" className="w-48">
                  Log Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
