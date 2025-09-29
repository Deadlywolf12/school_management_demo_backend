import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey(), // remove defaultRandom, client will generate UUID
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).$type<"income" | "expense">().notNull(),
  createdAt: timestamp("created_at").notNull(), // comes from client
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // helps conflict resolution
  isDeleted: boolean("is_deleted").default(false).notNull(), // soft delete for sync
});


export type category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;