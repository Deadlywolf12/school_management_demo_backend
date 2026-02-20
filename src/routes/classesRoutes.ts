// routes/class.routes.ts

import { Router } from "express";

import { auth } from "../middleware/auth";
import { authorize, validate } from "../middleware/validate";

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
classRouter.use(auth); 

// ─────────────────────────────────────────────
// [Admin] Create a new class
// ─────────────────────────────────────────────
classRouter.post(
  "/",

      authorize("admin"),
  validate(createClassSchema),
  createClass
);

// ─────────────────────────────────────────────
// [Admin] Update class information
// ─────────────────────────────────────────────
classRouter.put(
  "/:classId",

      authorize("admin"),
  validate(updateClassSchema),
  updateClass
);

// ─────────────────────────────────────────────
// [Auth] Get all classes (with optional filters)
// ─────────────────────────────────────────────
classRouter.get(
  "/",

  validate(getAllClassesSchema),
  getAllClasses
);

// ─────────────────────────────────────────────
// [Auth] Get class by ID (basic info)
// ─────────────────────────────────────────────
classRouter.get(
  "/:classId",

  validate(getClassByIdSchema),
  getClassById
);

// ─────────────────────────────────────────────
// [Auth] Get class with full details (subjects, students, teacher)
// ─────────────────────────────────────────────
classRouter.get(
  "/:classId/details",

  validate(getClassDetailsSchema),
  getClassDetails
);

// ─────────────────────────────────────────────
// [Admin] Add students to class
// ─────────────────────────────────────────────
classRouter.post(
  "/:classId/students",
  authorize("teacher","admin"),

  validate(addStudentsToClassSchema),
  addStudentsToClass
);

// ─────────────────────────────────────────────
// [Admin] Remove students from class
// ─────────────────────────────────────────────
classRouter.delete(
  "/:classId/students",
  authorize("teacher","admin"),

  validate(removeStudentsFromClassSchema),
  removeStudentsFromClass
);

// ─────────────────────────────────────────────
// [Admin] Delete class
// ─────────────────────────────────────────────
classRouter.delete(
  "/:classId",

      authorize("admin"),
  validate(deleteClassSchema),
  deleteClass
);

export default classRouter;