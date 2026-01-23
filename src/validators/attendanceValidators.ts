import { z } from "zod";

// Enums for validation
const RoleEnum = z.enum(["student", "teacher", "staff", "admin", "parent"]);
const StatusEnum = z.enum(["present", "absent", "late", "leave"]);

// ============================================
// OPTION 1: Simple String Validation (Recommended for API)
// ============================================

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
    markedBy: z.string().uuid().optional(),
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
    markedBy: z.string().uuid().optional(),
  }),
});

// Mark bulk attendance schema
export const markBulkAttendanceSchema = z.object({
  body: z.object({
    markedBy: z.string().uuid().optional(),
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
      .max(100, "Cannot mark more than 100 attendance records at once"),
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

// ============================================
// OPTION 2: With Coercion and Transformation
// (Use this if you want automatic type conversion)
// ============================================

export const markAttendanceSchemaWithCoercion = z.object({
  body: z.object({
    userId: z.string().uuid(),
    role: RoleEnum,
    status: StatusEnum,
    date: z.string().transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
    }).optional(),
    remarks: z.string().max(500).optional(),
    checkInTime: z.string().transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid datetime format");
      }
      return date.toISOString();
    }).optional(),
    checkOutTime: z.string().transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid datetime format");
      }
      return date.toISOString();
    }).optional(),
    markedBy: z.string().uuid().optional(),
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

// ============================================
// Usage Examples
// ============================================

/*
// In your routes file:

import { validate } from './middleware/validation';
import * as schemas from './validators/attendanceValidation';

// Mark attendance
router.post(
  '/attendance/mark',
  validate(schemas.markAttendanceSchema),
  attendanceController.markAttendance
);

// Update attendance
router.put(
  '/attendance/:id',
  validate(schemas.updateAttendanceSchema),
  attendanceController.updateAttendance
);

// Bulk mark
router.post(
  '/attendance/mark-bulk',
  validate(schemas.markBulkAttendanceSchema),
  attendanceController.markBulkAttendance
);

// Get attendance
router.get(
  '/attendance',
  validate(schemas.getAttendanceSchema),
  attendanceController.getAttendance
);

// Get user monthly
router.get(
  '/attendance/user/:userId/monthly',
  validate(schemas.getUserMonthlyAttendanceSchema),
  attendanceController.getUserMonthlyAttendance
);

// Get daily by role
router.get(
  '/attendance/daily/:role',
  validate(schemas.getDailyAttendanceByRoleSchema),
  attendanceController.getDailyAttendanceByRole
);

// Delete
router.delete(
  '/attendance/:id',
  validate(schemas.deleteAttendanceSchema),
  attendanceController.deleteAttendance
);

// Example Request Body (POST /attendance/mark):
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "student",
  "status": "present",
  "date": "2024-01-15",
  "remarks": "On time",
  "checkInTime": "2024-01-15T08:00:00.000Z",
  "checkOutTime": "2024-01-15T15:00:00.000Z"
}

// Example Query (GET /attendance?userId=...&role=...):
GET /attendance?userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&role=student&month=1&year=2024

*/