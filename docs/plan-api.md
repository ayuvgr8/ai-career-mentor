# Launch API additions

Base path `/api`. All `/career/*` endpoints require the authenticated owner's session. Writes must be same-origin. Request bodies and shared frontend types for plans live in `lib/api-zod/src/plans.ts`; existing profile/catalog/mentor contracts are generated from `lib/api-spec/openapi.yaml`.

| Method and path | Purpose |
| --- | --- |
| `GET /auth/config` | Public access mode and configured status; never returns secrets |
| `POST /auth/anonymous` | Explicit `{consent:true}` creates a device-only session only when `AUTH_MODE=anonymous` |
| `POST /logout` | Clears the session and returns `{redirectTo}`; GET cannot log someone out |
| `POST /career/roles/:slug/connection` | Saved-profile-based tentative connection and exact source quote for a launch guide |
| `GET /career/plans/review-configuration` | Named reviewer, configuration status and live-verification flag |
| `GET /career/plans/role/:slug` | `{plan: PlanView|null}` for this owner |
| `POST /career/plans/role/:slug` | `{constraints: PlanConstraints}` generates and saves a new plan version |
| `PUT /career/plans/:id` | `PlanContent` plus `expectedVersion`; validates weekly minutes and creates a new version |
| `PATCH /career/plans/:id/progress` | `expectedVersion`, completed activity indices and reflection; does not alter reviewed plan content |
| `GET /career/plans/:id/review-package` | Exact saved package preview; no provider request occurs |
| `POST /career/plans/:id/review` | `consent:true`, `expectedVersion`, `profileFingerprint`, `reviewerName`, `reviewerId`; rejects changed packages before transmission |
| `GET /career/plans/:id/review` | Bounded polling of the current version's actual attributed human decision |

`PlanView` includes ID, role slug, version, content, saved constraints, completion indices, reflection, profile-stale flag and review status/notes. It never exposes another user's record or the provider API key. Workflow run IDs remain server-side. States are `pending`, `reviewed`, `changes_requested`, `unavailable`; `reviewed` is a human decision, not a career-fit verdict.

Typical errors: `400` invalid fields/consent, `401` sign-in needed, `403` cross-origin mutation, `404` inaccessible or unavailable resource, `409` stale version/profile/recipient, `429` request limit and `503` external service or persistence failure. A failed generation leaves the previous plan intact. Simultaneous edits use optimistic version checks. A failed poll preserves the last recorded status.

The preview omits dedicated identity/contact fields but can include identifying text the user supplied in their answers. The browser shows that package before consent. The external workflow additionally receives a request ID and optional company routing ID. Cancellation is local and does not contact AgenticOrg. Deletion cascades local profiles/plans/reviews/sessions, not previously shared provider copies.
