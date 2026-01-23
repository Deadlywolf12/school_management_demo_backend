import { db } from "../db";
import { subjects } from "../db/schema/subjects";

import { teachers } from "../db/schema/teacher";
import { users } from "../db/schema/users";
import { eq, and } from "drizzle-orm";
import { Request, Response } from "express";
import { teacher_subjects } from "../db/schema/teacherXSubject";

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
// GET ALL SUBJECTS
// ============================================

/**
 * GET /api/admin/subjects?page=1&limit=10
 * Get all subjects with pagination
 */
export const getAllSubjects = async (
  req: Request<{}, {}, {}, { page?: number; limit?: number }>,
  res: Response
) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    // Get subjects with teacher count
    const allSubjects = await db.select().from(subjects);

    // Get subjects for current page
    const paginatedSubjects = await db
      .select()
      .from(subjects)
      .limit(limit)
      .offset(offset);

    // For each subject, get teacher count
    const subjectsWithTeachers = await Promise.all(
      paginatedSubjects.map(async (subject) => {
        const teacherList = await db
          .select({
            teacherId: teacher_subjects.teacherId,
          })
          .from(teacher_subjects)
          .where(eq(teacher_subjects.subjectId, subject.id));

        return {
          ...subject,
          teacherCount: teacherList.length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalSubjects: allSubjects.length,
      totalPages: Math.ceil(allSubjects.length / limit),
      data: subjectsWithTeachers,
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

/**
 * GET /api/admin/subjects/:subjectId
 * Get single subject with all teachers
 */
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

    // Get all teachers teaching this subject
    const teacherList = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: teachers.name,
        email: users.email,
        employeeId: teachers.employeeId,
        department: teachers.department,
        phoneNumber: teachers.phoneNumber,
        assignedAt: teacher_subjects.assignedAt,
      })
      .from(teacher_subjects)
      .innerJoin(teachers, eq(teacher_subjects.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teacher_subjects.subjectId, subjectId));

    return res.status(200).json({
      success: true,
      data: {
        ...subject,
        teachers: teacherList,
        teacherCount: teacherList.length,
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

/**
 * POST /api/admin/subjects/assign-teacher
 * Assign a teacher to a subject
 */
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

    // Check if assignment already exists
    const [existingAssignment] = await db
      .select()
      .from(teacher_subjects)
      .where(
        and(
          eq(teacher_subjects.teacherId, teacherId),
          eq(teacher_subjects.subjectId, subjectId)
        )
      );

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This teacher is already assigned to this subject",
      });
    }

    // Create assignment
    await db.insert(teacher_subjects).values({
      teacherId,
      subjectId,
    });

    return res.status(201).json({
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
 * Remove a teacher from a subject
 */
export const removeTeacherFromSubject = async (
  req: Request<{}, {}, { teacherId: string; subjectId: string }>,
  res: Response
) => {
  try {
    const { teacherId, subjectId } = req.body;

    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(teacher_subjects)
      .where(
        and(
          eq(teacher_subjects.teacherId, teacherId),
          eq(teacher_subjects.subjectId, subjectId)
        )
      );

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found between this teacher and subject",
      });
    }

    // Remove assignment
    await db
      .delete(teacher_subjects)
      .where(
        and(
          eq(teacher_subjects.teacherId, teacherId),
          eq(teacher_subjects.subjectId, subjectId)
        )
      );

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

    // Get all teachers
    const teacherList = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        name: teachers.name,
        email: users.email,
        gender: teachers.gender,
        employeeId: teachers.employeeId,
        department: teachers.department,
        phoneNumber: teachers.phoneNumber,
        assignedAt: teacher_subjects.assignedAt,
      })
      .from(teacher_subjects)
      .innerJoin(teachers, eq(teacher_subjects.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teacher_subjects.subjectId, subjectId));

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
// GET TEACHER'S SUBJECTS
// ============================================

/**
 * GET /api/admin/teachers/:teacherId/subjects
 * Get all subjects taught by a specific teacher
 */
export const getTeacherSubjects = async (
  req: Request<{ teacherId: string }>,
  res: Response
) => {
  try {
    const { teacherId } = req.params;

    // Verify teacher exists
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Get all subjects
    const subjectList = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        description: subjects.description,
        assignedAt: teacher_subjects.assignedAt,
      })
      .from(teacher_subjects)
      .innerJoin(subjects, eq(teacher_subjects.subjectId, subjects.id))
      .where(eq(teacher_subjects.teacherId, teacherId));

    return res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      teacher: {
        id: teacher.id,
        name: teacher.name,
        employeeId: teacher.employeeId,
        department: teacher.department,
      },
      subjects: subjectList,
      totalSubjects: subjectList.length,
    });
  } catch (err: unknown) {
    console.error("Error fetching teacher subjects:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};