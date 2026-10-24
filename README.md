# Rolevo — AI Career Mentor

React/Tailwind frontend, Express API, PostgreSQL/Drizzle persistence, Replit Auth and server-side AI Integrations. This implementation follows the [launch build plan](https://files.instinct.com/cwmomusins17-ai-career-mentor-build-plan), with the [product specification](https://files.instinct.com/7bup29seab8f-career-mentor-product-spec) as context.

## Run locally

Use Node 24, pnpm 10.33.2 and a local PostgreSQL server (for example `brew services start postgresql@16`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` runs `scripts/bootstrap.mjs` first. On the first run it creates `.env` from `.env.example` with local defaults (device-only sign-in, `postgres://$USER@127.0.0.1:5432/rolevo`), creates that local database if it is missing and applies the SQL migrations. It stops with a clear message if PostgreSQL is not running or the AI key is missing: add `AI_INTEGRATIONS_OPENAI_BASE_URL` (for example `https://api.openai.com/v1`) and `AI_INTEGRATIONS_OPENAI_API_KEY` to `.env`, then rerun. Open `http://localhost:5173`. The API runs on port 5050 and rebuilds and restarts when its source changes; Vite proxies `/api` to it.

To run the production bundle locally instead: `pnpm build && pnpm db:migrate && pnpm start`, then open `http://localhost:5050`.

### Database migrations

`lib/db/migrations/*.sql` are applied in order by `pnpm db:migrate` (`lib/db/migrate.mjs`). Each file is idempotent, tracked in `schema_migrations` and applied under an advisory lock, so it is safe on a fresh database, on one created earlier with `drizzle-kit push`, and on every deployment boot. Add a new numbered, additive file for each schema change; never use `push-force` on production.

Replit login requires a valid `REPL_ID` and registered callback `${APP_ORIGIN}/api/callback`. For local testing without Replit Auth, explicitly set `AUTH_MODE=anonymous`. The user must accept device-only access: a 256-bit HttpOnly cookie, no cross-device recovery, and access loss on logout, cookie clearing or seven-day expiry. This is not an account recovery system. The default remains Replit Auth.

AI configuration is server-only. Set `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, and a supported `CAREER_AI_MODEL` through Replit Integrations/Secrets. Missing AI configuration fails startup. Provider failures return errors; the application does not silently substitute fabricated plans. Never put secrets in a `VITE_` variable.

## What is included

- Plain sign-in; optional PDF/text resume draft or manual basics; editable persona confirmation.
- Adaptive Hinglish tap-card reflection, maximum seven answers; professional current-work and grow/switch questions first; skippable personal constraints.
- Explicit profile save, editable saved profile, three tentative family suggestions with source-checked quotes.
- Exact 11-role catalog in four families. Four approved launch guides are available: Front-end Engineer, Performance Marketer, Product Designer and Core Product Manager. Seven other role guides are coming soon. Existing owner-approved copy is preserved.
- Role brief, illustrative day, journey, AI impact, entry requirements, personalized connection and temporary text mentor grounded in that same brief.
- Saved, personalized 6–8 activity plans with weekly time budgets, device/budget/city/grow-or-switch constraints, edits, completion checks and reflection. New versions invalidate review; changed profiles mark plans stale.
- Explicit human-review preview and consent, workflow submission and attributed approval polling. No automated decision endpoint is called.
- Five-step designer simulation with explanation fields, a labeled sample AI draft, handoff and two concrete observed-choice examples in the debrief. No score, career verdict or claim of work experience.
- Account-data deletion, owner isolation, same-origin writes, bounded AI calls and instance-local request limits.

Voice notes and real-time voice are deliberately hidden until end-to-end support is verified. Podcasts, recurring check-ins, jobs/auto-apply and other “later” features are not launch features. Initial testing is for adults. Do not open a minors pilot without the required policy/consent review.

## Human review — you are the sole reviewer

In AgenticOrg, configure a workflow with a human review step assigned only to **your signed-in human account**. Set its workflow UUID, your reviewer UUID, a recognizable display name, and optional company UUID in Secrets. Set the HTTPS API base including `/api/v1` and a least-privilege API key that can start/read that workflow and read approvals. Do not give the application permission to decide approvals. See AgenticOrg's [workflow docs](https://agenticorg.ai/docs/workflows) and [approval docs](https://agenticorg.ai/docs/approvals).

The adapter is `artifacts/api-server/src/server/approval.ts`. It submits `POST /workflows/{id}/run` with a `payload` containing the previewed profile summary, constraints, plan, recipient and operational identifiers. The server—not the browser—builds this package from the authenticated user's saved data. Names, email, company and the raw resume are not included as dedicated fields, but free-text summaries may contain what the user entered: the user must inspect the preview.

An approval must match both the workflow run and your configured reviewer ID and include a decision timestamp. A completed workflow alone is never approval. Queue pagination is bounded; failure leaves the last status intact. Edits create new versions. A committed request claim prevents automatic double submission even if the provider times out. Ambiguous requests require operator reconciliation by review ID; never blindly resubmit them. A workflow may still hold a separately consented old version after a user edits or deletes their app data.

Keep `AGENTICORG_VERIFIED=false` until you personally test **one approve and one reject** in the real AgenticOrg dashboard and verify the resulting notes/status in the app. Synthetic tests do not satisfy this gate. Requests with this flag false still contact the configured provider, with the same consent flow; the UI says review is not yet live.

## Verification

Use a disposable, localhost PostgreSQL database named `rolevo_test`; never use the production database. Initialize its schema with the db `push` command. Install test browsers with `pnpm exec playwright install chromium`, then:

```sh
DATABASE_URL=postgres://TEST_USER@127.0.0.1:5432/rolevo_test pnpm verify
```

`verify` runs strict TypeScript checks, production builds, PostgreSQL/API tests and desktop/mobile Playwright tests. The API tests use synthetic AI/AgenticOrg responses and real local persistence. Browser tests use isolated API fixtures. With installed Google Chrome, `PLAYWRIGHT_CHANNEL=chrome` can replace the downloaded Chromium. Searchable-PDF extraction is tested locally; billed OCR is opt-in with `RUN_RESUME_OCR_TEST=1` and real integration credentials. Do not mistake a fixture test for live provider verification. CI mirrors the offline suite.

## Deployment and remaining live gates

1. Provision PostgreSQL, Replit Auth and AI Integrations. Confirm the model is available. Configure HTTPS `APP_ORIGIN`, `NODE_ENV=production`, port and Secrets.
2. Back up an existing database. Run `pnpm db:migrate` (the Render start command already does). Migrations are additive and do not change approved guide copy. Never use `push-force` on production.
3. Build with `pnpm build`; start with `pnpm start`. Serve frontend and API on the same origin. Do not deploy the separate mockup-sandbox artifact.
4. Run real sign-in/callback/logout, PDF upload and AI failure/retry checks, then test a fresh profile → suggestions → mentor → two-week plan on desktop and phone. Check phone-only and paper-only plans for semantic feasibility, not just valid minutes.
5. Complete the real owner approve/reject gate above; verify changing a plan requires a fresh review. Do not remove the “not yet live” banner before both pass.
6. Delete a test account and confirm local profile/plans/reviews/sessions are gone. Document provider retention and backups; app deletion does not recall consented AgenticOrg copies. Do not claim provider training/retention terms that have not been verified.
7. Use a shared gateway rate limit if scaling beyond one API instance; the included in-memory limit is instance-local. Review observability, backup retention and provider permissions before public traffic.

No live deployment, real Replit login, provider-generated plan quality, real OCR or AgenticOrg human decision is certified merely by the local suite. Record those checks before calling the product shipped.
