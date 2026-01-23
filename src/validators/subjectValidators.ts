import { z } from "zod";


export const createSubjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Subject name must be at least 2 characters")
      .max(100, "Subject name must be less than 100 characters")
      .transform((n) => n.trim()),
    code: z
      .string()
      .min(2, "Subject code must be at least 2 characters")
      .max(20, "Subject code must be less than 20 characters")
      .transform((c) => c.trim().toUpperCase()),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .transform((d) => d.trim())
      .optional(),
  }),
});


export const updateSubjectSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, "Subject name must be at least 2 characters")
      .max(100, "Subject name must be less than 100 characters")
      .transform((n) => n.trim())
      .optional(),
    code: z
      .string()
      .min(2, "Subject code must be at least 2 characters")
      .max(20, "Subject code must be less than 20 characters")
      .transform((c) => c.trim().toUpperCase())
      .optional(),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .transform((d) => d.trim())
      .optional(),
  }),
});

export const deleteSubjectSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});


export const getSubjectByIdSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});


export const getAllSubjectsSchema = z.object({
  query: z.object({
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


export const assignTeacherToSubjectSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid("Invalid teacher ID format"),
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

export const removeTeacherFromSubjectSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid("Invalid teacher ID format"),
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});


export const getSubjectTeachersSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

export const getTeacherSubjectsSchema = z.object({
  params: z.object({
    teacherId: z.string().uuid("Invalid teacher ID format"),
  }),
});


export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;
export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdSchema>;
export type GetAllSubjectsInput = z.infer<typeof getAllSubjectsSchema>;
export type AssignTeacherToSubjectInput = z.infer<typeof assignTeacherToSubjectSchema>;
export type RemoveTeacherFromSubjectInput = z.infer<typeof removeTeacherFromSubjectSchema>;
export type GetSubjectTeachersInput = z.infer<typeof getSubjectTeachersSchema>;
export type GetTeacherSubjectsInput = z.infer<typeof getTeacherSubjectsSchema>;