"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Creator } from "@/components/shared/types";
import { Loader2, Save, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { checkUsernameAvailability } from "@/lib/api/creators";
import debounce from "lodash/debounce";

// Define role options for the select field
const ROLE_OPTIONS = [
  "ui-designer",
  "ux-designer",
  "product-designer",
  "interaction-designer",
  "visual-designer",
  "graphic-designer",
  "motion-designer",
  "illustrator",
  "art-director",
  "creative-director",
];

interface CreatorEditFormProps {
  creator: Creator;
  onSave: (updatedData: Partial<Creator>) => Promise<boolean>;
  onCancel: () => void;
}

export function CreatorEditForm({
  creator,
  onSave,
  onCancel,
}: CreatorEditFormProps) {
  const [formData, setFormData] = useState({
    username: creator.username || "",
    first_name: creator.first_name || "",
    last_name: creator.last_name || "",
    work_email: creator.work_email || "",
    location: creator.location || "",
    bio: creator.bio || "",
    years_of_experience: creator.years_of_experience
      ? String(creator.years_of_experience)
      : "",
    primary_role: creator.primary_role || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<
    "initial" | "checking" | "valid" | "invalid" | "error"
  >("initial");
  const [usernameMessage, setUsernameMessage] = useState<string>("");
  const [originalUsername] = useState<string>(creator.username || "");

  // Debounced function to check username availability
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      // Don't check if username hasn't changed
      if (username === originalUsername) {
        setUsernameStatus("valid");
        setUsernameMessage("");
        return;
      }

      // Basic validation
      if (!username) {
        setUsernameStatus("invalid");
        setUsernameMessage("Username is required");
        return;
      }

      if (username.length < 3) {
        setUsernameStatus("invalid");
        setUsernameMessage("Username must be at least 3 characters");
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setUsernameStatus("invalid");
        setUsernameMessage(
          "Username can only contain letters, numbers, underscores and hyphens"
        );
        return;
      }

      // Check availability with API
      setUsernameStatus("checking");

      try {
        const response = await checkUsernameAvailability(username);

        if (response.success) {
          if (response.available) {
            setUsernameStatus("valid");
            setUsernameMessage("Username is available");
          } else {
            setUsernameStatus("invalid");
            setUsernameMessage("Username is already taken");
          }
        } else {
          setUsernameStatus("error");
          setUsernameMessage("Error checking username");
        }
      } catch (error) {
        setUsernameStatus("error");
        setUsernameMessage("Error checking username");
      }
    }, 500),
    [originalUsername]
  );

  // Check username validity when it changes
  useEffect(() => {
    if (formData.username) {
      checkUsername(formData.username);
    } else {
      setUsernameStatus("initial");
      setUsernameMessage("");
    }

    return () => {
      checkUsername.cancel();
    };
  }, [formData.username, checkUsername]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRole = () => {
    if (!selectedRole || formData.primary_role.includes(selectedRole)) return;

    setFormData((prev) => ({
      ...prev,
      primary_role: [...prev.primary_role, selectedRole],
    }));
    setSelectedRole("");
  };

  const handleRemoveRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      primary_role: prev.primary_role.filter((r) => r !== role),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if username is invalid
    if (usernameStatus === "invalid" || usernameStatus === "checking") {
      toast.error(
        usernameMessage || "Please fix username issues before saving"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert years_of_experience to number
      const dataToSave = {
        ...formData,
        years_of_experience: formData.years_of_experience
          ? parseInt(formData.years_of_experience, 10)
          : undefined,
      };

      const success = await onSave(dataToSave);

      if (success) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Username status indicator
  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case "checking":
        return (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        );
      case "valid":
        return <Check className="h-4 w-4 text-green-500" />;
      case "invalid":
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <div className="relative">
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Your username"
              className={`pr-10 ${
                usernameStatus === "invalid" || usernameStatus === "error"
                  ? "border-red-500"
                  : usernameStatus === "valid"
                    ? "border-green-500"
                    : ""
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {renderUsernameStatus()}
            </div>
          </div>
          {usernameMessage && (
            <p
              className={`text-xs mt-1 ${
                usernameStatus === "valid" ? "text-green-500" : "text-red-500"
              }`}
            >
              {usernameMessage}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            This will change your profile URL.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-1"
            >
              First Name
            </label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Your first name"
            />
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium mb-1"
            >
              Last Name
            </label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Your last name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="work_email"
            className="block text-sm font-medium mb-1"
          >
            Work Email
          </label>
          <Input
            id="work_email"
            name="work_email"
            type="email"
            value={formData.work_email}
            onChange={handleInputChange}
            placeholder="Your work email"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Your location (e.g., New York, NY)"
          />
        </div>

        <div>
          <label
            htmlFor="years_of_experience"
            className="block text-sm font-medium mb-1"
          >
            Years of Experience
          </label>
          <Input
            id="years_of_experience"
            name="years_of_experience"
            type="number"
            min="0"
            max="100"
            value={formData.years_of_experience}
            onChange={handleInputChange}
            placeholder="Years of professional experience"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself"
            rows={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Primary Roles
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.primary_role.map((role) => (
              <div
                key={role}
                className="flex items-center bg-secondary rounded-full px-3 py-1"
              >
                <span className="text-sm">{role.replace(/-/g, " ")}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace(/-/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRole}
              disabled={!selectedRole}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
