import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "../users";

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),

  employeeId: text("employee_id").notNull().unique(),
  department: text("department").notNull(),
  roleDetails: text("role_details").notNull(), // e.g., "finance", "library"

  phoneNumber: text("phone_number").notNull().unique(),
  address: text("address").notNull().default(""),
  joiningDate: timestamp("joining_date").notNull().defaultNow(),
  salary: text("salary").notNull().default("0.00"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
