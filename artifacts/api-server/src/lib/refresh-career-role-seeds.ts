import { careerRolesTable, type db, type InsertCareerRole } from "@workspace/db";
import { sql } from "drizzle-orm";
import { careerRoleSeeds } from "./career-role-seeds";

// Accept a transaction as well as the database so the real upsert can be tested
// against an isolated temporary table.
export function refreshCareerRoleSeeds(
  database: Pick<typeof db, "insert">,
  seeds: InsertCareerRole[] = careerRoleSeeds,
) {
  return database
    .insert(careerRolesTable)
    .values(seeds)
    .onConflictDoUpdate({
      target: careerRolesTable.slug,
      set: {
        status: sql`excluded.status`,
        content: sql`excluded.content`,
      },
      where: sql`${careerRolesTable.status} = 'coming' OR (${careerRolesTable.status} = 'illustrative' AND ${careerRolesTable.content}->>'label' = 'Illustrative first draft')`,
    });
}
