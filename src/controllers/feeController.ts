import { db } from "../db";
import { Response } from "express";
import {
  invoices,
  feeStructures,
  discounts,
  fines,
  payments,
  feeLedger,
  paymentHistorySummary,
} from "../db/schema/fee";
import { students } from "../db/schema/students";
import { eq, and, desc } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateInvoiceNumber = (
  year: number,
  month: number | null,
  sequence: number
): string => {
  if (month) {
    return `INV-${year}-${month.toString().padStart(2, "0")}-${sequence
      .toString()
      .padStart(6, "0")}`;
  }
  return `INV-${year}-ANNUAL-${sequence.toString().padStart(6, "0")}`;
};

const generatePaymentNumber = (year: number, sequence: number): string => {
  return `PAY-${year}-${sequence.toString().padStart(8, "0")}`;
};

const calculateInvoiceTotal = (
  baseAmount: number,
  discountAmount: number,
  fineAmount: number
): number => baseAmount - discountAmount + fineAmount;

// ============================================
// INTERFACES FOR REQUEST BODIES
// ============================================

interface CreateMonthlyInvoiceBody {
  studentId: string;
  feeStructureId: string;
  month: number;
  year: number;
  dueDate: string;
}

interface CreateAnnualInvoiceBody {
  studentId: string;
  feeStructureId: string;
  academicYear: string;
  dueDate: string;
}

interface CancelInvoiceBody {
  reason: string;
}

// ============================================
// 1. CREATE MONTHLY INVOICE
// ============================================

export const createMonthlyInvoice = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { studentId, feeStructureId, month, year, dueDate } = req.body as CreateMonthlyInvoiceBody;
    const performedBy = req.user?.id;

    if (!performedBy) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify student
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    // Verify fee structure
    const [feeStructure] = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.id, feeStructureId),
          eq(feeStructures.isActive, true),
          eq(feeStructures.feeType, "monthly")
        )
      );
    if (!feeStructure)
      return res.status(404).json({
        success: false,
        message: "Fee structure not found or not active",
      });

    // Check duplicate invoice
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, studentId),
          eq(invoices.month, month),
          eq(invoices.year, year),
          eq(invoices.feeType, "monthly")
        )
      );
    if (existingInvoice)
      return res.status(400).json({
        success: false,
        message: `Invoice already exists for ${student.name} for ${month}/${year}`,
      });

    // Generate invoice number
    const latestInvoice = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.year, year))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

       if(latestInvoice.length > 0 && !latestInvoice[0]?.invoiceNumber ) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate invoice number",
        });
      }

    const sequence =
      latestInvoice.length > 0
        ? parseInt(latestInvoice[0]?.invoiceNumber.split("-").pop() || "0") + 1
        : 1;

    const invoiceNumber = generateInvoiceNumber(year, month, sequence);

    // Create invoice
    const baseAmount = parseFloat(feeStructure.baseAmount);
    const totalAmount = calculateInvoiceTotal(baseAmount, 0, 0);

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        studentId,
        feeStructureId,
        invoiceNumber,
        feeType: "monthly",
        academicYear: feeStructure.academicYear,
        month,
        year,
        baseAmount: feeStructure.baseAmount,
        discountAmount: "0.00",
        fineAmount: "0.00",
        totalAmount: totalAmount.toFixed(2),
        paidAmount: "0.00",
        status: "pending",
        dueDate: new Date(dueDate),
      })
      .returning();

      if(!newInvoice?.id) {
        return res.status(400).json({
        success: false,
        message: `Failed to create invoice`,
      });
      }

    // Ledger entry
    await db.insert(feeLedger).values({
      studentId,
      invoiceId: newInvoice.id,
      transactionType: "invoice_created",
      amount: totalAmount.toFixed(2),
      balanceBefore: "0.00",
      balanceAfter: totalAmount.toFixed(2),
      description: `Monthly invoice created for ${month}/${year}`,
      performedBy,
    });

    return res.status(201).json({
      success: true,
      message: "Monthly invoice created successfully",
      data: newInvoice,
    });
  } catch (err: unknown) {
    console.error("Error creating monthly invoice:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 2. CREATE ANNUAL INVOICE
// ============================================

export const createAnnualInvoice = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { studentId, feeStructureId, academicYear, dueDate } = req.body as CreateAnnualInvoiceBody;
    const performedBy = req.user?.id;

    if (!performedBy) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });

    const [feeStructure] = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.id, feeStructureId),
          eq(feeStructures.isActive, true),
          eq(feeStructures.feeType, "annual")
        )
      );
    if (!feeStructure)
      return res.status(404).json({
        success: false,
        message: "Fee structure not found or not active",
      });

    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, studentId),
          eq(invoices.academicYear, academicYear),
          eq(invoices.feeType, "annual")
        )
      );
    if (existingInvoice)
      return res.status(400).json({
        success: false,
        message: `Annual invoice already exists for ${student.name} for ${academicYear}`,
      });


      if (academicYear == undefined || academicYear.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Academic year is required",
        });
      }

    // Generate invoice number
    const year = parseInt(academicYear.split("-")[0]??"0");
    const latestInvoice = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.feeType, "annual"))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

      if(latestInvoice.length > 0 && !latestInvoice[0]?.invoiceNumber ) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate invoice number",
        });
      }

    const sequence =
      latestInvoice.length > 0
        ? parseInt(latestInvoice[0]?.invoiceNumber.split("-").pop() || "0") + 1
        : 1;

    const invoiceNumber = generateInvoiceNumber(year, null, sequence);

    const baseAmount = parseFloat(feeStructure.baseAmount);
    const totalAmount = calculateInvoiceTotal(baseAmount, 0, 0);

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        studentId,
        feeStructureId,
        invoiceNumber,
        feeType: "annual",
        academicYear,
        month: null,
        year,
        baseAmount: feeStructure.baseAmount,
        discountAmount: "0.00",
        fineAmount: "0.00",
        totalAmount: totalAmount.toFixed(2),
        paidAmount: "0.00",
        status: "pending",
        dueDate: new Date(dueDate),
      })
      .returning();

      if(!newInvoice?.id) {
        return res.status(400).json({
        success: false,
        message: `Failed to create invoice`,
      });
      }

    await db.insert(feeLedger).values({
      studentId,
      invoiceId: newInvoice.id,
      transactionType: "invoice_created",
      amount: totalAmount.toFixed(2),
      balanceBefore: "0.00",
      balanceAfter: totalAmount.toFixed(2),
      description: `Annual invoice created for ${academicYear}`,
      performedBy,
    });

    return res.status(201).json({
      success: true,
      message: "Annual invoice created successfully",
      data: newInvoice,
    });
  } catch (err: unknown) {
    console.error("Error creating annual invoice:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 3. CANCEL INVOICE
// ============================================

export const cancelInvoice = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { invoiceId } = req.params as { invoiceId: string };
    const { reason } = req.body as CancelInvoiceBody;
    const performedBy = req.user?.id;

    if (!performedBy) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice)
      return res.status(404).json({ success: false, message: "Invoice not found" });

    if (invoice.status === "paid")
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel a paid invoice" });

    if (invoice.status === "cancelled")
      return res
        .status(400)
        .json({ success: false, message: "Invoice is already cancelled" });

    await db
      .update(invoices)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));

    await db.insert(feeLedger).values({
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      transactionType: "invoice_cancelled",
      amount: "0.00",
      balanceBefore: invoice.totalAmount,
      balanceAfter: "0.00",
      description: `Invoice cancelled: ${reason}`,
      metadata: JSON.stringify({ reason }),
      performedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Invoice cancelled successfully",
    });
  } catch (err: unknown) {
    console.error("Error cancelling invoice:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export {};
