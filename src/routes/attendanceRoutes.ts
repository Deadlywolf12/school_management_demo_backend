import express from "express";
import { 
  authorize, 
  authorizeAttendanceMarking, 
  authorizeBulkAttendanceMarking, 
  validate 
} from "../middleware/validate";
import { 
  deleteAttendanceSchema, 
  getAttendanceSchema, 
  getDailyAttendanceByRoleSchema, 
  getDailySummarySchema,
  getUserMonthlyAttendanceSchema, 
  markAttendanceSchema, 
  markBulkAttendanceSchema, 
  updateAttendanceSchema 
} from "../validators/attendanceValidators";
import { 
  deleteAttendance, 
  getAttendance, 
  getDailyAttendanceByRole, 
  getDailyAttendanceSummary, 
  getUserMonthlyAttendance, 
  markAttendance, 
  markBulkAttendance, 
  updateAttendance 
} from "../controllers/attendanceController";
import { auth } from "../middleware/auth";

const attendanceRouter = express.Router();

// Apply authentication to all routes
attendanceRouter.use(auth);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance with flexible filters (userId, role, date, month/year, status)
 * @access  Admin, Teacher
 * @query   ?userId=xxx&role=student&date=2024-01-15&month=1&year=2024&status=present
 */
attendanceRouter.get(
  "/",
  authorize("admin", "teacher"),
  validate(getAttendanceSchema),
  getAttendance
);

/**
 * @route   GET /api/attendance/daily-summary
 * @desc    Get attendance summary for all roles on a specific date
 * @access  Admin only
 * @query   ?date=2024-01-15 (optional, defaults to today)
 */
attendanceRouter.get(
  "/daily-summary",
  authorize("admin"),
  validate(getDailySummarySchema),
  getDailyAttendanceSummary
);

/**
 * @route   GET /api/attendance/daily/:role
 * @desc    Get daily attendance for specific role
 * @access  Admin, Teacher
 * @params  role - student/teacher/staff
 * @query   ?date=2024-01-15 (optional, defaults to today)
 */
attendanceRouter.get(
  "/daily/:role",
  authorize("admin", "teacher"),
  validate(getDailyAttendanceByRoleSchema),
  getDailyAttendanceByRole
);

/**
 * @route   GET /api/attendance/user/:userId/monthly
 * @desc    Get user's attendance for current or specified month
 * @access  Admin, Teacher, User (self)
 * @params  userId - User's UUID
 * @query   ?month=1&year=2024 (optional, defaults to current month)
 */
attendanceRouter.get(
  "/user/:userId/monthly",
  validate(getUserMonthlyAttendanceSchema),
  // Authorization handled in controller (user can view own, admin/teacher can view all)
  getUserMonthlyAttendance
);

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for a single user
 * @access  Admin (all roles), Teacher (students only)
 * @body    { userId, role, status, date?, remarks?, checkInTime?, checkOutTime? }
 */
attendanceRouter.post(
  "/mark",
  validate(markAttendanceSchema),
  authorizeAttendanceMarking,
  markAttendance
);

/**
 * @route   POST /api/attendance/mark-bulk
 * @desc    Mark attendance for multiple users at once
 * @access  Admin (all roles), Teacher (students only)
 * @body    { markedBy?, attendanceList: [{ userId, role, status, ... }] }
 */
attendanceRouter.post(
  "/mark-bulk",
  validate(markBulkAttendanceSchema),
  authorizeBulkAttendanceMarking,
  markBulkAttendance
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update existing attendance record
 * @access  Admin (all), Teacher (students only)
 * @params  id - Attendance record UUID
 * @body    { status?, remarks?, checkInTime?, checkOutTime?, markedBy? }
 */
attendanceRouter.put(
  "/:id",
  validate(updateAttendanceSchema),
  authorize("admin", "teacher"),
  updateAttendance
);

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete attendance record
 * @access  Admin only
 * @params  id - Attendance record UUID
 */
attendanceRouter.delete(
  "/:id",
  authorize("admin"),
  validate(deleteAttendanceSchema),
  deleteAttendance
);

export default attendanceRouter;