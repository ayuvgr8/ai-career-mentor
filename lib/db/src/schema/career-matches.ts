import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { usersTable } from "./auth";

export type CareerRoleReaction = "interested" | "not-for-me";

export interface CareerMatchRecommendation {
  role: string;
  fit: number;
  why: string;
  quote: string;
}

// The match screen's saved signals: the last top-three result (so a revisit
// does not bill a new model call), the user's reaction to each suggested
// family, and which sub-role guides they opened. Reactions are tentative
// signals the user chose to give, never a diagnosis.
export const careerMatchesTable = pgTable("career_matches", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  recommendations: jsonb("recommendations")
    .$type<CareerMatchRecommendation[]>()
    .notNull()
    .default([]),
  profileFingerprint: varchar("profile_fingerprint", { length: 64 }),
  reactions: jsonb("reactions")
    .$type<Record<string, CareerRoleReaction>>()
    .notNull()
    .default({}),
  opened: jsonb("opened").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
