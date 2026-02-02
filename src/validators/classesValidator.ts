// validators/classValidators.ts

import { z } from "zod";

// ─────────────────────────────────────────────
// 1. Create Class (Admin only)
// POST /api/classes
// ─────────────────────────────────────────────
export const createClassSchema = z.object({
  body: z.object({
    classNumber: z.number().int().min(1).max(12, "Class must be between 1 and 12"),
    section: z.string().trim().max(10).optional(),
    classTeacherId: z.string().uuid("Invalid teacher ID").optional(),
    roomNumber: z.string().trim().min(1, "Room number is required").max(20),
    academicYear: z.number().int().min(2000).max(new Date().getFullYear() + 1, "Invalid academic year"),
    maxCapacity: z.number().int().min(1).max(100).default(40),
    description: z.string().trim().optional(),
    subjectIds: z.array(z.string().uuid("Invalid subject UUID")).min(1, "At least one subject is required"),
  }),
});
export type CreateClassInput = z.infer<typeof createClassSchema.shape.body>;

// ─────────────────────────────────────────────
// 2. Update Class (Admin only)
// PUT /api/classes/:classId
// Note: This does NOT update subjects (use separate API for that)
// ─────────────────────────────────────────────
export const updateClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
  body: z.object({
    section: z.string().trim().max(10).optional(),
    classTeacherId: z.string().uuid("Invalid teacher ID").optional().nullable(),
    roomNumber: z.string().trim().min(1).max(20).optional(),
    academicYear: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
    maxCapacity: z.number().int().min(1).max(100).optional(),
    description: z.string().trim().optional().nullable(),
    isActive: z.number().int().min(0).max(1).optional(),
  }),
});
export type UpdateClassInput = {
  params: z.infer<typeof updateClassSchema.shape.params>;
  body: z.infer<typeof updateClassSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 3. Get Class by ID (Auth required)
// GET /api/classes/:classId
// ─────────────────────────────────────────────
export const getClassByIdSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
});
export type GetClassByIdInput = z.infer<typeof getClassByIdSchema.shape.params>;

// ─────────────────────────────────────────────
// 4. Get All Classes (Auth required)
// GET /api/classes
// ─────────────────────────────────────────────
export const getAllClassesSchema = z.object({
  query: z.object({
    classNumber: z.coerce.number().int().min(1).max(12).optional(),
    academicYear: z.coerce.number().int().min(2000).optional(),
    isActive: z.coerce.number().int().min(0).max(1).optional(),
    section: z.string().trim().optional(),
  }),
});
export type GetAllClassesInput = z.infer<typeof getAllClassesSchema.shape.query>;

// ─────────────────────────────────────────────
// 5. Delete Class (Admin only)
// DELETE /api/classes/:classId
// ─────────────────────────────────────────────
export const deleteClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
});
export type DeleteClassInput = z.infer<typeof deleteClassSchema.shape.params>;

// ─────────────────────────────────────────────
// 6. Add Students to Class (Admin only)
// POST /api/classes/:classId/students
// ─────────────────────────────────────────────
export const addStudentsToClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
  body: z.object({
    studentIds: z.array(z.string().uuid("Invalid student ID")).min(1, "At least one student is required"),
  }),
});
export type AddStudentsToClassInput = {
  params: z.infer<typeof addStudentsToClassSchema.shape.params>;
  body: z.infer<typeof addStudentsToClassSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 7. Remove Students from Class (Admin only)
// DELETE /api/classes/:classId/students
// ─────────────────────────────────────────────
export const removeStudentsFromClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
  body: z.object({
    studentIds: z.array(z.string().uuid("Invalid student ID")).min(1, "At least one student is required"),
  }),
});
export type RemoveStudentsFromClassInput = {
  params: z.infer<typeof removeStudentsFromClassSchema.shape.params>;
  body: z.infer<typeof removeStudentsFromClassSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 8. Get Class with Full Details (Auth required)
// GET /api/classes/:classId/details
// Includes subjects, teacher info, student list
// ─────────────────────────────────────────────
export const getClassDetailsSchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
});
export type GetClassDetailsInput = z.infer<typeof getClassDetailsSchema.shape.params>;