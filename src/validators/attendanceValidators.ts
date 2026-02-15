// attendanceValidation.ts - UPDATED to handle markedBy properly

import { z } from "zod";

// Enums for validation
const RoleEnum = z.enum(["student", "teacher", "staff", "admin", "parent"]);
const StatusEnum = z.enum(["present", "absent", "late", "leave"]);

// Date validation (YYYY-MM-DD)
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional();

// DateTime validation (ISO 8601 format)
const dateTimeString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    "DateTime must be in ISO 8601 format (e.g., 2024-01-15T10:30:00.000Z)"
  )
  .optional();

// Helper for optional UUID that can be empty string
const optionalUUID = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(''))
  .transform(val => val === '' ? undefined : val);

// Mark attendance schema
export const markAttendanceSchema = z.object({
  body: z.object({
    userId: z.string().uuid("Invalid user ID format"),
    role: RoleEnum,
    status: StatusEnum,
    date: dateString,
    remarks: z.string().max(500).optional(),
    checkInTime: dateTimeString,
    checkOutTime: dateTimeString,
    markedBy: optionalUUID, // FIXED: Can be undefined or empty string
  }),
});

// Update attendance schema
export const updateAttendanceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid attendance ID format"),
  }),
  body: z.object({
    status: StatusEnum.optional(),
    remarks: z.string().max(500).optional(),
    checkInTime: dateTimeString,
    checkOutTime: dateTimeString,
    markedBy: optionalUUID, // FIXED: Can be undefined or empty string
  }),
});

// Mark bulk attendance schema
export const markBulkAttendanceSchema = z.object({
  body: z.object({
    markedBy: optionalUUID, // FIXED: Can be undefined or empty string
    // Accept BOTH formats for backward compatibility
    records: z
      .array(
        z.object({
          userId: z.string().uuid("Invalid user ID format"),
          role: RoleEnum,
          status: StatusEnum,
          date: dateString,
          remarks: z.string().max(500).optional(),
          checkInTime: dateTimeString,
          checkOutTime: dateTimeString,
        })
      )
      .min(1, "Attendance list must contain at least one entry")
      .max(100, "Cannot mark more than 100 attendance records at once")
      .optional(),
    attendanceList: z
      .array(
        z.object({
          userId: z.string().uuid("Invalid user ID format"),
          role: RoleEnum,
          status: StatusEnum,
          date: dateString,
          remarks: z.string().max(500).optional(),
          checkInTime: dateTimeString,
          checkOutTime: dateTimeString,
        })
      )
      .min(1, "Attendance list must contain at least one entry")
      .max(100, "Cannot mark more than 100 attendance records at once")
      .optional(),
  }).refine(data => data.records || data.attendanceList, {
    message: "Either 'records' or 'attendanceList' must be provided"
  }),
});

// Get attendance query schema
export const getAttendanceSchema = z.object({
  query: z.object({
    userId: z.string().uuid("Invalid user ID").optional(),
    role: RoleEnum.optional(),
    status: StatusEnum.optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD")
      .optional(),
    month: z
      .string()
      .regex(/^([1-9]|1[0-2])$/, "Month must be 1-12")
      .optional(),
    year: z
      .string()
      .regex(/^\d{4}$/, "Year must be 4 digits (YYYY)")
      .optional(),
  }),
});

// Get user monthly attendance params schema
export const getUserMonthlyAttendanceSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user ID format"),
  }),
  query: z.object({
    month: z
      .string()
      .regex(/^([1-9]|1[0-2])$/, "Month must be 1-12")
      .optional(),
    year: z
      .string()
      .regex(/^\d{4}$/, "Year must be 4 digits")
      .optional(),
  }),
});

// Get daily attendance by role schema
export const getDailyAttendanceByRoleSchema = z.object({
  params: z.object({
    role: RoleEnum,
  }),
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
  }),
});

// Get daily summary schema
export const getDailySummarySchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
  }),
});

// Delete attendance schema
export const deleteAttendanceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid attendance ID format"),
  }),
});

// Type exports
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type MarkBulkAttendanceInput = z.infer<typeof markBulkAttendanceSchema>;
export type GetAttendanceInput = z.infer<typeof getAttendanceSchema>;
export type GetUserMonthlyAttendanceInput = z.infer<typeof getUserMonthlyAttendanceSchema>;
export type GetDailyAttendanceByRoleInput = z.infer<typeof getDailyAttendanceByRoleSchema>;
export type GetDailySummaryInput = z.infer<typeof getDailySummarySchema>;
export type DeleteAttendanceInput = z.infer<typeof deleteAttendanceSchema>;