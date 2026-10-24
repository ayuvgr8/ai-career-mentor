import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import {
  careerPlansTable,
  careerProfilesTable,
  careerRolesTable,
  db,
  planReviewsTable,
} from "@workspace/db";
import {
  EditPlanBody,
  GeneratePlanBody,
  PlanId,
  PlanProgressBody,
  ReviewConsentBody,
} from "@workspace/api-zod";
import { aiModel, openai } from "@workspace/integrations-openai-ai-server";
import { fingerprint, planPrompt, validatePlan } from "../lib/plan-validation";
import {
  getReviewPackage,
  getReviewStatus,
  requestReview,
  reviewConfiguration,
} from "../server/approval";
import { launchSlugs } from "../lib/launch-catalog";

const router = Router();
router.use("/career/plans", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
});
router.get("/career/plans/review-configuration", (_req, res) => {
  res.json(reviewConfiguration());
});

async function view(plan: typeof careerPlansTable.$inferSelect) {
  const [profile] = await db
    .select()
    .from(careerProfilesTable)
    .where(eq(careerProfilesTable.userId, plan.userId));
  const stale =
    !profile || fingerprint(profile.profile) !== plan.profileFingerprint;
  const [review] = await db
    .select()
    .from(planReviewsTable)
    .where(
      and(
        eq(planReviewsTable.planId, plan.id),
        eq(planReviewsTable.version, plan.version),
      ),
    );
  return {
    id: plan.id,
    roleSlug: plan.roleSlug,
    version: plan.version,
    content: plan.content,
    constraints: plan.constraints,
    completed: plan.completed,
    reflection: plan.reflection,
    stale,
    review: review
      ? {
          status: review.status,
          reviewerName: review.reviewerName,
          notes: review.notes,
          version: review.version,
          stale,
        }
      : null,
  };
}

router.get("/career/plans/role/:slug", async (req, res) => {
  const [plan] = await db
    .select()
    .from(careerPlansTable)
    .where(
      and(
        eq(careerPlansTable.userId, req.user!.id),
        eq(careerPlansTable.roleSlug, req.params.slug),
      ),
    );
  res.json({ plan: plan ? await view(plan) : null });
});

router.post("/career/plans/role/:slug", async (req, res) => {
  const parsed = GeneratePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Confirm your weekly time, budget, device, city and goal.",
      });
    return;
  }
  const [profile] = await db
    .select()
    .from(careerProfilesTable)
    .where(eq(careerProfilesTable.userId, req.user!.id));
  const [role] = await db
    .select()
    .from(careerRolesTable)
    .where(eq(careerRolesTable.slug, req.params.slug));
  if (
    !profile ||
    !role?.content ||
    role.status !== "approved" ||
    !launchSlugs.has(role.slug)
  ) {
    res
      .status(400)
      .json({
        error: "Save your profile and choose an available role guide first.",
      });
    return;
  }
  const constraints = parsed.data.constraints;
  const [existing] = await db
    .select()
    .from(careerPlansTable)
    .where(
      and(
        eq(careerPlansTable.userId, req.user!.id),
        eq(careerPlansTable.roleSlug, role.slug),
      ),
    );
  try {
    const completion = await openai.chat.completions.create({
      model: aiModel(),
      max_completion_tokens: 6000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: planPrompt(constraints) },
        {
          role: "user",
          content: JSON.stringify({
            confirmedProfile: profile.profile,
            constraints,
            roleBrief: role.content,
          }),
        },
      ],
    });
    const content = validatePlan(
      JSON.parse(completion.choices[0]?.message?.content || ""),
      constraints,
    );
    const values = {
      content,
      constraints,
      profileFingerprint: fingerprint(profile.profile),
      completed: [],
      reflection: "",
      updatedAt: new Date(),
    };
    const [plan] = existing
      ? await db
          .update(careerPlansTable)
          .set({ ...values, version: existing.version + 1 })
          .where(
            and(
              eq(careerPlansTable.id, existing.id),
              eq(careerPlansTable.version, existing.version),
            ),
          )
          .returning()
      : await db
          .insert(careerPlansTable)
          .values({ ...values, userId: req.user!.id, roleSlug: role.slug })
          .onConflictDoNothing()
          .returning();
    if (!plan) {
      res
        .status(409)
        .json({
          error:
            "Another request changed this plan. Reload it; your newer version was preserved.",
        });
      return;
    }
    res.json(await view(plan));
  } catch {
    res
      .status(503)
      .json({
        error:
          "We could not create a plan within your constraints. Your previous plan is unchanged; try again.",
      });
  }
});

router.use("/career/plans/:id", async (req, res, next) => {
  if (!PlanId.safeParse(req.params.id).success) {
    res.status(404).json({ error: "Plan not found." });
    return;
  }
  const [plan] = await db
    .select()
    .from(careerPlansTable)
    .where(
      and(
        eq(careerPlansTable.id, req.params.id),
        eq(careerPlansTable.userId, req.user!.id),
      ),
    );
  if (!plan) {
    res.status(404).json({ error: "Plan not found." });
    return;
  }
  res.locals.plan = plan;
  next();
});
router.put("/career/plans/:id", async (req, res) => {
  const parsed = EditPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the activity fields." });
    return;
  }
  const plan = res.locals.plan as typeof careerPlansTable.$inferSelect;
  try {
    const content = validatePlan(parsed.data, plan.constraints);
    const [updated] = await db
      .update(careerPlansTable)
      .set({
        content,
        version: sql`${careerPlansTable.version} + 1`,
        completed: [],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(careerPlansTable.id, plan.id),
          eq(careerPlansTable.version, parsed.data.expectedVersion),
        ),
      )
      .returning();
    if (!updated) {
      res
        .status(409)
        .json({ error: "This plan changed. Reload it before editing." });
      return;
    }
    res.json(await view(updated));
  } catch {
    res
      .status(400)
      .json({
        error:
          "Keep at least three activities in each week, within your weekly minutes.",
      });
  }
});
router.patch("/career/plans/:id/progress", async (req, res) => {
  const parsed = PlanProgressBody.safeParse(req.body);
  const plan = res.locals.plan as typeof careerPlansTable.$inferSelect;
  if (
    !parsed.success ||
    parsed.data.completed.some((i) => i >= plan.content.activities.length)
  ) {
    res.status(400).json({ error: "Check your progress." });
    return;
  }
  const [updated] = await db
    .update(careerPlansTable)
    .set({
      completed: [...new Set(parsed.data.completed)],
      reflection: parsed.data.reflection,
    })
    .where(
      and(
        eq(careerPlansTable.id, plan.id),
        eq(careerPlansTable.version, parsed.data.expectedVersion),
      ),
    )
    .returning();
  if (!updated) {
    res
      .status(409)
      .json({ error: "The plan changed. Reload before saving progress." });
    return;
  }
  res.json(await view(updated));
});
router.get("/career/plans/:id/review-package", async (req, res) => {
  try {
    res.json(await getReviewPackage(req.params.id, req.user!.id));
  } catch {
    res
      .status(409)
      .json({
        error:
          "Regenerate the plan using your current profile before requesting review.",
      });
  }
});
router.post("/career/plans/:id/review", async (req, res) => {
  const parsed = ReviewConsentBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Confirm the named reviewer and exact package first." });
    return;
  }
  if (!reviewConfiguration().configured) {
    res
      .status(503)
      .json({ error: "Review is not yet live. No data was shared." });
    return;
  }
  try {
    await requestReview(req.params.id, req.user!.id, {
      version: parsed.data.expectedVersion,
      profileFingerprint: parsed.data.profileFingerprint,
      reviewerName: parsed.data.reviewerName,
      reviewerId: parsed.data.reviewerId,
    });
    res.json(await view(res.locals.plan));
  } catch {
    res
      .status(409)
      .json({
        error:
          "The package changed or review could not be requested. Reload the plan and check its status.",
      });
  }
});
router.get("/career/plans/:id/review", async (req, res) => {
  try {
    await getReviewStatus(req.params.id, req.user!.id);
    res.json(await view(res.locals.plan));
  } catch {
    res
      .status(503)
      .json({
        error:
          "Review status is temporarily unavailable. The last recorded decision has not changed.",
      });
  }
});
export default router;
