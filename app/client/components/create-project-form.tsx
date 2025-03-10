"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface CreateProjectFormProps {
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CreateProjectForm({
  initialTitle = "",
  initialDescription = "",
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create Project",
}: CreateProjectFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setError(null);

    try {
      await onSubmit(title, description);
      // Reset form on success
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project description (optional)"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
