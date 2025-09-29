import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(), 
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).$type<"income" | "expense">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), 
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  isDeleted: boolean("is_deleted").default(false).notNull(),
});


export type category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;