import { db } from "../db";
import { attendance } from "../db/schema/attendance";

import { users } from "../db/schema/users";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { Request, Response } from "express";

// Get attendance with flexible filters
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      role,
      date,
      startDate,
      endDate,
      month,
      year,
      status,
    } = req.query;

    // Build dynamic where conditions
    const conditions = [];

    // Filter by userId
    if (userId) {
      conditions.push(eq(attendance.userId, userId as string));
    }

    // Filter by role
    if (role) {
      conditions.push(eq(attendance.role, role as any));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(attendance.status, status as any));
    }

    // Filter by specific date (for daily attendance)
    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      conditions.push(gte(attendance.date, startOfDay));
      conditions.push(lte(attendance.date, endOfDay));
    }
    // Filter by date range
    else if (startDate && endDate) {
      conditions.push(gte(attendance.date, new Date(startDate as string)));
      conditions.push(lte(attendance.date, new Date(endDate as string)));
    }
    // Filter by month and year (default to current month if only userId is provided)
    else if (month && year) {
      const monthNum = parseInt(month as string) - 1; // JS months are 0-indexed
      const yearNum = parseInt(year as string);

      const startOfMonth = new Date(yearNum, monthNum, 1);
      const endOfMonth = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);

      conditions.push(gte(attendance.date, startOfMonth));
      conditions.push(lte(attendance.date, endOfMonth));
    }
    // Default: current month if userId is provided without date filters
    else if (userId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      conditions.push(gte(attendance.date, startOfMonth));
      conditions.push(lte(attendance.date, endOfMonth));
    }

    // Execute query with conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const attendanceRecords = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        role: attendance.role,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
    
        userEmail: users.email,
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(whereClause)
      .orderBy(desc(attendance.date));

    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "present").length,
      absent: attendanceRecords.filter((r) => r.status === "absent").length,
      late: attendanceRecords.filter((r) => r.status === "late").length,
      leave: attendanceRecords.filter((r) => r.status === "leave").length,
    };

    return res.status(200).json({
      success: true,
      data: attendanceRecords,
      stats,
      filters: {
        userId,
        role,
        date,
        startDate,
        endDate,
        month,
        year,
        status,
      },
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// Get attendance for a specific user for current month
export const getUserMonthlyAttendance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId exists
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfMonth),
          lte(attendance.date, endOfMonth)
        )
      )
      .orderBy(desc(attendance.date));

    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "present").length,
      absent: attendanceRecords.filter((r) => r.status === "absent").length,
      late: attendanceRecords.filter((r) => r.status === "late").length,
      leave: attendanceRecords.filter((r) => r.status === "leave").length,
      attendancePercentage:
        attendanceRecords.length > 0
          ? (
              (attendanceRecords.filter((r) => r.status === "present").length /
                attendanceRecords.length) *
              100
            ).toFixed(2)
          : "0.00",
    };

    return res.status(200).json({
      success: true,
      data: attendanceRecords,
      stats,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// Get daily attendance by role
export const getDailyAttendanceByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const { date } = req.query;

    // Validate role exists
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    // Validate role value
    const validRoles = ["student", "teacher", "staff", "admin", "parent"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Use provided date or default to today
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const attendanceRecords = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        role: attendance.role,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        markedBy: attendance.markedBy,
       
        userEmail: users.email,
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(
        and(
          eq(attendance.role, role as any),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      )
      .orderBy(desc(attendance.checkInTime));

    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "present").length,
      absent: attendanceRecords.filter((r) => r.status === "absent").length,
      late: attendanceRecords.filter((r) => r.status === "late").length,
      leave: attendanceRecords.filter((r) => r.status === "leave").length,
      attendanceRate:
        attendanceRecords.length > 0
          ? (
              (attendanceRecords.filter((r) => r.status === "present").length /
                attendanceRecords.length) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };

    return res.status(200).json({
      success: true,
      data: attendanceRecords,
      stats,
      role,
      date: targetDate.toISOString().split("T")[0],
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// Get attendance summary for all roles for a specific date
export const getDailyAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(and(gte(attendance.date, startOfDay), lte(attendance.date, endOfDay)));

    // Group by role
    const byRole = {
      student: attendanceRecords.filter((r) => r.role === "student"),
      teacher: attendanceRecords.filter((r) => r.role === "teacher"),
      staff: attendanceRecords.filter((r) => r.role === "staff"),
    };

    const summary = {
      date: targetDate.toISOString().split("T")[0],
      student: {
        total: byRole.student.length,
        present: byRole.student.filter((r) => r.status === "present").length,
        absent: byRole.student.filter((r) => r.status === "absent").length,
        late: byRole.student.filter((r) => r.status === "late").length,
        leave: byRole.student.filter((r) => r.status === "leave").length,
      },
      teacher: {
        total: byRole.teacher.length,
        present: byRole.teacher.filter((r) => r.status === "present").length,
        absent: byRole.teacher.filter((r) => r.status === "absent").length,
        late: byRole.teacher.filter((r) => r.status === "late").length,
        leave: byRole.teacher.filter((r) => r.status === "leave").length,
      },
      staff: {
        total: byRole.staff.length,
        present: byRole.staff.filter((r) => r.status === "present").length,
        absent: byRole.staff.filter((r) => r.status === "absent").length,
        late: byRole.staff.filter((r) => r.status === "late").length,
        leave: byRole.staff.filter((r) => r.status === "leave").length,
      },
      overall: {
        total: attendanceRecords.length,
        present: attendanceRecords.filter((r) => r.status === "present").length,
        absent: attendanceRecords.filter((r) => r.status === "absent").length,
        late: attendanceRecords.filter((r) => r.status === "late").length,
        leave: attendanceRecords.filter((r) => r.status === "leave").length,
      },
    };

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};