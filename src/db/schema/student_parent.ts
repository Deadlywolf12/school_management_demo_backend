import { pgTable, uuid } from "drizzle-orm/pg-core";
import { students } from "./students";
import { parents } from "./parents";


export const student_parents = pgTable("student_parents", {
  studentId: uuid("student_id").notNull().references(() => students.id),
  parentId: uuid("parent_id").notNull().references(() => parents.id),
});
