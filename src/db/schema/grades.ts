// db/schema.ts
//
// Drizzle ORM – PostgreSQL schema for the grading system.
// Run migrations with:   npx drizzle-kit generate && npx drizzle-kit migrate
//
// Assumes you already have a `students` table with at minimum:
//   CREATE TABLE students ( id TEXT PRIMARY KEY, ... );
// The foreign key on student_grades references that table.

import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  primaryKey,
  foreignKey,
  serial,
  uuid,
} from "drizzle-orm/pg-core";


// ─────────────────────────────────────────────────────────────────
// 1. class_subjects
//    One row per class (1–12).  `subjects` is a plain text[] column
//    so the admin can update the list without touching another table.
// ─────────────────────────────────────────────────────────────────
export const classSubjects = pgTable("class_subjects", {
  classNumber: integer("class_number").primaryKey(),
  subjectsId:    uuid("subjects_Id").array().notNull(),  // e.g. ["Mathematics","English",…]
  updatedAt:   timestamp("updated_at")
                 .notNull()
                 .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────
// 2. student_grades
//    One row per (student, class, year).  Stores the raw subject
//    scores as a JSON column so we never need to alter the table
//    when subjects change.  Computed columns (percentage, grade)
//    are stored for quick reads but the controller always
//    re-calculates on the fly so they stay in sync.
// ─────────────────────────────────────────────────────────────────


export const studentGrades = pgTable(
  "student_grades",
  {
   
    studentId:   uuid("student_id").notNull().references(() => students.id),
    classNumber: integer("class_number").notNull(),
    year:        integer("year").notNull(),

   // JSON array of { subjectId, obtainedMarks, totalMarks }
// matches exactly what the Zod `addGradeSchema.subjects` produces.
subjectsName: text("subjects").notNull(), // stored as JSON.stringify(); read back with JSON.parse()

    // Cached totals – controller overwrites these on every upsert
    totalObtained: numeric("total_obtained", { precision: 10, scale: 2 }).notNull().default("0"),
    totalMarks:    numeric("total_marks",    { precision: 10, scale: 2 }).notNull().default("0"),
    percentage:    numeric("percentage",     { precision: 5,  scale: 2 }).notNull().default("0"),
    grade:         text("grade").notNull().default("F"),

    createdAt: timestamp("created_at",).notNull().defaultNow(),
    updatedAt: timestamp("updated_at",).notNull().defaultNow(),
  },
  (table) => ({
    // Composite unique: only one grade record per student + class + year
    pk: primaryKey({ columns: [table.studentId, table.classNumber, table.year] }),

    // FK back to your existing students table
    fkStudent: foreignKey({
      columns:         [table.studentId],
      foreignColumns:  [students.id],  // ← point this at your real students table import if it lives elsewhere
    }),
  })
);

// ─────────────────────────────────────────────────────────────────
// 3. students  (stub)
//    You said you already have this table.  Keep only the `id`
//    column here so the FK above compiles.  Replace this entire
//    block with an import of your real students table definition.
// ─────────────────────────────────────────────────────────────────
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  // … your other columns live in your real students schema file.
  //     This stub exists solely so the FK reference above resolves.
});

// ─────────────────────────────────────────────────────────────────
// Relations (optional – only needed if you use Drizzle's relational
// query API.  Remove if you prefer plain .select() everywhere.)
// ─────────────────────────────────────────────────────────────────
// export const studentRelations = relations(students, ({ many }) => ({
//   grades: many(studentGrades),
// }));

// export const studentGradesRelations = relations(studentGrades, ({ one }) => ({
//   student: one(students, {
//     fields:    [studentGrades.studentId],
//     references:[students.id],
//   }),
// }));