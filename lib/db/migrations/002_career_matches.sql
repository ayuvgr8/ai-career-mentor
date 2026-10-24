-- Additive upgrade: saved match-screen signals (top three, reactions, opened guides).
-- Back up first. Run once with psql -v ON_ERROR_STOP=1 -f this-file.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS career_matches (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_fingerprint varchar(64),
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
