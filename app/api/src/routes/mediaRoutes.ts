import express from "express";
import * as mediaController from "../controllers/mediaController";
import { extractUser } from "../middleware/extractUser";
import { cacheClearMiddleware } from "../lib/cache";
import * as mediaValidation from "../middleware/mediaValidation";
import fileUpload from "express-fileupload";

const router = express.Router();

// Extract user middleware for all routes
router.use(extractUser);

// Configure file upload middleware (only applied to specific routes)
const uploadMiddleware = fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: "/tmp/",
  debug: process.env.NODE_ENV === "development",
  abortOnLimit: true, // Abort the request if file size limit is reached
  parseNested: true, // Parse nested fields in form data
  createParentPath: true, // Create parent path if it doesn't exist
  safeFileNames: true, // Remove special characters from file names
  preserveExtension: true, // Preserve the file extension
  uploadTimeout: 60000, // 60 seconds timeout for upload
});

/**
 * PUBLIC ROUTES
 * These routes are accessible without authentication but the user info
 * is still extracted if available via the extractUser middleware
 */

// Get media details (image or video)
// GET /api/media/:id
router.get("/:id", mediaController.getMediaDetails);

/**
 * PROTECTED ROUTES
 * These routes require authentication
 */

// Update media metadata
// PUT /api/media/:id/metadata
router.put(
  "/:id/metadata",
  mediaValidation.validateMediaMetadataUpdate,
  cacheClearMiddleware([`creator_username_`, `project_`, `media_`]),
  mediaController.updateMediaMetadata
);

// Delete media
// DELETE /api/media/:id
router.delete(
  "/:id",
  cacheClearMiddleware([`creator_username_`, `project_`, `media_`]),
  mediaController.deleteMedia
);

// Upload new media
// POST /api/media/upload
router.post(
  "/upload",
  uploadMiddleware,
  mediaValidation.validateMediaUploadRequest,
  cacheClearMiddleware([`creator_username_`, `project_`]),
  mediaController.uploadMedia
);

// Batch upload media
// POST /api/media/batch-upload
router.post(
  "/batch-upload",
  uploadMiddleware,
  mediaValidation.validateMediaUploadRequest,
  cacheClearMiddleware([`creator_username_`, `project_`]),
  mediaController.batchUploadMedia
);

// Upload video link (YouTube or Vimeo)
// POST /api/media/upload-video-link
router.post(
  "/upload-video-link",
  mediaValidation.validateVideoLinkUpload,
  cacheClearMiddleware([`creator_username_`, `project_`]),
  mediaController.uploadVideoLink
);

export default router;
