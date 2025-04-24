import { UploadedFile } from "express-fileupload";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import logger from "../config/logger";
import { MediaResponse, UploadOptions } from "../models/Media";
import axios from "axios";

export class MediaService {
  /**
   * Upload a single media file to storage and create a record in the database
   */
  async uploadMedia(
    file: UploadedFile,
    options: UploadOptions
  ): Promise<MediaResponse> {
    const { userId, projectId, creatorId, metadata = {} } = options;

    // Generate a unique filename with appropriate prefix
    const fileExtension = path.extname(file.name).toLowerCase();
    const filePrefix = file.mimetype.startsWith("image/") ? "image-" : "video-";
    const fileName = `${filePrefix}${uuidv4()}${fileExtension}`;

    // Create path structure: userId/project-id/filename
    const filePath = `${userId}/${projectId}/${fileName}`;

    // Determine file type - check both mimetype and extension
    // Common video extensions
    const videoExtensions = [
      ".mp4",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".webm",
      ".mkv",
      ".m4v",
    ];
    const isVideoByExtension = videoExtensions.includes(fileExtension);

    // If the extension clearly indicates it's a video, override the mimetype check
    const isImage = isVideoByExtension
      ? false
      : file.mimetype.startsWith("image/");
    const mediaType = isImage ? "image" : "video";

    // Additional logging for MIME type detection
    logger.debug("Media type detection", {
      fileName: file.name,
      mimeType: file.mimetype,
      detectedType: mediaType,
      extension: fileExtension,
      isVideoByExtension,
    });

    try {
      // Set up response metadata
      const mediaMetadata: Record<string, any> = {
        ...metadata,
        file_size: file.size,
        mime_type: file.mimetype,
        original_filename: file.name,
      };

      // Get file data to upload
      let fileData;

      // Log file details for debugging
      logger.debug("File upload details", {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        hasData: !!file.data,
        hasTempFilePath: !!file.tempFilePath,
        dataLength: file.data ? file.data.length : "N/A",
        tempFileExists: file.tempFilePath
          ? fs.existsSync(file.tempFilePath)
          : false,
        tempFileSize:
          file.tempFilePath && fs.existsSync(file.tempFilePath)
            ? fs.statSync(file.tempFilePath).size
            : "N/A",
      });

      // Prefer using tempFilePath if it exists and has content
      if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
        const stats = fs.statSync(file.tempFilePath);
        if (stats.size > 0) {
          fileData = fs.readFileSync(file.tempFilePath);
          logger.debug("Using tempFilePath for upload", {
            path: file.tempFilePath,
            size: stats.size,
          });
        } else {
          logger.warn("tempFilePath exists but is empty", {
            path: file.tempFilePath,
          });
          // Fall back to file.data if tempFile is empty
          if (file.data && file.data.length > 0) {
            fileData = file.data;
            logger.debug("Falling back to file.data", {
              size: file.data.length,
            });
          } else {
            throw new Error(
              "Cannot access file data - both tempFilePath and data are empty"
            );
          }
        }
      } else if (file.data && file.data.length > 0) {
        // Use file.data directly if available
        fileData = file.data;
        logger.debug("Using file.data for upload", { size: file.data.length });
      } else {
        throw new Error("Cannot access file data - no valid source available");
      }

      if (!fileData || (Buffer.isBuffer(fileData) && fileData.length === 0)) {
        throw new Error("File data is empty");
      }

      const { data: storageData, error: storageError } = await supabase.storage
        .from("media")
        .upload(filePath, fileData, {
          contentType: file.mimetype,
          cacheControl: "3600",
        });

      if (storageError) {
        logger.error("Storage upload error", { error: storageError });
        throw storageError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      const storageUrl = publicUrlData.publicUrl;

      let mediaData;

      // Store in appropriate table based on media type
      if (isImage) {
        // Create image record
        const { data: imageData, error: imageError } = await supabase
          .from("images")
          .insert([
            {
              project_id: projectId,
              creator_id: creatorId,
              url: storageUrl,
              alt_text: metadata.alt_text || file.name,
              resolutions: {},
              order: metadata.order || 0,
            },
          ])
          .select()
          .single();

        if (imageError) {
          logger.error("Image record creation error", { error: imageError });
          throw imageError;
        }

        mediaData = imageData;
      } else {
        // Create video record
        logger.debug("Creating video record", {
          file_name: file.name,
          url: storageUrl,
          project_id: projectId,
          title: metadata.title || path.basename(file.name, fileExtension),
        });

        // Ensure we have all required fields based on the database schema
        // From the schema: videos has required fields: id (auto), project_id, creator_id, title
        const videoRecord = {
          project_id: projectId,
          creator_id: creatorId,
          url: storageUrl,
          title: metadata.title || path.basename(file.name, fileExtension),
          description: metadata.description || "",
          categories: metadata.categories || [],
        };

        logger.debug("Video record to insert", videoRecord);

        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .insert([videoRecord])
          .select()
          .single();

        if (videoError) {
          logger.error("Video record creation error", {
            error: videoError,
            details: (videoError as any).details,
            message: (videoError as any).message,
            hint: (videoError as any).hint,
            code: (videoError as any).code,
          });
          throw videoError;
        }

        mediaData = videoData;
      }

      // Return standardized response
      return {
        id: mediaData.id,
        type: mediaType,
        url: storageUrl,
        projectId: projectId,
        creatorId: creatorId,
        metadata: {
          ...mediaMetadata,
          ...mediaData,
        },
        created_at: mediaData.created_at,
      };
    } catch (error) {
      logger.error("Media upload failed", { error });
      throw error;
    }
  }

  /**
   * Upload media from a URL (without storing in our storage)
   */
  async uploadMediaFromUrl(
    url: string,
    options: UploadOptions
  ): Promise<MediaResponse> {
    const { userId, projectId, creatorId, metadata = {} } = options;

    try {
      // Determine media type from URL or metadata
      let mediaType: "image" | "video" = "image";
      const fileExtension = path.extname(url).toLowerCase();
      const videoExtensions = [
        ".mp4",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".webm",
        ".mkv",
        ".m4v",
      ];

      // If metadata specifies the type, use that
      if (metadata.type) {
        mediaType = metadata.type;
      }
      // Otherwise try to determine from URL
      else if (videoExtensions.includes(fileExtension)) {
        mediaType = "video";
      }

      let mediaData;

      // Store in appropriate table based on media type
      if (mediaType === "image") {
        // Create image record directly with the external URL
        const { data: imageData, error: imageError } = await supabase
          .from("images")
          .insert([
            {
              project_id: projectId,
              creator_id: creatorId,
              url: url, // Use the original URL
              alt_text: metadata.alt_text || path.basename(url),
              resolutions: {},
              order: metadata.order || 0,
            },
          ])
          .select()
          .single();

        if (imageError) {
          logger.error("Image record creation error", {
            error: imageError,
            details: (imageError as any).details,
            message: (imageError as any).message,
            hint: (imageError as any).hint,
            code: (imageError as any).code,
          });
          throw imageError;
        }

        mediaData = imageData;
      } else {
        // Create video record with the external URL
        const videoRecord = {
          project_id: projectId,
          creator_id: creatorId,
          url: url, // Use the original URL
          title: metadata.title || path.basename(url),
          description: metadata.description || "",
          categories: metadata.categories || [],
          youtube_id: metadata.youtube_id,
          vimeo_id: metadata.vimeo_id,
        };

        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .insert([videoRecord])
          .select()
          .single();

        if (videoError) {
          logger.error("Video record creation error", {
            error: videoError,
            details: (videoError as any).details,
            message: (videoError as any).message,
            hint: (videoError as any).hint,
            code: (videoError as any).code,
          });
          throw videoError;
        }

        mediaData = videoData;
      }

      // Return standardized response
      return {
        id: mediaData.id,
        type: mediaType,
        url: url,
        projectId: projectId,
        creatorId: creatorId,
        metadata: {
          ...metadata,
          ...mediaData,
        },
        created_at: mediaData.created_at,
      };
    } catch (error) {
      // Improved error logging with more details
      if (error instanceof Error) {
        logger.error("Media URL upload failed", {
          error: error.message,
          stack: error.stack,
          url,
        });
      } else if (typeof error === "object" && error !== null) {
        logger.error("Media URL upload failed", {
          error,
          message: (error as any).message || "Unknown error",
          details: (error as any).details || {},
          code: (error as any).code || "UNKNOWN",
          url,
        });
      } else {
        logger.error("Media URL upload failed", {
          error: String(error),
          url,
        });
      }
      throw error;
    }
  }

  /**
   * Batch upload multiple media files
   */
  async batchUploadMedia(
    files: UploadedFile[],
    options: UploadOptions
  ): Promise<{ results: MediaResponse[]; errors: any[] }> {
    const results: MediaResponse[] = [];
    const errors: any[] = [];

    // Process each file sequentially to avoid overwhelming the database
    for (const item of files) {
      try {
        const result = await this.uploadMedia(item, options);
        results.push(result);
      } catch (error) {
        const errorDetails = {
          filename: item.name || "unknown",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        };

        logger.error("Failed to upload individual item in batch", errorDetails);
        errors.push(errorDetails);
      }
    }

    // If all uploads failed, throw an error with details
    if (results.length === 0 && errors.length > 0) {
      const errorMessage = `All uploads failed: ${JSON.stringify(errors)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // If some uploads failed, log the errors
    if (errors.length > 0) {
      logger.warn("Some media uploads failed", { errors });
    }

    // Return both results and errors to allow API to show partial success
    return { results, errors };
  }

  /**
   * Get media details by ID
   */
  async getMediaDetails(mediaId: string): Promise<MediaResponse | null> {
    // Try to find in images table first
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .select("*, projects!images_project_id_fkey(title)")
      .eq("id", mediaId)
      .maybeSingle();

    if (imageError) {
      logger.error("Error querying images table", {
        error: imageError,
        mediaId,
      });
    }

    if (imageData) {
      return {
        id: imageData.id,
        type: "image",
        url: imageData.url,
        projectId: imageData.project_id,
        creatorId: imageData.creator_id,
        metadata: {
          alt_text: imageData.alt_text,
          order: imageData.order,
          project_title: imageData.projects?.title,
          resolutions: imageData.resolutions || {},
        },
        created_at: imageData.created_at,
      };
    }

    // If not found in images, try videos
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .select("*, projects(title)")
      .eq("id", mediaId)
      .maybeSingle();

    if (videoError) {
      logger.error("Error querying videos table", {
        error: videoError,
        mediaId,
      });
    }

    console.log("Video data", videoData);

    if (videoData) {
      return {
        id: videoData.id,
        type: "video",
        url: videoData.url,
        projectId: videoData.project_id,
        creatorId: videoData.creator_id,
        metadata: {
          title: videoData.title,
          description: videoData.description,
          vimeo_id: videoData.vimeo_id,
          youtube_id: videoData.youtube_id,
          order: videoData.order,
          project_title: videoData.projects?.title,
        },
        created_at: videoData.created_at,
      };
    }

    return null;
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: string,
    mediaType: "image" | "video",
    metadata: Record<string, any>,
    userId: string
  ): Promise<MediaResponse | null> {
    // Determine table based on media type
    const tableName = mediaType === "image" ? "images" : "videos";

    // First check if the user has permission to update this media
    // by verifying they're the creator or admin
    const { data: media, error: mediaError } = await supabase
      .from(tableName)
      .select(
        `
        *,
        projects!inner(
          id,
          creator_id
        ),
        creators!inner(
          id,
          profile_id
        )
      `
      )
      .eq("id", mediaId)
      .single();

    if (mediaError || !media) {
      logger.error("Media not found", { error: mediaError });
      return null;
    }

    // Check if user is the creator
    if (media.creators.profile_id !== userId) {
      logger.warn("Unauthorized media update attempt", {
        mediaId,
        userId,
        ownerId: media.creators.profile_id,
      });
      throw new Error(
        "Unauthorized: You don't have permission to update this media"
      );
    }

    // Prepare update data based on media type
    const updateData: Record<string, any> = {};

    if (mediaType === "image") {
      if (metadata.alt_text !== undefined)
        updateData.alt_text = metadata.alt_text;
      if (metadata.order !== undefined) updateData.order = metadata.order;
      if (metadata.resolutions !== undefined)
        updateData.resolutions = metadata.resolutions;
    } else {
      if (metadata.title !== undefined) updateData.title = metadata.title;
      if (metadata.description !== undefined)
        updateData.description = metadata.description;
      if (metadata.vimeo_id !== undefined)
        updateData.vimeo_id = metadata.vimeo_id;
      if (metadata.youtube_id !== undefined)
        updateData.youtube_id = metadata.youtube_id;
      if (metadata.order !== undefined) updateData.order = metadata.order;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the record
    const { data: updatedMedia, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", mediaId)
      .select()
      .single();

    if (updateError) {
      logger.error("Media update error", { error: updateError });
      throw updateError;
    }

    // Return updated media details
    return this.getMediaDetails(mediaId);
  }

  /**
   * Delete media by ID
   */
  async deleteMedia(mediaId: string, userId: string): Promise<boolean> {
    // First try to find the media in either table to determine its type
    const mediaDetails = await this.getMediaDetails(mediaId);

    if (!mediaDetails) {
      logger.warn("Media not found for deletion", { mediaId });
      return false;
    }

    // Check ownership via creator profile
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("profile_id, username")
      .eq("id", mediaDetails.creatorId)
      .single();

    if (creatorError || !creator) {
      logger.error("Creator not found for media", {
        mediaId,
        creatorId: mediaDetails.creatorId,
      });
      return false;
    }

    // Check if user is the creator
    if (creator.profile_id !== userId) {
      logger.warn("Unauthorized media deletion attempt", {
        mediaId,
        userId,
        ownerId: creator.profile_id,
      });
      return false;
    }

    // Extract the file path from the URL
    const url = new URL(mediaDetails.url);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts.slice(pathParts.indexOf("media") + 1).join("/");

    // Delete the media file from storage
    const { error: storageError } = await supabase.storage
      .from("media")
      .remove([filePath]);

    if (storageError) {
      logger.error("Error deleting media file from storage", {
        error: storageError,
      });
      // Continue anyway to try to delete the database record
    }

    // Check for thumbnail in metadata for images
    if (
      mediaDetails.type === "image" &&
      mediaDetails.metadata.resolutions?.thumbnail
    ) {
      try {
        const thumbUrl = new URL(mediaDetails.metadata.resolutions.thumbnail);
        const thumbPathParts = thumbUrl.pathname.split("/");
        const thumbFilePath = thumbPathParts
          .slice(thumbPathParts.indexOf("media") + 1)
          .join("/");

        await supabase.storage.from("media").remove([thumbFilePath]);
      } catch (err) {
        logger.warn("Error deleting thumbnail", { error: err });
        // Continue anyway
      }
    }

    // Delete the database record
    const tableName = mediaDetails.type === "image" ? "images" : "videos";
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      logger.error("Error deleting media record", { error: deleteError });
      return false;
    }

    return true;
  }

  /**
   * Batch import media from URLs
   */
  async batchImportUrlMedia(
    urlItems: Array<{ url: string; metadata?: Record<string, any> }>,
    options: UploadOptions
  ): Promise<{ results: MediaResponse[]; errors: any[] }> {
    const results: MediaResponse[] = [];
    const errors: any[] = [];

    // Process each URL sequentially
    for (const item of urlItems) {
      try {
        // Apply item-specific metadata to options
        const urlOptions = {
          ...options,
          metadata: {
            ...options.metadata,
            ...(item.metadata || {}),
          },
        };

        const result = await this.uploadMediaFromUrl(item.url, urlOptions);
        results.push(result);
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        let errorStack = "";

        if (error instanceof Error) {
          errorMessage = error.message;
          errorStack = error.stack || "";
        } else if (typeof error === "object" && error !== null) {
          if (
            "message" in error &&
            typeof (error as any).message === "string"
          ) {
            errorMessage = (error as any).message;
          }

          if (
            "details" in error &&
            typeof (error as any).details === "string"
          ) {
            errorMessage += ` - ${(error as any).details}`;
          } else if (
            "details" in error &&
            typeof (error as any).details === "object"
          ) {
            errorMessage += ` - ${JSON.stringify((error as any).details)}`;
          }

          if ("code" in error && typeof (error as any).code === "string") {
            errorMessage += ` (code: ${(error as any).code})`;
          }
        }

        const errorDetails = {
          url: item.url || "unknown",
          error: errorMessage,
          stack: errorStack,
        };

        logger.error("Failed to import URL in batch", errorDetails);
        errors.push(errorDetails);
      }
    }

    // If all imports failed, throw an error with details
    if (results.length === 0 && errors.length > 0) {
      const errorMessage = `All URL imports failed: ${JSON.stringify(errors)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // If some imports failed, log the errors
    if (errors.length > 0) {
      logger.warn("Some URL imports failed", { errors });
    }

    // Return both results and errors to allow API to show partial success
    return { results, errors };
  }

  /**
   * Upload a profile image (avatar or banner)
   */
  async uploadProfileImage(
    file: UploadedFile,
    userId: string,
    creatorId: string,
    type: "avatar" | "banner"
  ): Promise<{ url: string }> {
    try {
      // Generate a unique filename with appropriate prefix
      const fileExtension = path.extname(file.name).toLowerCase();
      const fileName = `${type}-${uuidv4()}${fileExtension}`;

      // Create path structure: userId/profile/filename
      const filePath = `${userId}/profile/${fileName}`;

      // Get file data to upload
      let fileData;

      // Prefer using tempFilePath if it exists and has content
      if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
        const stats = fs.statSync(file.tempFilePath);
        if (stats.size > 0) {
          fileData = fs.readFileSync(file.tempFilePath);
        } else if (file.data && file.data.length > 0) {
          fileData = file.data;
        } else {
          throw new Error(
            "Cannot access file data - both tempFilePath and data are empty"
          );
        }
      } else if (file.data && file.data.length > 0) {
        fileData = file.data;
      } else {
        throw new Error("Cannot access file data - no valid source available");
      }

      if (!fileData || (Buffer.isBuffer(fileData) && fileData.length === 0)) {
        throw new Error("File data is empty");
      }

      const { data: storageData, error: storageError } = await supabase.storage
        .from("media")
        .upload(filePath, fileData, {
          contentType: file.mimetype,
          cacheControl: "3600",
        });

      if (storageError) {
        logger.error("Storage upload error", { error: storageError });
        throw storageError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (error) {
      logger.error(`Profile ${type} upload failed`, { error });
      throw error;
    }
  }
}
