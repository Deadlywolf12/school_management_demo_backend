// routes/salary.routes.ts

import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";

import {
  generateMonthlySalary,
  processSalaryPayment,
  addBonus,
  addDeduction,
  adjustSalary,
  getSalaryRecords,
  getEmployeeSalaryHistory,
  getSalarySummary,
  getPendingPayments,
  updateSalaryRecord,
  cancelSalaryPayment,
  getSalaryAdjustments,
} from "../controllers/salaryController";

import {
  generateMonthlySalarySchema,
  processSalaryPaymentSchema,
  addBonusSchema,
  addDeductionSchema,
  adjustSalarySchema,
  getSalaryRecordsSchema,
  getEmployeeSalaryHistorySchema,
  getSalarySummarySchema,
  getPendingPaymentsSchema,
  updateSalaryRecordSchema,
  cancelSalaryPaymentSchema,
  getSalaryAdjustmentsSchema,
} from "../validators/salaryValidators";

const salaryRouter = Router();

// ─────────────────────────────────────────────
// [Admin] Generate monthly salaries for all employees
// ─────────────────────────────────────────────
salaryRouter.post(
  "/generate-monthly",
  adminAuth,
  validate(generateMonthlySalarySchema),
  generateMonthlySalary
);

// ─────────────────────────────────────────────
// [Admin] Process salary payment
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId/pay",
  adminAuth,
  validate(processSalaryPaymentSchema),
  processSalaryPayment
);

// ─────────────────────────────────────────────
// [Admin] Add bonus to employee
// ─────────────────────────────────────────────
salaryRouter.post(
  "/bonus",
  adminAuth,
  validate(addBonusSchema),
  addBonus
);

// ─────────────────────────────────────────────
// [Admin] Add deduction to employee
// ─────────────────────────────────────────────
salaryRouter.post(
  "/deduction",
  adminAuth,
  validate(addDeductionSchema),
  addDeduction
);

// ─────────────────────────────────────────────
// [Admin] Adjust employee salary
// ─────────────────────────────────────────────
salaryRouter.post(
  "/adjust",
  adminAuth,
  validate(adjustSalarySchema),
  adjustSalary
);

// ─────────────────────────────────────────────
// [Auth] Get salary records (with filters)
// ─────────────────────────────────────────────
salaryRouter.get(
  "/records",
  auth,
  validate(getSalaryRecordsSchema),
  getSalaryRecords
);

// ─────────────────────────────────────────────
// [Auth] Get employee salary history
// ─────────────────────────────────────────────
salaryRouter.get(
  "/history/:employeeId",
  auth,
  validate(getEmployeeSalaryHistorySchema),
  getEmployeeSalaryHistory
);

// ─────────────────────────────────────────────
// [Admin] Get salary summary for a month
// ─────────────────────────────────────────────
salaryRouter.get(
  "/summary",
  adminAuth,
  validate(getSalarySummarySchema),
  getSalarySummary
);

// ─────────────────────────────────────────────
// [Admin] Get pending payments
// ─────────────────────────────────────────────
salaryRouter.get(
  "/pending",
  adminAuth,
  validate(getPendingPaymentsSchema),
  getPendingPayments
);

// ─────────────────────────────────────────────
// [Admin] Update salary record (before payment)
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId",
  adminAuth,
  validate(updateSalaryRecordSchema),
  updateSalaryRecord
);

// ─────────────────────────────────────────────
// [Admin] Cancel salary payment
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId/cancel",
  adminAuth,
  validate(cancelSalaryPaymentSchema),
  cancelSalaryPayment
);

// ─────────────────────────────────────────────
// [Auth] Get salary adjustments history
// ─────────────────────────────────────────────
salaryRouter.get(
  "/adjustments/:employeeId",
  auth,
  validate(getSalaryAdjustmentsSchema),
  getSalaryAdjustments
);

export default salaryRouter;