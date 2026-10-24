# Morrow — AI Career Mentor

_A private, mobile-first career exploration app for students and early-career professionals in India._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required platform configuration: Postgres (`DATABASE_URL`) and Replit Auth (`REPL_ID`)
- OpenAI uses Replit AI Integrations; its environment values are provisioned automatically, with no user-owned API key.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/career-mentor` — React + Tailwind app and onboarding screens.
- `artifacts/api-server` — Express auth, profile, resume parsing, adaptive questions, and recommendations.
- `lib/api-spec/openapi.yaml` — API contract; run codegen after changes.
- `lib/db/src/schema` — Drizzle schema for auth sessions, users, and confirmed career profiles.
- `lib/integrations-openai-ai-server` — Replit-managed OpenAI SDK client.

## Architecture decisions

- Replit Auth uses the server-side OIDC flow with secure, HTTP-only session cookies.
- Only the profile explicitly confirmed by the user is stored. Assessment answers and resume contents are processed in memory and are not persisted.
- AI calls happen only on the server. Resume text and assessment answers are sent for the requested inference but are not stored.
- Account deletion removes the app user record, confirmed career profile, and their sessions; it does not delete the user's separate identity-provider account.

## Product

Morrow guides users through editable profile setup, optional resume extraction, adaptive Hinglish reflections, confirmed profile review, and three career-role suggestions from four supported paths. Users can inspect, edit, and delete their stored app data.

## User preferences

No additional standing preferences recorded.

## Gotchas

- The resume parser accepts PDF or pasted text; the browser sends it only for server-side parsing and does not retain the file.
- Career API routes require authentication; `/healthz` and auth-start/callback routes are public.
- The `@workspace/replit-auth-web` package uses the `app-base-path` meta tag for post-login redirects.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
