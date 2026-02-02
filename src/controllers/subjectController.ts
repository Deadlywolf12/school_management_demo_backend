import { db } from "../db";
import { subjects } from "../db/schema/subjects";
import { teachers } from "../db/schema/teacher";
import { users } from "../db/schema/users";
import { eq, and } from "drizzle-orm";
import { Request, Response } from "express";

// ============================================
// CREATE SUBJECT
// ============================================

/**
 * POST /api/admin/subjects
 * Create a new subject
 */
export const createSubject = async (
  req: Request<{}, {}, { name: string; code: string; description?: string }>,
  res: Response
) => {
  try {
    const { name, code, description } = req.body;

    // Check if subject with same name or code exists
    const [existingName] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.name, name));

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "A subject with this name already exists",
      });
    }

    const [existingCode] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.code, code));

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "A subject with this code already exists",
      });
    }

    // Create subject
    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
        code,
        description: description || null,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: newSubject,
    });
  } catch (err: unknown) {
    console.error("Error creating subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// GET ALL SUBJECTS (ID AND NAME ONLY)
// ============================================

/**
 * GET /api/admin/subjects
 * Get all subjects with id and name only
 */
export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    // Get all subjects (id and name only)
    const allSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(subjects);

    return res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: allSubjects,
      total: allSubjects.length,
    });
  } catch (err: unknown) {
    console.error("Error fetching subjects:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// GET SUBJECT BY ID
// ============================================

export const getSubjectById = async (
  req: Request<{ subjectId: string }>,
  res: Response
) => {
  try {
    const { subjectId } = req.params;

    // Get subject
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...subject,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// UPDATE SUBJECT
// ============================================

/**
 * PUT /api/admin/subjects/:subjectId
 * Update subject details
 */
export const updateSubject = async (
  req: Request<
    { subjectId: string },
    {},
    { name?: string; code?: string; description?: string }
  >,
  res: Response
) => {
  try {
    const { subjectId } = req.params;
    const { name, code, description } = req.body;

    // Check if subject exists
    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check for duplicate name (if updating name)
    if (name && name !== existingSubject.name) {
      const [duplicateName] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, name));

      if (duplicateName) {
        return res.status(400).json({
          success: false,
          message: "A subject with this name already exists",
        });
      }
    }

    // Check for duplicate code (if updating code)
    if (code && code !== existingSubject.code) {
      const [duplicateCode] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, code));

      if (duplicateCode) {
        return res.status(400).json({
          success: false,
          message: "A subject with this code already exists",
        });
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;

    // Update subject
    const [updatedSubject] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, subjectId))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (err: unknown) {
    console.error("Error updating subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// DELETE SUBJECT
// ============================================

/**
 * DELETE /api/admin/subjects/:subjectId
 * Delete a subject (also removes all teacher assignments)
 */
export const deleteSubject = async (
  req: Request<{ subjectId: string }>,
  res: Response
) => {
  try {
    const { subjectId } = req.params;

    // Check if subject exists
    const [existingSubject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Delete subject (cascade will handle teacher_subjects)
    await db.delete(subjects).where(eq(subjects.id, subjectId));

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err: unknown) {
    console.error("Error deleting subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// ASSIGN TEACHER TO SUBJECT
// ============================================

export const assignTeacherToSubject = async (
  req: Request<{}, {}, { teacherId: string; subjectId: string }>,
  res: Response
) => {
  try {
    const { teacherId, subjectId } = req.body;

    // Verify teacher exists
    const [teacher] = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        subjectId: teachers.subjectId,
      })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Verify subject exists
    const [subject] = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
      })
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check if teacher is already assigned to this subject
    if (teacher.subjectId === subjectId) {
      return res.status(400).json({
        success: false,
        message: "This teacher is already assigned to this subject",
      });
    }

    // Check if teacher is already assigned to another subject
    if (teacher.subjectId) {
      return res.status(400).json({
        success: false,
        message:
          "Teacher is already assigned to another subject. Please unassign first.",
      });
    }

    // Update teacher's subjectId
    await db
      .update(teachers)
      .set({ subjectId: subjectId })
      .where(eq(teachers.id, teacherId));

    return res.status(200).json({
      success: true,
      message: "Teacher assigned to subject successfully",
      data: {
        teacher: {
          id: teacher.id,
          name: teacher.name,
        },
        subject: {
          id: subject.id,
          name: subject.name,
          code: subject.code,
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error assigning teacher to subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// REMOVE TEACHER FROM SUBJECT
// ============================================

/**
 * DELETE /api/admin/subjects/remove-teacher
 * Remove a teacher from a subject by setting subjectId to null
 */
export const removeTeacherFromSubject = async (
   req: Request<{ teacherId: string; subjectId: string }>,  
  res: Response
) => {
  try {
  const { teacherId, subjectId } = req.params; 

    // Verify teacher exists
    const [teacher] = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        subjectId: teachers.subjectId,
      })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Check if teacher is assigned to the specified subject
    if (teacher.subjectId !== subjectId) {
      return res.status(400).json({
        success: false,
        message: "Teacher is not assigned to this subject",
      });
    }

    // Remove assignment by setting subjectId to null
    await db
      .update(teachers)
      .set({ subjectId: null })
      .where(eq(teachers.id, teacherId));

    return res.status(200).json({
      success: true,
      message: "Teacher removed from subject successfully",
    });
  } catch (err: unknown) {
    console.error("Error removing teacher from subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// GET SUBJECT'S TEACHERS
// ============================================

/**
 * GET /api/admin/subjects/:subjectId/teachers
 * Get all teachers teaching a specific subject
 */
export const getSubjectTeachers = async (
  req: Request<{ subjectId: string }>,
  res: Response
) => {
  try {
    const { subjectId } = req.params;

    // Verify subject exists
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Get all teachers assigned to this subject
    const teacherList = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: teachers.name,
        employeeId: teachers.employeeId,
        department: teachers.department,
        phoneNumber: teachers.phoneNumber,
        gender: teachers.gender,
      })
      .from(teachers)
      .where(eq(teachers.subjectId, subjectId));

    return res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully",
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
      },
      teachers: teacherList,
      totalTeachers: teacherList.length,
    });
  } catch (err: unknown) {
    console.error("Error fetching subject teachers:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// GET TEACHER'S SUBJECT
// ============================================

/**
 * GET /api/admin/teachers/:teacherId/subject
 * Get the subject assigned to a specific teacher
 */
export const getTeacherSubject = async (
  req: Request<{ teacherId: string }>,
  res: Response
) => {
  try {
    const { teacherId } = req.params;

    // Get teacher with subject info
    const [teacher] = await db
      .select({
        id: teachers.id,
        name: teachers.name,
        employeeId: teachers.employeeId,
        department: teachers.department,
        subjectId: teachers.subjectId,
      })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // If teacher has no subject assigned
    if (!teacher.subjectId) {
      return res.status(200).json({
        success: true,
        message: "Teacher has no subject assigned",
        teacher: {
          id: teacher.id,
          name: teacher.name,
          employeeId: teacher.employeeId,
          department: teacher.department,
        },
        subject: null,
      });
    }

    // Get subject details
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, teacher.subjectId));

    return res.status(200).json({
      success: true,
      message: "Subject retrieved successfully",
      teacher: {
        id: teacher.id,
        name: teacher.name,
        employeeId: teacher.employeeId,
        department: teacher.department,
      },
      subject: subject || null,
    });
  } catch (err: unknown) {
    console.error("Error fetching teacher subject:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};