import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("googleId").optional(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
