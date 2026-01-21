import { z } from "zod";

const validRoles = ["student", "teacher", "staff", "parent", "admin"] as const;

// ---------------- BASE ----------------
const baseUserSchema = {
  email: z.string().email().transform(e => e.trim().toLowerCase()),
  password: z.string().min(6).transform(p => p.trim()),
 
  role: z
    .string()
    .transform(r => r.trim().toLowerCase())
    .refine(r => validRoles.includes(r as any), {
      message: `Role must be one of: ${validRoles.join(", ")}`,
    }),

};

// ---------------- TEACHER ----------------
const teacherDetailsSchema = z.object({
  name: z.string().min(2),
  gender: z.string().optional(),
  employeeId: z.string().min(1),
  department: z.string().min(1),
  subject: z.string().min(1),
  classTeacher: z.string().optional(),
  phoneNumber: z.string().min(6),
  address: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.number().optional(),
});

// ---------------- STUDENT ----------------
const studentDetailsSchema = z.object({
  name: z.string().min(2),
  gender: z.string().optional(),
  studentId: z.string().min(1),
  class: z.string().min(1),
  enrollmentYear: z.number().int(),
  guardianIds: z.array(z.string().uuid()).optional(),
  emergencyNumber: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

// ---------------- STAFF ----------------
const staffDetailsSchema = z.object({
  name: z.string().min(2),
  gender: z.string().optional(),
  employeeId: z.string().min(1),
  department: z.string().min(1),
  roleDetails: z.string().min(1),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.number().optional(),
});

// ---------------- PARENT ----------------
const parentDetailsSchema = z.object({
  name: z.string().min(2),
  gender: z.string().optional(),
  guardianName: z.string().min(2),
  phoneNumber: z.string().min(6),
  address: z.string().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
});

// ---------------- MAIN SCHEMA ----------------
export const createUserSchema = z
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
  });
