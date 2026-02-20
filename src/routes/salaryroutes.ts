// routes/salary.routes.ts

import { Router } from "express";

import { auth } from "../middleware/auth";
import { authorize, validate } from "../middleware/validate";

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
salaryRouter.use(auth); // All routes require authentication

// ─────────────────────────────────────────────
// [Admin] Generate monthly salaries for all employees
// ─────────────────────────────────────────────
salaryRouter.post(
  "/generate-monthly",
authorize("admin"),
  validate(generateMonthlySalarySchema),
  generateMonthlySalary
);

// ─────────────────────────────────────────────
// [Admin] Process salary payment
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId/pay",
authorize("admin"),
  validate(processSalaryPaymentSchema),
  processSalaryPayment
);

// ─────────────────────────────────────────────
// [Admin] Add bonus to employee
// ─────────────────────────────────────────────
salaryRouter.post(
  "/bonus",
authorize("admin"),
  validate(addBonusSchema),
  addBonus
);

// ─────────────────────────────────────────────
// [Admin] Add deduction to employee
// ─────────────────────────────────────────────
salaryRouter.post(
  "/deduction",
 authorize("admin"),
  validate(addDeductionSchema),
  addDeduction
);

// ─────────────────────────────────────────────
// [Admin] Adjust employee salary base salary
// ─────────────────────────────────────────────
salaryRouter.post(
  "/adjust",
authorize("admin"),
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

  validate(getEmployeeSalaryHistorySchema),
  getEmployeeSalaryHistory
);

// ─────────────────────────────────────────────
// [Admin] Get salary summary for a month
// ─────────────────────────────────────────────
salaryRouter.get(
  "/summary",
  
  validate(getSalarySummarySchema),
  getSalarySummary
);

// ─────────────────────────────────────────────
// [Admin] Get pending payments
// ─────────────────────────────────────────────
salaryRouter.get(
  "/pending",

  validate(getPendingPaymentsSchema),
  getPendingPayments
);

// ─────────────────────────────────────────────
// [Admin] Update salary record (before payment)
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId",
 authorize("admin"),
  validate(updateSalaryRecordSchema),
  updateSalaryRecord
);

// ─────────────────────────────────────────────
// [Admin] Cancel salary payment
// ─────────────────────────────────────────────
salaryRouter.put(
  "/:salaryId/cancel",
authorize("admin"),
  validate(cancelSalaryPaymentSchema),
  cancelSalaryPayment
);

// ─────────────────────────────────────────────
// [Auth] Get salary adjustments history
// ─────────────────────────────────────────────
salaryRouter.get(
  "/adjustments/:employeeId",

  validate(getSalaryAdjustmentsSchema),
  getSalaryAdjustments
);

export default salaryRouter;