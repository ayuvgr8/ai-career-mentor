import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const careerPlansTable = pgTable(
  "career_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    roleSlug: varchar("role_slug", { length: 100 }).notNull(),
    version: integer("version").notNull().default(1),
    content: jsonb("content")
      .$type<{
        rationale: string;
        activities: {
          week: number;
          minutes: number;
          title: string;
          instructions: string;
          doneWhen: string;
        }[];
      }>()
      .notNull(),
    constraints: jsonb("constraints")
      .$type<{
        minutesPerWeek: number;
        budget: "free" | "paid-ok";
        device: "phone" | "computer" | "paper";
        city: string;
        goal: "discover" | "grow" | "switch";
      }>()
      .notNull(),
    profileFingerprint: varchar("profile_fingerprint", {
      length: 64,
    }).notNull(),
    completed: jsonb("completed").$type<number[]>().notNull().default([]),
    reflection: varchar("reflection", { length: 2000 }).notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("career_plans_user_role_idx").on(table.userId, table.roleSlug),
  ],
);

export const planReviewsTable = pgTable(
  "plan_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => careerPlansTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    profileFingerprint: varchar("profile_fingerprint", {
      length: 64,
    }).notNull(),
    reviewerName: varchar("reviewer_name", { length: 120 }).notNull(),
    reviewerId: varchar("reviewer_id", { length: 120 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    runId: varchar("run_id", { length: 120 }),
    notes: varchar("notes", { length: 4000 }),
    consentedAt: timestamp("consented_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("plan_reviews_version_idx").on(table.planId, table.version),
  ],
);
