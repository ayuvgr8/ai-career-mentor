-- Base schema for a fresh Rolevo database. Idempotent: safe on a database
-- that was initialized earlier with `drizzle-kit push`.
BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);
CREATE TABLE IF NOT EXISTS career_profiles (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS career_roles (
  slug varchar(100) PRIMARY KEY,
  family_slug varchar(100) NOT NULL,
  family_title varchar(150) NOT NULL,
  title varchar(150) NOT NULL,
  summary varchar(500) NOT NULL,
  status varchar(30) NOT NULL,
  sort_order integer NOT NULL,
  content jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS career_roles_family_sort_idx ON career_roles(family_slug, sort_order);
COMMIT;
