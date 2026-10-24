// Applies lib/db/migrations/*.sql (see migrations.mjs). The API server also
// runs this on boot. Usage: DATABASE_URL=... node lib/db/migrate.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { runMigrations, sslFor } from "./migrations.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: sslFor(process.env.DATABASE_URL),
});
await client.connect();
try {
  const count = await runMigrations(client, dir);
  console.log(count ? `${count} migration(s) applied.` : "Database schema is up to date.");
} finally {
  await client.end();
}
