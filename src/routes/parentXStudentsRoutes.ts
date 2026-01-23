import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  getStudentParentsSchema,
  getParentStudentsSchema,
  linkParentStudentSchema,
  unlinkParentStudentSchema,
} from "../validators/parentXStudentValidator";
import {
  getStudentParents,
  getParentStudents,
  linkParentStudent,
  unlinkParentStudent,
} from "../controllers/parentXStudentController";

const parentStudentRouter = Router();

// Apply auth and admin middleware to all routes
parentStudentRouter.use(auth);
parentStudentRouter.use(adminAuth);

/**
 * @route   GET /api/admin/students/:studentId/parents
 * @desc    Get all parents linked to a student with their details
 * @access  Admin only
 * @params  studentId - Student's UUID
 */
parentStudentRouter.get(
  "/students/:studentId/parents",
  validate(getStudentParentsSchema),
  getStudentParents
);

/**
 * @route   GET /api/admin/parents/:parentId/students
 * @desc    Get all students linked to a parent with their details
 * @access  Admin only
 * @params  parentId - Parent's UUID
 */
parentStudentRouter.get(
  "/parents/:parentId/students",
  validate(getParentStudentsSchema),
  getParentStudents
);

/**
 * @route   POST /api/admin/link-parent-student
 * @desc    Link an existing parent to an existing student
 * @access  Admin only
 * @body    { studentId: string, parentId: string }
 */
parentStudentRouter.post(
  "/link-parent-student",
  validate(linkParentStudentSchema),
  linkParentStudent
);

/**
 * @route   DELETE /api/admin/unlink-parent-student
 * @desc    Unlink a parent from a student
 * @access  Admin only
 * @body    { studentId: string, parentId: string }
 */
parentStudentRouter.delete(
  "/unlink-parent-student",
  validate(unlinkParentStudentSchema),
  unlinkParentStudent
);

export default parentStudentRouter;