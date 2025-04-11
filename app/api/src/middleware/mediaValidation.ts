import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { ErrorCode } from "../models/ApiResponse";
import { sendError } from "../utils/responseUtils";
import { UploadedFile } from "express-fileupload";
import { isUUID } from "../utils/validationUtils";

/**
 * Validation for media metadata updates
 * Handles validation for both image and video properties
 */
export const validateMediaMetadata = [
  param("id").isUUID().withMessage("Invalid media ID format"),
  body("type")
    .isIn(["image", "video"])
    .withMessage("Type must be 'image' or 'video'"),

  // Image-specific metadata
  body("alt_text")
    .optional()
    .isString()
    .withMessage("Alt text must be a string"),
  body("resolutions")
    .optional()
    .isObject()
    .withMessage("Resolutions must be an object"),

  // Video-specific metadata
  body("title").optional().isString().withMessage("Title must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("vimeo_id")
    .optional()
    .isString()
    .withMessage("Vimeo ID must be a string"),
  body("youtube_id")
    .optional()
    .isString()
    .withMessage("YouTube ID must be a string"),

  // Common metadata
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        ErrorCode.INVALID_PARAMETER,
        "Invalid media metadata",
        errors.array(),
        400
      );
    }
    next();
  },
];

/**
 * Validation for media uploads
 */
export const validateMediaUpload = [
  body("project_id")
    .isUUID()
    .withMessage("Project ID is required and must be a valid UUID"),
  body("media_type")
    .optional()
    .isIn(["image", "video"])
    .withMessage("Media type must be 'image' or 'video' if specified"),
  body("alt_text")
    .optional()
    .isString()
    .withMessage("Alt text must be a string"),
  body("title").optional().isString().withMessage("Title must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),

  (req: Request, res: Response, next: NextFunction) => {
    // Validate file is present
    if (!req.files || Object.keys(req.files).length === 0) {
      return sendError(
        res,
        ErrorCode.MISSING_REQUIRED_FIELD,
        "No files were uploaded",
        null,
        400
      );
    }

    // Get the file (could be single file or array)
    const file = req.files.file;

    // For single file upload, ensure it's not an array
    if (Array.isArray(file) && req.path !== "/batch-upload") {
      return sendError(
        res,
        ErrorCode.INVALID_PARAMETER,
        "Multiple files not allowed for single upload",
        null,
        400
      );
    }

    // Validate file types
    if (!Array.isArray(file)) {
      // Single file validation
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];

      if (!validTypes.includes(file.mimetype)) {
        return sendError(
          res,
          ErrorCode.INVALID_PARAMETER,
          "Invalid file type. Supported types: JPEG, PNG, GIF, WebP, MP4, QuickTime, AVI, WebM",
          null,
          400
        );
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        ErrorCode.INVALID_PARAMETER,
        "Invalid upload parameters",
        errors.array(),
        400
      );
    }

    next();
  },
];

/**
 * Validate media metadata update request
 */
export const validateMediaMetadataUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    media_type,
    alt_text,
    title,
    description,
    order,
    vimeo_id,
    youtube_id,
    resolutions,
  } = req.body;

  // Validate UUID
  if (!id || !isUUID(id)) {
    return sendError(res, ErrorCode.BAD_REQUEST, "Invalid media ID format");
  }

  // Validate media type
  if (!media_type || !["image", "video"].includes(media_type)) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Valid media type (image/video) is required"
    );
  }

  // Validate fields based on media type
  if (media_type === "image") {
    // Image-specific validations
    if (alt_text && typeof alt_text !== "string") {
      return sendError(res, ErrorCode.BAD_REQUEST, "Alt text must be a string");
    }

    if (resolutions && typeof resolutions !== "object") {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Resolutions must be an object"
      );
    }
  } else {
    // Video-specific validations
    if (title && typeof title !== "string") {
      return sendError(res, ErrorCode.BAD_REQUEST, "Title must be a string");
    }

    if (description && typeof description !== "string") {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Description must be a string"
      );
    }

    if (vimeo_id && typeof vimeo_id !== "string") {
      return sendError(res, ErrorCode.BAD_REQUEST, "Vimeo ID must be a string");
    }

    if (youtube_id && typeof youtube_id !== "string") {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "YouTube ID must be a string"
      );
    }
  }

  // Common validations
  if (order !== undefined) {
    const orderNum = Number(order);
    if (isNaN(orderNum) || orderNum < 0) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Order must be a non-negative number"
      );
    }
  }

  next();
};

/**
 * Validate media upload request
 */
export const validateMediaUploadRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { project_id, media_type, alt_text, title, description, order } =
    req.body;

  // Validate project ID
  if (!project_id || !isUUID(project_id)) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Valid project ID is required"
    );
  }

  // Optional validations
  if (media_type && !["image", "video"].includes(media_type)) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Media type must be either 'image' or 'video'"
    );
  }

  if (alt_text && typeof alt_text !== "string") {
    return sendError(res, ErrorCode.BAD_REQUEST, "Alt text must be a string");
  }

  if (title && typeof title !== "string") {
    return sendError(res, ErrorCode.BAD_REQUEST, "Title must be a string");
  }

  if (description && typeof description !== "string") {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Description must be a string"
    );
  }

  if (order !== undefined) {
    const orderNum = Number(order);
    if (isNaN(orderNum) || orderNum < 0) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Order must be a non-negative number"
      );
    }
  }

  // Check files
  if (!req.files || Object.keys(req.files).length === 0) {
    return sendError(res, ErrorCode.BAD_REQUEST, "No files were uploaded");
  }

  // Handle single file upload vs batch upload
  const isBatchUpload = req.path.includes("/batch-upload");

  if (!isBatchUpload) {
    // For single file upload, try to find a valid file
    let foundFile = false;

    // First check the expected 'file' field
    if (req.files.file) {
      foundFile = true;

      // Make sure file is not an array in non-batch upload
      if (Array.isArray(req.files.file)) {
        if (req.files.file.length > 1) {
          return sendError(
            res,
            ErrorCode.BAD_REQUEST,
            "Multiple files detected. Use /batch-upload for multiple files"
          );
        }
        // Validate the first file
        validateFileType(req.files.file[0], res, next);
        return;
      }

      // Validate single file
      validateFileType(req.files.file as UploadedFile, res, next);
      return;
    }

    // If 'file' field not found, check any other field that might contain a file
    for (const key of Object.keys(req.files)) {
      const fileField = req.files[key];
      if (Array.isArray(fileField)) {
        if (fileField.length > 0) {
          foundFile = true;
          if (fileField.length > 1) {
            return sendError(
              res,
              ErrorCode.BAD_REQUEST,
              `Multiple files detected in '${key}'. Use /batch-upload for multiple files`
            );
          }
          // Validate the first file
          validateFileType(fileField[0], res, next);
          return;
        }
      } else if (fileField) {
        foundFile = true;
        // Validate single file
        validateFileType(fileField as UploadedFile, res, next);
        return;
      }
    }

    if (!foundFile) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "No valid file found in the upload"
      );
    }
  } else {
    // For batch upload, check various fields for files
    let files: UploadedFile[] = [];

    // First check expected 'files' field
    if (req.files.files) {
      if (Array.isArray(req.files.files)) {
        files = req.files.files;
      } else {
        files = [req.files.files as UploadedFile];
      }
    }

    // If no files found in 'files' field, check any other field
    if (files.length === 0) {
      for (const key of Object.keys(req.files)) {
        const fileField = req.files[key];
        if (Array.isArray(fileField) && fileField.length > 0) {
          files = fileField;
          break;
        } else if (fileField) {
          files = [fileField as UploadedFile];
          break;
        }
      }
    }

    if (files.length === 0) {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "No valid files found for batch upload"
      );
    }

    // Validate each file type
    for (const file of files) {
      const validationResult = validateFileTypeWithoutResponse(file);
      if (!validationResult.valid) {
        return sendError(
          res,
          ErrorCode.BAD_REQUEST,
          `Invalid file type for ${file.name}: ${validationResult.message}`
        );
      }
    }

    next();
  }
};

/**
 * Validate file type without sending HTTP response
 */
function validateFileTypeWithoutResponse(file: UploadedFile) {
  // List of valid MIME types
  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const validVideoTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/webm",
  ];

  const validTypes = [...validImageTypes, ...validVideoTypes];

  if (!validTypes.includes(file.mimetype)) {
    return {
      valid: false,
      message: `Unsupported file type: ${file.mimetype}. Supported types: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM`,
    };
  }

  return { valid: true, message: "" };
}

/**
 * Validate file type and send HTTP response if invalid
 */
function validateFileType(
  file: UploadedFile,
  res: Response,
  next: NextFunction
) {
  const validationResult = validateFileTypeWithoutResponse(file);

  if (!validationResult.valid) {
    return sendError(res, ErrorCode.BAD_REQUEST, validationResult.message);
  }

  next();
}

/**
 * Validate video link upload request
 */
export const validateVideoLinkUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { project_id, video_url, title, description } = req.body;

  // Validate project ID
  if (!project_id || !isUUID(project_id)) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Valid project ID is required"
    );
  }

  // Validate video URL
  if (!video_url || typeof video_url !== "string") {
    return sendError(res, ErrorCode.BAD_REQUEST, "Valid video URL is required");
  }

  // Check if URL is from YouTube or Vimeo
  const isYouTube =
    video_url.includes("youtube.com") || video_url.includes("youtu.be");
  const isVimeo = video_url.includes("vimeo.com");

  if (!isYouTube && !isVimeo) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "URL must be from YouTube or Vimeo"
    );
  }

  // Optional field validations
  if (title && typeof title !== "string") {
    return sendError(res, ErrorCode.BAD_REQUEST, "Title must be a string");
  }

  if (description && typeof description !== "string") {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Description must be a string"
    );
  }

  next();
};

/**
 * Validate URL import request
 */
export const validateUrlImportRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { project_id, urls } = req.body;

  // Validate project ID
  if (!project_id || !isUUID(project_id)) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "Valid project ID is required"
    );
  }

  // Validate URLs array
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return sendError(
      res,
      ErrorCode.BAD_REQUEST,
      "URLs array is required and must not be empty"
    );
  }

  // Validate each URL item
  for (const item of urls) {
    if (typeof item === "string") {
      // If it's a simple string URL, no additional validation needed
      continue;
    } else if (typeof item === "object" && item !== null) {
      // If it's an object, it must have a url property
      if (!item.url || typeof item.url !== "string") {
        return sendError(
          res,
          ErrorCode.BAD_REQUEST,
          "Each URL item must be a string or an object with a url string property"
        );
      }
    } else {
      return sendError(
        res,
        ErrorCode.BAD_REQUEST,
        "Each URL item must be a string or an object with a url property"
      );
    }
  }

  next();
};
