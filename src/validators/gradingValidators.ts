// schemas/grading.schema.ts
import { z } from "zod";

// ─────────────────────────────────────────────
// 1. Update class subjects   (Admin only)
// PUT /api/grading/class-subjects
// ─────────────────────────────────────────────
export const updateClassSubjectsSchema = z.object({
  body: z.object({
    classNumber: z.number().int().min(1).max(12, "Class must be between 1 and 12"),
    subjects: z
      .array(z.string().trim().min(1, "Subject name cannot be empty"))
      .min(1, "At least one subject is required"),
  }),
});
export type UpdateClassSubjectsInput = z.infer<typeof updateClassSubjectsSchema.shape.body>;

// ─────────────────────────────────────────────
// 2. Add / update a student's grade for a year  (Admin only)
// POST /api/grading/add-grade
// ─────────────────────────────────────────────
const subjectScoreSchema = z.object({
  subject: z.string().uuid().trim().min(1, "Subject UUID is required"),
  obtainedMarks: z.number().min(0, "Obtained marks cannot be negative"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
}).refine(
  (val) => val.obtainedMarks <= val.totalMarks,
  { message: "Obtained marks cannot exceed total marks", path: ["obtainedMarks"] }
);

export const addGradeSchema = z.object({
  body: z.object({
    studentId: z.string().trim().min(1, "Student ID is required"),
    classNumber: z.number().int().min(1).max(12, "Class must be between 1 and 12"),
    year: z.number().int().min(2000).max(new Date().getFullYear(), "Year cannot be in the future"),
    subjects: z.array(subjectScoreSchema).min(1, "At least one subject is required"),
  }),
});
export type AddGradeInput = z.infer<typeof addGradeSchema.shape.body>;

// ─────────────────────────────────────────────
// 3. Get student grade (single year or all)     (Auth required)
// GET /api/grading/student-grade/:studentId
// ─────────────────────────────────────────────
export const getStudentGradeSchema = z.object({
  params: z.object({
    studentId: z.string().trim().min(1),
  }),
  query: z.object({
    classNumber: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).optional(),
  }),
});
export type GetStudentGradeInput = {
  params: z.infer<typeof getStudentGradeSchema.shape.params>;
  query: z.infer<typeof getStudentGradeSchema.shape.query>;
};

// ─────────────────────────────────────────────
// 4. Get student overall result (full history)  (Auth required)
// GET /api/grading/student-overall/:studentId
// ─────────────────────────────────────────────
export const getStudentOverallSchema = z.object({
  params: z.object({
    studentId: z.string().trim().min(1),
  }),
});
export type GetStudentOverallInput = z.infer<typeof getStudentOverallSchema.shape.params>;

// ─────────────────────────────────────────────
// 5. Get class subjects                         (Auth required)
// GET /api/grading/class-subjects/:classNumber
// ─────────────────────────────────────────────
export const getClassSubjectsSchema = z.object({
  params: z.object({
    classNumber: z.coerce.number().int().min(1).max(12),
  }),
});
export type GetClassSubjectsInput = z.infer<typeof getClassSubjectsSchema.shape.params>;