import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";
import logger from "../config/logger";
import { MediaService } from "../services/mediaService";
import { supabase } from "../lib/supabase";
import { AuthenticatedRequest } from "../middleware/extractUser";

const mediaService = new MediaService();

/**
 * Extract YouTube video ID from a YouTube URL
 */
function extractYouTubeId(url: string): string | null {
  // Handle various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Extract Vimeo video ID from a Vimeo URL
 */
function extractVimeoId(url: string): string | null {
  // Handle various Vimeo URL formats
  const regExp =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export const getMediaDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Media ID is required");
    }

    const mediaDetails = await mediaService.getMediaDetails(id);

    if (!mediaDetails) {
      return sendError(res, ErrorCode.NOT_FOUND, "Media not found");
    }

    return sendSuccess(res, { media: mediaDetails });
  } catch (error) {
    logger.error("Error getting media details", { error });
    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      "Error retrieving media details"
    );
  }
};

export const updateMediaMetadata = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { media_type, ...metadata } = req.body;
    const user = req.user;

    if (!id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Media ID is required");
    }

    if (!media_type || !["image", "video"].includes(media_type)) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Valid media type (image/video) is required"
      );
    }

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const updatedMedia = await mediaService.updateMediaMetadata(
      id,
      media_type as "image" | "video",
      metadata,
      user.id
    );

    if (!updatedMedia) {
      return sendError(
        res,
        ErrorCode.NOT_FOUND,
        "Media not found or update failed"
      );
    }

    return sendSuccess(res, {
      media: updatedMedia,
      message: "Media metadata updated successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return sendError(res, ErrorCode.FORBIDDEN, error.message);
    }

    logger.error("Error updating media metadata", { error });
    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      "Error updating media metadata"
    );
  }
};

export const deleteMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Media ID is required");
    }

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const deleted = await mediaService.deleteMedia(id, user.id);

    if (!deleted) {
      return sendError(
        res,
        ErrorCode.FORBIDDEN,
        "Media not found or you don't have permission to delete it"
      );
    }

    return sendSuccess(res, {
      message: "Media deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting media", { error });
    return sendError(res, ErrorCode.SERVER_ERROR, "Error deleting media");
  }
};

export const uploadMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { project_id, alt_text, title, description, order } = req.body;
    const user = req.user;

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    if (!project_id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Project ID is required");
    }

    // Check if project exists and get creator information
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return sendError(res, ErrorCode.NOT_FOUND, "Project not found");
    }

    // Verify user is the project creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("id", project.creator_id)
      .single();

    if (creatorError || !creator) {
      return sendError(res, ErrorCode.NOT_FOUND, "Creator not found");
    }

    if (creator.profile_id !== user.id) {
      return sendError(
        res,
        ErrorCode.FORBIDDEN,
        "You don't have permission to upload media to this project"
      );
    }

    // Check if file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return sendError(res, ErrorCode.BAD_REQUEST, "No file uploaded");
    }

    logger.debug("Files received", {
      filesObj: req.files,
      fileKeys: Object.keys(req.files),
      hasFile: !!req.files.file,
    });

    // Handle the file object
    let file: UploadedFile;
    if (req.files.file) {
      if (Array.isArray(req.files.file)) {
        // If multiple files were sent under 'file', use the first one
        file = req.files.file[0];
        logger.warn("Multiple files sent under 'file' field, using first one", {
          count: req.files.file.length,
        });
      } else {
        file = req.files.file as UploadedFile;
      }
    } else {
      // If the file isn't in the 'file' field, check if there's any file
      const firstFileKey = Object.keys(req.files)[0];
      if (firstFileKey) {
        const firstFile = req.files[firstFileKey];
        if (Array.isArray(firstFile)) {
          file = firstFile[0];
        } else {
          file = firstFile as UploadedFile;
        }
        logger.warn(`File found in '${firstFileKey}' field instead of 'file'`);
      } else {
        return sendError(
          res,
          ErrorCode.BAD_REQUEST,
          "No file field found in upload"
        );
      }
    }

    // Prepare metadata
    const metadata = {
      alt_text,
      title,
      description,
      order: order ? parseInt(order) : undefined,
      // Add empty categories array for videos
      categories: [],
    };

    // Log detailed file info for debugging
    logger.debug("Processing file upload", {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      hasData: !!file.data,
      hasTempPath: !!file.tempFilePath,
      tempFileExists: file.tempFilePath
        ? require("fs").existsSync(file.tempFilePath)
        : false,
      tempFileSize:
        file.tempFilePath && require("fs").existsSync(file.tempFilePath)
          ? require("fs").statSync(file.tempFilePath).size
          : "N/A",
      md5: file.md5,
      truncData: file.data
        ? `First 20 bytes: ${file.data.slice(0, 20).toString("hex")}`
        : "N/A",
    });

    try {
      const result = await mediaService.uploadMedia(file, {
        userId: user.id,
        projectId: project_id,
        creatorId: creator.id,
        metadata,
      });

      return sendSuccess(
        res,
        {
          media: result,
          message: "Media uploaded successfully",
        },
        undefined,
        201
      );
    } catch (uploadError) {
      logger.error("Media service upload error", {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
        stack:
          uploadError instanceof Error ? uploadError.stack : "No stack trace",
      });

      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        uploadError instanceof Error
          ? `Error uploading media: ${uploadError.message}`
          : "Error uploading media"
      );
    }
  } catch (error) {
    logger.error("Error in upload media controller", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      error instanceof Error
        ? `Error uploading media: ${error.message}`
        : "Error uploading media"
    );
  }
};

export const batchUploadMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { project_id } = req.body;
    const user = req.user;

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    if (!project_id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Project ID is required");
    }

    // Check if project exists and get creator information
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return sendError(res, ErrorCode.NOT_FOUND, "Project not found");
    }

    // Verify user is the project creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("id", project.creator_id)
      .single();

    if (creatorError || !creator) {
      return sendError(res, ErrorCode.NOT_FOUND, "Creator not found");
    }

    if (creator.profile_id !== user.id) {
      return sendError(
        res,
        ErrorCode.FORBIDDEN,
        "You don't have permission to upload media to this project"
      );
    }

    // Initialize media array
    let files: UploadedFile[] = [];

    // Check if files were uploaded
    if (req.files && Object.keys(req.files).length > 0) {
      logger.debug("Files received for batch upload", {
        fileKeys: Object.keys(req.files),
        hasFilesField: !!req.files.files,
        totalFields: Object.keys(req.files).length,
        fieldSizes: Object.entries(req.files).reduce(
          (acc, [key, value]) => {
            if (Array.isArray(value)) {
              acc[key] = `${value.length} files`;
            } else {
              acc[key] = "1 file";
            }
            return acc;
          },
          {} as Record<string, string>
        ),
      });

      // Get files array, check various possible fields
      // First, check for expected field name 'files'
      if (req.files.files) {
        if (Array.isArray(req.files.files)) {
          files = req.files.files;
        } else {
          files = [req.files.files as UploadedFile];
        }
      }

      // If files not found in 'files' field, check any other field
      if (files.length === 0) {
        for (const key of Object.keys(req.files)) {
          const fileField = req.files[key];
          if (Array.isArray(fileField)) {
            files = fileField;
            logger.warn(
              `Using ${key} as files array with ${files.length} files`
            );
            break;
          } else if (fileField) {
            files = [fileField as UploadedFile];
            logger.warn(`Using ${key} as single file`);
            break;
          }
        }
      }

      logger.debug(`Found ${files.length} files to upload`);

      // Log detailed info about the first few files for debugging
      if (files.length > 0) {
        const fileSamples = files.slice(0, 3).map((file) => ({
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
          hasData: !!file.data,
          hasTempPath: !!file.tempFilePath,
          tempFileExists: file.tempFilePath
            ? require("fs").existsSync(file.tempFilePath)
            : false,
          tempFileSize:
            file.tempFilePath && require("fs").existsSync(file.tempFilePath)
              ? require("fs").statSync(file.tempFilePath).size
              : "N/A",
        }));

        logger.debug("File samples for first 3 files:", { fileSamples });
      }
    }

    // If no files, return error
    if (files.length === 0) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "No files found in the request"
      );
    }

    try {
      const { results, errors } = await mediaService.batchUploadMedia(files, {
        userId: user.id,
        projectId: project_id,
        creatorId: creator.id,
        metadata: {
          // Include default empty categories array for videos
          categories: [],
        },
      });

      // Create a response that includes both successes and errors
      return sendSuccess(
        res,
        {
          media: results,
          total: results.length,
          errors: errors.length > 0 ? errors : undefined,
          message:
            errors.length > 0
              ? `Uploaded ${results.length} media items with ${errors.length} failures`
              : `Successfully uploaded ${results.length} media items`,
        },
        undefined,
        errors.length > 0 ? 207 : 201 // Use 207 Multi-Status for partial success
      );
    } catch (uploadError) {
      logger.error("Media service batch upload error", {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
      });

      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        uploadError instanceof Error
          ? uploadError.message
          : "Error batch uploading media"
      );
    }
  } catch (error) {
    logger.error("Error in batch upload media controller", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      error instanceof Error ? error.message : "Error batch uploading media"
    );
  }
};

export const uploadVideoLink = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { project_id, video_url, title, description } = req.body;
    const user = req.user;

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    if (!project_id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Project ID is required");
    }

    if (!video_url) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Video URL is required");
    }

    // Check if project exists and get creator information
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return sendError(res, ErrorCode.NOT_FOUND, "Project not found");
    }

    // Verify user is the project creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("id", project.creator_id)
      .single();

    if (creatorError || !creator) {
      return sendError(res, ErrorCode.NOT_FOUND, "Creator not found");
    }

    if (creator.profile_id !== user.id) {
      return sendError(
        res,
        ErrorCode.FORBIDDEN,
        "You don't have permission to upload media to this project"
      );
    }

    // Extract video IDs from the URL
    let youtubeId = null;
    let vimeoId = null;

    if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
      youtubeId = extractYouTubeId(video_url);
      if (!youtubeId) {
        return sendError(res, ErrorCode.BAD_REQUEST, "Invalid YouTube URL");
      }
      logger.debug(`Extracted YouTube ID: ${youtubeId} from ${video_url}`);
    } else if (video_url.includes("vimeo.com")) {
      vimeoId = extractVimeoId(video_url);
      if (!vimeoId) {
        return sendError(res, ErrorCode.BAD_REQUEST, "Invalid Vimeo URL");
      }
      logger.debug(`Extracted Vimeo ID: ${vimeoId} from ${video_url}`);
    } else {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "URL must be from YouTube or Vimeo"
      );
    }

    // Create a video record directly (no file upload needed)
    const videoRecord = {
      project_id: project_id,
      creator_id: creator.id,
      url: video_url,
      title: title || "Video from " + (youtubeId ? "YouTube" : "Vimeo"),
      description: description || "",
      categories: [],
      youtube_id: youtubeId,
      vimeo_id: vimeoId,
    };

    logger.debug("Creating video record from link", videoRecord);

    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert([videoRecord])
      .select()
      .single();

    if (videoError) {
      logger.error("Video record creation error", {
        error: videoError,
        details: videoError.details,
        message: videoError.message,
        hint: videoError.hint,
        code: videoError.code,
      });

      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        `Error creating video record: ${videoError.message}`
      );
    }

    // Format the response
    const response = {
      id: videoData.id,
      type: "video",
      url: videoData.url,
      projectId: videoData.project_id,
      creatorId: videoData.creator_id,
      metadata: {
        title: videoData.title,
        description: videoData.description,
        youtube_id: videoData.youtube_id,
        vimeo_id: videoData.vimeo_id,
      },
      created_at: videoData.created_at,
    };

    return sendSuccess(
      res,
      {
        media: response,
        message: "Video link added successfully",
      },
      undefined,
      201
    );
  } catch (error) {
    logger.error("Error adding video link", { error });
    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      error instanceof Error ? error.message : "Error adding video link"
    );
  }
};

export const importUrlMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { project_id, urls } = req.body;
    const user = req.user;

    logger.debug("URL import request received", {
      projectId: project_id,
      urlCount: Array.isArray(urls) ? urls.length : "not an array",
      body: req.body,
    });

    if (!user || !user.id) {
      return sendError(res, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    if (!project_id) {
      return sendError(res, ErrorCode.BAD_REQUEST, "Project ID is required");
    }

    // Validate URLs
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "URLs array is required and must not be empty"
      );
    }

    // Check if project exists and get creator information
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return sendError(res, ErrorCode.NOT_FOUND, "Project not found");
    }

    // Verify user is the project creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("id", project.creator_id)
      .single();

    if (creatorError || !creator) {
      return sendError(res, ErrorCode.NOT_FOUND, "Creator not found");
    }

    if (creator.profile_id !== user.id) {
      return sendError(
        res,
        ErrorCode.FORBIDDEN,
        "You don't have permission to upload media to this project"
      );
    }

    // Transform URLs to the format expected by mediaService.batchImportUrlMedia
    const urlItems = urls
      .map((url) => {
        // Check if url is a string or an object with url property
        if (typeof url === "string") {
          return { url };
        } else if (typeof url === "object" && url !== null && "url" in url) {
          return url;
        }
        return null;
      })
      .filter(Boolean) as { url: string; metadata?: Record<string, any> }[];

    logger.debug(`Processing ${urlItems.length} URL items for import`, {
      firstItem: urlItems.length > 0 ? urlItems[0] : null,
    });

    try {
      const { results, errors } = await mediaService.batchImportUrlMedia(
        urlItems,
        {
          userId: user.id,
          projectId: project_id,
          creatorId: creator.id,
          metadata: {
            // Include default empty categories array for videos
            categories: [],
          },
        }
      );

      // Create a response that includes both successes and errors
      return sendSuccess(
        res,
        {
          media: results,
          total: results.length,
          errors: errors.length > 0 ? errors : undefined,
          message:
            errors.length > 0
              ? `Imported ${results.length} media items with ${errors.length} failures`
              : `Successfully imported ${results.length} media items`,
        },
        undefined,
        errors.length > 0 ? 207 : 201 // Use 207 Multi-Status for partial success
      );
    } catch (uploadError) {
      logger.error("Media service URL import error", {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
      });

      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        uploadError instanceof Error
          ? uploadError.message
          : "Error importing media from URLs"
      );
    }
  } catch (error) {
    logger.error("Error in URL import controller", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return sendError(
      res,
      ErrorCode.SERVER_ERROR,
      error instanceof Error ? error.message : "Error importing media from URLs"
    );
  }
};
