import { db } from "../db";
import { users } from "../db/schema/users";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { teachers } from "../db/schema/actorsSchemas/teacher";
import { students } from "../db/schema/actorsSchemas/students";
import { staff } from "../db/schema/actorsSchemas/staff";

import { student_parents } from "../db/schema/actorsSchemas/student_parent";
import { parents } from "../db/schema/actorsSchemas/parents";

export type Role = "student" | "teacher" | "staff" | "parent" | "admin"; // Add "parent" to Role type

export interface TeacherDetails {
  employeeId: string;
  department: string;
  subject: string;
  classTeacher: string; // e.g., "8"
  phoneNumber?: string;
  address?: string;
  joiningDate?: string; // ISO date string
  salary?: string; // Changed to string to match schema
}

export interface StudentDetails {
  studentId: string;
  class: string;
  enrollmentYear: number;
  guardianIds?: string[]; // one or more parents
  emergencyNumber?: string;
  address?: string;
  bloodGroup?: string;
  dateOfBirth?: string; // ISO date
  gender?: string;
}

export interface StaffDetails {
  employeeId: string;
  department: string;
  roleDetails: string; // e.g., "finance", "admin"
  phoneNumber?: string;
  address?: string;
  joiningDate?: string;
  salary?: string; // Changed to string to match schema (was number)
}

export interface ParentDetails {
  guardianName: string;
  phoneNumber: string;
  address?: string;
  studentIds?: string[];
}

export interface CreateUserBody {
  role: Role;
  email: string;
  name: string;
  password: string;

  teacherDetails?: TeacherDetails;
  studentDetails?: StudentDetails;
  staffDetails?: StaffDetails;
  parentDetails?: ParentDetails;
}

export const createUser = async (
  req: Request<{}, {}, CreateUserBody>,
  res: Response
) => {
  try {
    const {
      role,
      email,
      name,
      password,
      teacherDetails,
      studentDetails,
      staffDetails,
      parentDetails,
    } = req.body;

    const emailNormalized = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 8);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized));

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, msg: "User already exists" });
    }

    // Insert new user
    const newUser = { email: emailNormalized, password: hashedPassword, role };

    const insertedUsers = await db.insert(users).values(newUser).returning();
    const user = insertedUsers[0];
    const userId = user?.id;

    if (!userId) {
      throw new Error("Failed to create user");
    }

    // Create role-specific record
    switch (role) {
      case "teacher":
        if (!teacherDetails) throw new Error("Teacher details required");

        await db.insert(teachers).values({
          userId: userId, // Use camelCase - TypeScript property name
          employeeId: teacherDetails.employeeId,
          department: teacherDetails.department,
          subject: teacherDetails.subject,
          classTeacherOf: teacherDetails.classTeacher,
          phoneNumber: teacherDetails.phoneNumber ?? "",
          address: teacherDetails.address ?? "",
          joiningDate: teacherDetails.joiningDate
            ? new Date(teacherDetails.joiningDate)
            : new Date(),
          salary: teacherDetails.salary ?? "0.00", // Must be string to match schema
        });
        break;

      case "student":
        if (!studentDetails) throw new Error("Student details required");

        await db.insert(students).values({
          userId: userId,
          studentId: studentDetails.studentId,
          class: studentDetails.class,
          enrollmentYear: studentDetails.enrollmentYear,
          emergencyNumber: studentDetails.emergencyNumber ?? "",
          address: studentDetails.address ?? "",
          bloodGroup: studentDetails.bloodGroup ?? "",
          dateOfBirth: studentDetails.dateOfBirth
            ? new Date(studentDetails.dateOfBirth)
            : new Date(),
          gender: studentDetails.gender ?? "Not specified",
        });

        // Insert into join table if guardianIds exist
        if (studentDetails.guardianIds?.length) {
          for (const parentId of studentDetails.guardianIds) {
            await db.insert(student_parents).values({
              studentId: userId,
              parentId: parentId,
            });
          }
        }

        break;

      case "staff":
        if (!staffDetails) throw new Error("Staff details required");

        await db.insert(staff).values({
          userId: userId,
          employeeId: staffDetails.employeeId,
          department: staffDetails.department,
          roleDetails: staffDetails.roleDetails,
          phoneNumber: staffDetails.phoneNumber ?? "",
          address: staffDetails.address ?? "",
          joiningDate: staffDetails.joiningDate
            ? new Date(staffDetails.joiningDate)
            : new Date(),
          salary: staffDetails.salary ?? "0.00", // Changed to string to match schema
        });
        break;

      case "parent":
        if (!parentDetails) throw new Error("Parent details required");

        await db.insert(parents).values({
          userId: userId,
          guardianName: parentDetails.guardianName,
          phoneNumber: parentDetails.phoneNumber,
          address: parentDetails.address ?? "",
        });

        // Insert into join table if studentIds exist
        if (parentDetails.studentIds?.length) {
          for (const studentId of parentDetails.studentIds) {
            await db.insert(student_parents).values({
              studentId: studentId,
              parentId: userId,
            });
          }
        }

        break;

      case "admin":
        // nothing extra needed
        break;

      default:
        throw new Error("Invalid role");
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: userId,
        email: emailNormalized,
        role,
      },
    });

    // Handle errors safely
  } catch (err: unknown) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};