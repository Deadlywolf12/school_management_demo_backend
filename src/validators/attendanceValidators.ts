import { z } from "zod";

// Enums for validation
const RoleEnum = z.enum(["student", "teacher", "staff", "admin", "parent"]);
const StatusEnum = z.enum(["present", "absent", "late", "leave"]);

// Mark attendance schema
export const markAttendanceSchema = z.object({
  body: z.object({
    userId: z.string().uuid("Invalid user ID format"),
    role: RoleEnum,
    status: StatusEnum,
    date: z.string().datetime().optional(),
    remarks: z.string().max(500).optional(),
    checkInTime: z.string().datetime().optional(),
    checkOutTime: z.string().datetime().optional(),
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
    checkInTime: z.string().datetime().optional(),
    checkOutTime: z.string().datetime().optional(),
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
          date: z.string().datetime().optional(),
          remarks: z.string().max(500).optional(),
          checkInTime: z.string().datetime().optional(),
          checkOutTime: z.string().datetime().optional(),
        })
      )
      .min(1, "Attendance list must contain at least one entry"),
  }),
});

// Get attendance query schema
export const getAttendanceSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    role: RoleEnum.optional(),
    status: StatusEnum.optional(),
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    month: z.string().regex(/^([1-9]|1[0-2])$/).optional(), // 1-12
    year: z.string().regex(/^\d{4}$/).optional(), // YYYY
  }),
});

// Get user monthly attendance params schema
export const getUserMonthlyAttendanceSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user ID format"),
  }),
});

// Get daily attendance by role schema
export const getDailyAttendanceByRoleSchema = z.object({
  params: z.object({
    role: RoleEnum,
  }),
  query: z.object({
    date: z.string().optional(),
  }),
});

// Delete attendance schema
export const deleteAttendanceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid attendance ID format"),
  }),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type MarkBulkAttendanceInput = z.infer<typeof markBulkAttendanceSchema>;