import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  // Owned by migrate.mjs; push must never propose dropping it.
  tablesFilter: ["!schema_migrations"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
