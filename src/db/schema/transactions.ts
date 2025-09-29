import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./category";

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).$type<"income" | "expense">().notNull(),
amount: numeric("amount", { precision: 12, scale: 2 })
  .notNull()
  .$type<number>(),

  note: varchar("note", { length: 255 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
