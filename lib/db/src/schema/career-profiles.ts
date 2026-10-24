import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { usersTable } from "./auth";

export interface CareerProfileData {
  name: string;
  city: string;
  ageBand: string | null;
  persona: "student" | "professional";
  currentStage: string | null;
  company: string | null;
  yearsExperience: string | null;
  internships: string[];
  interests: string[];
  energizers: string[];
  chores: string[];
  workStyle: string;
  preferredMake: string;
  strengths: string[];
  constraints: string[];
  familyExpectations: string | null;
  moneyNeeds: string | null;
  relocation: string | null;
}

export const careerProfilesTable = pgTable("career_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  profile: jsonb("profile").$type<CareerProfileData>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
