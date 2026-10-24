// Shared by `pnpm db:migrate` (migrate.mjs) and the API server's boot.
// Applies <dir>/*.sql in name order, once each, under an advisory lock so two
// processes cannot race. Every migration is also idempotent.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const LOCK_ID = 7_042_026;

// Render's external database hostnames require TLS; its internal ones (same
// region, private network) do not. An explicit sslmode in the URL or
// DATABASE_SSL=true|false always wins.
export function sslFor(connectionString) {
  if (process.env.DATABASE_SSL === "false") return undefined;
  if (process.env.DATABASE_SSL === "true") return { rejectUnauthorized: process.env.DATABASE_SSL_VERIFY !== "false" };
  try {
    const url = new URL(connectionString);
    if (url.searchParams.has("sslmode")) return undefined;
    if (url.hostname.endsWith(".render.com")) return { rejectUnauthorized: process.env.DATABASE_SSL_VERIFY !== "false" };
  } catch {
    // Let pg report the malformed URL itself.
  }
  return undefined;
}

export async function runMigrations(client, dir, log = console.log) {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(200) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.name));
    const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      // Each file manages its own BEGIN/COMMIT.
      await client.query(await readFile(path.join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      log(`applied ${file}`);
      count += 1;
    }
    return count;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
  }
}
