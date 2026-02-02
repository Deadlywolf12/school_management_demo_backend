// db/schema/classes.ts

import { pgTable, uuid, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Class identification
  classNumber: integer("class_number").notNull().unique(), // e.g., 1, 2, 3... 12
  section: varchar("section", { length: 10 }), // e.g., "A", "B", "C" (optional for different sections of same class)
  
  // Teacher assignment
  classTeacherId: uuid("class_teacher_id"), // References teachers table
  
  // Room information
  roomNumber: varchar("room_number", { length: 20 }).notNull(), // e.g., "101", "A-205"
  
  // Student tracking
  totalStudents: integer("total_students").notNull().default(0),
  studentIds: uuid("student_ids").array().notNull().default([]), // Array of student UUIDs
  
  // Subjects reference
  classSubjectsId: integer("class_subjects_id"), // References class_subjects.classNumber
  
  // Additional information
  academicYear: integer("academic_year").notNull(), // e.g., 2024
  maxCapacity: integer("max_capacity").notNull().default(40), // Maximum students allowed
  
  // Metadata
  description: text("description"), // Optional class description
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;