"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function NewProjectForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<string>("image");
  const [mediaLink, setMediaLink] = useState<string>("");
  const [projectLink, setProjectLink] = useState<string>("");
  const [isLargeFile, setIsLargeFile] = useState<boolean>(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    // Check for file size
    const hasLargeFile = droppedFiles.some(
      (file) => file.size > 5 * 1024 * 1024
    );
    setIsLargeFile(hasLargeFile);

    if (!hasLargeFile) {
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Check for file size
      const hasLargeFile = selectedFiles.some(
        (file) => file.size > 5 * 1024 * 1024
      );
      setIsLargeFile(hasLargeFile);

      if (!hasLargeFile) {
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      {/* Project Link Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Project from Link</CardTitle>
          <CardDescription>
            Enter a link to import media from another project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="Paste project link here"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
              />
            </div>
            <Button>Import</Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>
            Upload images and videos (max 5MB) or provide links for larger files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="link">Add Media Link</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Images and videos up to 5MB
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {isLargeFile && (
                <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-md">
                  <p>
                    One or more files exceed the 5MB limit. Please use the "Add
                    Media Link" option for larger files.
                  </p>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Selected files:</h3>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm">
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}{" "}
                        MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="link">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mediaLink">Media Link</Label>
                  <Input
                    id="mediaLink"
                    type="url"
                    placeholder="Paste media link here"
                    value={mediaLink}
                    onChange={(e) => setMediaLink(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="block mb-2">Media Type</Label>
                  <RadioGroup
                    value={mediaType}
                    onValueChange={setMediaType}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" />
                      <Label htmlFor="image">Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="youtube" id="youtube" />
                      <Label htmlFor="youtube">YouTube Video</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vimeo" id="vimeo" />
                      <Label htmlFor="vimeo">Vimeo Video</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="mt-2">Add Media Link</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
