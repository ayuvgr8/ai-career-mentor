// First-run setup for local development. Safe to run repeatedly; `pnpm dev`
// runs it before starting the servers.
//   1. creates .env from .env.example with local defaults when it is missing
//   2. creates the local development database when it does not exist yet
//   3. applies lib/db/migrations (idempotent, tracked in schema_migrations)
//   4. reports configuration the operator still has to fill in
// It never prints secret values and never touches a non-local database's
// existence: remote databases must be provisioned by their platform.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const quiet = process.argv.includes("--quiet");
const say = (message) => { if (!quiet) console.log(message); };
const warn = (message) => console.warn(`⚠  ${message}`);

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error(`Node ${process.versions.node} is too old. Use Node 24 (see .node-version).`);
  process.exit(1);
}

if (!existsSync(envPath)) {
  const user = os.userInfo().username;
  const example = readFileSync(path.join(root, ".env.example"), "utf8")
    .replace(/^APP_ORIGIN=.*$/m, "APP_ORIGIN=http://localhost:5173")
    .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=postgres://${user}@127.0.0.1:5432/rolevo`)
    // Replit Auth needs a registered callback; local runs use the explicit
    // device-only mode, which the sign-in screen discloses to the user.
    .replace(/^AUTH_MODE=.*$/m, "AUTH_MODE=anonymous");
  writeFileSync(envPath, example, { mode: 0o600 });
  console.log("Created .env with local defaults. Add your AI provider key to it.");
}

const env = { ...parseEnv(readFileSync(envPath, "utf8")), ...process.env };

const missing = ["AI_INTEGRATIONS_OPENAI_BASE_URL", "AI_INTEGRATIONS_OPENAI_API_KEY"].filter((key) => !env[key]);
if (missing.length) {
  console.error(`Missing ${missing.join(" and ")} in .env. The server needs an OpenAI-compatible provider (for example https://api.openai.com/v1 and your key).`);
  process.exit(1);
}
if (env.AUTH_MODE !== "anonymous" && !env.REPL_ID) {
  warn("AUTH_MODE is replit but REPL_ID is empty, so sign-in is unavailable. Set AUTH_MODE=anonymous for local testing.");
}

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is missing in .env.");
  process.exit(1);
}

const require = createRequire(path.join(root, "lib/db/package.json"));
const pg = require("pg");
await ensureDatabase(env.DATABASE_URL);

const migrate = spawnSync(process.execPath, [path.join(root, "lib/db/migrate.mjs")], {
  env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
  stdio: quiet ? ["ignore", "ignore", "inherit"] : "inherit",
});
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

say("Ready. Run `pnpm dev` and open http://localhost:5173");

async function ensureDatabase(url) {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.end();
    return;
  } catch (error) {
    await client.end().catch(() => {});
    const target = new URL(url);
    const local = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
    if (error.code === "ECONNREFUSED") {
      console.error(`PostgreSQL is not running at ${target.host}. Start it (for example \`brew services start postgresql@16\`) and retry.`);
      process.exit(1);
    }
    // 3D000: database does not exist. Only create local development databases.
    if (error.code !== "3D000" || !local) {
      console.error(`Could not connect to the database: ${error.message}`);
      process.exit(1);
    }
    const name = decodeURIComponent(target.pathname.slice(1));
    const admin = new URL(url);
    admin.pathname = "/postgres";
    const adminClient = new pg.Client({ connectionString: admin.href });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
    await adminClient.end();
    console.log(`Created local database ${name}.`);
  }
}

function parseEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}
