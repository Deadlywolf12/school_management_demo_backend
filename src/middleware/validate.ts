import { ZodSchema, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: err.issues.map((issue) => issue.message),
        });
      }
      return res.status(400).json({
        success: false,
        errors: [err.message || "Invalid request body"],
      });
    }
  };
