"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DropzoneInputProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

export function DropzoneInput({
  onFilesSelected,
  acceptedFileTypes,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  className,
}: DropzoneInputProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errorMessages = rejectedFiles.map((rejected) => {
          const errors = rejected.errors.map((e: any) => e.message).join(", ");
          return `${rejected.file.name}: ${errors}`;
        });
        setError(errorMessages.join("\n"));
        return;
      }

      // Check number of files
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} files at once.`);
        return;
      }

      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
    if (newFiles.length < maxFiles) {
      setError(null);
    }
  };

  const clearAll = () => {
    setFiles([]);
    onFilesSelected([]);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    disabled,
    maxFiles,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload
            className={cn(
              "h-10 w-10",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="text-sm text-center">
            {isDragActive ? (
              <p className="font-medium text-primary">Drop the files here</p>
            ) : (
              <p className="text-muted-foreground">
                Drag & drop files here, or click to select
              </p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              Maximum {maxFiles} files, up to{" "}
              {(maxSize / 1024 / 1024).toFixed(0)}MB each.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0 translate-y-0.5" />
          <div className="flex-1 whitespace-pre-line">{error}</div>
        </div>
      )}

      {/* {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>

          <ul className="space-y-1 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-md">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between text-sm p-1 hover:bg-muted/50 rounded"
              >
                <div className="flex items-center overflow-hidden">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground/70 ml-2 text-xs flex-shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {file.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
} 