import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import type {
  CareerProfileInput,
  CareerRoleRecord,
} from "@workspace/api-client-react";
import type {
  PlanConstraints,
  PlanContent,
  PlanView,
  ReviewConfiguration,
  ReviewPackage,
} from "@workspace/api-zod";
import { planApi } from "@/lib/plan-api";

const inputClass =
  "mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm";
const buttonClass =
  "rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50";

export function TwoWeekPlan({
  role,
  profile,
}: {
  role: CareerRoleRecord;
  profile: CareerProfileInput | null;
}) {
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [constraints, setConstraints] = useState<PlanConstraints>({
    minutesPerWeek: 180,
    budget: "free",
    device: "computer",
    city: profile?.city || "",
    goal: profile?.persona === "professional" ? "grow" : "discover",
  });
  const [configuration, setConfiguration] =
    useState<ReviewConfiguration | null>(null);
  const [reviewPackage, setReviewPackage] = useState<ReviewPackage | null>(
    null,
  );
  const [editing, setEditing] = useState<PlanContent | null>(null);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const lock = useRef(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      planApi<{ plan: PlanView | null }>(`/role/${role.slug}`),
      planApi<ReviewConfiguration>("/review-configuration"),
    ])
      .then(([result, config]) => {
        if (!alive) return;
        setPlan(result.plan);
        setConfiguration(config);
        if (result.plan) {
          setConstraints(result.plan.constraints);
          setReflection(result.plan.reflection);
        }
        setError("");
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [role.slug, reload, profile]);

  useEffect(() => {
    if (!plan || plan.review?.status !== "pending" || plan.stale) return;
    let alive = true;
    let running = false;
    const poll = async () => {
      if (running || document.hidden || lock.current) return;
      running = true;
      try {
        const next = await planApi<PlanView>(`/${plan.id}/review`);
        if (alive) {
          setPlan(next);
          setPollError("");
        }
      } catch (e) {
        if (alive) setPollError((e as Error).message);
      } finally {
        running = false;
      }
    };
    const timer = window.setInterval(poll, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [plan?.id, plan?.version, plan?.review?.status, plan?.stale]);

  const action = async (work: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const generate = (event: FormEvent) => {
    event.preventDefault();
    void action(async () => {
      const next = await planApi<PlanView>(`/role/${role.slug}`, "POST", {
        constraints,
      });
      setPlan(next);
      setEditing(null);
      setReviewPackage(null);
      setReflection("");
    });
  };
  const saveProgress = (completed: number[]) =>
    void action(async () => {
      if (!plan) return;
      const previous = plan;
      setPlan({ ...plan, completed, reflection });
      try {
        setPlan(
          await planApi<PlanView>(`/${plan.id}/progress`, "PATCH", {
            expectedVersion: plan.version,
            completed,
            reflection,
          }),
        );
      } catch (error) {
        setPlan(previous);
        throw error;
      }
    });
  const reviewLabels = {
    pending: "Pending",
    reviewed: "Reviewed",
    changes_requested: "Changes requested",
    unavailable: "Review unavailable",
  };

  return (
    <section
      className="mt-8 rounded-[1.8rem] border border-primary/25 bg-[#f4ead6] p-6 sm:p-8"
      data-testid="section-two-week-plan"
    >
      <p className="mono text-xs uppercase tracking-widest text-primary">
        Your next two weeks
      </p>
      <h2 className="serif mt-3 text-4xl">A plan that fits your life.</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Six to eight small activities for {role.title}, with time limits and a
        clear finish. Confirm the limits below; generating saves this plan to
        your private account. Changing these limits creates a new version that
        needs a fresh review.
      </p>
      {!profile ? (
        <Link href="/onboarding" className="mt-5 inline-block underline">
          Confirm your profile to create a plan
        </Link>
      ) : (
        <form onSubmit={generate} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Minutes available each week
            <input
              className={inputClass}
              type="number"
              min={30}
              max={2400}
              step={1}
              required
              value={constraints.minutesPerWeek}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  minutesPerWeek: Number(e.target.value),
                })
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Device available
            <select
              className={inputClass}
              value={constraints.device}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  device: e.target.value as PlanConstraints["device"],
                })
              }
            >
              <option value="computer">Computer</option>
              <option value="phone">Phone only</option>
              <option value="paper">Paper and pen, offline</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Budget
            <select
              className={inputClass}
              value={constraints.budget}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  budget: e.target.value as PlanConstraints["budget"],
                })
              }
            >
              <option value="free">Free tools only</option>
              <option value="paid-ok">Optional paid tools are okay</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            City
            <input
              className={inputClass}
              required
              maxLength={120}
              value={constraints.city}
              onChange={(e) =>
                setConstraints({ ...constraints, city: e.target.value })
              }
            />
          </label>
          <label className="text-sm font-semibold">
            What are you working toward?
            <select
              className={inputClass}
              value={constraints.goal}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  goal: e.target.value as PlanConstraints["goal"],
                })
              }
            >
              <option value="discover">Explore this career</option>
              <option value="grow">Grow in my current field</option>
              <option value="switch">Switch to this field</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              className={buttonClass}
              disabled={busy || loading}
              data-testid="button-start-two-week-plan"
            >
              {busy
                ? "Working…"
                : plan
                  ? "Regenerate with these limits"
                  : "Generate my plan"}
            </button>
          </div>
        </form>
      )}
      {loading && (
        <p role="status" className="mt-4">
          Loading your plan…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button
            className="ml-3 underline"
            onClick={() => setReload((n) => n + 1)}
          >
            Reload saved plan
          </button>
        </div>
      )}
      {plan && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h3 className="serif text-3xl">
              Your starter plan · version {plan.version}
            </h3>
            <span data-testid="text-plan-progress">
              {plan.completed.length} / {plan.content.activities.length}{" "}
              completed
            </span>
          </div>
          {plan.stale && (
            <p role="status" className="mt-4 rounded-xl bg-amber-100 p-4">
              Your profile changed. Regenerate this plan before requesting a new
              review.
            </p>
          )}
          <p className="mt-3 text-sm leading-6">{plan.content.rationale}</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {[1, 2].map((week) => (
              <div key={week} className="rounded-2xl border bg-card/80 p-5">
                <h4 className="serif text-3xl">Week {week}</h4>
                <p className="mt-1 text-xs">
                  {plan.content.activities
                    .filter((a) => a.week === week)
                    .reduce((n, a) => n + a.minutes, 0)}{" "}
                  / {plan.constraints.minutesPerWeek} minutes
                </p>
                <ol className="mt-4 space-y-4">
                  {plan.content.activities.map((activity, index) =>
                    activity.week !== week ? null : (
                      <li key={index} className="rounded-xl border p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={busy || Boolean(editing)}
                            checked={plan.completed.includes(index)}
                            onChange={() =>
                              saveProgress(
                                plan.completed.includes(index)
                                  ? plan.completed.filter((i) => i !== index)
                                  : [...plan.completed, index],
                              )
                            }
                            className="mt-1 h-5 w-5"
                          />
                          <span>
                            <span className="text-xs text-primary">
                              {activity.minutes} min
                            </span>
                            <strong className="block">{activity.title}</strong>
                          </span>
                        </label>
                        <p className="mt-3 text-sm leading-6">
                          {activity.instructions}
                        </p>
                        <p className="mt-3 text-sm">
                          <b>Done when:</b> {activity.doneWhen}
                        </p>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            ))}
          </div>
          <label className="mt-6 block text-sm font-semibold">
            Check in: what energised you, what drained you, or what blocked you?
            <textarea
              className={inputClass}
              rows={3}
              maxLength={2000}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </label>
          <button
            disabled={busy}
            className="mt-3 text-sm font-semibold underline"
            onClick={() => saveProgress(plan.completed)}
          >
            Save my check-in
          </button>
          <div className="mt-5">
            <button
              disabled={busy}
              className="text-sm font-semibold underline"
              onClick={() =>
                setEditing(editing ? null : structuredClone(plan.content))
              }
            >
              {editing ? "Cancel editing" : "Edit activities"}
            </button>
          </div>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action(async () => {
                  setPlan(
                    await planApi<PlanView>(`/${plan.id}`, "PUT", {
                      ...editing,
                      expectedVersion: plan.version,
                    }),
                  );
                  setEditing(null);
                  setReviewPackage(null);
                });
              }}
              className="mt-5 space-y-4"
            >
              <p className="text-sm">
                Saving edits creates a new version and clears its review and
                completion checks.
              </p>
              {editing.activities.map((activity, index) => (
                <fieldset key={index} className="rounded-xl border bg-card p-4">
                  <legend>
                    Activity {index + 1} · Week {activity.week}
                  </legend>
                  {(
                    ["title", "instructions", "doneWhen", "minutes"] as const
                  ).map((field) => (
                    <label className="mt-2 block text-sm" key={field}>
                      {
                        {
                          title: "Title",
                          instructions: "Activity",
                          doneWhen: "Done when",
                          minutes: "Minutes",
                        }[field]
                      }
                      <input
                        className={inputClass}
                        type={field === "minutes" ? "number" : "text"}
                        min={5}
                        max={1200}
                        required
                        value={activity[field]}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            activities: editing.activities.map((a, i) =>
                              i !== index
                                ? a
                                : {
                                    ...a,
                                    [field]:
                                      field === "minutes"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  },
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
              <button className={buttonClass} disabled={busy}>
                Save new version
              </button>
            </form>
          )}
          <div
            className="mt-8 border-t border-primary/20 pt-6"
            data-testid="section-plan-review"
          >
            <h3 className="serif text-3xl">A human second look</h3>
            {!configuration?.live && (
              <p
                role="status"
                className="mt-3 rounded-xl bg-amber-100 p-4 text-sm"
              >
                Review is not yet live. One approve and one reject must be
                verified in AgenticOrg before launch.
                {configuration?.configured
                  ? " Configured requests still send to AgenticOrg; this integration has not passed live verification."
                  : " No review package can be shared until a reviewer and workflow are configured."}
              </p>
            )}
            {plan.review && (
              <div className="mt-4 rounded-xl border bg-card p-4">
                <strong>
                  {plan.review.stale
                    ? "Previous review — profile changed"
                    : reviewLabels[plan.review.status]}
                </strong>
                <p className="mt-1 text-sm">
                  Reviewer: {plan.review.reviewerName}
                </p>
                {plan.review.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {plan.review.notes}
                  </p>
                )}
              </div>
            )}
            {pollError && (
              <p role="alert" className="mt-3 text-sm text-red-800">
                {pollError}
              </p>
            )}
            {!plan.review && (
              <button
                className={`${buttonClass} mt-5`}
                disabled={
                  busy ||
                  !configuration?.configured ||
                  plan.stale ||
                  Boolean(editing)
                }
                onClick={() =>
                  void action(async () => {
                    setReviewPackage(
                      await planApi<ReviewPackage>(
                        `/${plan.id}/review-package`,
                      ),
                    );
                  })
                }
              >
                Request review
              </button>
            )}
            {reviewPackage && (
              <div
                role="region"
                aria-label="Review consent"
                className="mt-5 rounded-2xl border-2 border-primary bg-card p-5"
              >
                <h4 className="serif text-2xl">
                  Share with {reviewPackage.reviewerName}?
                </h4>
                <p className="mt-3 text-sm leading-6">
                  AgenticOrg will receive this confirmed profile summary, your
                  limits, and version {reviewPackage.version} of the plan.{" "}
                  {reviewPackage.reviewerName} reviews it in the AgenticOrg
                  dashboard. This does not send anything to an employer. Shared
                  copies are subject to AgenticOrg’s retention settings;
                  deleting this app account does not recall them.
                </p>
                <details className="mt-4" open>
                  <summary className="font-semibold">
                    Review package (plus request and workflow routing
                    identifiers)
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-secondary/50 p-4 text-xs">
                    {JSON.stringify(reviewPackage, null, 2)}
                  </pre>
                </details>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className={buttonClass}
                    disabled={busy}
                    onClick={() =>
                      void action(async () => {
                        setPlan(
                          await planApi<PlanView>(
                            `/${plan.id}/review`,
                            "POST",
                            {
                              consent: true,
                              expectedVersion: reviewPackage.version,
                              reviewerName: reviewPackage.reviewerName,
                              reviewerId: reviewPackage.reviewerId,
                              profileFingerprint:
                                reviewPackage.profileFingerprint,
                            },
                          ),
                        );
                        setReviewPackage(null);
                      })
                    }
                  >
                    Confirm and share for review
                  </button>
                  <button
                    className="px-4 text-sm underline"
                    disabled={busy}
                    onClick={() => setReviewPackage(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
