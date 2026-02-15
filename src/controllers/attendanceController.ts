import { db } from "../db";
import { attendance } from "../db/schema/attendance";
import { users } from "../db/schema/users";
import { teachers } from "../db/schema/teacher";
import { students } from "../db/schema/students";
import { staff } from "../db/schema/staff";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { Request, Response } from "express";

// Helper function to get user name from role-specific table
async function getUserNameByRole(userId: string, role: string): Promise<string> {
  try {
    if (role === "teacher") {
      const [teacher] = await db
        .select({ name: teachers.name })
        .from(teachers)
        .where(eq(teachers.userId, userId))
        .limit(1);
      return teacher?.name || "Unknown";
    } else if (role === "student") {
      const [student] = await db
        .select({ name: students.name })
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);
      return student?.name || "Unknown";
    } else if (role === "staff") {
      const [staffMember] = await db
        .select({ name: staff.name })
        .from(staff)
        .where(eq(staff.userId, userId))
        .limit(1);
      return staffMember?.name || "Unknown";
    }
    return "Unknown";
  } catch (err) {
    console.error(`Error fetching name for user ${userId}:`, err);
    return "Unknown";
  }
}

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

    // Fetch names from role-specific tables
    const enrichedRecords = await Promise.all(
      attendanceRecords.map(async (record) => ({
        ...record,
        userName: await getUserNameByRole(record.userId, record.role),
      }))
    );

    // Calculate statistics
    const stats = {
      total: enrichedRecords.length,
      present: enrichedRecords.filter((r) => r.status === "present").length,
      absent: enrichedRecords.filter((r) => r.status === "absent").length,
      late: enrichedRecords.filter((r) => r.status === "late").length,
      leave: enrichedRecords.filter((r) => r.status === "leave").length,
    };

    return res.status(200).json({
      success: true,
      data: enrichedRecords,
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
export const getUserMonthlyAttendance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Validate userId exists
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Authorization: Users can only view their own, admin/teacher can view all
    const currentUser = (req as any).user;
    const isAdmin = currentUser.role === "admin";
    const isTeacher = currentUser.role === "teacher";
    const isSelf = currentUser.id === userId;

    if (!isAdmin && !isTeacher && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this attendance",
      });
    }

    // Use provided month/year or default to current
    const targetMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

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
      month: targetMonth + 1,
      year: targetYear,
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

    // Fetch names from role-specific tables
    const enrichedRecords = await Promise.all(
      attendanceRecords.map(async (record) => ({
        ...record,
        userName: await getUserNameByRole(record.userId, record.role),
      }))
    );

    const stats = {
      total: enrichedRecords.length,
      present: enrichedRecords.filter((r) => r.status === "present").length,
      absent: enrichedRecords.filter((r) => r.status === "absent").length,
      late: enrichedRecords.filter((r) => r.status === "late").length,
      leave: enrichedRecords.filter((r) => r.status === "leave").length,
      attendanceRate:
        enrichedRecords.length > 0
          ? (
              (enrichedRecords.filter((r) => r.status === "present").length /
                enrichedRecords.length) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };

    return res.status(200).json({
      success: true,
      data: enrichedRecords,
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



export const markAttendance = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      role,
      date,
      status,
      remarks,
      checkInTime,
      checkOutTime,
      markedBy,
    } = req.body;

    // Validate required fields
    if (!userId || !role || !status) {
      return res.status(400).json({
        success: false,
        message: "userId, role, and status are required",
      });
    }

    // Validate role
    const validRoles = ["student", "teacher", "staff", "admin", "parent"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Validate status
    const validStatuses = ["present", "absent", "late", "leave"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Parse date or use current date
    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    // Check if attendance already exists for this date
    const [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );

    if (existingAttendance) {
      // UPDATE existing attendance
      const updated = await db
        .update(attendance)
        .set({
          status,
          remarks: remarks || existingAttendance.remarks,
          checkInTime: checkInTime ? new Date(checkInTime) : existingAttendance.checkInTime,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : existingAttendance.checkOutTime,
          markedBy: markedBy || existingAttendance.markedBy,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existingAttendance.id))
        .returning();

      // Validate update result
      if (!updated || updated.length === 0 || !updated[0]) {
        return res.status(500).json({
          success: false,
          message: "Failed to update attendance record",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Attendance updated successfully",
        data: updated[0],
      });
    }

    // CREATE NEW attendance record
    const newAttendance = await db
      .insert(attendance)
      .values({
        userId,
        role,
        date: attendanceDate,
        status,
        remarks: remarks || "",
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        markedBy: markedBy || null,
      })
      .returning();

    // Validate insert result
    if (!newAttendance || newAttendance.length === 0 || !newAttendance[0]) {
      return res.status(500).json({
        success: false,
        message: "Failed to create attendance record",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: newAttendance[0],
    });
  } catch (err: unknown) {
    console.error("Mark attendance error:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      remarks,
      checkInTime,
      checkOutTime,
      markedBy,
    } = req.body;

    // Validate attendance ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Attendance ID is required",
      });
    }

    // Check if attendance exists
    const [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["present", "absent", "late", "leave"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (checkInTime !== undefined) updateData.checkInTime = checkInTime ? new Date(checkInTime) : null;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    if (markedBy !== undefined) updateData.markedBy = markedBy;

    // EXECUTE THE UPDATE (This was missing!)
    const updated = await db
      .update(attendance)
      .set(updateData)
      .where(eq(attendance.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: updated[0],
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    // Accept both 'records' and 'attendanceList' for flexibility
    const { records, attendanceList, markedBy } = req.body;
    const listToProcess = records || attendanceList;

    if (!listToProcess || !Array.isArray(listToProcess) || listToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance list must be a non-empty array",
      });
    }

    const results: {
      success: Array<{ userId: string; attendanceId: string; action: 'created' | 'updated' }>;
      failed: Array<{ userId: string; error: string }>;
    } = {
      success: [],
      failed: [],
    };

    // Process each attendance entry
    for (const entry of listToProcess) {
      try {
        const { userId, role, date, status, remarks, checkInTime, checkOutTime } = entry;

        // Validate required fields
        if (!userId || !role || !status) {
          results.failed.push({
            userId: userId || "unknown",
            error: "userId, role, and status are required",
          });
          continue;
        }

        // Parse date or use current date
        const attendanceDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

        // Check if attendance already exists
        const [existingAttendance] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.userId, userId),
              gte(attendance.date, startOfDay),
              lte(attendance.date, endOfDay)
            )
          );

        if (existingAttendance) {
          // Update existing attendance
          const updated = await db
            .update(attendance)
            .set({
              status,
              remarks: remarks || existingAttendance.remarks,
              checkInTime: checkInTime ? new Date(checkInTime) : existingAttendance.checkInTime,
              checkOutTime: checkOutTime ? new Date(checkOutTime) : existingAttendance.checkOutTime,
              markedBy: markedBy || existingAttendance.markedBy,
              updatedAt: new Date(),
            })
            .where(eq(attendance.id, existingAttendance.id))
            .returning();

          // Check if update was successful
          if (!updated || updated.length === 0 || !updated[0]) {
            results.failed.push({
              userId,
              error: "Failed to update attendance record",
            });
            continue;
          }

          results.success.push({
            userId,
            attendanceId: updated[0].id,
            action: 'updated',
          });
        } else {
          // Create new attendance record
          const newAttendance = await db
            .insert(attendance)
            .values({
              userId,
              role,
              date: attendanceDate,
              status,
              remarks: remarks || "",
              checkInTime: checkInTime ? new Date(checkInTime) : null,
              checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
              markedBy: markedBy || null,
            })
            .returning();

          // Check if insertion was successful
          if (!newAttendance || newAttendance.length === 0 || !newAttendance[0]) {
            results.failed.push({
              userId,
              error: "Failed to create attendance record",
            });
            continue;
          }

          results.success.push({
            userId,
            attendanceId: newAttendance[0].id,
            action: 'created',
          });
        }
      } catch (err) {
        console.error(`Error processing attendance for user ${entry.userId}:`, err);
        results.failed.push({
          userId: entry.userId || "unknown",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Return results
    const totalProcessed = results.success.length + results.failed.length;
    const successCount = results.success.length;
    const failedCount = results.failed.length;

    return res.status(200).json({
      success: true,
      message: `Processed ${totalProcessed} records: ${successCount} successful, ${failedCount} failed`,
      summary: {
        total: totalProcessed,
        successful: successCount,
        failed: failedCount,
        created: results.success.filter(r => r.action === 'created').length,
        updated: results.success.filter(r => r.action === 'updated').length,
      },
      results,
    });
  } catch (err: unknown) {
    console.error("Bulk attendance marking error:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
// Delete attendance record
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Attendance ID is required",
      });
    }

    // Check if attendance exists
    const [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Delete attendance
    await db.delete(attendance).where(eq(attendance.id, id));

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      deletedRecord: existingAttendance,
    });
  } catch (err: unknown) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};