import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(), // one-to-one with users table
 name:text("name").notNull().default(""),
  studentId: text("student_id").notNull().unique(),
  class: text("class").notNull(),
  enrollmentYear: integer("enrollment_year").notNull(),

 

  // Extra details
  emergencyNumber: text("emergency_number").notNull(),
  address: text("address").notNull().default(""),
  bloodGroup: text("blood_group").default("Unknown"),
  dateOfBirth: timestamp("date_of_birth").defaultNow(),
  gender: text("gender").default("Not specified"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
