import { db } from "../db";
import { Request, Response } from "express";
import {
  invoices,
  payments,
  feeLedger,
  paymentHistorySummary,
  discounts,
  fines,
} from "../db/schema/fee";
import { students } from "../db/schema/students";
import { eq, and, or, sql, desc, asc, gte, lte, between, inArray, count } from "drizzle-orm";
import { invoiceStatusEnum, feeTypeEnum } from "../db/schema/fee";
// ============================================
// 8. GET STUDENT FEE DETAILS
// ============================================

export const getStudentFeeDetails = async (
  req: Request<{ studentId: string }, {}, {}, { academicYear?: string; status?: string }>,
  res: Response
) => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;

    // 1. Verify student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 2. Build query conditions
    let conditions: any[] = [eq(invoices.studentId, studentId)];

    if (academicYear) {
      conditions.push(eq(invoices.academicYear, academicYear));
    }

    if (status && status !== "all") {
         if (
    status === "pending" ||
    status === "paid" ||
    status === "overdue" ||
    status === "cancelled"
  ) {
    conditions.push(eq(invoices.status, status));
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid status filter",
    });
  }
    }

    // 3. Get invoices
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt));

    // 4. Calculate summary
    const totalInvoiced = invoicesList.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount),
      0
    );
    const totalPaid = invoicesList.reduce(
      (sum, inv) => sum + parseFloat(inv.paidAmount),
      0
    );
    const totalPending = invoicesList
      .filter((inv) => inv.status === "pending" || inv.status === "overdue")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.studentId,
          class: student.class,
        },
        summary: {
          totalInvoiced: totalInvoiced.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalPending: totalPending.toFixed(2),
          collectionRate:
            totalInvoiced > 0
              ? ((totalPaid / totalInvoiced) * 100).toFixed(2) + "%"
              : "0%",
        },
        invoices: invoicesList,
        totalInvoices: invoicesList.length,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching student fee details:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 9. GET FEE HISTORY (LEDGER)
// ============================================

export const getFeeHistory = async (
  req: Request<
    { studentId: string },
    {},
    {},
    { page?: string; limit?: string }
  >,
  res: Response
) => {
  try {
    const { studentId } = req.params;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "50");
    const offset = (page - 1) * limit;

    // 1. Verify student exists
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 2. Get ledger entries
    const ledgerEntries = await db
      .select()
      .from(feeLedger)
      .where(eq(feeLedger.studentId, studentId))
      .orderBy(desc(feeLedger.performedAt))
      .limit(limit)
      .offset(offset);

   const total = await db.$count(
  feeLedger,
  eq(feeLedger.studentId, studentId)
);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.studentId,
          class: student.class,
        },
        history: ledgerEntries,
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching fee history:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 10. GET PAYMENT HISTORY (ALL STUDENTS)
// ============================================

export const getPaymentHistory = async (
  req: Request<
    {},
    {},
    {},
    {
      page?: string;
      limit?: string;
      startDate?: string;
      endDate?: string;
      studentId?: string;
      paymentMethod?: string;
    }
  >,
  res: Response
) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const offset = (page - 1) * limit;
    const { startDate, endDate, studentId, paymentMethod } = req.query;

    // Build conditions
    let conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(paymentHistorySummary.paymentDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(paymentHistorySummary.paymentDate, new Date(endDate)));
    }

    if (studentId) {
      conditions.push(eq(paymentHistorySummary.studentId, studentId));
    }

    if (paymentMethod && paymentMethod !== "all") {
      conditions.push(eq(paymentHistorySummary.paymentMethod, paymentMethod));
    }

    // Get payment history
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const paymentHistory = await db
      .select()
      .from(paymentHistorySummary)
      .where(whereClause)
      .orderBy(desc(paymentHistorySummary.paymentDate))
      .limit(limit)
      .offset(offset);

    // Get total count
    const total = await db.$count(
      paymentHistorySummary,
      whereClause
    );

    // Calculate summary
    const totalAmount = paymentHistory.reduce(
      (sum, payment) => sum + parseFloat(payment.amount),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        payments: paymentHistory,
        summary: {
          totalAmount: totalAmount.toFixed(2),
          totalPayments: paymentHistory.length,
        },
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching payment history:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 11. GET PAYMENT DETAILS
// ============================================

export const getPaymentDetails = async (
  req: Request<{ paymentId: string }>,
  res: Response
) => {
  try {
    const { paymentId } = req.params;

    // Get payment with invoice and student details
    const [paymentData] = await db
      .select({
        payment: payments,
        invoice: invoices,
        student: {
          id: students.id,
          name: students.name,
          studentId: students.studentId,
          class: students.class,
        },
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(students, eq(payments.studentId, students.id))
      .where(eq(payments.id, paymentId));

    if (!paymentData) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Get discounts applied to this invoice
    const discountsList = await db
      .select()
      .from(discounts)
      .where(eq(discounts.invoiceId, paymentData.invoice.id))
      .orderBy(desc(discounts.appliedAt));

    // Get fines applied to this invoice
    const finesList = await db
      .select()
      .from(fines)
      .where(eq(fines.invoiceId, paymentData.invoice.id))
      .orderBy(desc(fines.appliedAt));

    return res.status(200).json({
      success: true,
      data: {
        payment: paymentData.payment,
        invoice: paymentData.invoice,
        student: paymentData.student,
        discounts: discountsList,
        fines: finesList,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching payment details:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ============================================
// 12. GET DASHBOARD STATISTICS
// ============================================

export const getDashboardStats = async (
  req: Request<
    {},
    {},
    {},
    { academicYear?: string; month?: string; year?: string }
  >,
  res: Response
) => {
  try {
    const { academicYear, month, year } = req.query;

    // Build conditions for invoices
    let invoiceConditions: any[] = [];
    
    if (academicYear) {
      invoiceConditions.push(eq(invoices.academicYear, academicYear));
    }
    
    if (month) {
      invoiceConditions.push(eq(invoices.month, parseInt(month)));
    }
    
    if (year) {
      invoiceConditions.push(eq(invoices.year, parseInt(year)));
    }

    const invoiceWhere =
      invoiceConditions.length > 0 ? and(...invoiceConditions) : undefined;

    // Get invoice statistics
    const allInvoices = await db
      .select()
      .from(invoices)
      .where(invoiceWhere);

    const totalInvoiced = allInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount),
      0
    );

    const totalPaid = allInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.paidAmount),
      0
    );

    const pendingInvoices = allInvoices.filter(
      (inv) => inv.status === "pending"
    );
    const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
    const overdueInvoices = allInvoices.filter(
      (inv) => inv.status === "overdue"
    );

    const totalPending = pendingInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount),
      0
    );

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount),
      0
    );

    // Collection rate
    const collectionRate =
      totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    // Get payment count for the period
    let paymentConditions: any[] = [];
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      paymentConditions.push(
        between(payments.receivedAt, startDate, endDate)
      );
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      paymentConditions.push(
        between(payments.receivedAt, startDate, endDate)
      );
    }

    const paymentWhere =
      paymentConditions.length > 0 ? and(...paymentConditions) : undefined;

    const totalPayments = await db.$count(payments, paymentWhere);
    const paymentCount = totalPayments;
    return res.status(200).json({
      success: true,
      data: {
        invoices: {
          total: allInvoices.length,
          pending: pendingInvoices.length,
          paid: paidInvoices.length,
          overdue: overdueInvoices.length,
        },
        amounts: {
          totalInvoiced: totalInvoiced.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalPending: totalPending.toFixed(2),
          totalOverdue: totalOverdue.toFixed(2),
        },
        collectionRate: collectionRate.toFixed(2) + "%",
        payments: {
          total: paymentCount,
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching dashboard stats:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export {};