import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teacher";
import { subjects } from "./subjects";


export const teacher_subjects = pgTable("teacher_subjects", {
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export type teacher_subjects = typeof teacher_subjects.$inferSelect;
export type Newteacher_subjects = typeof teacher_subjects.$inferInsert;
