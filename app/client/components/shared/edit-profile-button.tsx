// app/client/components/edit-profile-button.tsx

"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useProfileEdit } from "@/contexts/ProfileEditContext";

interface EditProfileButtonProps extends ButtonProps {
  variant?: "default" | "outline" | "ghost";
  children?: React.ReactNode;
  username?: string;
}

export function EditProfileButton({
  variant = "default",
  children,
  username,
  ...props
}: EditProfileButtonProps) {
  const { openProfileDialog } = useProfileEdit();

  const handleEditProfile = () => {
    if (username) {
      openProfileDialog(username);
    } else {
      // For backward compatibility, dispatch the event with custom detail
      const event = new CustomEvent("edit-creator-profile", {
        detail: { username },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <button onClick={handleEditProfile} {...props}>
      {children || (
        <>
          <Pencil className="h-4 w-4 mr-2" />
          Edit profile
        </>
      )}
    </button>
  );
}
