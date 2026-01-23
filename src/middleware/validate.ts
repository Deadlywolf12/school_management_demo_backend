import { ZodObject, ZodRawShape, ZodError, z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * General validation middleware using Zod.
 * Dynamically validates body, params, and query based on schema keys.
 */
export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const toValidate: {
        body?: any;
        params?: any;
        query?: any;
      } = {};

      // Check if schema has body, params, or query keys
      const schemaKeys = Object.keys(schema.shape);

      // Collect data to validate
      if (schemaKeys.includes("body")) {
        toValidate.body = req.body;
      }
      if (schemaKeys.includes("params")) {
        toValidate.params = req.params;
      }
      if (schemaKeys.includes("query")) {
        toValidate.query = req.query;
      }

      // Validate all at once
      const validated = schema.parse(toValidate) as any;

      // Assign validated data back to request
      if (validated.body !== undefined) {
        req.body = validated.body;
      }
      
      if (validated.params !== undefined) {
        // For params, we need to merge the validated data
        Object.keys(validated.params).forEach((key) => {
          (req.params as any)[key] = validated.params[key];
        });
      }
      
      if (validated.query !== undefined) {
        // For query, we need to merge the validated data
        Object.keys(validated.query).forEach((key) => {
          (req.query as any)[key] = validated.query[key];
        });
      }

      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: err.issues.map((issue) => {
            const path = issue.path.join(".");
            return `${path}: ${issue.message}`;
          }),
        });
      }
      return res.status(400).json({
        success: false,
        errors: [err.message || "Invalid request"],
      });
    }
  };

/**
 * Alternative: Validate specific parts of the request
 * This is more flexible and doesn't require wrapping in body/params/query
 */
export const validateRequest = (schemas: {
  body?: ZodObject<ZodRawShape> | z.ZodTypeAny;
  params?: ZodObject<ZodRawShape> | z.ZodTypeAny;
  query?: ZodObject<ZodRawShape> | z.ZodTypeAny;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
      }

      // Validate params if schema provided
      if (schemas.params) {
        const validated = schemas.params.parse(req.params ?? {}) as any;
        // Merge validated params back
        Object.keys(validated).forEach((key) => {
          (req.params as any)[key] = validated[key];
        });
      }

      // Validate query if schema provided
      if (schemas.query) {
        const validated = schemas.query.parse(req.query ?? {}) as any;
        // Merge validated query back
        Object.keys(validated).forEach((key) => {
          (req.query as any)[key] = validated[key];
        });
      }

      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: err.issues.map((issue) => {
            const path = issue.path.join(".");
            return `${path}: ${issue.message}`;
          }),
        });
      }
      return res.status(400).json({
        success: false,
        errors: [err.message || "Invalid request"],
      });
    }
  };
};

/**
 * General role-based access control middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No role found",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - ${userRole}s are not allowed to perform this action`,
      });
    }

    next();
  };
};

/**
 * Middleware for single attendance marking
 */
export const authorizeAttendanceMarking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userRole = req.user?.role;
  const targetRole = req.body.role;

  if (!userRole) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (userRole === "admin") return next();
  if (userRole === "teacher" && targetRole === "student") return next();

  return res.status(403).json({
    success: false,
    message: `${userRole}s can only mark attendance for students`,
  });
};

/**
 * Middleware for bulk attendance marking
 */
export const authorizeBulkAttendanceMarking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userRole = req.user?.role;
  const attendanceList = req.body.attendanceList;

  if (!userRole) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!Array.isArray(attendanceList)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid attendance list" });
  }

  if (userRole === "admin") return next();

  if (userRole === "teacher") {
    const hasNonStudents = attendanceList.some(
      (entry: any) => entry.role !== "student"
    );
    if (hasNonStudents) {
      return res.status(403).json({
        success: false,
        message: "Teachers can only mark attendance for students",
      });
    }
    return next();
  }

  return res
    .status(403)
    .json({ success: false, message: "You are not authorized to mark attendance" });
};