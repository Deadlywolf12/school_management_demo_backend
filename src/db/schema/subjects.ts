import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";



export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), 
  code: text("code").notNull().unique(), 
  description: text("description"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
