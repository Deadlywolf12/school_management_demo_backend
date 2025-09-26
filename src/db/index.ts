import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as users from "./schema/users";
import * as otps from "./schema/otps";


dotenv.config({ path: "../.env" });

const pool = new Pool({connectionString: process.env.DATABASE_URL_DOCKER!,});

export const db = drizzle(pool, { schema: { ...users, ...otps } });