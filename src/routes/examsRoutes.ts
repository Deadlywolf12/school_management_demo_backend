// routes/examination.routes.ts

import { Router } from "express";


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
import { auth } from "../middleware/auth";
import { authorize, validate } from "../middleware/validate";


const examinationRouter = Router();

examinationRouter.use(auth); 

examinationRouter.get(
  "/",

  validate(getExaminationsSchema),
  getExaminations
);


// ─────────────────────────────────────────────
// [Admin] Create examination
// ─────────────────────────────────────────────
examinationRouter.post(
  "/",


      authorize("admin"),
  validate(createExaminationSchema),
  createExamination
);

// ─────────────────────────────────────────────
// [Admin] Create single exam schedule
// ─────────────────────────────────────────────
examinationRouter.post(
  "/:examinationId/schedule",

 
      authorize("admin"),
  validate(createExamScheduleSchema),
  createExamSchedule
);

// ─────────────────────────────────────────────
// [Admin] Bulk create exam schedules
// ─────────────────────────────────────────────
examinationRouter.post(
  "/:examinationId/schedule-bulk",

  
      authorize("admin"),
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

// ─────────────────────────────────────────────
// [Auth] Get exam schedules for an examination
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// [Auth] Get exam results (with filters)
// ─────────────────────────────────────────────
examinationRouter.get(
  "/results",

  validate(getExamResultsSchema),
  getExamResults
);
examinationRouter.get(
  "/:examinationId/schedules",

  validate(getExamSchedulesSchema),
  getExamSchedules
);

// ─────────────────────────────────────────────
// [Auth] Get student exam report
// ─────────────────────────────────────────────
examinationRouter.get(
  "/report/:studentId",

  validate(getStudentExamReportSchema),
  getStudentExamReport
);

// ─────────────────────────────────────────────
// [Auth] Get class exam summary
// ─────────────────────────────────────────────
examinationRouter.get(
  "/class-summary/:classId",

  validate(getClassExamSummarySchema),
  getClassExamSummary
);

// ─────────────────────────────────────────────
// [Admin] Update examination
// ─────────────────────────────────────────────
examinationRouter.put(
  "/:examinationId",
  
      authorize("admin"),
  validate(updateExaminationSchema),
  updateExamination
);

// ─────────────────────────────────────────────
// [Admin] Update exam schedule
// ─────────────────────────────────────────────
examinationRouter.put(
  "/schedule/:scheduleId",

      authorize("admin"),
  validate(updateExamScheduleSchema),
  updateExamSchedule
);

// ─────────────────────────────────────────────
// [Teacher] Update single student mark
// ─────────────────────────────────────────────
examinationRouter.put(
  "/result/:resultId",

  authorize("teacher","admin"),
  validate(updateStudentMarkSchema),
  updateStudentMark
);

// ─────────────────────────────────────────────
// [Admin] Delete examination
// ─────────────────────────────────────────────
examinationRouter.delete(
  "/:examinationId",
  authorize("admin"),
  validate(deleteExaminationSchema),
  deleteExamination
);

// ─────────────────────────────────────────────
// [Admin] Delete exam schedule
// ─────────────────────────────────────────────
examinationRouter.delete(
  "/schedule/:scheduleId",
  authorize("admin"),
  validate(deleteExamScheduleSchema),
  deleteExamSchedule
);

export default examinationRouter;