import { and, eq } from "drizzle-orm";
import {
  db,
  careerPlansTable,
  careerProfilesTable,
  planReviewsTable,
} from "@workspace/db";
import type {
  ReviewConfiguration,
  ReviewPackage,
  ReviewStatus,
} from "@workspace/api-zod";
import { fingerprint } from "../lib/plan-validation";

export function reviewConfiguration(): ReviewConfiguration {
  const configured = Boolean(
    process.env.AGENTICORG_URL &&
    process.env.AGENTICORG_KEY &&
    process.env.AGENTICORG_WORKFLOW_ID &&
    process.env.AGENTICORG_REVIEWER_NAME &&
    process.env.AGENTICORG_REVIEWER_ID,
  );
  return {
    configured,
    live: configured && process.env.AGENTICORG_VERIFIED === "true",
    reviewerName: process.env.AGENTICORG_REVIEWER_NAME || null,
  };
}

async function agentic(
  path: string,
  payload?: unknown,
  signal = AbortSignal.timeout(15000),
): Promise<Record<string, unknown>> {
  const base = new URL(process.env.AGENTICORG_URL!);
  if (base.protocol !== "https:")
    throw new Error("AgenticOrg requires an HTTPS URL.");
  const response = await fetch(`${base.href.replace(/\/$/, "")}${path}`, {
    method: payload === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.AGENTICORG_KEY}`,
      "Content-Type": "application/json",
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    signal,
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`AgenticOrg returned HTTP ${response.status}`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw new Error("Invalid AgenticOrg response.");
  return result as Record<string, unknown>;
}

// The caller supplies an authenticated owner. Never accept a profile or review package from the browser.
export async function getReviewPackage(
  planId: string,
  userId: string,
): Promise<ReviewPackage> {
  const [plan] = await db
    .select()
    .from(careerPlansTable)
    .where(
      and(eq(careerPlansTable.id, planId), eq(careerPlansTable.userId, userId)),
    );
  const [profile] = await db
    .select()
    .from(careerProfilesTable)
    .where(eq(careerProfilesTable.userId, userId));
  if (!plan || !profile)
    throw new Error("Plan or confirmed profile not found.");
  if (fingerprint(profile.profile) !== plan.profileFingerprint)
    throw new Error("Regenerate the plan after changing your profile.");
  const {
    persona,
    currentStage,
    interests,
    energizers,
    strengths,
    chores,
    workStyle,
    constraints,
    moneyNeeds,
    relocation,
  } = profile.profile;
  return {
    planId,
    version: plan.version,
    reviewerName: reviewConfiguration().reviewerName || "",
    reviewerId: process.env.AGENTICORG_REVIEWER_ID || "",
    profileFingerprint: plan.profileFingerprint,
    profileSummary: {
      persona,
      currentStage,
      interests,
      energizers,
      strengths,
      chores,
      workStyle,
      constraints,
      moneyNeeds,
      relocation,
    },
    constraints: plan.constraints,
    plan: plan.content,
  };
}

export async function requestReview(
  planId: string,
  userId: string,
  expected: {
    version: number;
    profileFingerprint: string;
    reviewerName: string;
    reviewerId: string;
  },
) {
  if (!reviewConfiguration().configured)
    throw new Error("Review is not yet configured.");
  // A locked plan prevents concurrent edit/submit races. Insert before sending; a timeout is ambiguous,
  // so never automatically repeat an external POST for this version.
  const claim = await db.transaction(async (tx) => {
    const [plan] = await tx
      .select()
      .from(careerPlansTable)
      .where(
        and(
          eq(careerPlansTable.id, planId),
          eq(careerPlansTable.userId, userId),
        ),
      )
      .for("update");
    if (!plan) throw new Error("Plan not found.");
    const packageData = await getReviewPackage(planId, userId);
    if (
      packageData.version !== expected.version ||
      packageData.profileFingerprint !== expected.profileFingerprint ||
      packageData.reviewerName !== expected.reviewerName ||
      packageData.reviewerId !== expected.reviewerId
    )
      throw new Error(
        "The review package changed. Open the consent screen again.",
      );
    const [existing] = await tx
      .select()
      .from(planReviewsTable)
      .where(
        and(
          eq(planReviewsTable.planId, planId),
          eq(planReviewsTable.version, plan.version),
        ),
      );
    if (existing) return { review: existing, packageData, claimed: false };
    const [review] = await tx
      .insert(planReviewsTable)
      .values({
        planId,
        version: plan.version,
        profileFingerprint: plan.profileFingerprint,
        reviewerName: packageData.reviewerName,
        reviewerId: process.env.AGENTICORG_REVIEWER_ID!,
        status: "pending",
      })
      .returning();
    return { review, packageData, claimed: true };
  });
  if (!claim.claimed) return claim.review;
  // Commit the claim BEFORE contacting the provider. An interrupted request is never resent.
  const { review, packageData } = claim;
  try {
    const result = await agentic(
      `/workflows/${encodeURIComponent(process.env.AGENTICORG_WORKFLOW_ID!)}/run`,
      {
        payload: {
          ...packageData,
          reviewId: review.id,
          ...(process.env.AGENTICORG_COMPANY_ID
            ? { company_id: process.env.AGENTICORG_COMPANY_ID }
            : {}),
        },
      },
    );
    if (
      typeof result.run_id !== "string" ||
      !/^[a-zA-Z0-9-]{1,120}$/.test(result.run_id)
    )
      throw new Error("Missing run ID.");
    return (
      await db
        .update(planReviewsTable)
        .set({ runId: result.run_id })
        .where(eq(planReviewsTable.id, review.id))
        .returning()
    )[0];
  } catch {
    return (
      await db
        .update(planReviewsTable)
        .set({
          status: "unavailable",
          notes:
            "Could not confirm workflow creation. The operator must check AgenticOrg before another request; no automatic retry was sent.",
        })
        .where(eq(planReviewsTable.id, review.id))
        .returning()
    )[0];
  }
}

export function decisionFromItems(
  items: Record<string, unknown>[],
  runId: string,
  reviewerId: string,
): { status: ReviewStatus; notes: string | null } {
  const related = items.filter((item) => item.workflow_run_id === runId);
  const decided = related.filter(
    (item) =>
      item.decision_by === reviewerId &&
      typeof item.decision_at === "string" &&
      Number.isFinite(Date.parse(item.decision_at)),
  );
  const rejected = decided.find(
    (item) =>
      (item.status === "rejected" || item.status === "decided") &&
      item.decision === "reject",
  );
  if (rejected)
    return {
      status: "changes_requested",
      notes:
        typeof rejected.decision_notes === "string"
          ? rejected.decision_notes.slice(0, 4000)
          : null,
    };
  const approved = decided.find(
    (item) => item.status === "decided" && item.decision === "approve",
  );
  if (
    approved &&
    !related.some(
      (item) => item.status === "pending" || item.status === "expired",
    )
  )
    return {
      status: "reviewed",
      notes:
        typeof approved.decision_notes === "string"
          ? approved.decision_notes.slice(0, 4000)
          : null,
    };
  return { status: "pending", notes: null };
}

export async function getReviewStatus(planId: string, userId: string) {
  const [plan] = await db
    .select()
    .from(careerPlansTable)
    .where(
      and(eq(careerPlansTable.id, planId), eq(careerPlansTable.userId, userId)),
    );
  if (!plan) throw new Error("Plan not found.");
  const [review] = await db
    .select()
    .from(planReviewsTable)
    .where(
      and(
        eq(planReviewsTable.planId, planId),
        eq(planReviewsTable.version, plan.version),
      ),
    );
  if (!review || review.status !== "pending") return review || null;
  if (!review.runId) {
    if (Date.now() - review.updatedAt.getTime() < 60000) return review;
    return (
      await db
        .update(planReviewsTable)
        .set({
          status: "unavailable",
          notes:
            "Workflow creation was interrupted. The operator must reconcile this request in AgenticOrg; it will not be resent automatically.",
        })
        .where(eq(planReviewsTable.id, review.id))
        .returning()
    )[0];
  }
  if (Date.now() - review.updatedAt.getTime() < 10000) return review;
  const [reserved] = await db
    .update(planReviewsTable)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(planReviewsTable.id, review.id),
        eq(planReviewsTable.updatedAt, review.updatedAt),
        eq(planReviewsTable.status, "pending"),
      ),
    )
    .returning();
  if (!reserved) return review;
  const deadline = AbortSignal.timeout(15000);
  const run = await agentic(
    `/workflows/runs/${encodeURIComponent(review.runId)}`,
    undefined,
    deadline,
  );
  // Run completion alone is never evidence of human approval. Read attributed queue decisions.
  const items: Record<string, unknown>[] = [];
  for (const status of ["decided", "rejected", "pending", "expired"]) {
    for (let page = 1; page <= 10; page++) {
      const result = await agentic(
        `/approvals?status=${status}&include_expired=true&per_page=100&page=${page}`,
        undefined,
        deadline,
      );
      if (
        !Array.isArray(result.items) ||
        typeof result.pages !== "number" ||
        !Number.isInteger(result.pages) ||
        result.items.some(
          (item: unknown) =>
            !item || typeof item !== "object" || Array.isArray(item),
        )
      )
        throw new Error("Invalid approval response.");
      items.push(...result.items);
      if (page >= result.pages) break;
      if (page === 10)
        throw new Error("Approval history exceeds the bounded poll.");
    }
  }
  let decision = decisionFromItems(items, review.runId, review.reviewerId);
  if (
    decision.status === "pending" &&
    typeof run.status === "string" &&
    ["failed", "cancelled", "timed_out"].includes(run.status)
  )
    decision = {
      status: "unavailable",
      notes: "The review workflow stopped without a verified human decision.",
    };
  return (
    await db
      .update(planReviewsTable)
      .set({ ...decision, updatedAt: new Date() })
      .where(eq(planReviewsTable.id, review.id))
      .returning()
  )[0];
}
