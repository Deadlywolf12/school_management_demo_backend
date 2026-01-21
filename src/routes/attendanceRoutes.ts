import express from "express";
import {
  getAttendance,
  getUserMonthlyAttendance,
  getDailyAttendanceByRole,
  getDailyAttendanceSummary,
} from "../controllers/attendanceController";

const attendanceRouter = express.Router();

/**
 * @route   GET /api/attendance
 * @desc    Get attendance with flexible filters
 * @query   userId, role, date, startDate, endDate, month, year, status
 * @example /api/attendance?userId=123
 * @example /api/attendance?role=teacher&date=2024-01-15
 * @example /api/attendance?userId=123&month=1&year=2024
 * @example /api/attendance?startDate=2024-01-01&endDate=2024-01-31
 */
attendanceRouter.get("/", getAttendance);

/**
 * @route   GET /api/attendance/user/:userId/monthly
 * @desc    Get user's attendance for current month
 * @params  userId
 * @example /api/attendance/user/123/monthly
 */
attendanceRouter.get("/user/:userId/monthly", getUserMonthlyAttendance);

/**
 * @route   GET /api/attendance/daily/:role
 * @desc    Get daily attendance by role
 * @params  role (student | teacher | staff)
 * @query   date (optional, defaults to today)
 * @example /api/attendance/daily/teacher
 * @example /api/attendance/daily/student?date=2024-01-15
 */
attendanceRouter.get("/daily/:role", getDailyAttendanceByRole);

/**
 * @route   GET /api/attendance/daily-summary
 * @desc    Get attendance summary for all roles for a specific date
 * @query   date (optional, defaults to today)
 * @example /api/attendance/daily-summary
 * @example /api/attendance/daily-summary?date=2024-01-15
 */
attendanceRouter.get("/daily-summary", getDailyAttendanceSummary);

export default attendanceRouter;