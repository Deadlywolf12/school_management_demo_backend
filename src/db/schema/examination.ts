// db/schema/examination.ts

import { pgTable, uuid, varchar, timestamp, integer, text, date } from "drizzle-orm/pg-core";

// ─── EXAMINATIONS TABLE ─────────────────────────────────────────
// Main exam definition (e.g., "Mid-Term 2024", "Final Exam 2024")
export const examinations = pgTable("examinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Exam identification
  name: varchar("name", { length: 255 }).notNull(), // "Mid-Term Exam", "Final Exam"
  type: varchar("type", { length: 50 }).notNull(), // "mid_term", "final", "monthly", "quiz"
  
  // Academic period
  academicYear: integer("academic_year").notNull(), // e.g., 2024
  term: varchar("term", { length: 20 }), // "1st", "2nd", "3rd" (optional)
  
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // "scheduled", "ongoing", "completed", "cancelled"
  
  // Additional info
  description: text("description"),
  instructions: text("instructions"), // General instructions for students
  
  // Metadata
  createdBy: uuid("created_by").notNull(), // Admin user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── EXAM SCHEDULES TABLE ───────────────────────────────────────
// Individual exam sessions (one per class per subject)
export const examSchedules = pgTable("exam_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Exam reference
  examinationId: uuid("examination_id").notNull().references(() => examinations.id, { onDelete: "cascade" }),
  
  // Class and subject
  classId: uuid("class_id").notNull(), // References classes table
  classNumber: integer("class_number").notNull(), // Denormalized for quick access
  subjectId: uuid("subject_id").notNull(), // References subjects table
  subjectName: varchar("subject_name", { length: 255 }).notNull(), // Denormalized
  
  // Schedule details
  date: date("date").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(), // e.g., "09:00"
  endTime: varchar("end_time", { length: 10 }).notNull(), // e.g., "11:00"
  duration: integer("duration").notNull(), // Duration in minutes
  
  // Venue
  roomNumber: varchar("room_number", { length: 50 }).notNull(),
  
  // Exam details
  totalMarks: integer("total_marks").notNull().default(100),
  passingMarks: integer("passing_marks").notNull().default(40),
  
  // Invigilators (array of teacher IDs)
  invigilators: uuid("invigilators").array().notNull().default([]),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // "scheduled", "ongoing", "completed", "cancelled"
  
  // Additional instructions
  instructions: text("instructions"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── EXAM RESULTS TABLE ─────────────────────────────────────────
// Stores individual student results for each exam schedule
export const examResults = pgTable("exam_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // References
  examScheduleId: uuid("exam_schedule_id").notNull().references(() => examSchedules.id, { onDelete: "cascade" }),
  examinationId: uuid("examination_id").notNull().references(() => examinations.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull(), // References students table
  
  // Denormalized for quick queries
  classId: uuid("class_id").notNull(),
  classNumber: integer("class_number").notNull(),
  subjectId: uuid("subject_id").notNull(),
  
  // Marks
  obtainedMarks: integer("obtained_marks").notNull(),
  totalMarks: integer("total_marks").notNull(),
  percentage: varchar("percentage", { length: 10 }).notNull(), // e.g., "85.50"
  grade: varchar("grade", { length: 5 }).notNull(), // "A+", "A", "B+", etc.
  status: varchar("status", { length: 20 }).notNull(), // "pass", "fail", "absent"
  
  // Marking details
  markedBy: uuid("marked_by").notNull(), // Teacher ID who marked this
  markedAt: timestamp("marked_at").notNull().defaultNow(),
  
  // Additional info
  remarks: text("remarks"), // Teacher's remarks
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── BULK MARKING SESSIONS TABLE ────────────────────────────────
// Tracks bulk marking operations for audit purposes
export const bulkMarkingSessions = pgTable("bulk_marking_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // References
  examScheduleId: uuid("exam_schedule_id").notNull().references(() => examSchedules.id, { onDelete: "cascade" }),
  examinationId: uuid("examination_id").notNull(),
  
  // Session details
  classId: uuid("class_id").notNull(),
  classNumber: integer("class_number").notNull(),
  subjectId: uuid("subject_id").notNull(),
  
  // Stats
  totalStudents: integer("total_students").notNull(),
  studentsMarked: integer("students_marked").notNull(),
  studentsAbsent: integer("students_absent").notNull().default(0),
  
  // Marking details
  markedBy: uuid("marked_by").notNull(), // Teacher ID
  markedAt: timestamp("marked_at").notNull().defaultNow(),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── EXAM ATTENDANCE TABLE ──────────────────────────────────────
// Tracks student attendance for each exam
export const examAttendance = pgTable("exam_attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // References
  examScheduleId: uuid("exam_schedule_id").notNull().references(() => examSchedules.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull(),
  
  // Attendance
  status: varchar("status", { length: 20 }).notNull(), // "present", "absent", "excused"
  
  // Invigilator who marked attendance
  markedBy: uuid("marked_by"),
  markedAt: timestamp("marked_at").notNull().defaultNow(),
  
  // Remarks
  remarks: text("remarks"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type Examination = typeof examinations.$inferSelect;
export type NewExamination = typeof examinations.$inferInsert;

export type ExamSchedule = typeof examSchedules.$inferSelect;
export type NewExamSchedule = typeof examSchedules.$inferInsert;

export type ExamResult = typeof examResults.$inferSelect;
export type NewExamResult = typeof examResults.$inferInsert;

export type BulkMarkingSession = typeof bulkMarkingSessions.$inferSelect;
export type NewBulkMarkingSession = typeof bulkMarkingSessions.$inferInsert;

export type ExamAttendance = typeof examAttendance.$inferSelect;
export type NewExamAttendance = typeof examAttendance.$inferInsert;