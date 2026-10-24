import { createInsertSchema } from "drizzle-zod";
import { index, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export interface CareerRoleDayBlock {
  time: string;
  activity: string;
}

export interface CareerRoleJourneyStep {
  period: string;
  focus: string;
  evidence: string;
}

export interface CareerRoleAiImpact {
  changing: string;
  tasksToWatch: string[];
  humanEdge: string[];
}

export interface CareerRoleEntryRequirements {
  foundation: string[];
  helpful: string[];
  proofOfWork: string[];
}

export interface CareerRolePracticeProject {
  title: string;
  timebox: string;
  materials: string[];
  steps: string[];
  deliverable: string;
  reflection: string;
}

export interface CareerRoleContent {
  label: string | null;
  whyItFits: string;
  dayInLife: CareerRoleDayBlock[];
  metrics: string[];
  stakeholders: string[];
  journey: CareerRoleJourneyStep[];
  aiImpact: CareerRoleAiImpact;
  entryRequirements: CareerRoleEntryRequirements;
  practiceProject?: CareerRolePracticeProject;
}

export const careerRolesTable = pgTable(
  "career_roles",
  {
    slug: varchar("slug", { length: 100 }).primaryKey(),
    familySlug: varchar("family_slug", { length: 100 }).notNull(),
    familyTitle: varchar("family_title", { length: 150 }).notNull(),
    title: varchar("title", { length: 150 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    status: varchar("status", { length: 30 }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    content: jsonb("content").$type<CareerRoleContent | null>(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("career_roles_family_sort_idx").on(table.familySlug, table.sortOrder)],
);

export const insertCareerRoleSchema = createInsertSchema(careerRolesTable).omit({
  updatedAt: true,
});
export type InsertCareerRole = typeof careerRolesTable.$inferInsert;
export type CareerRole = typeof careerRolesTable.$inferSelect;
