// controllers/classController.ts

import { RequestHandler } from "express";
import { db } from "../db";
import { classes } from "../db/schema/classes";
import { classSubjects } from "../db/schema/grades";
import { students } from "../db/schema/students";
import { subjects } from "../db/schema/subjects"; // Assuming you have this
import { eq, and, inArray } from "drizzle-orm";
import {
  CreateClassInput,
  UpdateClassInput,
  AddStudentsToClassInput,
  RemoveStudentsFromClassInput,
} from "../validators/classesValidator";
import { en } from "zod/v4/locales";

// ─── 1. CREATE CLASS ─────────────────────────────────────────────
export const createClass: RequestHandler = async (req, res) => {
  try {
    const {
      classNumber,
      section,
      classTeacherId,
      roomNumber,
      academicYear,
      maxCapacity,
      description,
      subjectIds,
    }: CreateClassInput = req.body;

    // 1. Check if class with same number and section already exists
    const existingClass = await db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.classNumber, classNumber),
          section ? eq(classes.section, section) : undefined
        )
      )
      .limit(1);

    if (existingClass.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Class ${classNumber}${section ? `-${section}` : ""} already exists`,
      });
    }

    // 2. Verify teacher exists (if provided)
    if (classTeacherId) {
      // Add teacher verification logic here
      // const teacher = await db.select().from(teachers).where(eq(teachers.id, classTeacherId));
      // if (!teacher.length) return res.status(404).json({...});
    }

    // 3. Create/Update class_subjects entry
    const existingSubjects = await db
      .select()
      .from(classSubjects)
      .where(eq(classSubjects.classNumber, classNumber))
      .limit(1);

    if (existingSubjects.length > 0) {
      // Update existing
      await db
        .update(classSubjects)
        .set({
          subjectsId: subjectIds,
          updatedAt: new Date(),
        })
        .where(eq(classSubjects.classNumber, classNumber));
    } else {
      // Create new
      await db.insert(classSubjects).values({
        classNumber,
        subjectsId: subjectIds,
      });
    }

    // 4. Create the class
    const [newClass] = await db
      .insert(classes)
      .values({
        classNumber,
        section: section || null,
        classTeacherId: classTeacherId || null,
        roomNumber,
        academicYear,
        maxCapacity: maxCapacity || 40,
        description: description || null,
        classSubjectsId: classNumber, // Reference to class_subjects table
        totalStudents: 0,
        studentIds: [],
        isActive: 1,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    console.error("createClass error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create class",
    });
  }
};

// ─── 2. UPDATE CLASS ─────────────────────────────────────────────
export const updateClass: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const updateData = req.body;


    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Verify class exists
    const existingClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (existingClass.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

 
    // if (updateData.classTeacherId) {
    //  db.
    // }

    // Update class
    const [updatedClass] = await db
      .update(classes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, classId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    console.error("updateClass error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update class",
    });
  }
};

// ─── 3. GET CLASS BY ID ──────────────────────────────────────────
export const getClassById: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

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

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("getClassById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class",
    });
  }
};

// ─── 4. GET ALL CLASSES ──────────────────────────────────────────
export const getAllClasses: RequestHandler = async (req, res) => {
  try {
    const { classNumber, academicYear, isActive, section } = req.query;

    // Build where conditions
    const conditions = [];
    if (classNumber) conditions.push(eq(classes.classNumber, Number(classNumber)));
    if (academicYear) conditions.push(eq(classes.academicYear, Number(academicYear)));
    if (isActive !== undefined) conditions.push(eq(classes.isActive, Number(isActive)));
    if (section) conditions.push(eq(classes.section, String(section)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allClasses = await db
      .select()
      .from(classes)
      .where(whereClause)
      .orderBy(classes.classNumber, classes.section);

    res.status(200).json({
      success: true,
      count: allClasses.length,
      data: allClasses,
    });
  } catch (error) {
    console.error("getAllClasses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};

// ─── 5. DELETE CLASS ─────────────────────────────────────────────
export const deleteClass: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;


    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }
    // Check if class exists
    const existingClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (existingClass.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!existingClass[0]) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if class has students
    if (existingClass[0].totalStudents > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete class with students. Remove all students first.",
      });
    }

    // Delete class
    await db.delete(classes).where(eq(classes.id, classId));

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("deleteClass error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete class",
    });
  }
};

// ─── 6. ADD STUDENTS TO CLASS ────────────────────────────────────
export const addStudentsToClass: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds }: AddStudentsToClassInput["body"] = req.body;

    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // 1. Get class
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

    // 2. Check capacity
    const newTotal = classData.totalStudents + studentIds.length;
    if (newTotal > classData.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Cannot add students. Class capacity is ${classData.maxCapacity}, current: ${classData.totalStudents}`,
      });
    }

    // 3. Verify students exist
    const existingStudents = await db
      .select()
      .from(students)
      .where(inArray(students.id, studentIds));

    if (existingStudents.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more students not found",
      });
    }

    // 4. Check for duplicates
    const currentStudentIds = classData.studentIds || [];
    const duplicates = studentIds.filter((id) => currentStudentIds.includes(id));
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Students already in class: ${duplicates.join(", ")}`,
      });
    }

    // 5. Update class
    const updatedStudentIds = [...currentStudentIds, ...studentIds];
    const [updatedClass] = await db
      .update(classes)
      .set({
        studentIds: updatedStudentIds,
        totalStudents: updatedStudentIds.length,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, classId))
      .returning();

    // 6. Update student records to set their class
    await db
      .update(students)
      .set({ classId: classData.id })
      .where(inArray(students.id, studentIds));

    res.status(200).json({
      success: true,
      message: `${studentIds.length} student(s) added to class`,
      data: updatedClass,
    });
  } catch (error) {
    console.error("addStudentsToClass error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add students to class",
    });
  }
};

// ─── 7. REMOVE STUDENTS FROM CLASS ───────────────────────────────
export const removeStudentsFromClass: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds }: RemoveStudentsFromClassInput["body"] = req.body;

    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // 1. Get class
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

    // 2. Remove students from class array
    const currentStudentIds = classData.studentIds || [];
    const updatedStudentIds = currentStudentIds.filter(
      (id) => !studentIds.includes(id)
    );

    // 3. Update class
    const [updatedClass] = await db
      .update(classes)
      .set({
        studentIds: updatedStudentIds,
        totalStudents: updatedStudentIds.length,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, classId))
      .returning();

    // 4. Update student records to remove their class
    await db
      .update(students)
      .set({ classId: "non" })
      .where(inArray(students.id, studentIds));

    res.status(200).json({
      success: true,
      message: `${studentIds.length} student(s) removed from class`,
      data: updatedClass,
    });
  } catch (error) {
    console.error("removeStudentsFromClass error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove students from class",
    });
  }
};

// ─── 8. GET CLASS WITH FULL DETAILS ──────────────────────────────
export const getClassDetails: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;

    if(classId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // 1. Get class data
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

    // 2. Get subjects
    let subjectsData: { id: string; name: string; code: string; description: string | null; createdAt: Date; updatedAt: Date; }[] = [];
    if (classData.classSubjectsId) {
      const [classSubjectsData] = await db
        .select()
        .from(classSubjects)
        .where(eq(classSubjects.classNumber, classData.classSubjectsId))
        .limit(1);

      if (classSubjectsData && classSubjectsData.subjectsId.length > 0) {
        // Fetch actual subject details
        subjectsData = await db
          .select()
          .from(subjects)
          .where(inArray(subjects.id, classSubjectsData.subjectsId));
      }
    }

let studentsData: {
  id: string;
  name: string;
  enrollmentYear: number;
  emergencyNumber: string;
  address: string;
  bloodGroup: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
}[] = [];


    if (classData.studentIds && classData.studentIds.length > 0) {
      studentsData = await db
        .select({
          id: students.id,
          name: students.name,
          enrollmentYear: students.enrollmentYear,
          emergencyNumber: students.emergencyNumber,
          address: students.address,
          bloodGroup: students.bloodGroup,
          dateOfBirth: students.dateOfBirth,
          gender: students.gender,
         
        })
        .from(students)
        .where(inArray(students.id, classData.studentIds));
    }

    // 4. Get teacher info (if you have teachers table)
    let teacherData = null;
    if (classData.classTeacherId) {
      // teacherData = await db.select().from(teachers).where(eq(teachers.id, classData.classTeacherId));
    }

    res.status(200).json({
      success: true,
      data: {
        ...classData,
        subjects: subjectsData,
        students: studentsData,
        teacher: teacherData,
      },
    });
  } catch (error) {
    console.error("getClassDetails error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class details",
    });
  }
};