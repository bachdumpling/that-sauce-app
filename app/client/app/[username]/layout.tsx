"use client";

import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CreatorHeader } from "./components/creator-header";
import { TabsNav } from "./components/tabs-nav";
import React from "react";
import { Creator } from "@/client/types";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { checkCreatorExistsAction } from "@/actions/creator-actions";
import ProfileEditDialog from "./components/profile-edit-dialog";
import { updateCreatorProfileAction } from "@/actions/creator-actions";
import { toast } from "sonner";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";

// Props that will be passed to child components
interface CreatorPageProps {
  creator: Creator;
}

export default function CreatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { username: string } | Promise<{ username: string }>;
}) {
  // Unwrap params using React.use() to avoid the warning
  const resolvedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const { username } = resolvedParams;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for profile editing with type that allows dynamic social platform fields
  const [profileForm, setProfileForm] = useState<{
    username: string;
    avatar_url: string;
    banner_url: string;
    first_name: string;
    last_name: string;
    bio: string;
    location: string;
    years_of_experience: string;
    work_email: string;
    primary_role: string[];
    social_links?: {
      [key: string]: string; // Platform ID to URL mapping, e.g. "linkedin" -> "https://..."
    };
    [key: string]: any; // Allow dynamic social media fields like social_linkedin, social_twitter, etc.
  }>({
    username: "",
    avatar_url: "",
    banner_url: "",
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    years_of_experience: "",
    work_email: "",
    primary_role: [],
    social_links: {},
  });

  // Fetch creator data
  useEffect(() => {
    async function fetchCreator() {
      try {
        const response = await checkCreatorExistsAction(username);
        setCreator(response);

        // Initialize form with creator data
        const initialForm = {
          username: response.username || "",
          avatar_url: response.avatar_url || "",
          banner_url: response.banner_url || "",
          first_name: response.first_name || "",
          last_name: response.last_name || "",
          bio: response.bio || "",
          location: response.location || "",
          years_of_experience: response.years_of_experience?.toString() || "",
          work_email: response.work_email || "",
          primary_role: response.primary_role || [],
          social_links: response.social_links || {},
        };

        // Add social platforms data for easier form access
        if (response.social_links) {
          SOCIAL_PLATFORMS.forEach((platform) => {
            initialForm[`social_${platform.id}`] =
              response.social_links?.[platform.id] || "";
          });
        }

        setProfileForm(initialForm);
      } catch (error) {
        console.error("Error fetching creator:", error);
      }
    }

    fetchCreator();
  }, [username]);

  // Handle Edit Profile event from any page
  useEffect(() => {
    function handleEditProfile() {
      setIsProfileDialogOpen(true);
    }

    window.addEventListener("edit-creator-profile", handleEditProfile);
    return () => {
      window.removeEventListener("edit-creator-profile", handleEditProfile);
    };
  }, []);

  // Handle form field changes
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for social platform fields
    if (name.startsWith("social_")) {
      const platformId = name.replace("social_", "");
      setProfileForm((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platformId]: value,
        },
      }));
    } else {
      // Regular field handling
      setProfileForm((prev) => ({
        ...prev,
        [name]: value,
      }));
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
        bio: profileForm.bio,
        location: profileForm.location,
        years_of_experience: profileForm.years_of_experience
          ? parseInt(profileForm.years_of_experience, 10)
          : undefined,
        work_email: profileForm.work_email,
        primary_role: profileForm.primary_role,
        social_links: socialLinks,
      });

      if (response.success) {
        toast("Profile updated successfully");
        setIsProfileDialogOpen(false);

        // If username was changed, redirect to the new profile page
        if (profileForm.username !== username) {
          window.location.href = `/${profileForm.username}`;
        } else {
          // Refresh creator data
          const updatedCreator = await checkCreatorExistsAction(username);
          setCreator(updatedCreator);
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

  return (
    <>
      <div className="container w-full max-w-7xl mx-auto">
        <CreatorHeader creator={creator} username={username} />
        <TabsNav creator={creator} username={username} />

        {children}
      </div>

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

      <Toaster />
    </>
  );
}

// Component to display children with creator props
function CreatorPageContent({
  children,
  creator,
}: {
  children: React.ReactNode;
  creator: Creator;
}) {
  try {
    // Only clone if children is a valid React element
    if (React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<CreatorPageProps>,
        {
          creator,
        }
      );
    }
    // Fallback if children is not a valid React element (shouldn't normally happen)
    return children;
  } catch (error) {
    return (
      <div className="py-6">
        <p className="text-red-500">Error rendering page content</p>
      </div>
    );
  }
}
