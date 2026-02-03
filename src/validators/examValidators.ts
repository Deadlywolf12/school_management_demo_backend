// validators/examinationValidators.ts

import { z } from "zod";

// ─────────────────────────────────────────────
// 1. Create Examination (Admin only)
// POST /api/examinations
// ─────────────────────────────────────────────
export const createExaminationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Exam name is required"),
    type: z.enum(["mid_term", "final", "monthly", "quiz"], {
      message: "Invalid exam type"
    }),
    academicYear: z.number().int().min(2000).max(new Date().getFullYear() + 1),
    term: z.string().trim().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    description: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
  }).refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }),
});
export type CreateExaminationInput = z.infer<typeof createExaminationSchema.shape.body>;

// ─────────────────────────────────────────────
// 2. Create Exam Schedule (Admin only)
// POST /api/examinations/:examinationId/schedule
// ─────────────────────────────────────────────
export const createExamScheduleSchema = z.object({
  params: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
  body: z.object({
    classId: z.string().uuid("Invalid class ID"),
    subjectId: z.string().uuid("Invalid subject ID"),
    examDate: z.coerce.date(), // Keep as examDate in API but map to 'date' in controller
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
    duration: z.number().int().min(15).max(300, "Duration must be between 15 and 300 minutes"),
    roomNumber: z.string().trim().min(1, "Room number is required"),
    totalMarks: z.number().int().min(1).default(100),
    passingMarks: z.number().int().min(1).default(40),
    invigilators: z.array(z.string().uuid("Invalid invigilator ID")).min(1, "At least one invigilator is required"),
    instructions: z.string().trim().optional(),
  }).refine((data) => data.passingMarks <= data.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  }),
});
export type CreateExamScheduleInput = {
  params: z.infer<typeof createExamScheduleSchema.shape.params>;
  body: z.infer<typeof createExamScheduleSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 3. Bulk Create Exam Schedules (Admin only)
// POST /api/examinations/:examinationId/schedule-bulk
// ─────────────────────────────────────────────
const examScheduleItemSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  examDate: z.coerce.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().int().min(15).max(300),
  roomNumber: z.string().trim().min(1),
  totalMarks: z.number().int().min(1).default(100),
  passingMarks: z.number().int().min(1).default(40),
  invigilators: z.array(z.string().uuid()).min(1),
  instructions: z.string().trim().optional(),
});

export const bulkCreateExamScheduleSchema = z.object({
  params: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
  body: z.object({
    schedules: z.array(examScheduleItemSchema).min(1, "At least one schedule is required"),
  }),
});
export type BulkCreateExamScheduleInput = {
  params: z.infer<typeof bulkCreateExamScheduleSchema.shape.params>;
  body: z.infer<typeof bulkCreateExamScheduleSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 4. Bulk Mark Students (Teacher only)
// POST /api/examinations/mark-bulk
// ─────────────────────────────────────────────
const studentMarkSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  obtainedMarks: z.number().min(0, "Marks cannot be negative"),
  status: z.enum(["pass", "fail", "absent"], {
   message: "Status must be 'pass', 'fail', or 'absent'" ,
  }),
  remarks: z.string().trim().optional(),
});

export const bulkMarkStudentsSchema = z.object({
  body: z.object({
    examScheduleId: z.string().uuid("Invalid exam schedule ID"),
    marks: z.array(studentMarkSchema).min(1, "At least one student mark is required"),
  }),
});
export type BulkMarkStudentsInput = z.infer<typeof bulkMarkStudentsSchema.shape.body>;

// ─────────────────────────────────────────────
// 5. Get Examinations (Auth required)
// GET /api/examinations
// ─────────────────────────────────────────────
export const getExaminationsSchema = z.object({
  query: z.object({
    academicYear: z.coerce.number().int().min(2000).optional(),
    examType: z.enum(["mid_term", "final", "monthly", "quiz"]).optional(),
    status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
  }),
});
export type GetExaminationsInput = z.infer<typeof getExaminationsSchema.shape.query>;

// ─────────────────────────────────────────────
// 6. Get Exam Schedules (Auth required)
// GET /api/examinations/:examinationId/schedules
// ─────────────────────────────────────────────
export const getExamSchedulesSchema = z.object({
  params: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
  query: z.object({
    classId: z.string().uuid("Invalid class ID").optional(),
    subjectId: z.string().uuid("Invalid subject ID").optional(),
    status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
  }),
});
export type GetExamSchedulesInput = {
  params: z.infer<typeof getExamSchedulesSchema.shape.params>;
  query: z.infer<typeof getExamSchedulesSchema.shape.query>;
};

// ─────────────────────────────────────────────
// 7. Get Exam Results (Auth required)
// GET /api/examinations/results
// ─────────────────────────────────────────────
export const getExamResultsSchema = z.object({
  query: z.object({
    examinationId: z.string().uuid("Invalid examination ID").optional(),
    examScheduleId: z.string().uuid("Invalid exam schedule ID").optional(),
    studentId: z.string().uuid("Invalid student ID").optional(),
    classId: z.string().uuid("Invalid class ID").optional(),
  }),
});
export type GetExamResultsInput = z.infer<typeof getExamResultsSchema.shape.query>;

// ─────────────────────────────────────────────
// 8. Get Student Exam Report (Auth required)
// GET /api/examinations/report/:studentId
// ─────────────────────────────────────────────
export const getStudentExamReportSchema = z.object({
  params: z.object({
    studentId: z.string().uuid("Invalid student ID"),
  }),
  query: z.object({
    examinationId: z.string().uuid("Invalid examination ID").optional(),
  }),
});
export type GetStudentExamReportInput = {
  params: z.infer<typeof getStudentExamReportSchema.shape.params>;
  query: z.infer<typeof getStudentExamReportSchema.shape.query>;
};

// ─────────────────────────────────────────────
// 9. Update Examination (Admin only)
// PUT /api/examinations/:examinationId
// ─────────────────────────────────────────────
export const updateExaminationSchema = z.object({
  params: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
  body: z.object({
    examName: z.string().trim().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
    description: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
  }),
});
export type UpdateExaminationInput = {
  params: z.infer<typeof updateExaminationSchema.shape.params>;
  body: z.infer<typeof updateExaminationSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 10. Update Exam Schedule (Admin only)
// PUT /api/examinations/schedule/:scheduleId
// ─────────────────────────────────────────────
export const updateExamScheduleSchema = z.object({
  params: z.object({
    scheduleId: z.string().uuid("Invalid schedule ID"),
  }),
  body: z.object({
    examDate: z.coerce.date().optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    roomNumber: z.string().trim().min(1).optional(),
    invigilators: z.array(z.string().uuid()).min(1).optional(),
    status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
    instructions: z.string().trim().optional(),
  }),
});
export type UpdateExamScheduleInput = {
  params: z.infer<typeof updateExamScheduleSchema.shape.params>;
  body: z.infer<typeof updateExamScheduleSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 11. Delete Examination (Admin only)
// DELETE /api/examinations/:examinationId
// ─────────────────────────────────────────────
export const deleteExaminationSchema = z.object({
  params: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
});
export type DeleteExaminationInput = z.infer<typeof deleteExaminationSchema.shape.params>;

// ─────────────────────────────────────────────
// 12. Delete Exam Schedule (Admin only)
// DELETE /api/examinations/schedule/:scheduleId
// ─────────────────────────────────────────────
export const deleteExamScheduleSchema = z.object({
  params: z.object({
    scheduleId: z.string().uuid("Invalid schedule ID"),
  }),
});
export type DeleteExamScheduleInput = z.infer<typeof deleteExamScheduleSchema.shape.params>;

// ─────────────────────────────────────────────
// 13. Get Class Exam Summary (Auth required)
// GET /api/examinations/class-summary/:classId
// ─────────────────────────────────────────────
export const getClassExamSummarySchema = z.object({
  params: z.object({
    classId: z.string().uuid("Invalid class ID"),
  }),
  query: z.object({
    examinationId: z.string().uuid("Invalid examination ID"),
  }),
});
export type GetClassExamSummaryInput = {
  params: z.infer<typeof getClassExamSummarySchema.shape.params>;
  query: z.infer<typeof getClassExamSummarySchema.shape.query>;
};

// ─────────────────────────────────────────────
// 14. Update Single Student Mark (Teacher only)
// PUT /api/examinations/result/:resultId
// ─────────────────────────────────────────────
export const updateStudentMarkSchema = z.object({
  params: z.object({
    resultId: z.string().uuid("Invalid result ID"),
  }),
  body: z.object({
    obtainedMarks: z.number().min(0, "Marks cannot be negative"),
    status: z.enum(["pass", "fail", "absent"]).optional(),
    remarks: z.string().trim().optional(),
  }),
});
export type UpdateStudentMarkInput = {
  params: z.infer<typeof updateStudentMarkSchema.shape.params>;
  body: z.infer<typeof updateStudentMarkSchema.shape.body>;
};