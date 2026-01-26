// ============================================
// STUDENT FEE MANAGEMENT SYSTEM - DATABASE SCHEMA
// ============================================

import { pgTable, uuid, text, decimal, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { students } from "./students";

// ============================================
// ENUMS
// ============================================

 const feeTypeEnum = pgEnum("fee_type", ["monthly", "annual"]);
 const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "paid", "overdue", "cancelled"]);
 const paymentStatusEnum = pgEnum("payment_status", ["completed", "failed", "refunded"]);
 const discountTypeEnum = pgEnum("discount_type", ["percentage", "flat"]);
 const fineTypeEnum = pgEnum("fine_type", ["late_fee", "penalty", "other"]);
 const transactionTypeEnum = pgEnum("transaction_type", [
  "invoice_created",
  "discount_applied",
  "fine_applied",
  "payment_received",
  "payment_failed",
  "invoice_cancelled",
  "refund_processed"
]);

// ============================================
// 1. FEE STRUCTURES (Master Configuration)
// ============================================

/**
 * Defines the base fee structure for different classes/grades
 * This is the master configuration - admin sets these amounts
 */
export const feeStructures = pgTable("fee_structures", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Fee details
  name: text("name").notNull(), // e.g., "Grade 10 Monthly Fee"
  description: text("description"),
  feeType: feeTypeEnum("fee_type").notNull(), // monthly or annual
  
  // Amounts
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(), // Base fee amount
  
  // Applicability
  classLevel: text("class_level"), // e.g., "10-A", null means all classes
  academicYear: text("academic_year").notNull(), // e.g., "2024-2025"
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// 2. INVOICES (Student-specific fee bills)
// ============================================

/**
 * Individual invoices generated for each student
 * One invoice per student per month (for monthly) or per year (for annual)
 */
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Student reference
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  
  // Fee structure reference
  feeStructureId: uuid("fee_structure_id")
    .notNull()
    .references(() => feeStructures.id),
  
  // Invoice details
  invoiceNumber: text("invoice_number").notNull().unique(), // INV-2024-001234
  feeType: feeTypeEnum("fee_type").notNull(),
  
  // Period covered
  academicYear: text("academic_year").notNull(),
  month: integer("month"), // 1-12, null for annual
  year: integer("year").notNull(), // 2024
  
  // Amounts
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  fineAmount: decimal("fine_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // base - discount + fine
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Status
  status: invoiceStatusEnum("status").notNull().default("pending"),
  
  // Due date
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// 3. DISCOUNTS (Applied to invoices)
// ============================================

/**
 * Discounts applied to specific invoices
 * Keeps history of all discounts ever applied
 */
export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Invoice reference
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  
  // Discount details
  discountType: discountTypeEnum("discount_type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // 10% or $100
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Actual amount discounted
  reason: text("reason").notNull(), // "Sibling discount", "Merit scholarship", etc.
  
  // Applied by
  appliedBy: uuid("applied_by").notNull(), // Admin user ID
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  
  // Audit
  notes: text("notes"),
});

// ============================================
// 4. FINES (Late fees, penalties)
// ============================================

/**
 * Fines/penalties applied to invoices
 * Keeps history of all fines ever applied
 */
export const fines = pgTable("fines", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Invoice reference
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  
  // Fine details
  fineType: fineTypeEnum("fine_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(), // "Payment overdue by 7 days"
  
  // Applied by
  appliedBy: uuid("applied_by").notNull(), // Admin user ID
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  
  // Audit
  notes: text("notes"),
});

// ============================================
// 5. PAYMENTS (Full payment records)
// ============================================

/**
 * Records of all payments made
 * IMMUTABLE - never update, only insert
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Invoice reference
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  
  // Student reference (denormalized for quick queries)
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  
  // Payment details
  paymentNumber: text("payment_number").notNull().unique(), // PAY-2024-001234
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment method
  paymentMethod: text("payment_method").notNull(), // "cash", "card", "bank_transfer", "cheque"
  referenceNumber: text("reference_number"), // Transaction ID, cheque number, etc.
  
  // Status
  status: paymentStatusEnum("status").notNull().default("completed"),
  
  // Received by
  receivedBy: uuid("received_by").notNull(), // Admin user ID
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  
  // Audit
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// 6. FEE LEDGER (Complete audit trail)
// ============================================

/**
 * Complete transaction log - APPEND ONLY
 * Every action creates a ledger entry
 * Never update or delete - only insert
 */
export const feeLedger = pgTable("fee_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // References
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id),
  
  // Transaction details
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  transactionId: uuid("transaction_id"), // ID of payment, discount, or fine
  
  // Amounts (snapshot at time of transaction)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  // Details
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  
  // Actor
  performedBy: uuid("performed_by").notNull(), // User who performed action
  performedAt: timestamp("performed_at").notNull().defaultNow(),
});

// ============================================
// 7. PAYMENT HISTORY SUMMARY (Read-optimized view)
// ============================================

/**
 * Materialized view for quick dashboard queries
 * Updated via trigger or cron job
 */
export const paymentHistorySummary = pgTable("payment_history_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Student info (denormalized)
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id),
  studentName: text("student_name").notNull(),
  studentClass: text("student_class").notNull(),
  
  // Payment info
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  
  // Amounts
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  feeType: feeTypeEnum("fee_type").notNull(),
  
  // Period
  academicYear: text("academic_year").notNull(),
  month: integer("month"),
  year: integer("year").notNull(),
  
  // Payment details
  paymentMethod: text("payment_method").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});



export {
  feeTypeEnum,
  invoiceStatusEnum,
  paymentStatusEnum,
  discountTypeEnum,
  fineTypeEnum,
  transactionTypeEnum,
};