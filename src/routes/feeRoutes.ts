import { Router } from "express";
import { auth } from "../middleware/auth";
import { adminAuth } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  createMonthlyInvoiceSchema,
  createAnnualInvoiceSchema,
  applyDiscountSchema,
  applyFineSchema,
  payFeeSchema,
  getStudentFeeDetailsSchema,
  getFeeHistorySchema,
  getInvoiceByIdSchema,
  getPaymentHistorySchema,
  getPaymentDetailsSchema,
  cancelInvoiceSchema,
  getDashboardStatsSchema,
  bulkGenerateMonthlyInvoicesSchema,
  bulkGenerateAnnualInvoicesSchema,
} from "../validators/feeValidators";
import {
  createMonthlyInvoice,
  createAnnualInvoice,
 
  cancelInvoice,
  getInvoiceById,
  
} from "../controllers/feeController";
import { applyDiscount, applyFine, payFee } from "../controllers/feeController2";
import { getDashboardStats, getFeeHistory, getPaymentDetails, getPaymentHistory, getStudentFeeDetails } from "../controllers/feeController3";
import { getAllFeeStructures } from "../controllers/feeStructureController";

const feeRouter = Router();

// ============================================
// Apply auth middleware to all routes
// ============================================
// feeRouter.use(auth);
// feeRouter.use(adminAuth); // All fee operations require admin access

// ============================================
// INVOICE MANAGEMENT ROUTES
// ============================================

/**
 * @route   POST /api/admin/fees/invoices/monthly
 * @desc    Create a monthly invoice for a student
 * @access  Admin only
 * @body    { studentId, feeStructureId, month, year, dueDate }
 */
feeRouter.post(
  "/fees/invoices/monthly",
  validate(createMonthlyInvoiceSchema),
  createMonthlyInvoice
);


feeRouter.get(
  "/fees/structures",

  getAllFeeStructures
);
/**
 * @route   POST /api/admin/fees/invoices/annual
 * @desc    Create an annual invoice for a student
 * @access  Admin only
 * @body    { studentId, feeStructureId, academicYear, dueDate }
 */
feeRouter.post(
  "/fees/invoices/annual",
  validate(createAnnualInvoiceSchema),
  createAnnualInvoice
);

/**
 * @route   GET /api/admin/fees/invoices/:invoiceId
 * @desc    Get invoice details by ID
 * @access  Admin only
 * @params  invoiceId - Invoice UUID
 * @returns Invoice with student, discounts, fines, and payment details
 */
feeRouter.get(
  "/fees/invoices/:invoiceId",
  validate(getInvoiceByIdSchema),
  getInvoiceById
);

/**
 * @route   PUT /api/admin/fees/invoices/:invoiceId/cancel
 * @desc    Cancel an invoice
 * @access  Admin only
 * @params  invoiceId - Invoice UUID
 * @body    { reason }
 */
feeRouter.put(
  "/fees/invoices/:invoiceId/cancel",
  validate(cancelInvoiceSchema),
  cancelInvoice
);

// ============================================
// DISCOUNT & FINE ROUTES
// ============================================

/**
 * @route   POST /api/admin/fees/discounts
 * @desc    Apply discount to an invoice
 * @access  Admin only
 * @body    { invoiceId, discountType, value, reason, notes? }
 */
feeRouter.post(
  "/fees/discounts",
  validate(applyDiscountSchema),
  applyDiscount
);

/**
 * @route   POST /api/admin/fees/fines
 * @desc    Apply fine to an invoice
 * @access  Admin only
 * @body    { invoiceId, fineType, amount, reason, notes? }
 */
feeRouter.post("/fees/fines", validate(applyFineSchema), applyFine);

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * @route   POST /api/admin/fees/payments
 * @desc    Record a full payment for an invoice
 * @access  Admin only
 * @body    { invoiceId, amount, paymentMethod, referenceNumber?, notes? }
 * @note    FULL PAYMENT ONLY - amount must equal invoice total
 */
feeRouter.post("/fees/payments", validate(payFeeSchema), payFee);

/**
 * @route   GET /api/admin/fees/payments/history
 * @desc    Get payment history for all students
 * @access  Admin only
 * @query   ?page=1&limit=20&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&studentId=uuid&paymentMethod=cash
 * @returns Paginated list of payments with summary
 */
feeRouter.get(
  "/fees/payments/history",
  validate(getPaymentHistorySchema),
  getPaymentHistory
);

/**
 * @route   GET /api/admin/fees/payments/:paymentId
 * @desc    Get detailed information about a specific payment
 * @access  Admin only
 * @params  paymentId - Payment UUID
 * @returns Payment details with invoice, student, discounts, and fines
 */
feeRouter.get(
  "/fees/payments/:paymentId",
  validate(getPaymentDetailsSchema),
  getPaymentDetails
);

// ============================================
// STUDENT FEE QUERY ROUTES
// ============================================

/**
 * @route   GET /api/admin/fees/students/:studentId
 * @desc    Get all fee details for a specific student
 * @access  Admin only
 * @params  studentId - Student UUID
 * @query   ?academicYear=2024-2025&status=pending
 * @returns Student info, summary, and all invoices
 */
feeRouter.get(
  "/fees/students/:studentId",
  validate(getStudentFeeDetailsSchema),
  getStudentFeeDetails
);

/**
 * @route   GET /api/admin/fees/students/:studentId/history
 * @desc    Get complete fee transaction history for a student
 * @access  Admin only
 * @params  studentId - Student UUID
 * @query   ?page=1&limit=50
 * @returns Paginated ledger entries (complete audit trail)
 */
feeRouter.get(
  "/fees/students/:studentId/history",
  validate(getFeeHistorySchema),
  getFeeHistory
);

// ============================================
// DASHBOARD & REPORTING ROUTES
// ============================================

/**
 * @route   GET /api/admin/fees/dashboard/stats
 * @desc    Get dashboard statistics for fee management
 * @access  Admin only
 * @query   ?academicYear=2024-2025&month=1&year=2024
 * @returns Overview statistics (invoices, payments, collection rate)
 */
feeRouter.get(
  "/fees/dashboard/stats",
  validate(getDashboardStatsSchema),
  getDashboardStats
);

// ============================================
// BULK OPERATIONS (Optional - for automation)
// ============================================

/**
 * @route   POST /api/admin/fees/bulk/monthly-invoices
 * @desc    Bulk generate monthly invoices for all students
 * @access  Admin only
 * @body    { month, year, classLevel?, dueDate }
 * @note    Usually run via cron job, but available for manual trigger
 */
// feeRouter.post(
//   "/fees/bulk/monthly-invoices",
//   validate(bulkGenerateMonthlyInvoicesSchema),
//   bulkGenerateMonthlyInvoices
// );

/**
 * @route   POST /api/admin/fees/bulk/annual-invoices
 * @desc    Bulk generate annual invoices for all students
 * @access  Admin only
 * @body    { academicYear, classLevel?, dueDate }
 * @note    Usually run via cron job, but available for manual trigger
 */
// feeRouter.post(
//   "/fees/bulk/annual-invoices",
//   validate(bulkGenerateAnnualInvoicesSchema),
//   bulkGenerateAnnualInvoices
// );

export default feeRouter;

// ============================================
// ROUTE SUMMARY
// ============================================

/**
 * Total Routes: 11 (+ 2 optional bulk operations)
 * 
 * Invoice Management (4):
 * - POST   /fees/invoices/monthly
 * - POST   /fees/invoices/annual
 * - GET    /fees/invoices/:invoiceId
 * - PUT    /fees/invoices/:invoiceId/cancel
 * 
 * Discounts & Fines (2):
 * - POST   /fees/discounts
 * - POST   /fees/fines
 * 
 * Payments (3):
 * - POST   /fees/payments
 * - GET    /fees/payments/history
 * - GET    /fees/payments/:paymentId
 * 
 * Student Queries (2):
 * - GET    /fees/students/:studentId
 * - GET    /fees/students/:studentId/history
 * 
 * Dashboard (1):
 * - GET    /fees/dashboard/stats
 * 
 * Bulk Operations (2 - commented out):
 * - POST   /fees/bulk/monthly-invoices
 * - POST   /fees/bulk/annual-invoices
 */