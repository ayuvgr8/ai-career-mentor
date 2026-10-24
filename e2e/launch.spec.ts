import { test, expect, type Page } from "@playwright/test";
import { careerRoleSeeds } from "../artifacts/api-server/src/lib/career-role-seeds";
import type { PlanView } from "../lib/api-zod/src/plans";

const profile = {
  id: "synthetic-user",
  name: "Synthetic Explorer",
  city: "Test City",
  ageBand: "22-25",
  persona: "professional",
  currentStage: "Working",
  company: null,
  yearsExperience: null,
  internships: [],
  interests: ["Drawing simple screens"],
  energizers: [],
  chores: [],
  workStyle: "Small team",
  preferredMake: "Useful tools",
  strengths: [],
  constraints: [],
  familyExpectations: null,
  moneyNeeds: null,
  relocation: null,
  updatedAt: new Date(0).toISOString(),
};
const role = {
  ...careerRoleSeeds.find((item) => item.slug === "product-design")!,
  updatedAt: new Date(0).toISOString(),
};

async function fixtures(page: Page) {
  let savedProfile = { ...profile };
  let shares = 0;
  let plan: PlanView | null = null;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const reply = (body: unknown) => route.fulfill({ json: body });
    if (path === "/api/auth/user")
      return reply({
        user: {
          id: profile.id,
          firstName: "Synthetic",
          email: null,
          lastName: null,
          profileImageUrl: null,
        },
      });
    if (path === "/api/me/profile") {
      if (method === "PUT") {
        savedProfile = { ...savedProfile, ...route.request().postDataJSON() };
        return reply(savedProfile);
      }
      return reply({ profile: savedProfile });
    }
    if (path === "/api/career/roles") return reply({ roles: [role] });
    if (path === "/api/career/roles/product-design") return reply(role);
    if (path.endsWith("/connection"))
      return reply({
        why: "Sketching may connect to interface work.",
        quote: "Drawing simple screens",
        tradeoff: "Try testing your sketch.",
      });
    if (path === "/api/career/plans/review-configuration")
      return reply({
        configured: true,
        live: false,
        reviewerName: "Owner only",
      });
    if (path === "/api/career/plans/role/product-design") {
      if (method === "GET") return reply({ plan });
      plan = {
        id: "synthetic-plan",
        version: (plan?.version || 0) + 1,
        roleSlug: "product-design",
        constraints: route.request().postDataJSON().constraints,
        content: {
          rationale: "Six short activities fit these limits.",
          activities: Array.from({ length: 6 }, (_, i) => ({
            title: `Practice ${i + 1}`,
            week: i < 3 ? 1 : 2,
            minutes: 5,
            instructions: "Sketch a small signup flow.",
            doneWhen: "One sketch is ready.",
          })),
        },
        completed: [],
        reflection: "",
        stale: false,
        review: null,
      };
      return reply(plan);
    }
    if (path.endsWith("/review-package"))
      return reply({
        planId: plan!.id,
        version: plan!.version,
        reviewerName: "Owner only",
        reviewerId: "owner",
        profileFingerprint: "synthetic-fingerprint",
        profileSummary: { interests: savedProfile.interests },
        constraints: plan!.constraints,
        plan: plan!.content,
      });
    if (path.endsWith("/review")) {
      if (method === "POST") {
        shares++;
        plan!.review = {
          reviewerName: "Owner only",
          status: "pending",
          notes: null,
          version: plan!.version,
          stale: false,
        };
      }
      return reply(plan);
    }
    if (path.endsWith("/progress")) {
      const body = route.request().postDataJSON();
      plan!.completed = body.completed;
      plan!.reflection = body.reflection;
      return reply(plan);
    }
    if (path === "/api/career/plans/synthetic-plan" && method === "PUT") {
      plan!.content = route.request().postDataJSON();
      plan!.version++;
      plan!.review = null;
      plan!.completed = [];
      return reply(plan);
    }
    return route.fulfill({
      status: 404,
      json: { error: `Missing synthetic fixture: ${path}` },
    });
  });
  return { shares: () => shares, saved: () => savedProfile };
}

test("saved profile edits remain editable and save for professionals", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto("/profile-review");
  await page.getByTestId("input-review-name").fill("Updated Explorer");
  await page.getByTestId("input-review-city").fill("New City");
  await page.getByTestId("input-review-interests").fill("Drawing");
  await page.getByTestId("input-review-interests").press("End");
  await page
    .getByTestId("input-review-interests")
    .pressSequentially(", coding");
  await expect(page.getByTestId("input-review-interests")).toHaveValue(
    "Drawing, coding",
  );
  await expect(page.getByTestId("input-review-name")).toHaveValue(
    "Updated Explorer",
  );
  await page.getByRole("button", { name: "Save my profile" }).click();
  await expect(page).toHaveURL(/\/roles$/);
  expect(state.saved().name).toBe("Updated Explorer");
  expect(state.saved().interests).toEqual(["Drawing", "coding"]);
  await page.goto("/profile-review");
  await expect(page.getByTestId("input-review-city")).toHaveValue("New City");
});

test("plan generation, progress, consent cancellation and version reset", async ({
  page,
}, testInfo) => {
  const state = await fixtures(page);
  await page.goto("/roles/product-design");
  await page.getByLabel("Minutes available each week").fill("30");
  await page.getByLabel("Device available").selectOption("paper");
  await page.getByRole("button", { name: "Generate my plan" }).click();
  await expect(page.getByText("Your starter plan · version 1")).toBeVisible();
  await page.getByRole("checkbox", { name: /Practice 1/ }).check();
  await expect(page.getByTestId("text-plan-progress")).toHaveText(
    "1 / 6 completed",
  );
  await page
    .getByRole("button", { name: "Request review", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Review consent" }),
  ).toContainText("Owner only");
  expect(state.shares()).toBe(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Review consent" }),
  ).toHaveCount(0);
  expect(state.shares()).toBe(0);
  await page
    .getByRole("button", { name: "Request review", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm and share for review" })
    .click();
  await expect(page.getByTestId("section-plan-review")).toContainText(
    "Pending",
  );
  expect(state.shares()).toBe(1);
  await page
    .getByRole("button", { name: "Edit activities", exact: true })
    .click();
  await page.getByRole("button", { name: "Save new version" }).click();
  await expect(page.getByText("Your starter plan · version 2")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request review", exact: true }),
  ).toBeEnabled();
  await expect(page.getByTestId("section-plan-review")).toContainText(
    "Review is not yet live",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByTestId("section-two-week-plan")
    .screenshot({ path: testInfo.outputPath("plan.png") });
});

test("designer simulation reaches an evidence-based debrief without a career score", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/roles/product-design");
  for (let i = 1; i <= 5; i++) {
    await page.getByTestId(`button-designer-choice-${i}-1`).click();
    await page.getByRole("button", { name: "Next decision" }).click();
  }
  await expect(page.getByTestId("section-designer-debrief")).toContainText(
    "Two things you actually tried",
  );
  await expect(page.getByTestId("section-designer-debrief")).toContainText(
    "You chose:",
  );
  await page
    .getByLabel("What did you enjoy?")
    .fill("Reviewing the signup flow");
  await page.getByLabel("What frustrated you?").fill("Cutting scope");
  await page.getByTestId("button-restart-designer-day").click();
  await expect(page.getByTestId("designer-day-scene-1")).toBeVisible();
});

test("public landing is the first-class entry point and every CTA reaches sign in", async ({
  page,
}, testInfo) => {
  await page.route("**/api/auth/user", (route) =>
    route.fulfill({ json: { user: null } }),
  );
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ json: { mode: "anonymous", available: true } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveTitle(/Rolevo|Career/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Try a job before you commit.",
  );
  await expect(page.getByText("2 weeks")).toBeVisible();
  await expect(page.getByRole("link", { name: "Try a role" }).first()).toHaveAttribute(
    "href",
    "/onboarding",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("landing-full-page.png"), fullPage: true });
  await page.getByRole("link", { name: "Try a role" }).first().click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("button", { name: "Continue on this device" })).toBeDisabled();
});

test("device-only entry requires acknowledging its limitations", async ({
  page,
}) => {
  await page.route("**/api/auth/user", (route) =>
    route.fulfill({ json: { user: null } }),
  );
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ json: { mode: "anonymous", available: true } }),
  );
  await page.goto("/onboarding");
  await expect(
    page.getByRole("button", { name: "Continue on this device" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Continue on this device" }),
  ).toBeEnabled();
  await expect(
    page.getByText(/No recovery or cross-device sync/),
  ).toBeVisible();
});
