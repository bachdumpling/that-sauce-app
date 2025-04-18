import fileUpload from "express-fileupload";

// Configure file upload middleware (only applied to specific routes)
export const uploadMiddleware = fileUpload({
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
