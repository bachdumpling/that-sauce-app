"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Creator } from "@/client/types";
import { checkCreatorExistsAction } from "@/actions/creator-actions";
import ProfileEditDialog from "@/app/[username]/components/profile-edit-dialog";
import { updateCreatorProfileAction } from "@/actions/creator-actions";
import { toast } from "sonner";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";

interface ProfileEditContextType {
  isProfileDialogOpen: boolean;
  openProfileDialog: (username?: string) => void;
  closeProfileDialog: () => void;
  currentCreatorUsername: string | null;
}

const ProfileEditContext = createContext<ProfileEditContextType>({
  isProfileDialogOpen: false,
  openProfileDialog: () => {},
  closeProfileDialog: () => {},
  currentCreatorUsername: null,
});

export function useProfileEdit() {
  return useContext(ProfileEditContext);
}

export function ProfileEditProvider({ children }: { children: ReactNode }) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [currentCreatorUsername, setCurrentCreatorUsername] = useState<
    string | null
  >(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [profileForm, setProfileForm] = useState({
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

  // Open profile dialog with a specific username
  const openProfileDialog = async (username?: string) => {
    if (username) {
      try {
        const creatorData = await checkCreatorExistsAction(username);
        setCreator(creatorData);
        setCurrentCreatorUsername(username);

        // Initialize form with creator data
        const initialForm = {
          username: creatorData.username || "",
          avatar_url: creatorData.avatar_url || "",
          banner_url: creatorData.banner_url || "",
          first_name: creatorData.first_name || "",
          last_name: creatorData.last_name || "",
          bio: creatorData.bio || "",
          location: creatorData.location || "",
          years_of_experience:
            creatorData.years_of_experience?.toString() || "",
          work_email: creatorData.work_email || "",
          primary_role: creatorData.primary_role || [],
          social_links: creatorData.social_links || {},
        };

        // Add social platforms data for easier form access
        if (creatorData.social_links) {
          SOCIAL_PLATFORMS.forEach((platform) => {
            initialForm[`social_${platform.id}`] =
              creatorData.social_links?.[platform.id] || "";
          });
        }

        setProfileForm(initialForm);
        setIsProfileDialogOpen(true);
      } catch (error) {
        console.error("Error fetching creator:", error);
        toast.error("Could not load profile data");
      }
    }
  };

  const closeProfileDialog = () => {
    setIsProfileDialogOpen(false);
  };

  // Handle form field changes
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

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
      setProfileForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePrimaryRoleChange = (selectedRoles: string[]) => {
    setProfileForm((prev) => ({
      ...prev,
      primary_role: selectedRoles,
    }));
  };

  const handleProfileUpdate = async () => {
    if (!currentCreatorUsername) return;

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

      const response = await updateCreatorProfileAction(
        currentCreatorUsername,
        {
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
        }
      );

      if (response.success) {
        toast.success("Profile updated successfully");
        setIsProfileDialogOpen(false);

        // If username was changed, redirect to the new profile page
        if (profileForm.username !== currentCreatorUsername) {
          window.location.href = `/${profileForm.username}`;
        } else {
          // Refresh creator data if needed
          window.location.reload();
        }
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Listen for global edit-creator-profile event
  useEffect(() => {
    const handleGlobalEditProfile = (event: CustomEvent) => {
      const username = event.detail?.username;
      if (username) {
        openProfileDialog(username);
      }
    };

    window.addEventListener(
      "edit-creator-profile",
      handleGlobalEditProfile as EventListener
    );

    return () => {
      window.removeEventListener(
        "edit-creator-profile",
        handleGlobalEditProfile as EventListener
      );
    };
  }, []);

  return (
    <ProfileEditContext.Provider
      value={{
        isProfileDialogOpen,
        openProfileDialog,
        closeProfileDialog,
        currentCreatorUsername,
      }}
    >
      {children}

      {/* Render the dialog here so it's available globally */}
      <ProfileEditDialog
        isOpen={isProfileDialogOpen}
        onClose={closeProfileDialog}
        profileForm={profileForm}
        handleFormChange={handleFormChange}
        handlePrimaryRoleChange={handlePrimaryRoleChange}
        handleProfileUpdate={handleProfileUpdate}
        isSubmitting={isSubmitting}
      />
    </ProfileEditContext.Provider>
  );
}
