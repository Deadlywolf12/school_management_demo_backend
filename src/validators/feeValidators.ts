import { z } from "zod";

// ============================================
// FEE MANAGEMENT VALIDATORS
// ============================================

// ============================================
// 1. CREATE MONTHLY INVOICE
// ============================================

export const createMonthlyInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    feeStructureId: z.string().uuid("Invalid fee structure ID format"),
    month: z
      .number()
      .int()
      .min(1, "Month must be between 1 and 12")
      .max(12, "Month must be between 1 and 12"),
    year: z
      .number()
      .int()
      .min(2020, "Year must be 2020 or later")
      .max(2100, "Year must be 2100 or earlier"),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  }),
});

// ============================================
// 2. CREATE ANNUAL INVOICE
// ============================================

export const createAnnualInvoiceSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    feeStructureId: z.string().uuid("Invalid fee structure ID format"),
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format")
      .refine((val) => {
        const parts = val.split("-");
  const start = Number(parts[0]!); 
  const end = Number(parts[1]!);
  return end === start + 1;
      }, "Academic year must be consecutive (e.g., 2024-2025)"),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  }),
});

// ============================================
// 3. APPLY DISCOUNT
// ============================================

const DISCOUNTS = ["percentage", "flat"] as const;
export const applyDiscountSchema = z.object({
  body: z
    .object({
      invoiceId: z.string().uuid("Invalid invoice ID format"),
 discountType: z.enum(["percentage", "flat"], {
  message: "Discount type must be 'percentage' or 'flat'",
}),
      value: z.number().positive("Discount value must be positive"),
      reason: z
        .string()
        .min(3, "Reason must be at least 3 characters")
        .max(200, "Reason must be less than 200 characters")
        .transform((r) => r.trim()),
      notes: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        // If percentage, value must be <= 100
        if (data.discountType === "percentage") {
          return data.value <= 100;
        }
        return true;
      },
      {
        message: "Percentage discount cannot exceed 100%",
        path: ["value"],
      }
    ),
});

// ============================================
// 4. APPLY FINE
// ============================================

export const applyFineSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid("Invalid invoice ID format"),
    fineType: z.enum(["late_fee", "penalty", "other"], {
      message: "Fine type must be 'late_fee', 'penalty', or 'other'",
    }),
    amount: z.number().positive("Fine amount must be positive"),
    reason: z
      .string()
      .min(3, "Reason must be at least 3 characters")
      .max(200, "Reason must be less than 200 characters")
      .transform((r) => r.trim()),
    notes: z.string().max(500).optional(),
  }),
});

// ============================================
// 5. PAY FEE (FULL PAYMENT ONLY)
// ============================================

export const payFeeSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid("Invalid invoice ID format"),
    amount: z.number().positive("Payment amount must be positive"),
    paymentMethod: z.enum(["cash", "card", "bank_transfer", "cheque", "online"], {
    
        message: "Payment method must be 'cash', 'card', 'bank_transfer', 'cheque', or 'online'",
      
    }),
    referenceNumber: z
      .string()
      .max(100, "Reference number must be less than 100 characters")
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

// ============================================
// 6. GET STUDENT FEE DETAILS
// ============================================

export const getStudentFeeDetailsSchema = z.object({
  params: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
  }),
  query: z.object({
    academicYear: z.string().optional(),
    status: z
      .enum(["pending", "paid", "overdue", "cancelled", "all"])
      .optional()
      .default("all"),
  }),
});

// ============================================
// 7. GET FEE HISTORY
// ============================================

export const getFeeHistorySchema = z.object({
  params: z.object({
    studentId: z.string().uuid("Invalid student ID format"),
  }),
  query: z.object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Page must be a positive number",
      }),
    limit: z
      .string()
      .optional()
      .default("50")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
  }),
});

// ============================================
// 8. GET INVOICE BY ID
// ============================================

export const getInvoiceByIdSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid("Invalid invoice ID format"),
  }),
});

// ============================================
// 9. GET PAYMENT HISTORY (ALL STUDENTS)
// ============================================

export const getPaymentHistorySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Page must be a positive number",
      }),
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => parseInt(val))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
        message: "Limit must be between 1 and 100",
      }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
    studentId: z.string().uuid("Invalid student ID format").optional(),
    paymentMethod: z
      .enum(["cash", "card", "bank_transfer", "cheque", "online", "all"])
      .optional()
      .default("all"),
  }),
});

// ============================================
// 10. GET PAYMENT DETAILS
// ============================================

export const getPaymentDetailsSchema = z.object({
  params: z.object({
    paymentId: z.string().uuid("Invalid payment ID format"),
  }),
});

// ============================================
// 11. CANCEL INVOICE
// ============================================

export const cancelInvoiceSchema = z.object({
  params: z.object({
    invoiceId: z.string().uuid("Invalid invoice ID format"),
  }),
  body: z.object({
    reason: z
      .string()
      .min(10, "Cancellation reason must be at least 10 characters")
      .max(500, "Cancellation reason must be less than 500 characters")
      .transform((r) => r.trim()),
  }),
});

// ============================================
// 12. GET DASHBOARD STATISTICS
// ============================================

export const getDashboardStatsSchema = z.object({
  query: z.object({
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format")
      .optional(),
    month: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 1 && val <= 12),
        "Month must be between 1 and 12"
      ),
    year: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 2020),
        "Year must be 2020 or later"
      ),
  }),
});

// ============================================
// 13. BULK GENERATE MONTHLY INVOICES
// ============================================

export const bulkGenerateMonthlyInvoicesSchema = z.object({
  body: z.object({
    month: z
      .number()
      .int()
      .min(1, "Month must be between 1 and 12")
      .max(12, "Month must be between 1 and 12"),
    year: z
      .number()
      .int()
      .min(2020, "Year must be 2020 or later")
      .max(2100, "Year must be 2100 or earlier"),
    classLevel: z.string().optional(), // If specified, only generate for this class
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  }),
});

// ============================================
// 14. BULK GENERATE ANNUAL INVOICES
// ============================================

export const bulkGenerateAnnualInvoicesSchema = z.object({
  body: z.object({
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format")
      .refine((val) => {
       const parts = val.split("-");
  const start = Number(parts[0]!); 
  const end = Number(parts[1]!);
  return end === start + 1;
      }, "Academic year must be consecutive (e.g., 2024-2025)"),
    classLevel: z.string().optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateMonthlyInvoiceInput = z.infer<typeof createMonthlyInvoiceSchema>;
export type CreateAnnualInvoiceInput = z.infer<typeof createAnnualInvoiceSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type ApplyFineInput = z.infer<typeof applyFineSchema>;
export type PayFeeInput = z.infer<typeof payFeeSchema>;
export type GetStudentFeeDetailsInput = z.infer<typeof getStudentFeeDetailsSchema>;
export type GetFeeHistoryInput = z.infer<typeof getFeeHistorySchema>;
export type GetInvoiceByIdInput = z.infer<typeof getInvoiceByIdSchema>;
export type GetPaymentHistoryInput = z.infer<typeof getPaymentHistorySchema>;
export type GetPaymentDetailsInput = z.infer<typeof getPaymentDetailsSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type GetDashboardStatsInput = z.infer<typeof getDashboardStatsSchema>;
export type BulkGenerateMonthlyInvoicesInput = z.infer<
  typeof bulkGenerateMonthlyInvoicesSchema
>;
export type BulkGenerateAnnualInvoicesInput = z.infer<
  typeof bulkGenerateAnnualInvoicesSchema
>;