import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import { and, eq } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  careerPlansTable,
  careerProfilesTable,
  planReviewsTable,
} from "@workspace/db";
import type {
  PlanConstraints,
  PlanContent,
  PlanView,
  ReviewPackage,
} from "@workspace/api-zod";
import { validatePlan, planPrompt } from "./plan-validation";
import { decisionFromItems } from "../server/approval";
import { launchCatalog, launchSlugs } from "./launch-catalog";
import { careerRoleSeeds } from "./career-role-seeds";

const constraints: PlanConstraints = {
  minutesPerWeek: 30,
  budget: "free",
  device: "paper",
  city: "Test City",
  goal: "discover",
};
const content: PlanContent = {
  rationale: "Six five-minute offline activities fit your available time.",
  activities: Array.from({ length: 6 }, (_, i) => ({
    week: i < 3 ? 1 : 2,
    minutes: 5,
    title: `Practice ${i + 1}`,
    instructions: "Sketch an invented event signup on paper.",
    doneWhen: "One annotated sketch is ready.",
  })),
};
const profile = {
  name: "Synthetic Explorer",
  city: "Test City",
  ageBand: "18–24",
  persona: "student",
  currentStage: "College",
  company: null,
  yearsExperience: null,
  internships: [],
  interests: ["Drawing simple screens"],
  energizers: ["Solving a small problem"],
  chores: [],
  workStyle: "Small team",
  preferredMake: "A useful tool",
  strengths: [],
  constraints: [],
  familyExpectations: null,
  moneyNeeds: null,
  relocation: null,
};
const json = <T>(response: Response) => response.json() as Promise<T>;

test("plan validation enforces six to eight activities and each weekly limit", () => {
  assert.deepEqual(validatePlan(content, constraints), content);
  assert.throws(() =>
    validatePlan(
      { ...content, activities: content.activities.slice(0, 5) },
      constraints,
    ),
  );
  assert.throws(() =>
    validatePlan(
      {
        ...content,
        activities: content.activities.map((a) => ({ ...a, minutes: 20 })),
      },
      constraints,
    ),
  );
  assert.throws(() =>
    validatePlan(
      {
        ...content,
        activities: content.activities.map((a) => ({ ...a, week: 1 })),
      },
      constraints,
    ),
  );
  assert.throws(() =>
    validatePlan(
      {
        ...content,
        activities: content.activities.map((a) => ({ ...a, doneWhen: "" })),
      },
      constraints,
    ),
  );
  assert.match(planPrompt(constraints), /offline with paper and pen/);
  assert.match(
    planPrompt({ ...constraints, device: "phone", goal: "switch" }),
    /no local IDE/,
  );
});

test("catalog exposes precisely four approved guides and seven placeholders", () => {
  const catalog = launchCatalog(
    careerRoleSeeds.map((role) => ({
      ...role,
      content: role.content ?? null,
      updatedAt: new Date(),
    })),
  );
  assert.equal(catalog.length, 11);
  assert.equal(catalog.filter((r) => r.content).length, 4);
  assert.deepEqual(
    new Set(catalog.filter((r) => r.content).map((r) => r.slug)),
    launchSlugs,
  );
  assert.ok(catalog.some((r) => r.slug === "data-engineer" && !r.content));
  assert.ok(catalog.some((r) => r.slug === "product-builder" && !r.content));
});

test("only the named human reviewer can produce a decision", () => {
  const approval = {
    workflow_run_id: "run-1",
    decision_by: "owner",
    decision_at: new Date().toISOString(),
    status: "decided",
    decision: "approve",
    decision_notes: "Make the final sketch smaller.",
  };
  assert.equal(decisionFromItems([], "run-1", "owner").status, "pending");
  assert.equal(
    decisionFromItems([approval], "run-2", "owner").status,
    "pending",
  );
  assert.equal(
    decisionFromItems([approval], "run-1", "someone-else").status,
    "pending",
  );
  assert.equal(
    decisionFromItems([{ ...approval, decision_at: null }], "run-1", "owner")
      .status,
    "pending",
  );
  assert.equal(
    decisionFromItems([approval], "run-1", "owner").status,
    "reviewed",
  );
  assert.equal(
    decisionFromItems(
      [approval, { workflow_run_id: "run-1", status: "pending" }],
      "run-1",
      "owner",
    ).status,
    "pending",
  );
  assert.equal(
    decisionFromItems([{ ...approval, decision: "reject" }], "run-1", "owner")
      .status,
    "changes_requested",
  );
});

test("authenticated launch flow, consent, versions, isolation and deletion", async (t) => {
  const url = new URL(process.env.DATABASE_URL || "http://missing");
  assert.ok(
    ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.pathname === "/rolevo_test",
    "Integration tests require a disposable local database named rolevo_test",
  );
  process.env.AUTH_MODE = "anonymous";
  process.env.NODE_ENV = "test";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "https://ai.invalid/v1";
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "synthetic-test-key";
  delete process.env.AGENTICORG_KEY;
  const realFetch = globalThis.fetch;
  let workflowStarts = 0;
  let invalidPlan = false;
  let providerUnavailable = false;
  let decision: "approve" | "reject" | null = null;
  const outbound: string[] = [];
  const packages: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const address =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (address.startsWith("https://ai.invalid/")) {
      const request = JSON.parse(String(init?.body));
      const system = request.messages[0].content as string;
      if (providerUnavailable)
        return Response.json(
          { error: { message: "Synthetic outage" } },
          { status: 503 },
        );
      let output: unknown = invalidPlan
        ? {
            ...content,
            activities: content.activities.map((a) => ({ ...a, minutes: 60 })),
          }
        : content;
      if (system.includes("Extract a draft"))
        output = {
          personaGuess: "student",
          currentStage: "College",
          interests: ["Drawing simple screens", "Invented achievement"],
        };
      else if (system.includes("Choose one unanswered topic"))
        output = {
          topic: "current-work",
          question: "Tumhara current kaam kya hai?",
          options: ["Building", "Planning", "People"],
          allowFreeText: true,
        };
      else if (system.includes("Synthesize only")) output = profile;
      else if (system.includes("Recommend exactly"))
        output = {
          recommendations: [
            "Software Engineer",
            "Marketing",
            "Content Creation / Design",
          ].map((role) => ({
            role,
            fit: 70,
            why: "Try the work before choosing.",
            quote: "Drawing simple screens",
          })),
        };
      else if (system.includes("Explain one tentative"))
        output = {
          why: "Sketching may connect to interface work.",
          quote: "Drawing simple screens",
          tradeoff: "Try getting feedback on one sketch.",
        };
      else if (!system.includes("two-week"))
        output = "Start with a small sketch and ask what a user needs.";
      return Response.json({
        id: "synthetic",
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                typeof output === "string" ? output : JSON.stringify(output),
            },
            finish_reason: "stop",
          },
        ],
      });
    }
    if (address.startsWith("https://review.invalid/")) {
      outbound.push(address);
      if (address.endsWith("/run")) {
        workflowStarts++;
        packages.push(JSON.parse(String(init?.body)).payload);
        return Response.json({
          run_id: `synthetic-run-${workflowStarts}`,
          status: "running",
        });
      }
      if (address.includes("/workflows/runs/"))
        return Response.json({ status: "completed" });
      const status = new URL(address).searchParams.get("status");
      return Response.json({
        pages: 1,
        items:
          status === "decided" && decision
            ? [
                {
                  workflow_run_id: `synthetic-run-${workflowStarts}`,
                  decision_by: "synthetic-owner",
                  decision_at: new Date().toISOString(),
                  status: "decided",
                  decision,
                  decision_notes: "Synthetic human review note.",
                },
              ]
            : [],
      });
    }
    return realFetch(input, init);
  };
  const { default: app } = await import("../app");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  process.env.APP_ORIGIN = origin;
  const api = (path: string, method = "GET", payload?: unknown, cookie = "") =>
    realFetch(`${origin}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
  const ownerIds: string[] = [];
  let cookie = "";
  let other = "";
  let plan: PlanView;
  let preview: ReviewPackage;
  const pollReady = async () => {
    await db
      .update(planReviewsTable)
      .set({ updatedAt: new Date(Date.now() - 20000) })
      .where(eq(planReviewsTable.planId, plan.id));
  };
  try {
    await t.test(
      "requires authentication and explicit guest consent",
      async () => {
        assert.equal((await api("/career/roles")).status, 401);
        assert.equal((await api("/auth/anonymous", "POST", {})).status, 400);
        for (let i = 0; i < 2; i++) {
          const response = await api("/auth/anonymous", "POST", {
            consent: true,
          });
          assert.equal(response.status, 200);
          const session = response.headers.get("set-cookie")!.split(";")[0];
          assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
          if (i === 0) cookie = session;
          else other = session;
          const who = await json<{ user: { id: string } }>(
            await api("/auth/user", "GET", undefined, session),
          );
          ownerIds.push(who.user.id);
        }
        const csrf = await realFetch(`${origin}/api/me/profile`, {
          method: "PUT",
          headers: {
            Origin: "https://evil.invalid",
            Cookie: cookie,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        });
        assert.equal(csrf.status, 403);
      },
    );
    await t.test(
      "resume drafts are exact-source and not saved before confirmation",
      async () => {
        const response = await api(
          "/career/resume/parse",
          "POST",
          {
            name: profile.name,
            city: profile.city,
            ageBand: null,
            resumeText:
              "College student. Drawing simple screens for an invented class project.",
          },
          cookie,
        );
        assert.equal(response.status, 200);
        const result = await json<{ draft: { interests: string[] } }>(response);
        assert.deepEqual(result.draft.interests, ["Drawing simple screens"]);
        assert.equal(
          (
            await json<{ profile: unknown }>(
              await api("/me/profile", "GET", undefined, cookie),
            )
          ).profile,
          null,
        );
        assert.equal(
          (await api("/me/profile", "PUT", profile, cookie)).status,
          200,
        );
      },
    );
    await t.test("catalog and mentor gates match launch scope", async () => {
      const catalog = await json<{ roles: { slug: string; status: string }[] }>(
        await api("/career/roles", "GET", undefined, cookie),
      );
      assert.equal(catalog.roles.length, 11);
      assert.equal(
        catalog.roles.filter((r) => r.status === "approved").length,
        4,
      );
      assert.equal(
        (
          await api(
            "/career/roles/back-end-engineer/mentor",
            "POST",
            { messages: [{ role: "user", content: "Hello" }] },
            cookie,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await api(
            "/career/roles/product-design/mentor",
            "POST",
            { messages: [{ role: "user", content: "Where do I start?" }] },
            cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await api(
            "/career/roles/product-design/connection",
            "POST",
            {},
            cookie,
          )
        ).status,
        200,
      );
    });
    await t.test(
      "professional questions are ordered and stop at seven",
      async () => {
        const start = {
          persona: "professional",
          draft: { ...profile, persona: "professional" },
          answers: [],
        };
        const first = await json<{ topic: string }>(
          await api("/career/questions/next", "POST", start, cookie),
        );
        assert.equal(first.topic, "current-work");
        const second = await json<{ topic: string }>(
          await api(
            "/career/questions/next",
            "POST",
            {
              ...start,
              answers: [{ topic: "current-work", answer: "Building" }],
            },
            cookie,
          ),
        );
        assert.equal(second.topic, "growth-direction");
        const end = await json<{ complete: boolean }>(
          await api(
            "/career/questions/next",
            "POST",
            {
              ...start,
              answers: Array.from({ length: 7 }, (_, i) => ({
                topic: `topic-${i}`,
                answer: "No idea yet / skip",
              })),
            },
            cookie,
          ),
        );
        assert.equal(end.complete, true);
        assert.equal(
          (
            await api(
              "/career/recommendations",
              "POST",
              { profile, answers: [] },
              cookie,
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "generates, persists, enforces limits and preserves an existing plan on failure",
      async () => {
        const response = await api(
          "/career/plans/role/product-design",
          "POST",
          { constraints },
          cookie,
        );
        assert.equal(response.status, 200);
        plan = await json<PlanView>(response);
        assert.equal(plan.content.activities.length, 6);
        assert.equal(plan.version, 1);
        invalidPlan = true;
        assert.equal(
          (
            await api(
              "/career/plans/role/product-design",
              "POST",
              { constraints },
              cookie,
            )
          ).status,
          503,
        );
        invalidPlan = false;
        const stored = await json<{ plan: PlanView }>(
          await api(
            "/career/plans/role/product-design",
            "GET",
            undefined,
            cookie,
          ),
        );
        assert.equal(stored.plan.version, 1);
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}`,
              "PUT",
              { ...content, expectedVersion: 1 },
              other,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/progress`,
              "PATCH",
              {
                expectedVersion: 1,
                completed: [0],
                reflection: "Sketching was useful.",
              },
              cookie,
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "review preview and cancellation do not transmit; consent binds exact recipient",
      async () => {
        assert.equal(
          (
            await json<{ configured: boolean }>(
              await api(
                "/career/plans/review-configuration",
                "GET",
                undefined,
                cookie,
              ),
            )
          ).configured,
          false,
        );
        Object.assign(process.env, {
          AGENTICORG_URL: "https://review.invalid/api/v1",
          AGENTICORG_KEY: "synthetic",
          AGENTICORG_WORKFLOW_ID: "synthetic-workflow",
          AGENTICORG_REVIEWER_NAME: "Owner only",
          AGENTICORG_REVIEWER_ID: "synthetic-owner",
        });
        preview = await json<ReviewPackage>(
          await api(
            `/career/plans/${plan.id}/review-package`,
            "GET",
            undefined,
            cookie,
          ),
        );
        assert.equal(workflowStarts, 0);
        assert.ok(!("name" in preview.profileSummary));
        const consent = {
          consent: true,
          expectedVersion: preview.version,
          profileFingerprint: preview.profileFingerprint,
          reviewerName: preview.reviewerName,
          reviewerId: preview.reviewerId,
        };
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/review`,
              "POST",
              { ...consent, consent: false },
              cookie,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/review`,
              "POST",
              { ...consent, reviewerId: "someone-else" },
              cookie,
            )
          ).status,
          409,
        );
        assert.equal(workflowStarts, 0);
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/review`,
              "POST",
              consent,
              cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/review`,
              "POST",
              consent,
              cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          workflowStarts,
          1,
          "double submit must not duplicate a workflow",
        );
        assert.equal(packages[0].reviewerId, "synthetic-owner");
      },
    );
    await t.test(
      "completed workflow is pending until attributed human approval; edit needs new review",
      async () => {
        await pollReady();
        let result = await json<PlanView>(
          await api(
            `/career/plans/${plan.id}/review`,
            "GET",
            undefined,
            cookie,
          ),
        );
        assert.equal(result.review?.status, "pending");
        decision = "approve";
        await pollReady();
        result = await json<PlanView>(
          await api(
            `/career/plans/${plan.id}/review`,
            "GET",
            undefined,
            cookie,
          ),
        );
        assert.equal(result.review?.status, "reviewed");
        assert.equal(result.review.notes, "Synthetic human review note.");
        plan = await json<PlanView>(
          await api(
            `/career/plans/${plan.id}`,
            "PUT",
            { ...content, expectedVersion: 1 },
            cookie,
          ),
        );
        assert.equal(plan.version, 2);
        assert.equal(plan.review, null);
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}`,
              "PUT",
              { ...content, expectedVersion: 1 },
              cookie,
            )
          ).status,
          409,
        );
        preview = await json<ReviewPackage>(
          await api(
            `/career/plans/${plan.id}/review-package`,
            "GET",
            undefined,
            cookie,
          ),
        );
        await api(
          `/career/plans/${plan.id}/review`,
          "POST",
          {
            consent: true,
            expectedVersion: 2,
            profileFingerprint: preview.profileFingerprint,
            reviewerName: preview.reviewerName,
            reviewerId: preview.reviewerId,
          },
          cookie,
        );
        decision = "reject";
        await pollReady();
        result = await json<PlanView>(
          await api(
            `/career/plans/${plan.id}/review`,
            "GET",
            undefined,
            cookie,
          ),
        );
        assert.equal(result.review?.status, "changes_requested");
        assert.ok(outbound.every((path) => !path.includes("/decide")));
      },
    );
    await t.test(
      "changed profile blocks review and account deletion cascades",
      async () => {
        await api(
          "/me/profile",
          "PUT",
          { ...profile, city: "Changed City" },
          cookie,
        );
        assert.equal(
          (
            await api(
              `/career/plans/${plan.id}/review-package`,
              "GET",
              undefined,
              cookie,
            )
          ).status,
          409,
        );
        providerUnavailable = true;
        assert.equal(
          (
            await api(
              "/career/roles/product-design/mentor",
              "POST",
              { messages: [{ role: "user", content: "Hello" }] },
              cookie,
            )
          ).status,
          503,
        );
        assert.equal(
          (await api("/me/profile", "DELETE", undefined, cookie)).status,
          200,
        );
        assert.equal(
          (
            await db
              .select()
              .from(careerPlansTable)
              .where(eq(careerPlansTable.id, plan.id))
          ).length,
          0,
        );
        assert.equal(
          (
            await db
              .select()
              .from(planReviewsTable)
              .where(eq(planReviewsTable.planId, plan.id))
          ).length,
          0,
        );
        assert.equal(
          (
            await db
              .select()
              .from(careerProfilesTable)
              .where(eq(careerProfilesTable.userId, ownerIds[0]))
          ).length,
          0,
        );
        assert.equal(
          (await api("/career/roles", "GET", undefined, cookie)).status,
          401,
        );
      },
    );
  } finally {
    globalThis.fetch = realFetch;
    for (const id of ownerIds)
      await db.delete(usersTable).where(eq(usersTable.id, id));
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  }
});
