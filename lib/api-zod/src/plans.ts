import { z } from "zod";

export const PlanId = z.string().uuid().brand<"PlanId">();
export type PlanId = z.infer<typeof PlanId>;

export const PlanConstraints = z.object({
  minutesPerWeek: z.number().int().min(30).max(2400),
  budget: z.enum(["free", "paid-ok"]),
  device: z.enum(["phone", "computer", "paper"]),
  city: z.string().trim().min(1).max(120),
  goal: z.enum(["discover", "grow", "switch"]),
});
export const PlanActivity = z.object({
  week: z.number().int().min(1).max(2),
  minutes: z.number().int().min(5).max(1200),
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().min(1).max(1500),
  doneWhen: z.string().trim().min(1).max(600),
});
export const PlanContent = z.object({
  rationale: z.string().trim().min(1).max(1500),
  activities: z.array(PlanActivity).min(6).max(8),
});
export const GeneratePlanBody = z.object({ constraints: PlanConstraints });
export const EditPlanBody = PlanContent.extend({
  expectedVersion: z.number().int().positive(),
});
export const PlanProgressBody = z.object({
  expectedVersion: z.number().int().positive(),
  completed: z.array(z.number().int().min(0).max(7)).max(8),
  reflection: z.string().trim().max(2000),
});
export const ReviewConsentBody = z.object({
  consent: z.literal(true),
  expectedVersion: z.number().int().positive(),
  reviewerName: z.string().min(1).max(120),
  reviewerId: z.string().min(1).max(120),
  profileFingerprint: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]+$/),
});
export type PlanConstraints = z.infer<typeof PlanConstraints>;
export type PlanContent = z.infer<typeof PlanContent>;
export type PlanActivity = z.infer<typeof PlanActivity>;
export type ReviewStatus =
  "pending" | "reviewed" | "changes_requested" | "unavailable";
export interface ReviewView {
  status: ReviewStatus;
  reviewerName: string;
  notes: string | null;
  version: number;
  stale: boolean;
}
export interface PlanView {
  id: string;
  roleSlug: string;
  version: number;
  content: PlanContent;
  constraints: PlanConstraints;
  completed: number[];
  reflection: string;
  stale: boolean;
  review: ReviewView | null;
}
export interface ReviewConfiguration {
  configured: boolean;
  live: boolean;
  reviewerName: string | null;
}
export interface ReviewPackage {
  planId: string;
  version: number;
  reviewerName: string;
  profileFingerprint: string;
  reviewerId: string;
  profileSummary: Record<string, unknown>;
  constraints: PlanConstraints;
  plan: PlanContent;
}
