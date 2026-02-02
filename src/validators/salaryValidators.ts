// validators/salaryValidators.ts

import { z } from "zod";

// ─────────────────────────────────────────────
// 1. Generate Monthly Salaries (Admin only)
// POST /api/salary/generate-monthly
// ─────────────────────────────────────────────
export const generateMonthlySalarySchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12, "Month must be between 1 and 12"),
    year: z.number().int().min(2000).max(new Date().getFullYear() + 1, "Invalid year"),
   employeeType: z.enum(["teacher", "staff", "all"], {
  message: "Employee type must be 'teacher', 'staff', or 'all'",
}),
  }),
});
export type GenerateMonthlySalaryInput = z.infer<typeof generateMonthlySalarySchema.shape.body>;

// ─────────────────────────────────────────────
// 2. Process Salary Payment (Admin only)
// PUT /api/salary/:salaryId/pay
// ─────────────────────────────────────────────
export const processSalaryPaymentSchema = z.object({
  params: z.object({
    salaryId: z.string().uuid("Invalid salary ID"),
  }),
  body: z.object({
    paymentMethod: z.enum(["bank_transfer", "cash", "cheque"], {
      message: "Payment method must be 'bank_transfer', 'cash', or 'cheque'",
    }),
    transactionId: z.string().trim().optional(),
    paymentDate: z.coerce.date().optional(),
    remarks: z.string().trim().optional(),
  }),
});
export type ProcessSalaryPaymentInput = {
  params: z.infer<typeof processSalaryPaymentSchema.shape.params>;
  body: z.infer<typeof processSalaryPaymentSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 3. Add Bonus (Admin only)
// POST /api/salary/bonus
// ─────────────────────────────────────────────
export const addBonusSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
    employeeType: z.enum(["teacher", "staff"], {
      message: "Employee type must be 'teacher' or 'staff'",
    }),
    bonusType: z.string().trim().min(1, "Bonus type is required"),
    amount: z.number().min(0, "Amount must be positive"),
    description: z.string().trim().optional(),
    month: z.number().int().min(1).max(12, "Month must be between 1 and 12"),
    year: z.number().int().min(2000).max(new Date().getFullYear() + 1, "Invalid year"),
  }),
});
export type AddBonusInput = z.infer<typeof addBonusSchema.shape.body>;

// ─────────────────────────────────────────────
// 4. Add Deduction (Admin only)
// POST /api/salary/deduction
// ─────────────────────────────────────────────
export const addDeductionSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
    employeeType: z.enum(["teacher", "staff"], {
      message: "Employee type must be 'teacher' or 'staff'",
    }),
    deductionType: z.string().trim().min(1, "Deduction type is required"),
    amount: z.number().min(0, "Amount must be positive"),
    description: z.string().trim().optional(),
    month: z.number().int().min(1).max(12, "Month must be between 1 and 12"),
    year: z.number().int().min(2000).max(new Date().getFullYear() + 1, "Invalid year"),
  }),
});
export type AddDeductionInput = z.infer<typeof addDeductionSchema.shape.body>;

// ─────────────────────────────────────────────
// 5. Adjust Salary (Admin only)
// POST /api/salary/adjust
// ─────────────────────────────────────────────
export const adjustSalarySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
    employeeType: z.enum(["teacher", "staff"], {
      message: "Employee type must be 'teacher' or 'staff'",
    }),
    newSalary: z.number().min(0, "Salary must be positive"),
    effectiveFrom: z.coerce.date(),
    reason: z.string().trim().min(1, "Reason is required"),
  }),
});
export type AdjustSalaryInput = z.infer<typeof adjustSalarySchema.shape.body>;

// ─────────────────────────────────────────────
// 6. Get Salary Records (Auth required)
// GET /api/salary/records
// ─────────────────────────────────────────────
export const getSalaryRecordsSchema = z.object({
  query: z.object({
    employeeId: z.string().uuid("Invalid employee ID").optional(),
    employeeType: z.enum(["teacher", "staff"]).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).optional(),
    paymentStatus: z.enum(["pending", "paid", "cancelled"]).optional(),
  }),
});
export type GetSalaryRecordsInput = z.infer<typeof getSalaryRecordsSchema.shape.query>;

// ─────────────────────────────────────────────
// 7. Get Employee Salary History (Auth required)
// GET /api/salary/history/:employeeId
// ─────────────────────────────────────────────
export const getEmployeeSalaryHistorySchema = z.object({
  params: z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
  }),
  query: z.object({
    employeeType: z.enum(["teacher", "staff"], {
      message: "Employee type must be 'teacher' or 'staff'",
    }),
    year: z.coerce.number().int().min(2000).optional(),
  }),
});
export type GetEmployeeSalaryHistoryInput = {
  params: z.infer<typeof getEmployeeSalaryHistorySchema.shape.params>;
  query: z.infer<typeof getEmployeeSalaryHistorySchema.shape.query>;
};

// ─────────────────────────────────────────────
// 8. Get Salary Summary (Admin only)
// GET /api/salary/summary
// ─────────────────────────────────────────────
export const getSalarySummarySchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000),
    employeeType: z.enum(["teacher", "staff", "all"]).optional(),
  }),
});
export type GetSalarySummaryInput = z.infer<typeof getSalarySummarySchema.shape.query>;

// ─────────────────────────────────────────────
// 9. Get Pending Payments (Admin only)
// GET /api/salary/pending
// ─────────────────────────────────────────────
export const getPendingPaymentsSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).optional(),
    employeeType: z.enum(["teacher", "staff", "all"]).optional(),
  }),
});
export type GetPendingPaymentsInput = z.infer<typeof getPendingPaymentsSchema.shape.query>;

// ─────────────────────────────────────────────
// 10. Update Salary Record (Admin only)
// PUT /api/salary/:salaryId
// ─────────────────────────────────────────────
export const updateSalaryRecordSchema = z.object({
  params: z.object({
    salaryId: z.string().uuid("Invalid salary ID"),
  }),
  body: z.object({
    bonus: z.number().min(0).optional(),
    deductions: z.number().min(0).optional(),
    remarks: z.string().trim().optional(),
  }),
});
export type UpdateSalaryRecordInput = {
  params: z.infer<typeof updateSalaryRecordSchema.shape.params>;
  body: z.infer<typeof updateSalaryRecordSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 11. Cancel Salary Payment (Admin only)
// PUT /api/salary/:salaryId/cancel
// ─────────────────────────────────────────────
export const cancelSalaryPaymentSchema = z.object({
  params: z.object({
    salaryId: z.string().uuid("Invalid salary ID"),
  }),
  body: z.object({
    reason: z.string().trim().min(1, "Cancellation reason is required"),
  }),
});
export type CancelSalaryPaymentInput = {
  params: z.infer<typeof cancelSalaryPaymentSchema.shape.params>;
  body: z.infer<typeof cancelSalaryPaymentSchema.shape.body>;
};

// ─────────────────────────────────────────────
// 12. Get Salary Adjustments (Auth required)
// GET /api/salary/adjustments/:employeeId
// ─────────────────────────────────────────────
export const getSalaryAdjustmentsSchema = z.object({
  params: z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
  }),
  query: z.object({
    employeeType: z.enum(["teacher", "staff"], {
      message: "Employee type must be 'teacher' or 'staff'",
    }),
  }),
});
export type GetSalaryAdjustmentsInput = {
  params: z.infer<typeof getSalaryAdjustmentsSchema.shape.params>;
  query: z.infer<typeof getSalaryAdjustmentsSchema.shape.query>;
};