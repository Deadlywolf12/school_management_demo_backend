import { pgTable, uuid, text, timestamp, decimal } from "drizzle-orm/pg-core";
import { users } from "./users";
import { subjects } from "./subjects";
import { classes } from "./classes";

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),

  employeeId: text("employee_id").notNull().unique(),
  department: text("department").notNull(),
  subjectId: uuid("subject_id").references(()=>subjects.id),
  name:text("name").notNull().default(""),
  gender: text("gender").default("Not specified"),
  classTeacherOfId: uuid("class_teacher_of_id")
  .references(() => classes.id, { onDelete: "set null" })
  .unique(),
  
  phoneNumber: text("phone_number").notNull().unique(),
  address: text("address").notNull().default(""), // new address column
  joiningDate: timestamp("joining_date").notNull().defaultNow(),
  salary: text("salary").notNull().default("0.00"), // store as string for decimal
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
