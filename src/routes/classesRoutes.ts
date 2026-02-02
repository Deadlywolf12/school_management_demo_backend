// routes/class.routes.ts

import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";

import {
  createClass,
  updateClass,
  getClassById,
  getAllClasses,
  deleteClass,
  addStudentsToClass,
  removeStudentsFromClass,
  getClassDetails,
} from "../controllers/classesController";

import {
  createClassSchema,
  updateClassSchema,
  getClassByIdSchema,
  getAllClassesSchema,
  deleteClassSchema,
  addStudentsToClassSchema,
  removeStudentsFromClassSchema,
  getClassDetailsSchema,
} from "../validators/classesValidator";

const classRouter = Router();

// ─────────────────────────────────────────────
// [Admin] Create a new class
// ─────────────────────────────────────────────
classRouter.post(
  "/",
  adminAuth,
  validate(createClassSchema),
  createClass
);

// ─────────────────────────────────────────────
// [Admin] Update class information
// ─────────────────────────────────────────────
classRouter.put(
  "/:classId",
  adminAuth,
  validate(updateClassSchema),
  updateClass
);

// ─────────────────────────────────────────────
// [Auth] Get all classes (with optional filters)
// ─────────────────────────────────────────────
classRouter.get(
  "/",
  auth,
  validate(getAllClassesSchema),
  getAllClasses
);

// ─────────────────────────────────────────────
// [Auth] Get class by ID (basic info)
// ─────────────────────────────────────────────
classRouter.get(
  "/:classId",
  auth,
  validate(getClassByIdSchema),
  getClassById
);

// ─────────────────────────────────────────────
// [Auth] Get class with full details (subjects, students, teacher)
// ─────────────────────────────────────────────
classRouter.get(
  "/:classId/details",
  auth,
  validate(getClassDetailsSchema),
  getClassDetails
);

// ─────────────────────────────────────────────
// [Admin] Add students to class
// ─────────────────────────────────────────────
classRouter.post(
  "/:classId/students",
  adminAuth,
  validate(addStudentsToClassSchema),
  addStudentsToClass
);

// ─────────────────────────────────────────────
// [Admin] Remove students from class
// ─────────────────────────────────────────────
classRouter.delete(
  "/:classId/students",
  adminAuth,
  validate(removeStudentsFromClassSchema),
  removeStudentsFromClass
);

// ─────────────────────────────────────────────
// [Admin] Delete class
// ─────────────────────────────────────────────
classRouter.delete(
  "/:classId",
  adminAuth,
  validate(deleteClassSchema),
  deleteClass
);

export default classRouter;