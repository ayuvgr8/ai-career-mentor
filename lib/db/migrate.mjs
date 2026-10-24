// Applies lib/db/migrations/*.sql in name order, once each, under an advisory
// lock so two deploys cannot race. Every migration is also written to be
// idempotent, so a database first created with `drizzle-kit push` upgrades
// cleanly. Usage: DATABASE_URL=... node lib/db/migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
const LOCK_ID = 7_042_026;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
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
    console.log(`applied ${file}`);
    count += 1;
  }
  console.log(count ? `${count} migration(s) applied.` : "Database schema is up to date.");
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
  await client.end();
}
