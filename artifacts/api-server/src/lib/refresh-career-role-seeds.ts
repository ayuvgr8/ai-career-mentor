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
        status: sql`CASE WHEN ${careerRolesTable.status} = 'approved' THEN ${careerRolesTable.status} ELSE excluded.status END`,
        // Approved copy is immutable here: only backfill the separately labeled
        // practice suggestion when absent, never replace an existing suggestion.
        content: sql`CASE WHEN ${careerRolesTable.status} = 'approved'
          THEN ${careerRolesTable.content} || jsonb_build_object('practiceProject', excluded.content->'practiceProject')
          ELSE excluded.content END`,
      },
      where: sql`${careerRolesTable.status} = 'coming'
        OR (${careerRolesTable.status} = 'illustrative' AND ${careerRolesTable.content}->>'label' = 'Illustrative first draft')
        OR (${careerRolesTable.status} = 'approved'
          AND ${careerRolesTable.content} IS NOT NULL
          AND NOT (${careerRolesTable.content} ? 'practiceProject')
          AND excluded.content->'practiceProject' IS NOT NULL)`,
    });
}
