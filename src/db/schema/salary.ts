// db/schema/salary.ts

import { pgTable, uuid, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";

// ─── SALARY RECORDS TABLE ───────────────────────────────────────
// Tracks monthly salary payments for teachers and staff
export const salaryRecords = pgTable("salary_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Employee reference
  employeeId: uuid("employee_id").notNull(), // Can be teacher ID or staff ID
  employeeType: varchar("employee_type", { length: 20 }).notNull(), // "teacher" or "staff"
  employeeName: varchar("employee_name", { length: 255 }).notNull(), // Denormalized for quick access
  
  // Salary period
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(), // e.g., 2024
  
  // Salary breakdown
  baseSalary: varchar("base_salary", { length: 20 }).notNull(), // Base monthly salary
  bonus: varchar("bonus", { length: 20 }).notNull().default("0"), // Performance bonus, attendance bonus, etc.
  deductions: varchar("deductions", { length: 20 }).notNull().default("0"), // Tax, insurance, penalties
  netSalary: varchar("net_salary", { length: 20 }).notNull(), // baseSalary + bonus - deductions
  
  // Payment details
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // "pending", "paid", "cancelled"
  paymentDate: timestamp("payment_date"), // When payment was made
  paymentMethod: varchar("payment_method", { length: 50 }), // "bank_transfer", "cash", "cheque"
  transactionId: varchar("transaction_id", { length: 100 }), // Bank transaction reference
  
  // Additional info
  remarks: text("remarks"), // Notes about bonuses, deductions, etc.
  approvedBy: uuid("approved_by"), // Admin user ID who approved payment
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── SALARY ADJUSTMENTS TABLE ───────────────────────────────────
// Tracks salary changes/revisions for employees
export const salaryAdjustments = pgTable("salary_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Employee reference
  employeeId: uuid("employee_id").notNull(),
  employeeType: varchar("employee_type", { length: 20 }).notNull(), // "teacher" or "staff"
  
  // Adjustment details
  previousSalary: varchar("previous_salary", { length: 20 }).notNull(),
  newSalary: varchar("new_salary", { length: 20 }).notNull(),
  adjustmentPercentage: varchar("adjustment_percentage", { length: 10 }), // e.g., "+10%", "-5%"
  
  // Effective date
  effectiveFrom: timestamp("effective_from").notNull(), // When new salary takes effect
  
  // Reason and approval
  reason: text("reason").notNull(), // "promotion", "annual_increment", "demotion", etc.
  approvedBy: uuid("approved_by").notNull(), // Admin user ID
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── BONUS RECORDS TABLE ────────────────────────────────────────
// Separate tracking for one-time bonuses
export const bonusRecords = pgTable("bonus_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Employee reference
  employeeId: uuid("employee_id").notNull(),
  employeeType: varchar("employee_type", { length: 20 }).notNull(),
  
  // Bonus details
  bonusType: varchar("bonus_type", { length: 50 }).notNull(), // "performance", "festival", "attendance", "project"
  amount: varchar("amount", { length: 20 }).notNull(),
  description: text("description"),
  
  // Period
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  
  // Approval
  approvedBy: uuid("approved_by").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("approved"), // "approved", "paid", "cancelled"
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── DEDUCTION RECORDS TABLE ────────────────────────────────────
// Separate tracking for deductions
export const deductionRecords = pgTable("deduction_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Employee reference
  employeeId: uuid("employee_id").notNull(),
  employeeType: varchar("employee_type", { length: 20 }).notNull(),
  
  // Deduction details
  deductionType: varchar("deduction_type", { length: 50 }).notNull(), // "tax", "insurance", "loan", "penalty", "absence"
  amount: varchar("amount", { length: 20 }).notNull(),
  description: text("description"),
  
  // Period
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  
  // Approval
  approvedBy: uuid("approved_by").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("approved"), // "approved", "applied", "cancelled"
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SalaryRecord = typeof salaryRecords.$inferSelect;
export type NewSalaryRecord = typeof salaryRecords.$inferInsert;

export type SalaryAdjustment = typeof salaryAdjustments.$inferSelect;
export type NewSalaryAdjustment = typeof salaryAdjustments.$inferInsert;

export type BonusRecord = typeof bonusRecords.$inferSelect;
export type NewBonusRecord = typeof bonusRecords.$inferInsert;

export type DeductionRecord = typeof deductionRecords.$inferSelect;
export type NewDeductionRecord = typeof deductionRecords.$inferInsert;