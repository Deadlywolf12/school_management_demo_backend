import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Import all tables
import * as users from "./schema/users";
import * as otps from "./schema/otps";

import { student_parents } from "./schema/student_parent";
import { staff } from "./schema/staff";
import { teachers } from "./schema/teacher";
import { parents } from "./schema/parents";
import { students } from "./schema/students";
import { subjects } from "./schema/subjects";
import { classSubjects, studentGrades } from "./schema/grades";
import { discounts, feeLedger, feeStructures, fines, invoices, paymentHistorySummary, payments } from "./schema/fee";
import { classes } from "./schema/classes";
import { bonusRecords, deductionRecords, salaryAdjustments, salaryRecords } from "./schema/salary";
import { bulkMarkingSessions, examAttendance, examinations, examResults, examSchedules } from "./schema/examination";



dotenv.config({ path: "../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_DOCKER!,
  ssl: { rejectUnauthorized: false },
});

// Spread all tables in the schema
export const db = drizzle(pool, {
  schema: {
    ...users,
    ...otps,
    ...subjects,
    ...students,
    ...parents,
    ...student_parents,
    ...teachers,
    ...staff,
    ...classSubjects,
    ...studentGrades, 
    ...feeStructures,
    ...invoices,
    ...discounts,
    ...fines,
    ...payments,
    ...feeLedger,
    ...paymentHistorySummary,
    ...classes,
    ...salaryAdjustments,
    ...salaryRecords,
    ...bonusRecords,
    ...deductionRecords,
    ...examinations,
    ...examAttendance,
    ...examResults,
    ...examSchedules,
    ...bulkMarkingSessions
  },
});
