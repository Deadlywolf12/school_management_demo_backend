import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

// Create a Postgres enum type for attendance status
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "leave",
]);

// Create a Postgres enum type for role
export const roleEnum = pgEnum("role", [
  "student",
  "teacher",
  "staff",
  "admin",
  "parent",
]);

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // links to users table with cascade delete

  role: roleEnum("role").notNull(), // enum: student | teacher | staff | admin | parent
  date: timestamp("date").notNull().defaultNow(), // attendance date
  status: attendanceStatusEnum("status").notNull().default("absent"), // enum column with default value
  remarks: text("remarks").default(""), // optional notes

  // Additional useful columns
  checkInTime: timestamp("check_in_time"), // when they checked in
  checkOutTime: timestamp("check_out_time"), // when they checked out
  markedBy: uuid("marked_by").references(() => users.id), // who marked the attendance (admin/teacher)

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;