"use client";

import { Creator, Project } from "@/components/shared/types";
import { Overview } from "./overview";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  Plus,
  Instagram,
  Mail,
  Briefcase,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCreatorProfileAction } from "@/actions/creator-actions";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { CREATOR_ROLES, SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import ProfileEditDialog from "./profile-edit-dialog";

// Role options for the MultiSelect component
const ROLE_OPTIONS: Option[] = CREATOR_ROLES.map((role) => ({
  value: role,
  label: role,
}));

interface CreatorClientProps {
  creator: Creator;
  username: string;
}

export function CreatorClient({ creator, username }: CreatorClientProps) {
  const pathname = usePathname();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: creator.username || "",
    first_name: creator.first_name || "",
    last_name: creator.last_name || "",
    website: creator.website || "",
    bio: creator.bio || "",
    location: creator.location || "",
    years_of_experience: creator.years_of_experience?.toString() || "",
    work_email: creator.work_email || "",
    primary_role: creator.primary_role || [],
    socialUsername: "",
  });
  const [bioLength, setBioLength] = useState(profileForm.bio.length);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event emitter/listener for the Edit Profile button in creator-header.tsx
  useEffect(() => {
    const handleEditProfile = () => setIsProfileDialogOpen(true);
    window.addEventListener("edit-creator-profile", handleEditProfile);
    return () =>
      window.removeEventListener("edit-creator-profile", handleEditProfile);
  }, []);

  // Handle form field changes
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "bio") {
      setBioLength(value.length);
    }
  };

  // Handle primary role selection changes
  const handlePrimaryRoleChange = (selectedRoles: string[]) => {
    setProfileForm((prev) => ({
      ...prev,
      primary_role: selectedRoles,
    }));
  };

  // Handle profile update submission
  const handleProfileUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Prepare social links as a JSON object
      const socialLinks = {};
      SOCIAL_PLATFORMS.forEach((platform) => {
        const value = profileForm[`social_${platform.id}`];
        if (value) {
          socialLinks[platform.id] = value;
        }
      });

      // Use the server action instead of client API call
      const response = await updateCreatorProfileAction(username, {
        username: profileForm.username,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        website: profileForm.website,
        bio: profileForm.bio,
        location: profileForm.location,
        years_of_experience: profileForm.years_of_experience
          ? parseInt(profileForm.years_of_experience, 10)
          : undefined,
        work_email: profileForm.work_email,
        primary_role: profileForm.primary_role,
        social_links: socialLinks, // Add social links object
      });

      if (response.success) {
        toast("Profile updated successfully");
        setIsProfileDialogOpen(false);

        // If username was changed, redirect to the new profile page
        if (profileForm.username !== username) {
          window.location.href = `/${profileForm.username}`;
        }
      } else {
        toast(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.endsWith(`/${username}`)) return "overview";
    if (pathname.includes(`/${username}/work`)) return "work";
    if (pathname.includes(`/${username}/about`)) return "about";
    return "overview";
  };

  const activeTab = getActiveTab();

  return (
    <>
      {/* Profile Edit Dialog */}
      <ProfileEditDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        profileForm={profileForm}
        handleFormChange={handleFormChange}
        handlePrimaryRoleChange={handlePrimaryRoleChange}
        handleProfileUpdate={handleProfileUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Main content area based on active tab */}
      {activeTab === "overview" && <Overview creator={creator} />}

      {activeTab === "work" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group hover:opacity-90 transition-opacity">
            <div className="overflow-hidden">
              <div className="w-full h-72 object-cover rounded-[16px] border border-gray-200 grid place-items-center">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center rounded-full p-2"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
          {creator.projects && creator.projects.length > 0 ? (
            creator.projects.map((project) => (
              <Link
                href={`/${username}/work/${project.id}`}
                key={project.id}
                className="group hover:opacity-90 transition-opacity"
              >
                <div className="overflow-hidden">
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0].url}
                      alt={project.title}
                      className="w-full h-72 object-cover rounded-[16px] border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-72 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="pt-4">
                    <h3 className="font-medium text-lg">{project.title}</h3>
                    {project.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 py-12 text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                No projects yet
              </h3>
              {creator.isOwner && (
                <Button className="mt-4">Add Your First Project</Button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "about" && (
        <div className="prose dark:prose-invert max-w-none">
          <h2>About {creator.first_name || creator.username}</h2>
          {creator.bio ? (
            <p>{creator.bio}</p>
          ) : (
            <p className="text-muted-foreground">No bio available.</p>
          )}

          {creator.location && (
            <div className="mt-6">
              <h3>Location</h3>
              <p>{creator.location}</p>
            </div>
          )}

          {creator.website && (
            <div className="mt-6">
              <h3>Website</h3>
              <a
                href={
                  creator.website.startsWith("http")
                    ? creator.website
                    : `https://${creator.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {creator.website}
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
