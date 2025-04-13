import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

// Validation for creating/updating organizations
export const validateOrganization = [
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("logo_url").optional().isURL().withMessage("Must be a valid URL"),
  body("website").optional().isURL().withMessage("Must be a valid URL"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid organization data",
          details: errors.array(),
        },
      });
    }
    next();
  },
];
