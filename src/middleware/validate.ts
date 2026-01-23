import { ZodSchema, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";


export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as {
        body?: any;
        params?: any;
        query?: any;
      };

      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;

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
        errors: [err.message || "Invalid request"],
      });
    }
  };

// Role-based access control middleware
// Assumes req.user is set by authentication middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - req.user is added by auth middleware
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

// Specific middleware for attendance marking
// Teachers can only mark student attendance, admins can mark all
export const authorizeAttendanceMarking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userRole = req.user?.role;
  const targetRole = req.body.role;

  if (!userRole) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Admin can mark attendance for anyone
  if (userRole === "admin") {
    return next();
  }

  // Teachers can only mark student attendance
  if (userRole === "teacher" && targetRole === "student") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `${userRole}s can only mark attendance for students`,
  });
};

// Specific middleware for bulk attendance marking
export const authorizeBulkAttendanceMarking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userRole = req.user?.role;
  const attendanceList = req.body.attendanceList;

  if (!userRole) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  // Admin can mark attendance for anyone
  if (userRole === "admin") {
    return next();
  }

  // Teachers can only mark student attendance
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

  return res.status(403).json({
    success: false,
    message: "You are not authorized to mark attendance",
  });
};