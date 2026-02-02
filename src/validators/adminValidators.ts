import { z } from "zod";

const validRoles = ["student", "teacher", "staff", "parent", "admin"] as const;

// ============================================
// REUSABLE SCHEMAS
// ============================================

const baseUserSchema = {
  email: z
    .string()
    .email("Invalid email format")
    .transform((e) => e.trim().toLowerCase()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .transform((p) => p.trim()),
  role: z
    .string()
    .transform((r) => r.trim().toLowerCase())
    .refine((r) => validRoles.includes(r as any), {
      message: `Role must be one of: ${validRoles.join(", ")}`,
    }),
};

// Teacher details
const teacherDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female"]).optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  subjectId: z.string().min(1, "Subject is required"),
  classTeacher: z.uuid().optional(),
  phoneNumber: z.string().min(6, "Phone number must be at least 6 digits"),
  address: z.string().optional(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  salary: z
    .string()
    .or(z.number())
    .transform((val) => String(val))
    .optional(),
});

// Student details
const studentDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female"]).optional(),
  studentId: z.string().min(1, "Student ID is required"),
  class: z.uuid(),
  enrollmentYear: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear()),
  guardianIds: z.array(z.string().uuid()).optional(),
  emergencyNumber: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

// Staff details
const staffDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female"]).optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  roleDetails: z.string().min(1, "Role details are required"),
  phoneNumber: z.string().min(6).optional(),
  address: z.string().optional(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  salary: z
    .string()
    .or(z.number())
    .transform((val) => String(val))
    .optional(),
});

// Parent details
const parentDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female"]).optional(),
  guardianName: z.string().min(2, "Guardian name is required"),
  phoneNumber: z.string().min(6, "Phone number must be at least 6 digits"),
  address: z.string().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
});

// ============================================
// CREATE USER SCHEMA
// ============================================

/**
 * POST /api/admin/createUsers
 * Create a new user with role-specific details
 */
export const createUserSchema = z.object({
  body: z
    .object({
      ...baseUserSchema,
      teacherDetails: teacherDetailsSchema.optional(),
      studentDetails: studentDetailsSchema.optional(),
      staffDetails: staffDetailsSchema.optional(),
      parentDetails: parentDetailsSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "teacher" && !data.teacherDetails) {
        ctx.addIssue({
          path: ["teacherDetails"],
          message: "teacherDetails is required for teacher role",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.role === "student" && !data.studentDetails) {
        ctx.addIssue({
          path: ["studentDetails"],
          message: "studentDetails is required for student role",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.role === "staff" && !data.staffDetails) {
        ctx.addIssue({
          path: ["staffDetails"],
          message: "staffDetails is required for staff role",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.role === "parent" && !data.parentDetails) {
        ctx.addIssue({
          path: ["parentDetails"],
          message: "parentDetails is required for parent role",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.role === "admin") {
        if (data.teacherDetails || data.studentDetails || data.staffDetails || data.parentDetails) {
          ctx.addIssue({
            path: ["role"],
            message: "Admin role should not have any additional details",
            code: z.ZodIssueCode.custom,
          });
        }
      }
    }),
});

// ============================================
// GET USERS SCHEMA
// ============================================

/**
 * GET /api/admin/users?role=teacher&page=1&limit=10
 * Get all users with pagination and filters
 */
export const getUsersSchema = z.object({
  query: z.object({
    role: z
      .enum(["student", "teacher", "staff", "parent", "admin"])
      .optional(),
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Page must be a positive number",
      }),
    limit: z
      .string()
      .optional()
      .default("10")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
  }),
});

// ============================================
// GET USER BY ID SCHEMA
// ============================================

/**
 * GET /api/admin/users/:userId
 * Get single user details
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user ID format"),
  }),
});

// ============================================
// UPDATE USER SCHEMA
// ============================================

/**
 * PUT /api/admin/users/:userId
 * Update user details (all fields optional)
 */


export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user ID format"),
  }),
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .transform((e) => e.trim().toLowerCase())
      .optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .transform((p) => p.trim())
      .optional(),
    teacherDetails: teacherDetailsSchema.partial().optional(),
    studentDetails: studentDetailsSchema.partial().optional(),
    staffDetails: staffDetailsSchema.partial().optional(),
    parentDetails: parentDetailsSchema.partial().optional(),
  }),
});

// ============================================
// DELETE USER SCHEMA
// ============================================

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid user ID format"),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

// Export individual detail schemas for reuse
export {
  teacherDetailsSchema,
  studentDetailsSchema,
  staffDetailsSchema,
  parentDetailsSchema,
};