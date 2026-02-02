// controllers/salaryController.ts

import { RequestHandler } from "express";
import { db } from "../db";
import { salaryRecords, bonusRecords, deductionRecords, salaryAdjustments } from "../db/schema/salary";
import { teachers } from "../db/schema/teacher";
import { staff } from "../db/schema/staff";
import { eq, and, inArray, or, desc } from "drizzle-orm";
import {
  GenerateMonthlySalaryInput,
  ProcessSalaryPaymentInput,
  AddBonusInput,
  AddDeductionInput,
  AdjustSalaryInput,
} from "../validators/salaryValidators";

// ─── 1. GENERATE MONTHLY SALARIES ───────────────────────────────
export const generateMonthlySalary: RequestHandler = async (req, res) => {
  try {
    const { month, year, employeeType }: GenerateMonthlySalaryInput = req.body;
    // @ts-ignore
    const adminId = req.user?.id;

    // Check if salaries already generated for this month/year
    const existingSalaries = await db
      .select()
      .from(salaryRecords)
      .where(
        and(
          eq(salaryRecords.month, month),
          eq(salaryRecords.year, year),
          employeeType !== "all" 
            ? eq(salaryRecords.employeeType, employeeType)
            : undefined
        )
      );

    if (existingSalaries.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Salaries already generated for ${month}/${year}`,
      });
    }

    const salariesToCreate: any[] = [];

    // Fetch teachers if needed
    if (employeeType === "teacher" || employeeType === "all") {
      const allTeachers = await db.select().from(teachers);

      for (const teacher of allTeachers) {
        // Get bonuses for this month/year
        const bonuses = await db
          .select()
          .from(bonusRecords)
          .where(
            and(
              eq(bonusRecords.employeeId, teacher.id),
              eq(bonusRecords.employeeType, "teacher"),
              eq(bonusRecords.month, month),
              eq(bonusRecords.year, year),
              eq(bonusRecords.status, "approved")
            )
          );

        // Get deductions for this month/year
        const deductions = await db
          .select()
          .from(deductionRecords)
          .where(
            and(
              eq(deductionRecords.employeeId, teacher.id),
              eq(deductionRecords.employeeType, "teacher"),
              eq(deductionRecords.month, month),
              eq(deductionRecords.year, year),
              eq(deductionRecords.status, "approved")
            )
          );

        const totalBonus = bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const baseSalary = parseFloat(teacher.salary);
        const netSalary = baseSalary + totalBonus - totalDeductions;

        salariesToCreate.push({
          employeeId: teacher.id,
          employeeType: "teacher",
          employeeName: teacher.name,
          month,
          year,
          baseSalary: teacher.salary,
          bonus: totalBonus.toString(),
          deductions: totalDeductions.toString(),
          netSalary: netSalary.toString(),
          paymentStatus: "pending",
        });
      }
    }

    // Fetch staff if needed
    if (employeeType === "staff" || employeeType === "all") {
      const allStaff = await db.select().from(staff);

      for (const staffMember of allStaff) {
        // Get bonuses for this month/year
        const bonuses = await db
          .select()
          .from(bonusRecords)
          .where(
            and(
              eq(bonusRecords.employeeId, staffMember.id),
              eq(bonusRecords.employeeType, "staff"),
              eq(bonusRecords.month, month),
              eq(bonusRecords.year, year),
              eq(bonusRecords.status, "approved")
            )
          );

        // Get deductions for this month/year
        const deductions = await db
          .select()
          .from(deductionRecords)
          .where(
            and(
              eq(deductionRecords.employeeId, staffMember.id),
              eq(deductionRecords.employeeType, "staff"),
              eq(deductionRecords.month, month),
              eq(deductionRecords.year, year),
              eq(deductionRecords.status, "approved")
            )
          );

        const totalBonus = bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const baseSalary = parseFloat(staffMember.salary);
        const netSalary = baseSalary + totalBonus - totalDeductions;

        salariesToCreate.push({
          employeeId: staffMember.id,
          employeeType: "staff",
          employeeName: staffMember.name,
          month,
          year,
          baseSalary: staffMember.salary,
          bonus: totalBonus.toString(),
          deductions: totalDeductions.toString(),
          netSalary: netSalary.toString(),
          paymentStatus: "pending",
        });
      }
    }

    // Insert all salary records
    const created = await db.insert(salaryRecords).values(salariesToCreate).returning();

    res.status(201).json({
      success: true,
      message: `Generated ${created.length} salary records for ${month}/${year}`,
      data: {
        count: created.length,
        month,
        year,
        employeeType,
      },
    });
  } catch (error) {
    console.error("generateMonthlySalary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate salaries",
    });
  }
};

// ─── 2. PROCESS SALARY PAYMENT ───────────────────────────────────
export const processSalaryPayment: RequestHandler = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { paymentMethod, transactionId, paymentDate, remarks } = req.body;
    // @ts-ignore
    const adminId = req.user?.id;


   if (salaryId === undefined) {
        return res.status(400).json({
          success: false,
          message: "Salary ID is required",
        });
      }

    // Get salary record
    const [salary] = await db
      .select()
      .from(salaryRecords)
      .where(eq(salaryRecords.id, salaryId))
      .limit(1);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (salary.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Salary already paid",
      });
    }

    if (salary.paymentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay cancelled salary",
      });
    }

    // Update salary record
    const [updated] = await db
      .update(salaryRecords)
      .set({
        paymentStatus: "paid",
        paymentMethod,
        transactionId,
        paymentDate: paymentDate || new Date(),
        remarks: remarks || salary.remarks,
        approvedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(salaryRecords.id, salaryId))
      .returning();

    // Update bonus records status
    await db
      .update(bonusRecords)
      .set({ status: "paid" })
      .where(
        and(
          eq(bonusRecords.employeeId, salary.employeeId),
          eq(bonusRecords.employeeType, salary.employeeType),
          eq(bonusRecords.month, salary.month),
          eq(bonusRecords.year, salary.year),
          eq(bonusRecords.status, "approved")
        )
      );

    // Update deduction records status
    await db
      .update(deductionRecords)
      .set({ status: "applied" })
      .where(
        and(
          eq(deductionRecords.employeeId, salary.employeeId),
          eq(deductionRecords.employeeType, salary.employeeType),
          eq(deductionRecords.month, salary.month),
          eq(deductionRecords.year, salary.year),
          eq(deductionRecords.status, "approved")
        )
      );

    res.status(200).json({
      success: true,
      message: "Salary payment processed successfully",
      data: updated,
    });
  } catch (error) {
    console.error("processSalaryPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
    });
  }
};

// ─── 3. ADD BONUS ────────────────────────────────────────────────
export const addBonus: RequestHandler = async (req, res) => {
  try {
    const { employeeId, employeeType, bonusType, amount, description, month, year }: AddBonusInput = req.body;
    // @ts-ignore
    const adminId = req.user?.id;

    // Verify employee exists
    const employeeTable = employeeType === "teacher" ? teachers : staff;
    const employee = await db
      .select()
      .from(employeeTable)
      .where(eq(employeeTable.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: `${employeeType} not found`,
      });
    }

    // Create bonus record
    const [bonus] = await db
      .insert(bonusRecords)
      .values({
        employeeId,
        employeeType,
        bonusType,
        amount: amount.toString(),
        description,
        month,
        year,
        approvedBy: adminId,
        status: "approved",
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Bonus added successfully",
      data: bonus,
    });
  } catch (error) {
    console.error("addBonus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add bonus",
    });
  }
};

// ─── 4. ADD DEDUCTION ────────────────────────────────────────────
export const addDeduction: RequestHandler = async (req, res) => {
  try {
    const { employeeId, employeeType, deductionType, amount, description, month, year }: AddDeductionInput = req.body;
    // @ts-ignore
    const adminId = req.user?.id;

    // Verify employee exists
    const employeeTable = employeeType === "teacher" ? teachers : staff;
    const employee = await db
      .select()
      .from(employeeTable)
      .where(eq(employeeTable.id, employeeId))
      .limit(1);

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: `${employeeType} not found`,
      });
    }

    // Create deduction record
    const [deduction] = await db
      .insert(deductionRecords)
      .values({
        employeeId,
        employeeType,
        deductionType,
        amount: amount.toString(),
        description,
        month,
        year,
        approvedBy: adminId,
        status: "approved",
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Deduction added successfully",
      data: deduction,
    });
  } catch (error) {
    console.error("addDeduction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add deduction",
    });
  }
};

// ─── 5. ADJUST SALARY ────────────────────────────────────────────
export const adjustSalary: RequestHandler = async (req, res) => {
  try {
    const { employeeId, employeeType, newSalary, effectiveFrom, reason }: AdjustSalaryInput = req.body;
    // @ts-ignore
    const adminId = req.user?.id;

    // Get employee current salary
    const employeeTable = employeeType === "teacher" ? teachers : staff;
    const [employee] = await db
      .select()
      .from(employeeTable)
      .where(eq(employeeTable.id, employeeId))
      .limit(1);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `${employeeType} not found`,
      });
    }

    const previousSalary = parseFloat(employee.salary);
    const adjustmentPercentage = (((newSalary - previousSalary) / previousSalary) * 100).toFixed(2);

    // Create adjustment record
    const [adjustment] = await db
      .insert(salaryAdjustments)
      .values({
        employeeId,
        employeeType,
        previousSalary: previousSalary.toString(),
        newSalary: newSalary.toString(),
        adjustmentPercentage: `${adjustmentPercentage}%`,
        effectiveFrom,
        reason,
        approvedBy: adminId,
      })
      .returning();

    // Update employee salary
    await db
      .update(employeeTable)
      .set({ salary: newSalary.toString() })
      .where(eq(employeeTable.id, employeeId));

    res.status(200).json({
      success: true,
      message: "Salary adjusted successfully",
      data: adjustment,
    });
  } catch (error) {
    console.error("adjustSalary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to adjust salary",
    });
  }
};

// ─── 6. GET SALARY RECORDS ───────────────────────────────────────
export const getSalaryRecords: RequestHandler = async (req, res) => {
  try {
    const { employeeId, employeeType, month, year, paymentStatus } = req.query;

    const conditions = [];
    if (employeeId) conditions.push(eq(salaryRecords.employeeId, String(employeeId)));
    if (employeeType) conditions.push(eq(salaryRecords.employeeType, String(employeeType)));
    if (month) conditions.push(eq(salaryRecords.month, Number(month)));
    if (year) conditions.push(eq(salaryRecords.year, Number(year)));
    if (paymentStatus) conditions.push(eq(salaryRecords.paymentStatus, String(paymentStatus)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const records = await db
      .select()
      .from(salaryRecords)
      .where(whereClause)
      .orderBy(desc(salaryRecords.year), desc(salaryRecords.month));

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("getSalaryRecords error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary records",
    });
  }
};

// ─── 7. GET EMPLOYEE SALARY HISTORY ──────────────────────────────
export const getEmployeeSalaryHistory: RequestHandler = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { employeeType, year } = req.query;
    if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required",
        });
    }

    const conditions = [
      eq(salaryRecords.employeeId, employeeId),
      eq(salaryRecords.employeeType, String(employeeType)),
    ];

    if (year) conditions.push(eq(salaryRecords.year, Number(year)));

    const records = await db
      .select()
      .from(salaryRecords)
      .where(and(...conditions))
      .orderBy(desc(salaryRecords.year), desc(salaryRecords.month));

    // Get bonuses and deductions separately for detailed view
    const bonuses = await db
      .select()
      .from(bonusRecords)
      .where(
        and(
          eq(bonusRecords.employeeId, employeeId),
          eq(bonusRecords.employeeType, String(employeeType)),
          year ? eq(bonusRecords.year, Number(year)) : undefined
        )
      );

    const deductions = await db
      .select()
      .from(deductionRecords)
      .where(
        and(
          eq(deductionRecords.employeeId, employeeId),
          eq(deductionRecords.employeeType, String(employeeType)),
          year ? eq(deductionRecords.year, Number(year)) : undefined
        )
      );

    // Calculate totals
    const totalPaid = records
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + parseFloat(r.netSalary), 0);

    const totalPending = records
      .filter((r) => r.paymentStatus === "pending")
      .reduce((sum, r) => sum + parseFloat(r.netSalary), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        bonuses,
        deductions,
        summary: {
          totalRecords: records.length,
          totalPaid: totalPaid.toFixed(2),
          totalPending: totalPending.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("getEmployeeSalaryHistory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary history",
    });
  }
};

// ─── 8. GET SALARY SUMMARY ───────────────────────────────────────
export const getSalarySummary: RequestHandler = async (req, res) => {
  try {
    const { month, year, employeeType } = req.query;

    const conditions = [
      eq(salaryRecords.month, Number(month)),
      eq(salaryRecords.year, Number(year)),
    ];

    if (employeeType && employeeType !== "all") {
      conditions.push(eq(salaryRecords.employeeType, String(employeeType)));
    }

    const records = await db
      .select()
      .from(salaryRecords)
      .where(and(...conditions));

    const summary = {
      totalEmployees: records.length,
      totalBaseSalary: records.reduce((sum, r) => sum + parseFloat(r.baseSalary), 0),
      totalBonus: records.reduce((sum, r) => sum + parseFloat(r.bonus), 0),
      totalDeductions: records.reduce((sum, r) => sum + parseFloat(r.deductions), 0),
      totalNetSalary: records.reduce((sum, r) => sum + parseFloat(r.netSalary), 0),
      totalPaid: records
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + parseFloat(r.netSalary), 0),
      totalPending: records
        .filter((r) => r.paymentStatus === "pending")
        .reduce((sum, r) => sum + parseFloat(r.netSalary), 0),
      byStatus: {
        paid: records.filter((r) => r.paymentStatus === "paid").length,
        pending: records.filter((r) => r.paymentStatus === "pending").length,
        cancelled: records.filter((r) => r.paymentStatus === "cancelled").length,
      },
      byType: {
        teachers: records.filter((r) => r.employeeType === "teacher").length,
        staff: records.filter((r) => r.employeeType === "staff").length,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("getSalarySummary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary summary",
    });
  }
};

// ─── 9. GET PENDING PAYMENTS ─────────────────────────────────────
export const getPendingPayments: RequestHandler = async (req, res) => {
  try {
    const { month, year, employeeType } = req.query;

    const conditions = [eq(salaryRecords.paymentStatus, "pending")];

    if (month) conditions.push(eq(salaryRecords.month, Number(month)));
    if (year) conditions.push(eq(salaryRecords.year, Number(year)));
    if (employeeType && employeeType !== "all") {
      conditions.push(eq(salaryRecords.employeeType, String(employeeType)));
    }

    const pending = await db
      .select()
      .from(salaryRecords)
      .where(and(...conditions))
      .orderBy(desc(salaryRecords.year), desc(salaryRecords.month));

    const totalAmount = pending.reduce((sum, r) => sum + parseFloat(r.netSalary), 0);

    res.status(200).json({
      success: true,
      count: pending.length,
      totalAmount: totalAmount.toFixed(2),
      data: pending,
    });
  } catch (error) {
    console.error("getPendingPayments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending payments",
    });
  }
};

// ─── 10. UPDATE SALARY RECORD ────────────────────────────────────
export const updateSalaryRecord: RequestHandler = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { bonus, deductions, remarks } = req.body;


    if (!salaryId) {
        return res.status(400).json({
          success: false,
          message: "Salary ID is required",
        });
    }

    const [salary] = await db
      .select()
      .from(salaryRecords)
      .where(eq(salaryRecords.id, salaryId))
      .limit(1);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (salary.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot update paid salary",
      });
    }

    // Recalculate net salary
    const baseSalary = parseFloat(salary.baseSalary);
    const newBonus = bonus !== undefined ? bonus : parseFloat(salary.bonus);
    const newDeductions = deductions !== undefined ? deductions : parseFloat(salary.deductions);
    const netSalary = baseSalary + newBonus - newDeductions;

    const [updated] = await db
      .update(salaryRecords)
      .set({
        bonus: newBonus.toString(),
        deductions: newDeductions.toString(),
        netSalary: netSalary.toString(),
        remarks: remarks !== undefined ? remarks : salary.remarks,
        updatedAt: new Date(),
      })
      .where(eq(salaryRecords.id, salaryId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Salary record updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateSalaryRecord error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update salary record",
    });
  }
};

// ─── 11. CANCEL SALARY PAYMENT ───────────────────────────────────
export const cancelSalaryPayment: RequestHandler = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { reason } = req.body;

    if (!salaryId) {    
      return res.status(400).json({
        success: false,
        message: "Salary ID is required",
      });
    }

    const [salary] = await db
      .select()
      .from(salaryRecords)
      .where(eq(salaryRecords.id, salaryId))
      .limit(1);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (salary.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel paid salary",
      });
    }

    const [cancelled] = await db
      .update(salaryRecords)
      .set({
        paymentStatus: "cancelled",
        remarks: reason,
        updatedAt: new Date(),
      })
      .where(eq(salaryRecords.id, salaryId))
      .returning();

    res.status(200).json({
      success: true,
      message: "Salary payment cancelled",
      data: cancelled,
    });
  } catch (error) {
    console.error("cancelSalaryPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
    });
  }
};

// ─── 12. GET SALARY ADJUSTMENTS ──────────────────────────────────
export const getSalaryAdjustments: RequestHandler = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { employeeType } = req.query;

    if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required",
        });
    }

    const adjustments = await db
      .select()
      .from(salaryAdjustments)
      .where(
        and(
          eq(salaryAdjustments.employeeId, employeeId),
          eq(salaryAdjustments.employeeType, String(employeeType))
        )
      )
      .orderBy(desc(salaryAdjustments.effectiveFrom));

    res.status(200).json({
      success: true,
      count: adjustments.length,
      data: adjustments,
    });
  } catch (error) {
    console.error("getSalaryAdjustments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary adjustments",
    });
  }
};