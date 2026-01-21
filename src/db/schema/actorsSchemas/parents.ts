import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "../users";
import { students } from "./students";

export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(), 

  phoneNumber: text("phone_number").notNull().unique(),
  address: text("address").notNull().default(""),
guardianName: text("guardian_name").notNull(), // father/mother name
 name:text("name").notNull().default(""),
   gender: text("gender").default("Not specified"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
