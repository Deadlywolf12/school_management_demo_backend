import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Import all tables
import * as users from "./schema/users";
import * as otps from "./schema/otps";
import { students } from "./schema/actorsSchemas/students";
import { parents } from "./schema/actorsSchemas/parents";
import { student_parents } from "./schema/actorsSchemas/student_parent";
import { teachers } from "./schema/actorsSchemas/teacher";
import { staff } from "./schema/actorsSchemas/staff";


dotenv.config({ path: "../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_DOCKER!,
});

// Spread all tables in the schema
export const db = drizzle(pool, {
  schema: {
    ...users,
    ...otps,
    ...students,
    ...parents,
    ...student_parents,
    ...teachers,
    ...staff,
  },
});
