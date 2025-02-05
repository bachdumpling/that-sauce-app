import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/auth-context";
import { Upload } from "lucide-react";
import { PostgrestError } from "@supabase/supabase-js";

interface MediaEntry {
  id: string;
  user_id: string;
  file_path: string;
  file_type: "image" | "video";
  storage_url: string;
  mime_type: string;
  size_bytes: number;
  metadata: {
    original_name: string;
  };
}

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (url: string, mediaEntry: MediaEntry) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: "uploading" | "completed" | "error") => void;
}

export function FileUpload({
  projectId,
  onUploadComplete,
  onError,
  onStatusChange,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    onStatusChange?.("uploading");

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${projectId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      // Create media entry
      const { data: mediaEntry, error: mediaError } = await supabase
        .from("media")
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_type: file.type.startsWith("image/") ? "image" : "video",
          storage_url: publicUrl,
          mime_type: file.type,
          size_bytes: file.size,
          metadata: {
            original_name: file.name,
          },
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Create queue entry for processing
      const { error: queueError } = await supabase
        .from("media_queue")
        .insert({
          media_id: mediaEntry.id,
          file_path: filePath,
          file_type: file.type.startsWith("image/") ? "image" : "video",
        });

      if (queueError) throw queueError;

      onUploadComplete?.(publicUrl, mediaEntry);
      onStatusChange?.("completed");
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error instanceof Error ? error.message : "Upload failed");
      onStatusChange?.("error");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Images or videos
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      {isUploading && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Uploading...</p>
        </div>
      )}
    </div>
  );
}
