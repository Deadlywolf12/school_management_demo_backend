import express from "express";
import { authorize, authorizeAttendanceMarking, authorizeBulkAttendanceMarking, validate } from "../middleware/validate";
import { deleteAttendanceSchema, getAttendanceSchema, getDailyAttendanceByRoleSchema, getUserMonthlyAttendanceSchema, markAttendanceSchema, markBulkAttendanceSchema, updateAttendanceSchema } from "../validators/attendanceValidators";
import { deleteAttendance, getAttendance, getDailyAttendanceByRole, getDailyAttendanceSummary, getUserMonthlyAttendance, markAttendance, markBulkAttendance, updateAttendance } from "../controllers/attendanceController";
import { auth } from "../middleware/auth";

// import { authenticate } from "../middlewares/authMiddleware"; // Your auth middleware

const attendanceRouter = express.Router();

// Note: Add authenticate middleware to all routes if you have one
// Example: router.use(authenticate);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance with flexible filters
 * @access  Admin, Teacher
 */
attendanceRouter.get(
  "/",
  auth,
  authorize("admin", "teacher"),
  validate(getAttendanceSchema),
  getAttendance
);

/**
 * @route   GET /api/attendance/user/:userId/monthly
 * @desc    Get user's attendance for current month
 * @access  Admin, Teacher, User (self)
 */
attendanceRouter.get(
  "/user/:userId/monthly",
 auth,
  validate(getUserMonthlyAttendanceSchema),
  getUserMonthlyAttendance
);

/**
 * @route   GET /api/attendance/daily/:role
 * @desc    Get daily attendance by role
 * @access  Admin, Teacher
 */
attendanceRouter.get(
  "/daily/:role",
  auth,
  authorize("admin", "teacher"),
  validate(getDailyAttendanceByRoleSchema),
  getDailyAttendanceByRole
);

/**
 * @route   GET /api/attendance/daily-summary
 * @desc    Get attendance summary for all roles
 * @access  Admin
 */
attendanceRouter.get(
  "/daily-summary",
  auth,
  authorize("admin"),
  getDailyAttendanceSummary
);

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark new attendance
 * @access  Admin (all roles), Teacher (students only)
 */
attendanceRouter.post(
  "/mark",
   auth,
  validate(markAttendanceSchema),
  authorizeAttendanceMarking,
  markAttendance
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update existing attendance
 * @access  Admin (all), Teacher (students only)
 */
attendanceRouter.put(
  "/:id",
  auth,
  validate(updateAttendanceSchema),
  authorize("admin", "teacher"),
  updateAttendance
);

/**
 * @route   POST /api/attendance/mark-bulk
 * @desc    Mark attendance for multiple users
 * @access  Admin (all roles), Teacher (students only)
 */
attendanceRouter.post(
  "/mark-bulk",
  auth,
  validate(markBulkAttendanceSchema),
  authorizeBulkAttendanceMarking,
  markBulkAttendance
);

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete attendance record
 * @access  Admin only
 */
attendanceRouter.delete(
  "/:id",
   auth,
  authorize("admin"),
  validate(deleteAttendanceSchema),
  deleteAttendance
);

export default attendanceRouter;