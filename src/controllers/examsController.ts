// controllers/examinationController.ts

import { RequestHandler } from "express";
import { db } from "../db";
import { bulkMarkingSessions, examinations, examResults, examSchedules } from "../db/schema/examination";
import type { NewExamination } from "../db/schema/examination";


import { classes } from "../db/schema/classes";
import { subjects } from "../db/schema/subjects";
import { students } from "../db/schema/students";
import { teachers } from "../db/schema/teacher";
import { eq, and, inArray, desc } from "drizzle-orm";
import { BulkCreateExamScheduleInput, BulkMarkStudentsInput, CreateExaminationInput, CreateExamScheduleInput, UpdateStudentMarkInput } from "../validators/examValidators";



// Helper function to calculate grade
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}
export const createExamination: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      type,
      academicYear,
      term,
      startDate,
      endDate,
      description,
      instructions,
    } = req.body;
    // @ts-ignore
    const adminId = req.user?.id;

    const [examination] = await db
      .insert(examinations)
      .values({
        name,
        type,
        academicYear,
        term: term || null,
        startDate: new Date(startDate).toISOString().substring(0, 10) as any,
        endDate: new Date(endDate).toISOString().substring(0, 10) as any,
        description: description || null,
        instructions: instructions || null,
        status: "scheduled" as any,
        createdBy: adminId,
      } as any) // ← Nuclear option
      .returning();

    res.status(201).json({
      success: true,
      message: "Examination created successfully",
      data: examination,
    });
  } catch (error) {
    console.error("createExamination error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create examination",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ─── 2. CREATE EXAM SCHEDULE ────────────────────────────────────
export const createExamSchedule: RequestHandler = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const {
      classId,
      subjectId,
      examDate,
      startTime,
      endTime,
      duration,
      roomNumber,
      totalMarks,
      passingMarks,
      invigilators,
      instructions,
    }: CreateExamScheduleInput["body"] = req.body;

    if(examinationId===undefined){
      return res.status(400).json({
        success: false,
        message: "Examination ID is required",
      });
    }

    // Verify examination exists
    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examinationId))
      .limit(1);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Examination not found",
      });
    }

    // Get class details
    const [classData] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Get subject details
    const [subjectData] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Verify invigilators exist
    const invigilatorRecords = await db
      .select()
      .from(teachers)
      .where(inArray(teachers.id, invigilators));

    if (invigilatorRecords.length !== invigilators.length) {
      return res.status(404).json({
        success: false,
        message: "One or more invigilators not found",
      });
    }

    // Create schedule
    const [schedule] = await db
      .insert(examSchedules)
      .values({
        examinationId,
        classId,
        classNumber: classData.classNumber,
        subjectId,
        subjectName: subjectData.name,
        date:  new Date(examDate).toISOString().substring(0, 10) as any,
        startTime,
        endTime,
        duration,
        roomNumber,
        totalMarks,
        passingMarks,
        invigilators,
        instructions,
        status: "scheduled",
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Exam schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("createExamSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exam schedule",
    });
  }
};

// ─── 3. BULK CREATE EXAM SCHEDULES ──────────────────────────────
export const bulkCreateExamSchedules: RequestHandler = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const { schedules }: BulkCreateExamScheduleInput["body"] = req.body;


    if(examinationId===undefined){
      return res.status(400).json({
        success: false,
        message: "Examination ID is required",
      });
    }

    // Verify examination exists
    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examinationId))
      .limit(1);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Examination not found",
      });
    }

    const schedulesToCreate = [];

    for (const schedule of schedules) {
      // Get class details
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, schedule.classId))
        .limit(1);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: `Class ${schedule.classId} not found`,
        });
      }

      // Get subject details
      const [subjectData] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, schedule.subjectId))
        .limit(1);

      if (!subjectData) {
        return res.status(404).json({
          success: false,
          message: `Subject ${schedule.subjectId} not found`,
        });
      }

      schedulesToCreate.push({
        examinationId,
        classId: schedule.classId,
        classNumber: classData.classNumber,
        subjectId: schedule.subjectId,
        subjectName: subjectData.name,
        date:  new Date(schedule.examDate).toISOString().substring(0, 10) as any,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.duration,
        roomNumber: schedule.roomNumber,
        totalMarks: schedule.totalMarks,
        passingMarks: schedule.passingMarks,
        invigilators: schedule.invigilators,
        instructions: schedule.instructions,
        status: "scheduled",
      });
    }

    const created = await db.insert(examSchedules).values(schedulesToCreate).returning();

    res.status(201).json({
      success: true,
      message: `${created.length} exam schedules created successfully`,
      data: created,
    });
  } catch (error) {
    console.error("bulkCreateExamSchedules error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exam schedules",
    });
  }
};

// ─── 4. BULK MARK STUDENTS ──────────────────────────────────────
export const bulkMarkStudents: RequestHandler = async (req, res) => {
  try {
    const { examScheduleId, marks }: BulkMarkStudentsInput = req.body;
    // @ts-ignore
    const teacherId = req.user?.id;

    // Get exam schedule
    const [schedule] = await db
      .select()
      .from(examSchedules)
      .where(eq(examSchedules.id, examScheduleId))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found",
      });
    }

    // Verify all students exist and belong to the class
    const studentIds = marks.map((m: { studentId: any; }) => m.studentId);
    const studentsData = await db
      .select()
      .from(students)
      .where(inArray(students.id, studentIds));

    if (studentsData.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more students not found",
      });
    }

    // Verify students belong to the class
    const invalidStudents = studentsData.filter((s) => s.classId !== schedule.classId);
    if (invalidStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some students do not belong to this class",
      });
    }

    const resultsToCreate = [];
    let absentCount = 0;

    for (const mark of marks) {
      if (mark.status === "absent") {
        absentCount++;
      }

      // Calculate percentage and grade
      const percentage = mark.status === "absent" 
        ? "0.00" 
        : ((mark.obtainedMarks / schedule.totalMarks) * 100).toFixed(2);
      
      const grade = mark.status === "absent" 
        ? "F" 
        : calculateGrade(parseFloat(percentage));

      // Determine pass/fail status
      let status = mark.status;
      if (status !== "absent") {
        status = mark.obtainedMarks >= schedule.passingMarks ? "pass" : "fail";
      }

      resultsToCreate.push({
        examScheduleId,
        examinationId: schedule.examinationId,
        studentId: mark.studentId,
        classId: schedule.classId,
        classNumber: schedule.classNumber,
        subjectId: schedule.subjectId,
        obtainedMarks: mark.status === "absent" ? 0 : mark.obtainedMarks,
        totalMarks: schedule.totalMarks,
        percentage,
        grade,
        status,
        markedBy: teacherId,
        remarks: mark.remarks,
      });
    }

    // Insert results (using upsert in case of re-marking)
    const created = await db
      .insert(examResults)
      .values(resultsToCreate)
      .onConflictDoUpdate({
        target: [examResults.examScheduleId, examResults.studentId],
        set: {
          obtainedMarks: examResults.obtainedMarks,
          percentage: examResults.percentage,
          grade: examResults.grade,
          status: examResults.status,
          markedBy: examResults.markedBy,
          remarks: examResults.remarks,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Create bulk marking session record
    await db.insert(bulkMarkingSessions).values({
      examScheduleId,
      examinationId: schedule.examinationId,
      classId: schedule.classId,
      classNumber: schedule.classNumber,
      subjectId: schedule.subjectId,
      totalStudents: marks.length,
      studentsMarked: marks.length - absentCount,
      studentsAbsent: absentCount,
      markedBy: teacherId,
    });

    res.status(201).json({
      success: true,
      message: `${created.length} students marked successfully`,
      data: {
        totalMarked: created.length,
        present: marks.length - absentCount,
        absent: absentCount,
      },
    });
  } catch (error) {
    console.error("bulkMarkStudents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark students",
    });
  }
};

// ─── 5. GET EXAMINATIONS ────────────────────────────────────────
export const getExaminations: RequestHandler = async (req, res) => {
  try {
    const { academicYear, examType, status } = req.query;

    const conditions = [];
    if (academicYear) conditions.push(eq(examinations.academicYear, Number(academicYear)));
    if (examType) conditions.push(eq(examinations.type, String(examType)));
    if (status) conditions.push(eq(examinations.status, String(status)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const exams = await db
      .select()
      .from(examinations)
      .where(whereClause)
      .orderBy(desc(examinations.academicYear), desc(examinations.startDate));

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error("getExaminations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch examinations",
    });
  }
};

// ─── 6. GET EXAM SCHEDULES ──────────────────────────────────────
export const getExamSchedules: RequestHandler = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const { classId, subjectId, status } = req.query;

    if(!examinationId){
      return res.status(400).json({
        success: false,
        message: "Examination ID is required",
      });
    }

    const conditions = [eq(examSchedules.examinationId, examinationId)];
    if (classId) conditions.push(eq(examSchedules.classId, String(classId)));
    if (subjectId) conditions.push(eq(examSchedules.subjectId, String(subjectId)));
    if (status) conditions.push(eq(examSchedules.status, String(status)));

    const schedules = await db
      .select()
      .from(examSchedules)
      .where(and(...conditions))
      .orderBy(examSchedules.date, examSchedules.startTime);

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error("getExamSchedules error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam schedules",
    });
  }
};

// ─── 7. GET EXAM RESULTS ────────────────────────────────────────
export const getExamResults: RequestHandler = async (req, res) => {
  try {
    const { examinationId, examScheduleId, studentId, classId } = req.query;

    const conditions = [];
    if (examinationId) conditions.push(eq(examResults.examinationId, String(examinationId)));
    if (examScheduleId) conditions.push(eq(examResults.examScheduleId, String(examScheduleId)));
    if (studentId) conditions.push(eq(examResults.studentId, String(studentId)));
    if (classId) conditions.push(eq(examResults.classId, String(classId)));

    if (conditions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one filter parameter is required",
      });
    }

    const results = await db
      .select()
      .from(examResults)
      .where(and(...conditions))
      .orderBy(examResults.classNumber, examResults.studentId);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("getExamResults error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam results",
    });
  }
};

// ─── 8. GET STUDENT EXAM REPORT ─────────────────────────────────
export const getStudentExamReport: RequestHandler = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examinationId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Verify student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const conditions = [eq(examResults.studentId, studentId)];
    if (examinationId) conditions.push(eq(examResults.examinationId, String(examinationId)));

    const results = await db
      .select()
      .from(examResults)
      .where(and(...conditions))
      .orderBy(examResults.classNumber);

    // Calculate overall statistics
    const totalSubjects = results.length;
    const passedSubjects = results.filter((r) => r.status === "pass").length;
    const failedSubjects = results.filter((r) => r.status === "fail").length;
    const absentSubjects = results.filter((r) => r.status === "absent").length;

    const totalObtained = results
      .filter((r) => r.status !== "absent")
      .reduce((sum, r) => sum + r.obtainedMarks, 0);
    
    const totalMarks = results
      .filter((r) => r.status !== "absent")
      .reduce((sum, r) => sum + r.totalMarks, 0);

    const overallPercentage = totalMarks > 0 
      ? ((totalObtained / totalMarks) * 100).toFixed(2) 
      : "0.00";

    res.status(200).json({
      success: true,
      data: {
        studentId,
        studentName: student.name,
        results,
        summary: {
          totalSubjects,
          passedSubjects,
          failedSubjects,
          absentSubjects,
          totalObtained,
          totalMarks,
          overallPercentage,
          overallGrade: calculateGrade(parseFloat(overallPercentage)),
        },
      },
    });
  } catch (error) {
    console.error("getStudentExamReport error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student exam report",
    });
  }
};

// ─── 9. UPDATE EXAMINATION ──────────────────────────────────────
export const updateExamination: RequestHandler = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const updateData = req.body;

    if (!examinationId) {
      return res.status(400).json({
        success: false,
        message: "Examination ID is required",
      });
    }

    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examinationId))
      .limit(1);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Examination not found",
      });
    }

    const [updated] = await db
      .update(examinations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(examinations.id, examinationId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Examination updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateExamination error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update examination",
    });
  }
};

// ─── 10. UPDATE EXAM SCHEDULE ───────────────────────────────────
export const updateExamSchedule: RequestHandler = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID is required",
      });
    }

    const [schedule] = await db
      .select()
      .from(examSchedules)
      .where(eq(examSchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found",
      });
    }

    const [updated] = await db
      .update(examSchedules)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(examSchedules.id, scheduleId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Exam schedule updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateExamSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update exam schedule",
    });
  }
};

// ─── 11. DELETE EXAMINATION ─────────────────────────────────────
export const deleteExamination: RequestHandler = async (req, res) => {
  try {
    const { examinationId } = req.params;

    if (!examinationId) {
      return res.status(400).json({
        success: false,
        message: "Examination ID is required",
      });
    }

    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examinationId))
      .limit(1);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Examination not found",
      });
    }

    // Check if there are any results
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.examinationId, examinationId))
      .limit(1);

    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete examination with existing results",
      });
    }

    await db.delete(examinations).where(eq(examinations.id, examinationId));

    res.status(200).json({
      success: true,
      message: "Examination deleted successfully",
    });
  } catch (error) {
    console.error("deleteExamination error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete examination",
    });
  }
};

// ─── 12. DELETE EXAM SCHEDULE ───────────────────────────────────
export const deleteExamSchedule: RequestHandler = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID is required",
      });
    }

    const [schedule] = await db
      .select()
      .from(examSchedules)
      .where(eq(examSchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Exam schedule not found",
      });
    }

    // Check if there are any results
    const results = await db
      .select()
      .from(examResults)
      .where(eq(examResults.examScheduleId, scheduleId))
      .limit(1);

    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete schedule with existing results",
      });
    }

    await db.delete(examSchedules).where(eq(examSchedules.id, scheduleId));

    res.status(200).json({
      success: true,
      message: "Exam schedule deleted successfully",
    });
  } catch (error) {
    console.error("deleteExamSchedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete exam schedule",
    });
  }
};

// ─── 13. GET CLASS EXAM SUMMARY ─────────────────────────────────
export const getClassExamSummary: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const { examinationId } = req.query;

    if (!classId || !examinationId) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Examination ID are required",
      });
    }

    const results = await db
      .select()
      .from(examResults)
      .where(
        and(
          eq(examResults.classId, classId),
          eq(examResults.examinationId, String(examinationId))
        )
      );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found for this class",
      });
    }

    // Group by subject
    const subjectStats: any = {};
    
    results.forEach((result) => {
      const subjectId = result.subjectId;
      
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subjectId,
          totalStudents: 0,
          passed: 0,
          failed: 0,
          absent: 0,
          totalObtained: 0,
          totalMarks: 0,
        };
      }
      
      subjectStats[subjectId].totalStudents++;
      
      if (result.status === "pass") subjectStats[subjectId].passed++;
      else if (result.status === "fail") subjectStats[subjectId].failed++;
      else if (result.status === "absent") subjectStats[subjectId].absent++;
      
      subjectStats[subjectId].totalObtained += result.obtainedMarks;
      subjectStats[subjectId].totalMarks += result.totalMarks;
    });

    // Calculate averages
    Object.values(subjectStats).forEach((stat: any) => {
      stat.averagePercentage = ((stat.totalObtained / stat.totalMarks) * 100).toFixed(2);
    });

    res.status(200).json({
      success: true,
      data: {
        classId,
        examinationId,
        subjects: Object.values(subjectStats),
        overall: {
          totalStudents: new Set(results.map((r) => r.studentId)).size,
          totalSubjects: Object.keys(subjectStats).length,
        },
      },
    });
  } catch (error) {
    console.error("getClassExamSummary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class exam summary",
    });
  }
};

// ─── 14. UPDATE STUDENT MARK ────────────────────────────────────
export const updateStudentMark: RequestHandler = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { obtainedMarks, status, remarks }: UpdateStudentMarkInput["body"] = req.body;
    // @ts-ignore
    const teacherId = req.user?.id;

    if (!resultId) {
      return res.status(400).json({
        success: false,
        message: "Result ID is required",
      });
    }

    const [result] = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, resultId))
      .limit(1);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Get schedule for total marks
    const [schedule] = await db
      .select()
      .from(examSchedules)
      .where(eq(examSchedules.id, result.examScheduleId))
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const newObtainedMarks = obtainedMarks ?? result.obtainedMarks;
    const newStatus = status ?? result.status;
    
    const percentage = ((newObtainedMarks / result.totalMarks) * 100).toFixed(2);
    const grade = calculateGrade(parseFloat(percentage));

    const [updated] = await db
      .update(examResults)
      .set({
        obtainedMarks: newObtainedMarks,
        percentage,
        grade,
        status: newStatus,
        remarks: remarks ?? result.remarks,
        markedBy: teacherId,
        updatedAt: new Date(),
      })
      .where(eq(examResults.id, resultId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Student mark updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateStudentMark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student mark",
    });
  }
};