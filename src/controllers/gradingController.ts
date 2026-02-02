// controllers/gradingController.ts

import { RequestHandler } from "express";
import { AddGradeInput, UpdateClassSubjectsInput } from "../validators/gradingValidators";
import { calculateGradeSummary } from "../helpers/gradesHelper";
import { classSubjects, studentGrades } from "../db/schema/grades";
import { db } from "../db";
import { and, asc, eq } from "drizzle-orm";
import { students } from "../db/schema/students";



// ─── 1. UPDATE CLASS SUBJECTS  (Admin) ───────────────────────────
export const updateClassSubjects: RequestHandler = async (req, res) => {
  try {
    const { classNumber, subjects }: UpdateClassSubjectsInput = req.body;

    const updated = await db
      .update(classSubjects)
      .set({
        subjectsId: subjects,
        updatedAt: new Date(),
      })
      .where(eq(classSubjects.classNumber, classNumber))
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        success: false,
        message: `Class ${classNumber} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Subjects updated for class ${classNumber}`,
      data: updated[0],
    });
  } catch (error) {
    console.error("updateClassSubjects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update class subjects",
    });
  }
};

export const getClassSubjects: RequestHandler = async (req, res) => {
  try {
    const classNumber = Number(req.params.classNumber);

    if (isNaN(classNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class number",
      });
    }

    const [record] = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classNumber, classNumber))
      .limit(1);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No subjects found for class ${classNumber}`,
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("getClassSubjects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class subjects",
    });
  }
};


// ─── 3. ADD / UPDATE GRADE  (Admin) ──────────────────────────────

export const addGrade: RequestHandler = async (req, res) => {
  try {
    const { studentId, classNumber, year, subjects }: AddGradeInput = req.body;

    // 1. Verify student exists
  const studentVerify = await db.select().from(students).where(eq(students.id, studentId)).limit(1);

  if (studentVerify.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Student with ID ${studentId} not found`,
    });
  }

   // 2. Verify subjects match what is configured for that class
const [classRecord] = await db
  .select()
  .from(classSubjects)
  .where(eq(classSubjects.classNumber, classNumber))
  .limit(1);

if (!classRecord) {
  return res.status(404).json({
    success: false,
    message: `Class ${classNumber} not found`,
  });
}

const allowedSubjects = classRecord.subjectsId; // uuid[]

const invalidSubjects = subjects.filter(
  (s) => !allowedSubjects.includes(s.subject)
);

if (invalidSubjects.length) {
  return res.status(400).json({
    success: false,
    message: `Invalid subjects for class ${classNumber}: ${invalidSubjects
      .map((s) => s.subject)
      .join(", ")}`,
  });
}

const subjectsWithId = subjects.map(s => ({
  subjectId: s.subject, 
  obtainedMarks: s.obtainedMarks,
  totalMarks: s.totalMarks,
}));
 // 3. Calculate grade summary for the response
const gradeSummary = calculateGradeSummary(subjectsWithId);
const dbGradeSummary = {
  totalObtained: gradeSummary.totalObtained.toString(),
  totalMarks: gradeSummary.totalMarks.toString(),
  percentage: gradeSummary.percentage.toString(),
  grade: gradeSummary.grade,
};


// 4. Upsert grade record (one row per student + classNumber + year)
await db
  .insert(studentGrades)
  .values({
    studentId,
    classNumber,
    year,
    subjectsName: JSON.stringify(subjects),
    ...dbGradeSummary,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [
      studentGrades.studentId,
      studentGrades.classNumber,
      studentGrades.year,
    ],
    set: {
      subjectsName: JSON.stringify(subjects),
      ...dbGradeSummary,
      updatedAt: new Date(),
    },
  });



    res.status(201).json({
      success: true,
      message: "Grade added successfully",
      data: {
        studentId,
        classNumber,
        year,
        ...dbGradeSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add grade" });
  }
};


export const getStudentGrade: RequestHandler = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const classNumber = req.query.classNumber ? Number(req.query.classNumber) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    // Build dynamic where clause
    const whereConditions = [eq(studentGrades.studentId, studentId)];
    if (classNumber) whereConditions.push(eq(studentGrades.classNumber, classNumber));
    if (year) whereConditions.push(eq(studentGrades.year, year));

    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Fetch grades
    const grades = await db
      .select()
      .from(studentGrades)
      .where(whereClause)
      .orderBy(asc(studentGrades.classNumber));

    if (grades.length === 0) {
      return res.status(404).json({ success: false, message: "No grades found" });
    }

    // Recalculate summary for each record so it's always fresh
    const result = grades.map((g) => {
      const subjects = JSON.parse(g.subjectsName); // g.subjects is JSON string
      const summary = calculateGradeSummary(subjects);

      return {
        classNumber: g.classNumber,
        year: g.year,
        ...summary,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("getStudentGrade error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student grade" });
  }
};

// ─── 5. GET STUDENT OVERALL RESULT  (Auth) ───────────────────────
export const getStudentOverallResult: RequestHandler = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    // Verify student exists
    const studentVerify = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentVerify.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    // Fetch all grade records ordered by classNumber asc
    const grades = await db
      .select()
      .from(studentGrades)
      .where(eq(studentGrades.studentId, studentId))
      .orderBy(asc(studentGrades.classNumber));

    if (grades.length === 0) {
      return res.status(404).json({ success: false, message: "No grades found for this student" });
    }

    // Build per-class summaries (same pattern as getStudentGrade)
    const classResults = grades.map((g) => {
      const subjects = JSON.parse(g.subjectsName);
      const summary = calculateGradeSummary(subjects);

      return {
        classNumber: g.classNumber,
        year:        g.year,
        ...summary,
      };
    });

    // Lifetime totals across ALL classes
    const lifetimeTotalObtained = classResults.reduce((s, c) => s + c.totalObtained, 0);
    const lifetimeTotalMarks    = classResults.reduce((s, c) => s + c.totalMarks,    0);
    const lifetimePercentage    = lifetimeTotalMarks > 0
      ? parseFloat(((lifetimeTotalObtained / lifetimeTotalMarks) * 100).toFixed(2))
      : 0;

    function letterGrade(pct: number): string {
      if (pct >= 90) return "A+";
      if (pct >= 80) return "A";
      if (pct >= 70) return "B+";
      if (pct >= 60) return "B";
      if (pct >= 50) return "C";
      if (pct >= 40) return "D";
      return "F";
    }

    res.status(200).json({
      success: true,
      data: {
        studentId,
        classResults,
        lifetime: {
          totalObtained: lifetimeTotalObtained,
          totalMarks:    lifetimeTotalMarks,
          percentage:    lifetimePercentage,
          grade:         letterGrade(lifetimePercentage),
        },
      },
    });
  } catch (error) {
    console.error("getStudentOverallResult error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch overall result" });
  }
};