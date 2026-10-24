-- Additive upgrade for an existing Rolevo database with users/career_profiles/career_roles.
-- Back up first. Run once with psql -v ON_ERROR_STOP=1 -f this-file.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS career_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_slug varchar(100) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL,
  constraints jsonb NOT NULL,
  profile_fingerprint varchar(64) NOT NULL,
  completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  reflection varchar(2000) NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS career_plans_user_role_idx ON career_plans(user_id, role_slug);
CREATE TABLE IF NOT EXISTS plan_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES career_plans(id) ON DELETE CASCADE,
  version integer NOT NULL,
  profile_fingerprint varchar(64) NOT NULL,
  reviewer_name varchar(120) NOT NULL,
  reviewer_id varchar(120) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'pending',
  run_id varchar(120),
  notes varchar(4000),
  consented_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS plan_reviews_version_idx ON plan_reviews(plan_id, version);
COMMIT;
