import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  createSubjectSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
  getSubjectByIdSchema,
  getAllSubjectsSchema,
  assignTeacherToSubjectSchema,
  removeTeacherFromSubjectSchema,
  getSubjectTeachersSchema,
  getTeacherSubjectSchema,
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
  getTeacherSubject,
} from "../controllers/subjectController";

const subjectRouter = Router();

// ============================================
// Apply auth and admin middleware to all routes
// ============================================
subjectRouter.use(auth);
subjectRouter.use(adminAuth);

// ============================================
// SUBJECT CRUD ROUTES
// ============================================

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects (id and name only, no pagination)
 * @access  Admin only
 * @returns { success: boolean, message: string, data: [{ id, name }], total: number }
 */
subjectRouter.get(
  "/subjects",
  validate(getAllSubjectsSchema),
  getAllSubjects
);

/**
 * @route   POST /api/admin/subjects
 * @desc    Create a new subject
 * @access  Admin only
 * @body    { name: string, code: string, description?: string }
 */
subjectRouter.post(
  "/subjects",
  validate(createSubjectSchema),
  createSubject
);

/**
 * @route   GET /api/admin/subjects/:subjectId
 * @desc    Get single subject by ID with full details
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.get(
  "/subjects/:subjectId",
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
  validate(updateSubjectSchema),
  updateSubject
);

/**
 * @route   DELETE /api/admin/subjects/:subjectId
 * @desc    Delete a subject (sets all teachers' subjectId to null)
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.delete(
  "/subjects/:subjectId",
  validate(deleteSubjectSchema),
  deleteSubject
);

// ============================================
// TEACHER-SUBJECT ASSIGNMENT ROUTES
// ============================================

/**
 * @route   POST /api/admin/subjects/assign-teacher
 * @desc    Assign a teacher to a subject (updates teacher's subjectId)
 * @access  Admin only
 * @body    { teacherId: string, subjectId: string }
 * @note    One teacher can only be assigned to ONE subject at a time
 */
subjectRouter.post(
  "/subjects/assign-teacher",
  validate(assignTeacherToSubjectSchema),
  assignTeacherToSubject
);

/**
 * @route   DELETE /api/admin/subjects/remove-teacher
 * @desc    Remove a teacher from a subject (sets teacher's subjectId to null)
 * @access  Admin only
 * @body    { teacherId: string, subjectId: string }
 */
subjectRouter.delete(
  "/subjects/remove-teacher",
  validate(removeTeacherFromSubjectSchema),
  removeTeacherFromSubject
);

/**
 * @route   GET /api/admin/subjects/:subjectId/teachers
 * @desc    Get all teachers teaching a specific subject
 * @access  Admin only
 * @params  subjectId - Subject's UUID
 */
subjectRouter.get(
  "/subjects/:subjectId/teachers",
  validate(getSubjectTeachersSchema),
  getSubjectTeachers
);

/**
 * @route   GET /api/admin/teachers/:teacherId/subject
 * @desc    Get the subject assigned to a specific teacher
 * @access  Admin only
 * @params  teacherId - Teacher's UUID
 * @note    Returns single subject (or null) since one teacher = one subject
 */
subjectRouter.get(
  "/teachers/:teacherId/subject",
  validate(getTeacherSubjectSchema),
  getTeacherSubject
);

export default subjectRouter;