import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
   requestedAt: timestamp("requestedAt").defaultNow().notNull(),
});

export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;