import { Request, Response } from "express";
import { db } from "../db";
import { teachers } from "../db/schema/actorsSchemas/teacher";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        employeeId: teachers.employeeId,
        department: teachers.department,
        subject: teachers.subject,
        classTeacherOf: teachers.classTeacherOf,
        phoneNumber: teachers.phoneNumber,
        email: users.email,
        name: teachers.name,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      page,
      limit,
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      mesg: "Failed to fetch teachers",
    });
  }
};
