import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// Validation for creating/updating projects
export const validateProject = [
  body("title")
    .if((value, { req }) => req.method === "POST") // Only required for POST
    .isString()
    .notEmpty()
    .withMessage("Title is required"),
  body("title")
    .if((value, { req }) => req.method === "PUT" && value !== undefined) // Optional for PUT
    .isString()
    .withMessage("Title must be a string"),
  body("description").optional().isString(),
  body("short_description")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("Short description must be less than 255 characters"),
  body("roles").optional().isArray().withMessage("Roles must be an array"),
  body("client_ids")
    .optional()
    .isArray()
    .withMessage("Client IDs must be an array"),
  body("client_ids.*")
    .optional()
    .isUUID()
    .withMessage("Each client ID must be a valid UUID"),
  body("year")
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body("behance_url").optional().isURL().withMessage("Must be a valid URL"),
  body("featured").optional().isBoolean(),
  body("thumbnail_url")
    .optional()
    .isURL()
    .withMessage("Thumbnail URL must be a valid URL"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid project data",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

// Validation for adding media to projects
export const validateMedia = [
  body("type")
    .isIn(["image", "video"])
    .withMessage("Type must be either 'image' or 'video'"),
  body("url").isURL().withMessage("Must be a valid URL"),
  body("alt_text")
    .if(body("type").equals("image"))
    .isString()
    .notEmpty()
    .withMessage("Alt text is required for images"),
  body("title")
    .if(body("type").equals("video"))
    .isString()
    .notEmpty()
    .withMessage("Title is required for videos"),
  body("vimeo_id").optional().isString(),
  body("youtube_id").optional().isString(),
  body("description").optional().isString(),
  body("order").optional().isInt({ min: 0 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid media data",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

// Validation for media deletion
export const validateMediaDelete = [
  query("type")
    .isIn(["image", "video"])
    .withMessage("Type query parameter must be either 'image' or 'video'"),
  param("mediaId").isUUID().withMessage("Invalid media ID format"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid request parameters",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

// Validation for media update
export const validateMediaUpdate = [
  param("mediaId").isUUID().withMessage("Invalid media ID format"),
  body("alt_text").optional().isString(),
  body("title").optional().isString(),
  body("description").optional().isString(),
  body("order").optional().isInt({ min: 0 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid media update data",
          details: errors.array(),
        },
      });
    }
    next();
  },
];
