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
import { teachers } from "../db/schema/teacher";

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
     
      const [teacher] = await db.select().from(teachers).where(eq(teachers.id, classTeacherId));
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }
    }
    
 if(teachers.classTeacherOfId){
      return res.status(400).json({
        success: false,
        message: "Teacher is already assigned to another class",
      });
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
      .set({ classId: null })
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

// ─── 8. GET CLASS WITH FULL DETAILS (CORRECTED) ──────────────────────────────
export const getClassDetails: RequestHandler = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log("=== GET CLASS DETAILS START ===");
    console.log("ClassId received:", classId);

    // Validate classId
    if (!classId) {
      console.log("ClassId is missing");
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // 1. Get class data
    console.log("Querying class data...");
    const classResult = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    console.log("Class query result:", classResult);
    const classData = classResult[0];

    if (!classData) {
      console.log("Class not found");
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    console.log("Class found:", {
      id: classData.id,
      classNumber: classData.classNumber,
      studentIds: classData.studentIds,
      classSubjectsId: classData.classSubjectsId,
      classTeacherId: classData.classTeacherId,
    });

    // 2. Get subjects data
    console.log("\n=== FETCHING SUBJECTS ===");
    let subjectsData: any[] = [];

    if (classData.classSubjectsId !== null && classData.classSubjectsId !== undefined) {
      console.log("ClassSubjectsId found:", classData.classSubjectsId);
      
      try {
        // Query using classNumber matching classSubjectsId
        const classSubjectsResult = await db
          .select()
          .from(classSubjects)
          .where(eq(classSubjects.classNumber, classData.classSubjectsId))
          .limit(1);

        console.log("ClassSubjects query result:", classSubjectsResult);

        if (classSubjectsResult.length > 0) {
          const classSubjectsData = classSubjectsResult[0];
          console.log("ClassSubjects data found:", classSubjectsData);

          if(classSubjectsData == null || classSubjectsData == undefined){
            return res.status(404).json({
        success: false,
        message: "Class subjects not found",
      });

          }
          
          if (classSubjectsData.subjectsId && classSubjectsData.subjectsId.length > 0) {
            console.log("Subject IDs to fetch:", classSubjectsData.subjectsId);
            
            // Fetch all subjects by IDs
            subjectsData = await db
              .select({
                id: subjects.id,
                name: subjects.name,
                code: subjects.code,
                description: subjects.description,
                createdAt: subjects.createdAt,
                updatedAt: subjects.updatedAt,
              })
              .from(subjects)
              .where(inArray(subjects.id, classSubjectsData.subjectsId));
            
            console.log("Subjects fetched:", subjectsData.length, "subjects");
            console.log("Subject details:", subjectsData);
          } else {
            console.log("No subject IDs in classSubjects");
          }
        } else {
          console.log("No classSubjects record found for classNumber:", classData.classSubjectsId);
        }
      } catch (subjectError) {
        console.error("Error fetching subjects:", subjectError);
        // Don't throw - continue with empty subjects
      }
    } else {
      console.log("No classSubjectsId on class");
    }

    // 3. Get students data
    console.log("\n=== FETCHING STUDENTS ===");
    let studentsData: any[] = [];

    if (classData.studentIds && classData.studentIds.length > 0) {
      console.log("Student IDs to fetch:", classData.studentIds);
      
      try {
        studentsData = await db
          .select({
            id: students.id,
            name: students.name,
            studentId: students.studentRoll,
            classLevel: students.classId,
            enrollmentYear: students.enrollmentYear,
            emergencyNumber: students.emergencyNumber,
            address: students.address,
            bloodGroup: students.bloodGroup,
            dateOfBirth: students.dateOfBirth,
            gender: students.gender,
          })
          .from(students)
          .where(inArray(students.id, classData.studentIds));
        
        console.log("Students fetched:", studentsData.length, "students");
        console.log("Student details:", studentsData);
      } catch (studentError) {
        console.error("Error fetching students:", studentError);
        // Don't throw - continue with empty students
      }
    } else {
      console.log("No student IDs on class");
    }

    // 4. Get teacher info
    console.log("\n=== FETCHING TEACHER ===");
    let teacherData: any = null;

    if (classData.classTeacherId) {
      console.log("Teacher ID to fetch:", classData.classTeacherId);
      
      try {
        const teacherResult = await db
          .select({
            id: teachers.id,
            employeeId: teachers.employeeId,
            name: teachers.name,
            department: teachers.department,
            subject: teachers.subjectId,
            phoneNumber: teachers.phoneNumber,
            gender: teachers.gender,
            address: teachers.address,
          })
          .from(teachers)
          .where(eq(teachers.id, classData.classTeacherId))
          .limit(1);

        console.log("Teacher query result:", teacherResult);
        
        if (teacherResult.length > 0) {
          teacherData = teacherResult[0];
          console.log("Teacher found:", teacherData.name);
        } else {
          console.log("No teacher found with ID:", classData.classTeacherId);
        }
      } catch (teacherError) {
        console.error("Error fetching teacher:", teacherError);
        // Don't throw - continue with null teacher
      }
    } else {
      console.log("No classTeacherId on class");
    }

    // 5. Build final response
    const responseData = {
      ...classData,
      subjects: subjectsData,
      students: studentsData,
      teacher: teacherData,
    };

    console.log("\n=== FINAL RESPONSE ===");
    console.log("Subjects count:", subjectsData.length);
    console.log("Students count:", studentsData.length);
    console.log("Teacher:", teacherData ? "Found" : "Not found");
    console.log("Response structure:", {
      hasSubjects: subjectsData.length > 0,
      hasStudents: studentsData.length > 0,
      hasTeacher: teacherData !== null,
    });
    console.log("=== GET CLASS DETAILS END ===\n");

    // CRITICAL: Make sure you're returning responseData, not classData
    return res.status(200).json({
      success: true,
      data: responseData,  // ← This must be responseData with all the fetched data
    });

  } catch (error) {
    console.error("=== FATAL ERROR ===");
    console.error("getClassDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch class details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

