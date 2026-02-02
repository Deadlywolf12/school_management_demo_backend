import { db } from "../db";
import { Request, Response } from "express";
import {
  invoices,
  discounts,
  fines,
  payments,
  feeLedger,
  paymentHistorySummary,
} from "../db/schema/fee";
import { students } from "../db/schema/students";
import { eq, and, sql } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";
import { Interface } from "readline";
import { classes } from "../db/schema/classes";

// ============================================
// HELPER FUNCTIONS
// ============================================

const calculateDiscountAmount = (
  baseAmount: number,
  discountType: "percentage" | "flat",
  value: number
): number => {
  if (discountType === "percentage") {
    return (baseAmount * value) / 100;
  }
  return value;
};

const calculateInvoiceTotal = (
  baseAmount: number,
  discountAmount: number,
  fineAmount: number
): number => {
  return baseAmount - discountAmount + fineAmount;
};

const generatePaymentNumber = (year: number, sequence: number): string => {
  return `PAY-${year}-${sequence.toString().padStart(8, "0")}`;
};

interface ApplyDiscountBody {
  invoiceId: string;
  discountType: "percentage" | "flat";
  value: number;
  reason: string;
  notes?: string;
}

// ============================================
// 5. APPLY DISCOUNT
// ============================================

export const applyDiscount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { invoiceId, discountType, value, reason, notes } = req.body as ApplyDiscountBody;
    const performedBy = req.user?.id;

    if(!performedBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1. Get invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // 2. Check invoice status
    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot apply discount to paid invoice",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot apply discount to cancelled invoice",
      });
    }

    // 3. Calculate discount amount
    const baseAmount = parseFloat(invoice.baseAmount);
    const discountAmount = calculateDiscountAmount(
      baseAmount,
      discountType,
      value
    );

    // 4. Validate discount doesn't exceed base amount
    const currentDiscountAmount = parseFloat(invoice.discountAmount);
    const totalDiscount = currentDiscountAmount + discountAmount;

    if (totalDiscount > baseAmount) {
      return res.status(400).json({
        success: false,
        message: `Total discount ($${totalDiscount.toFixed(2)}) cannot exceed base amount ($${baseAmount.toFixed(2)})`,
      });
    }

    // 5. Create discount record
    const [newDiscount] = await db
      .insert(discounts)
      .values({
        invoiceId,
        discountType,
        value: value.toString(),
        amount: discountAmount.toFixed(2),
        reason,
        appliedBy: performedBy,
        notes: notes || null,
      })
      .returning();

    // 6. Update invoice
    const newDiscountTotal = totalDiscount.toFixed(2);
    const fineAmount = parseFloat(invoice.fineAmount);
    const newTotal = calculateInvoiceTotal(baseAmount, totalDiscount, fineAmount);

    await db
      .update(invoices)
      .set({
        discountAmount: newDiscountTotal,
        totalAmount: newTotal.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

      if(newDiscount?.id === undefined) {
        return res.status(400).json({
        success: false,
        message: `Failed to create discount record`,
      });
      }

    // 7. Create ledger entry
    await db.insert(feeLedger).values({
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      transactionType: "discount_applied",
      transactionId: newDiscount.id,
      amount: `-${discountAmount.toFixed(2)}`,
      balanceBefore: invoice.totalAmount,
      balanceAfter: newTotal.toFixed(2),
      description: `Discount applied: ${reason}`,
      metadata: JSON.stringify({ discountType, value }),
      performedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Discount applied successfully",
      data: {
        discount: newDiscount,
        newInvoiceTotal: newTotal.toFixed(2),
      },
    });
  } catch (err: unknown) {
    console.error("Error applying discount:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 6. APPLY FINE
// ============================================


interface ApplyFineBody {
   invoiceId: string;
      fineType: "late_fee" | "penalty" | "other";
      amount: number;
      reason: string;
      notes?: string;
}

export const applyFine = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { invoiceId, fineType, amount, reason, notes } = req.body as ApplyFineBody;
    const performedBy = req.user?.id;
    if(!performedBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1. Get invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // 2. Check invoice status
    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot apply fine to paid invoice",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot apply fine to cancelled invoice",
      });
    }

    // 3. Create fine record
    const [newFine] = await db
      .insert(fines)
      .values({
        invoiceId,
        fineType,
        amount: amount.toFixed(2),
        reason,
        appliedBy: performedBy,
        notes: notes || null,
      })
      .returning();

    // 4. Update invoice
    const currentFineAmount = parseFloat(invoice.fineAmount);
    const newFineTotal = (currentFineAmount + amount).toFixed(2);
    
    const baseAmount = parseFloat(invoice.baseAmount);
    const discountAmount = parseFloat(invoice.discountAmount);
    const newTotal = calculateInvoiceTotal(
      baseAmount,
      discountAmount,
      currentFineAmount + amount
    );

    await db
      .update(invoices)
      .set({
        fineAmount: newFineTotal,
        totalAmount: newTotal.toFixed(2),
        status: invoice.status === "pending" ? "overdue" : invoice.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

      if(newFine?.id === undefined) {
        return res.status(400).json({
        success: false,
        message: `Failed to create fine record`,
      });
      }

    // 5. Create ledger entry
    await db.insert(feeLedger).values({
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      transactionType: "fine_applied",
      transactionId: newFine.id,
      amount: amount.toFixed(2),
      balanceBefore: invoice.totalAmount,
      balanceAfter: newTotal.toFixed(2),
      description: `Fine applied: ${reason}`,
      metadata: JSON.stringify({ fineType }),
      performedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Fine applied successfully",
      data: {
        fine: newFine,
        newInvoiceTotal: newTotal.toFixed(2),
      },
    });
  } catch (err: unknown) {
    console.error("Error applying fine:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 7. PAY FEE (FULL PAYMENT ONLY)
// ============================================

interface PayFeeBody {
   invoiceId: string;
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;

}

export const payFee = async (
  req: AuthRequest,
   
  res: Response
) => {
  try {
    const { invoiceId, amount, paymentMethod, referenceNumber, notes } =
      req.body as PayFeeBody;
    const performedBy = req.user?.id;

    if(!performedBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }   

    // 1. Get invoice with student details
    const [invoiceData] = await db
      .select({
        invoice: invoices,
        student: {
          id: students.id,
          name: students.name,
          
          classId: students.classId,
          classNumber: classes.classNumber,
          section: classes.section,
        },
      })
      .from(invoices)
      .innerJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id)) 
      .where(eq(invoices.id, invoiceId));

    if (!invoiceData) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const invoice = invoiceData.invoice;
    const student = invoiceData.student;

    // 2. Validate invoice status
    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already paid",
      });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay cancelled invoice",
      });
    }

   
    const invoiceTotal = parseFloat(invoice.totalAmount);
    const tolerance = 0.01; // Allow 1 cent tolerance for floating point

    if (Math.abs(amount - invoiceTotal) > tolerance) {
      return res.status(400).json({
        success: false,
        message: `Payment must be full amount. Expected: $${invoiceTotal.toFixed(2)}, Received: $${amount.toFixed(2)}`,
      });
    }

    // 4. Generate payment number
    const year = new Date().getFullYear();
    const latestPayment = await db
      .select({ paymentNumber: payments.paymentNumber })
      .from(payments)
      .orderBy(sql`${payments.createdAt} DESC`)
      .limit(1);

      if(latestPayment.length > 0 && !latestPayment[0]?.paymentNumber ) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate payment number",
        });
      }

    const sequence =
      latestPayment.length > 0
        ? parseInt((latestPayment[0]?.paymentNumber ?? "0").split("-").pop() || "0") + 1
        : 1;

    const paymentNumber = generatePaymentNumber(year, sequence);

    // 5. Begin transaction (conceptual - implement actual transaction)
    try {
      // Create payment record
      const [newPayment] = await db
        .insert(payments)
        .values({
          invoiceId,
          studentId: invoice.studentId,
          paymentNumber,
          amount: amount.toFixed(2),
          paymentMethod,
          referenceNumber: referenceNumber || null,
          status: "completed",
          receivedBy: performedBy,
          notes: notes || null,
        })
        .returning();

      // Update invoice
      await db
        .update(invoices)
        .set({
          paidAmount: amount.toFixed(2),
          status: "paid",
          paidDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

        if(newPayment?.id === undefined) {  
        return res.status(400).json({
        success: false,
        message: `Failed to create payment record`,
      });
        }

      // Create ledger entry
      await db.insert(feeLedger).values({
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        transactionType: "payment_received",
        transactionId: newPayment.id,
        amount: `-${amount.toFixed(2)}`,
        balanceBefore: invoice.totalAmount,
        balanceAfter: "0.00",
        description: `Payment received via ${paymentMethod}`,
        metadata: JSON.stringify({ paymentMethod, referenceNumber }),
        performedBy,
      });

      // Create payment history summary record
      await db.insert(paymentHistorySummary).values({
        studentId: invoice.studentId,
        studentName: student.name,
        studentClass: `${classes.classNumber}-${classes.section}`,
        paymentId: newPayment.id,
        invoiceId: invoice.id,
        amount: amount.toFixed(2),
        feeType: invoice.feeType,
        academicYear: invoice.academicYear,
        month: invoice.month,
        year: invoice.year,
        paymentMethod,
        paymentDate: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "Payment received successfully",
        data: {
          payment: newPayment,
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            status: "paid",
            paidDate: new Date(),
          },
        },
      });
    } catch (transactionErr) {
      // Rollback would happen here in actual transaction
      throw transactionErr;
    }
  } catch (err: unknown) {
    console.error("Error processing payment:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export {};