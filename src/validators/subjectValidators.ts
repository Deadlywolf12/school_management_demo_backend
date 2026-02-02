import { z } from "zod";

// ============================================
// CREATE SUBJECT SCHEMA
// ============================================

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

// ============================================
// UPDATE SUBJECT SCHEMA
// ============================================

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

// ============================================
// DELETE SUBJECT SCHEMA
// ============================================

export const deleteSubjectSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

// ============================================
// GET SUBJECT BY ID SCHEMA
// ============================================

export const getSubjectByIdSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

// ============================================
// GET ALL SUBJECTS SCHEMA (NO PAGINATION)
// ============================================

/**
 * GET /api/admin/subjects
 * Returns all subjects with id and name only (no pagination needed)
 */
export const getAllSubjectsSchema = z.object({
  query: z.object({}).optional(), // No query params needed
});

// ============================================
// ASSIGN TEACHER TO SUBJECT SCHEMA
// ============================================

export const assignTeacherToSubjectSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid("Invalid teacher ID format"),
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

// ============================================
// REMOVE TEACHER FROM SUBJECT SCHEMA
// ============================================

export const removeTeacherFromSubjectSchema = z.object({
  params: z.object({  // Change from body to params
    teacherId: z.string().uuid("Invalid teacher ID format"),
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

// ============================================
// GET SUBJECT'S TEACHERS SCHEMA
// ============================================

export const getSubjectTeachersSchema = z.object({
  params: z.object({
    subjectId: z.string().uuid("Invalid subject ID format"),
  }),
});

// ============================================
// GET TEACHER'S SUBJECT SCHEMA (changed from getTeacherSubjects)
// ============================================

/**
 * GET /api/admin/teachers/:teacherId/subject
 * Note: Changed from "subjects" (plural) to "subject" (singular)
 * because one teacher can only have ONE subject now
 */
export const getTeacherSubjectSchema = z.object({
  params: z.object({
    teacherId: z.string().uuid("Invalid teacher ID format"),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;
export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdSchema>;
export type GetAllSubjectsInput = z.infer<typeof getAllSubjectsSchema>;
export type AssignTeacherToSubjectInput = z.infer<
  typeof assignTeacherToSubjectSchema
>;
export type RemoveTeacherFromSubjectInput = z.infer<
  typeof removeTeacherFromSubjectSchema
>;
export type GetSubjectTeachersInput = z.infer<typeof getSubjectTeachersSchema>;
export type GetTeacherSubjectInput = z.infer<typeof getTeacherSubjectSchema>;