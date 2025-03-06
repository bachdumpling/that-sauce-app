import { useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
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
    project_id: string;
  };
}

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (url: string, mediaEntry: MediaEntry) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: "uploading" | "completed" | "error") => void;
}

export async function FileUpload({
  projectId,
  onUploadComplete,
  onError,
  onStatusChange,
}: FileUploadProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const inputId = `file-upload-${projectId}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadStep("Starting upload...");
    onStatusChange?.("uploading");

    try {
      // Upload file to storage
      setUploadStep("Uploading to storage...");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${projectId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadStep("Getting public URL...");
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      // Create media entry
      setUploadStep("Creating media entry...");
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
            project_id: projectId,
          },
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Create queue entry for processing
      setUploadStep("Creating queue entry...");
      const { error: queueError } = await supabase.from("media_queue").insert({
        media_id: mediaEntry.id,
        file_path: filePath,
        file_type: file.type.startsWith("image/") ? "image" : "video",
        metadata: {
          project_id: projectId,
        },
      });

      if (queueError) throw queueError;

      // Update project's media array
      setUploadStep("Updating project...");
      const { error: projectError } = await supabase.rpc(
        "add_media_to_project",
        {
          p_project_id: projectId,
          p_media_id: mediaEntry.id,
          p_media_type: file.type.startsWith("image/") ? "image" : "video",
        }
      );

      if (projectError) {
        console.error("Error updating project media:", projectError);
      }

      setUploadStep("Upload complete!");
      onUploadComplete?.(publicUrl, mediaEntry);
      onStatusChange?.("completed");
    } catch (error) {
      console.error("Upload error at step:", uploadStep, error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onError?.(`Error at ${uploadStep}: ${errorMessage}`);
      onStatusChange?.("error");
    } finally {
      setIsUploading(false);
      setUploadStep("");
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor={inputId}
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
            id={inputId}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      {isUploading && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">Uploading...</p>
          <p className="text-xs text-gray-400">{uploadStep}</p>
        </div>
      )}
    </div>
  );
}
