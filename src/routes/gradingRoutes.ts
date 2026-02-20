// routes/grading.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// import { adminAuth } from "../middleware/adminAuth"; // your existing middleware
import { auth }      from "../middleware/auth";      // your existing middleware


import {
  updateClassSubjects,
  getClassSubjects,
  addGrade,
  getStudentGrade,
  getStudentOverallResult,
} from "../controllers/gradingController";
import {addGradeSchema, getStudentGradeSchema, getClassSubjectsSchema, updateClassSubjectsSchema, getStudentOverallSchema } from "../validators/gradingValidators";
import { authorize, validate } from "../middleware/validate";

const gradeRouter = Router();
gradeRouter.use(auth);



// [Admin] Update subjects for a class
gradeRouter.put(
  "/class-subjects",
authorize('teacher','admin'),
  validate(updateClassSubjectsSchema),
  updateClassSubjects
);

// [Auth]  Get subjects for a class
gradeRouter.get(
  "/class-subjects/:classNumber",

  validate(getClassSubjectsSchema),
  getClassSubjects
);

// [Admin] Add or update a student's yearly grade
gradeRouter.post(
  "/add-grade",
authorize('teacher','admin'),

  validate(addGradeSchema),
  addGrade
);

// [Auth]  Get a student's grade(s) – optionally filtered by class / year
gradeRouter.get(
  "/student-grade/:studentId",
 
  validate(getStudentGradeSchema),
  getStudentGrade
);

// [Auth]  Get a student's full academic history + lifetime summary
gradeRouter.get(
  "/student-overall/:studentId",

  validate(getStudentOverallSchema),
  getStudentOverallResult
);

export default gradeRouter;