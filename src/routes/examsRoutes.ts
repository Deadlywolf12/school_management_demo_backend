// routes/examination.routes.ts

import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { auth } from "../middleware/auth";
import { authorize, validate } from "../middleware/validate";

import {
  createExamination,
  createExamSchedule,
  bulkCreateExamSchedules,
  bulkMarkStudents,
  getExaminations,
  getExamSchedules,
  getExamResults,
  getStudentExamReport,
  updateExamination,
  updateExamSchedule,
  deleteExamination,
  deleteExamSchedule,
  getClassExamSummary,
  updateStudentMark,
} from "../controllers/examsController";

import {
  createExaminationSchema,
  createExamScheduleSchema,
  bulkCreateExamScheduleSchema,
  bulkMarkStudentsSchema,
  getExaminationsSchema,
  getExamSchedulesSchema,
  getExamResultsSchema,
  getStudentExamReportSchema,
  updateExaminationSchema,
  updateExamScheduleSchema,
  deleteExaminationSchema,
  deleteExamScheduleSchema,
  getClassExamSummarySchema,
  updateStudentMarkSchema,
} from "../validators/examValidators";

const examinationRouter = Router();

// ─────────────────────────────────────────────
// [Admin] Create examination
// ─────────────────────────────────────────────
examinationRouter.post(
  "/",
  adminAuth,
  validate(createExaminationSchema),
  createExamination
);

// ─────────────────────────────────────────────
// [Admin] Create single exam schedule
// ─────────────────────────────────────────────
examinationRouter.post(
  "/:examinationId/schedule",
  adminAuth,
  validate(createExamScheduleSchema),
  createExamSchedule
);

// ─────────────────────────────────────────────
// [Admin] Bulk create exam schedules
// ─────────────────────────────────────────────
examinationRouter.post(
  "/:examinationId/schedule-bulk",
  adminAuth,
  validate(bulkCreateExamScheduleSchema),
  bulkCreateExamSchedules
);

// ─────────────────────────────────────────────
// [Teacher] Bulk mark students (class teacher only)
// ─────────────────────────────────────────────
examinationRouter.post(
  "/mark-bulk",
  authorize("teacher","admin"),

  validate(bulkMarkStudentsSchema),
  bulkMarkStudents
);

// ─────────────────────────────────────────────
// [Auth] Get all examinations (with filters)
// ─────────────────────────────────────────────
examinationRouter.get(
  "/",
  auth,
  validate(getExaminationsSchema),
  getExaminations
);

// ─────────────────────────────────────────────
// [Auth] Get exam schedules for an examination
// ─────────────────────────────────────────────
examinationRouter.get(
  "/:examinationId/schedules",
  auth,
  validate(getExamSchedulesSchema),
  getExamSchedules
);

// ─────────────────────────────────────────────
// [Auth] Get exam results (with filters)
// ─────────────────────────────────────────────
examinationRouter.get(
  "/results",
  auth,
  validate(getExamResultsSchema),
  getExamResults
);

// ─────────────────────────────────────────────
// [Auth] Get student exam report
// ─────────────────────────────────────────────
examinationRouter.get(
  "/report/:studentId",
  auth,
  validate(getStudentExamReportSchema),
  getStudentExamReport
);

// ─────────────────────────────────────────────
// [Auth] Get class exam summary
// ─────────────────────────────────────────────
examinationRouter.get(
  "/class-summary/:classId",
  auth,
  validate(getClassExamSummarySchema),
  getClassExamSummary
);

// ─────────────────────────────────────────────
// [Admin] Update examination
// ─────────────────────────────────────────────
examinationRouter.put(
  "/:examinationId",
  adminAuth,
  validate(updateExaminationSchema),
  updateExamination
);

// ─────────────────────────────────────────────
// [Admin] Update exam schedule
// ─────────────────────────────────────────────
examinationRouter.put(
  "/schedule/:scheduleId",
  adminAuth,
  validate(updateExamScheduleSchema),
  updateExamSchedule
);

// ─────────────────────────────────────────────
// [Teacher] Update single student mark
// ─────────────────────────────────────────────
examinationRouter.put(
  "/result/:resultId",
  auth, // Add middleware to check if teacher is authorized
  validate(updateStudentMarkSchema),
  updateStudentMark
);

// ─────────────────────────────────────────────
// [Admin] Delete examination
// ─────────────────────────────────────────────
examinationRouter.delete(
  "/:examinationId",
  adminAuth,
  validate(deleteExaminationSchema),
  deleteExamination
);

// ─────────────────────────────────────────────
// [Admin] Delete exam schedule
// ─────────────────────────────────────────────
examinationRouter.delete(
  "/schedule/:scheduleId",
  adminAuth,
  validate(deleteExamScheduleSchema),
  deleteExamSchedule
);

export default examinationRouter;