import path from "node:path";
import { existsSync } from "node:fs";
import { pool } from "@workspace/db";
import { runMigrations } from "@workspace/db/migrations";
import { logger } from "./logger";

// A short, secret-free identifier for a database failure: a Node network code
// (ENOTFOUND, ECONNREFUSED), a PostgreSQL SQLSTATE (28P01 bad password,
// 3D000 missing database) or a TLS code (SELF_SIGNED_CERT_IN_CHAIN).
export function databaseErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^[A-Z0-9_]{2,40}$/.test(code)) return code;
    if (error instanceof AggregateError && error.errors.length) return databaseErrorCode(error.errors[0]);
    if (error instanceof Error && /ssl|tls/i.test(error.message)) return "TLS";
  }
  return "UNKNOWN";
}

// Render runs from the repository root; the bundle sits three levels below it.
const migrationDirs = [
  path.resolve(process.cwd(), "lib/db/migrations"),
  path.resolve(import.meta.dirname, "../../../lib/db/migrations"),
];

// Applying migrations on boot keeps a deployment correct even when the
// platform's start command does not run `pnpm db:migrate`. They are
// idempotent and lock-guarded, so concurrent instances are safe.
export async function migrateOnBoot(): Promise<void> {
  if (process.env.MIGRATE_ON_BOOT === "false") return;
  const dir = migrationDirs.find((candidate) => existsSync(candidate));
  if (!dir) {
    logger.warn("Migration directory not found; skipping boot migrations");
    return;
  }
  const client = await pool.connect();
  try {
    const count = await runMigrations(client, dir, (message) => logger.info(message));
    logger.info({ count }, "Database migrations checked");
  } finally {
    client.release();
  }
}
