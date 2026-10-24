# Render deployment

`render.yaml` deploys Rolevo as one Node web service. The Express server
serves the compiled React application and `/api` from the same HTTPS origin;
the Blueprint provisions its Render Postgres database and supplies the private
`DATABASE_URL` automatically.

## First deployment

1. Commit `render.yaml` and `.node-version` to the Git repository that you
   connect to Render. The current checkout's remotes are Replit-specific, so
   push this project to a GitHub, GitLab, or Bitbucket repository first if it
   is not already available from Render.
2. In Render, create a **Blueprint** from that repository and approve the
   `rolevo-career-mentor` web service and `rolevo-db` Postgres database. The
   Blueprint starts on Render's free plans in Singapore; choose a paid plan
   before production traffic if the service must not sleep or needs migration
   pre-deploy commands.
3. When Render asks for secret values, enter `REPL_ID`,
   `AI_INTEGRATIONS_OPENAI_BASE_URL`, and
   `AI_INTEGRATIONS_OPENAI_API_KEY`. Do not prefix any of these with `VITE_`.
   Confirm the chosen `CAREER_AI_MODEL` is available to that AI provider.
4. The start command runs `pnpm db:migrate` before `pnpm start`. It creates
   the schema on an empty database and applies new additive migrations on
   later deploys; it is idempotent and lock-guarded. Do not use `push-force`.

5. Register `https://rolevo-career-mentor.onrender.com/api/callback` as the
   Replit OAuth callback URL. If a custom domain is attached, update both
   `APP_ORIGIN` in Render and this callback URL to that exact HTTPS origin,
   then redeploy.

## After deployment

Check `https://rolevo-career-mentor.onrender.com/api/healthz`, then test
sign-in, callback, logout, PDF upload, provider failure/retry, account deletion,
and the desktop/mobile launch flows. Do not set `AGENTICORG_VERIFIED=true`
until the actual owner approve and reject checks have passed.

The checked-in health endpoint is intentionally inexpensive; it confirms the
web process is ready. Database and provider behavior must be validated with the
application checks above.
