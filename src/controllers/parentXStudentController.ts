import { db } from "../db";
import { users } from "../db/schema/users";
import { students } from "../db/schema/students";
import { parents } from "../db/schema/parents";
import { student_parents } from "../db/schema/student_parent";
import { eq, and } from "drizzle-orm";
import { Request, Response } from "express";


export const getStudentParents = async (
  req: Request<{ studentId: string }>,
  res: Response
) => {
  try {
    const { studentId } = req.params;

    // First, verify the student exists
    const [student] = await db
      .select({
        id: students.id,
        name: students.name,
        studentId: students.studentId,
        class: students.class,
      })
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    
    const linkedParents = await db
      .select({
        id: parents.id,
        userId: parents.userId,
        name: parents.name,
        email: users.email,
        guardianName: parents.guardianName,
        gender: parents.gender,
        phoneNumber: parents.phoneNumber,
        address: parents.address,
      })
      .from(student_parents)
      .innerJoin(parents, eq(student_parents.parentId, parents.id))
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(student_parents.studentId, studentId));

    return res.status(200).json({
      success: true,
      message: "Parents retrieved successfully",
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
      },
      parents: linkedParents,
      totalParents: linkedParents.length,
    });
  } catch (err: unknown) {
    console.error("Error fetching student parents:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};


export const getParentStudents = async (
  req: Request<{ parentId: string }>,
  res: Response
) => {
  try {
    const { parentId } = req.params;

    // First, verify the parent exists
    const [parent] = await db
      .select({
        id: parents.id,
        name: parents.name,
        guardianName: parents.guardianName,
        phoneNumber: parents.phoneNumber,
      })
      .from(parents)
      .where(eq(parents.id, parentId));

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    
    const linkedStudents = await db
      .select({
        id: students.id,
        userId: students.userId,
        name: students.name,
        email: users.email,
        studentId: students.studentId,
        class: students.class,
        gender: students.gender,
        enrollmentYear: students.enrollmentYear,
        emergencyNumber: students.emergencyNumber,
        address: students.address,
        bloodGroup: students.bloodGroup,
        dateOfBirth: students.dateOfBirth,
      })
      .from(student_parents)
      .innerJoin(students, eq(student_parents.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(student_parents.parentId, parentId));

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      parent: {
        id: parent.id,
        name: parent.name,
        guardianName: parent.guardianName,
        phoneNumber: parent.phoneNumber,
      },
      students: linkedStudents,
      totalStudents: linkedStudents.length,
    });
  } catch (err: unknown) {
    console.error("Error fetching parent students:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

//link parent to student
export const linkParentStudent = async (
  req: Request<{}, {}, { studentId: string; parentId: string }>,
  res: Response
) => {
  try {
    const { studentId, parentId } = req.body;

    
    const [student] = await db
      .select({ id: students.id, name: students.name })
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    
    const [parent] = await db
      .select({ id: parents.id, guardianName: parents.guardianName })
      .from(parents)
      .where(eq(parents.id, parentId));

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

   
    const [existingLink] = await db
      .select()
      .from(student_parents)
      .where(
        and(
          eq(student_parents.studentId, studentId),
          eq(student_parents.parentId, parentId)
        )
      );

    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: "This parent is already linked to this student",
      });
    }

    
    await db.insert(student_parents).values({
      studentId: studentId,
      parentId: parentId,
    });

    return res.status(201).json({
      success: true,
      message: "Parent linked to student successfully",
      data: {
        student: {
          id: student.id,
          name: student.name,
        },
        parent: {
          id: parent.id,
          guardianName: parent.guardianName,
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error linking parent to student:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

//unlink parent from student
 
export const unlinkParentStudent = async (
  req: Request<{}, {}, { studentId: string; parentId: string }>,
  res: Response
) => {
  try {
    const { studentId, parentId } = req.body;

    // Check if link exists
    const [existingLink] = await db
      .select()
      .from(student_parents)
      .where(
        and(
          eq(student_parents.studentId, studentId),
          eq(student_parents.parentId, parentId)
        )
      );

    if (!existingLink) {
      return res.status(404).json({
        success: false,
        message: "Link not found between this parent and student",
      });
    }

    // Delete the link
    await db
      .delete(student_parents)
      .where(
        and(
          eq(student_parents.studentId, studentId),
          eq(student_parents.parentId, parentId)
        )
      );

    return res.status(200).json({
      success: true,
      message: "Parent unlinked from student successfully",
    });
  } catch (err: unknown) {
    console.error("Error unlinking parent from student:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};