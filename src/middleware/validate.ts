// src/middleware/validate.ts
import { ZodObject, ZodRawShape } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); 
      next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        errors: err.errors.map((e: any) => e.message),
      });
    }
  };
