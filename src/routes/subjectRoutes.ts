import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { authorize, validate } from "../middleware/validate";
import {
  createSubjectSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
  getSubjectByIdSchema,
  getAllSubjectsSchema,
  assignTeacherToSubjectSchema,
  removeTeacherFromSubjectSchema,
  getSubjectTeachersSchema,
  getTeacherSubjectsSchema,
} from "../validators/subjectValidators";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  getSubjectTeachers,
  getTeacherSubjects,
} from "../controllers/subjectController";

const subjectRouter = Router();

// Apply auth and admin middleware to all routes
subjectRouter.use(auth);
subjectRouter.use(adminAuth);

// ============================================
// SUBJECT CRUD ROUTES
// ============================================

/**
 * @route   POST /api/admin/subjects
 * @desc    Create a new subject
 * @access  Admin only
 * @body    { name: string, code: string, description?: string }
 */
subjectRouter.post(
  "/subjects",
  auth,
   authorize("admin"),
  validate(createSubjectSchema),
  createSubject
);

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects with pagination
 * @access  Admin only
 * @query   ?page=1&limit=10
 */
subjectRouter.get(
  "/subjects",
  auth,
   authorize("admin"),
  validate(getAllSubjectsSchema),
  getAllSubjects
);

/**
 * @route   GET /api/admin/subjects/:subjectId
 * @desc    Get single subject with all teachers
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.get(
  "/subjects/:subjectId",
  auth,
   authorize("admin"),
  validate(getSubjectByIdSchema),
  getSubjectById
);

/**
 * @route   PUT /api/admin/subjects/:subjectId
 * @desc    Update subject details
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 * @body    { name?: string, code?: string, description?: string }
 */
subjectRouter.put(
  "/subjects/:subjectId",
  auth,
   authorize("admin"),
  validate(updateSubjectSchema),
  updateSubject
);

/**
 * @route   DELETE /api/admin/subjects/:subjectId
 * @desc    Delete a subject (also removes all teacher assignments)
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.delete(
  "/subjects/:subjectId",
  auth,
   authorize("admin"),
  validate(deleteSubjectSchema),
  deleteSubject
);

// ============================================
// TEACHER-SUBJECT ASSIGNMENT ROUTES
// ============================================

/**
 * @route   POST /api/admin/subjects/assign-teacher
 * @desc    Assign a teacher to a subject
 * @access  Admin only
 * @body    { teacherId: string, subjectId: string }
 */
subjectRouter.post(
  "/subjects/assign-teacher",
  auth,
   authorize("admin"),
  validate(assignTeacherToSubjectSchema),
  assignTeacherToSubject
);

/**
 * @route   DELETE /api/admin/subjects/remove-teacher
 * @desc    Remove a teacher from a subject
 * @access  Admin only
 * @body    { teacherId: string, subjectId: string }
 */
subjectRouter.delete(
  "/subjects/remove-teacher",
  auth,
   authorize("admin"),
  validate(removeTeacherFromSubjectSchema),
  removeTeacherFromSubject
);

/**
 * @route   GET /api/admin/subjects/:subjectId/teachers
 * @desc    Get all teachers teaching a subject
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.get(
  "/subjects/:subjectId/teachers",
  auth,
   authorize("admin"),
  validate(getSubjectTeachersSchema),
  getSubjectTeachers
);

/**
 * @route   GET /api/admin/teachers/:teacherId/subjects
 * @desc    Get all subjects taught by a teacher
 * @access  Admin only
 * @params  teacherId - Teacher's UUID
 */
subjectRouter.get(
  "/teachers/:teacherId/subjects",
  auth,
   authorize("admin"),
  validate(getTeacherSubjectsSchema),
  getTeacherSubjects
);

export default subjectRouter;