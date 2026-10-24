import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
// An idle client can be dropped by the server or network. Without a listener
// pg re-emits that as an uncaught error and the whole process exits.
pool.on("error", (error) => {
  console.error(`PostgreSQL idle client error: ${error.message}`);
});
export const db = drizzle(pool, { schema });

export * from "./schema";
