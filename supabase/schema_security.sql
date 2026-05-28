-- supabase/schema_security.sql
-- Security schema: login_attempts table + RLS policies for all data tables
-- Run this in Supabase SQL Editor

-- ─── 1. Login Attempts Table (for rate limiting) ──────────────────────────────

CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash      TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  success      BOOLEAN DEFAULT false NOT NULL
);

-- Index for fast rate-limit queries by ip_hash + time
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts (ip_hash, attempt_time DESC);

-- Auto-cleanup: delete records older than 24 hours via pg_cron (optional)
-- SELECT cron.schedule('cleanup-login-attempts', '0 * * * *',
--   $$DELETE FROM login_attempts WHERE attempt_time < now() - interval '24 hours'$$);

-- RLS: only the Edge Function (service role) can read/write login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - login_attempts read" ON login_attempts;
CREATE POLICY "Service role only - login_attempts read"
  ON login_attempts FOR SELECT
  USING (false); -- No anon reads ever

DROP POLICY IF EXISTS "Service role only - login_attempts insert" ON login_attempts;
CREATE POLICY "Service role only - login_attempts insert"
  ON login_attempts FOR INSERT
  WITH CHECK (false); -- Blocked for anon; service_role bypasses RLS


-- ─── 2. RLS Policies for workout_sessions ─────────────────────────────────────

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read workout sessions (viewer mode)
DROP POLICY IF EXISTS "Public read - workout_sessions" ON workout_sessions;
CREATE POLICY "Public read - workout_sessions"
  ON workout_sessions FOR SELECT
  USING (true);

-- Only owner JWT can insert
DROP POLICY IF EXISTS "Owner write - workout_sessions" ON workout_sessions;
CREATE POLICY "Owner write - workout_sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'owner');

-- Only owner JWT can update
DROP POLICY IF EXISTS "Owner update - workout_sessions" ON workout_sessions;
CREATE POLICY "Owner update - workout_sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'owner');

-- Only owner JWT can delete
DROP POLICY IF EXISTS "Owner delete - workout_sessions" ON workout_sessions;
CREATE POLICY "Owner delete - workout_sessions"
  ON workout_sessions FOR DELETE
  USING (auth.jwt() ->> 'role' = 'owner');

-- ─── 3. RLS Policies for exercise_sets ────────────────────────────────────────

ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read - exercise_sets" ON exercise_sets;
CREATE POLICY "Public read - exercise_sets"
  ON exercise_sets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner write - exercise_sets" ON exercise_sets;
CREATE POLICY "Owner write - exercise_sets"
  ON exercise_sets FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner update - exercise_sets" ON exercise_sets;
CREATE POLICY "Owner update - exercise_sets"
  ON exercise_sets FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner delete - exercise_sets" ON exercise_sets;
CREATE POLICY "Owner delete - exercise_sets"
  ON exercise_sets FOR DELETE
  USING (auth.jwt() ->> 'role' = 'owner');

-- ─── 4. RLS Policies for personal_records ─────────────────────────────────────

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read - personal_records" ON personal_records;
CREATE POLICY "Public read - personal_records"
  ON personal_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner write - personal_records" ON personal_records;
CREATE POLICY "Owner write - personal_records"
  ON personal_records FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner update - personal_records" ON personal_records;
CREATE POLICY "Owner update - personal_records"
  ON personal_records FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner delete - personal_records" ON personal_records;
CREATE POLICY "Owner delete - personal_records"
  ON personal_records FOR DELETE
  USING (auth.jwt() ->> 'role' = 'owner');

-- ─── 5. RLS Policies for body_stats ───────────────────────────────────────────

ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read - body_stats" ON body_stats;
CREATE POLICY "Public read - body_stats"
  ON body_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner write - body_stats" ON body_stats;
CREATE POLICY "Owner write - body_stats"
  ON body_stats FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner update - body_stats" ON body_stats;
CREATE POLICY "Owner update - body_stats"
  ON body_stats FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'owner');

DROP POLICY IF EXISTS "Owner delete - body_stats" ON body_stats;
CREATE POLICY "Owner delete - body_stats"
  ON body_stats FOR DELETE
  USING (auth.jwt() ->> 'role' = 'owner');

-- ─── 6. RLS for strava_tokens (sensitive — no public read) ────────────────────

ALTER TABLE strava_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public read - strava_tokens" ON strava_tokens;
CREATE POLICY "No public read - strava_tokens"
  ON strava_tokens FOR SELECT
  USING (false); -- Only Edge Functions (service_role) can read tokens

-- ─── 7. RLS for strava_activities (public read OK) ────────────────────────────

ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read - strava_activities" ON strava_activities;
CREATE POLICY "Public read - strava_activities"
  ON strava_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "No direct write - strava_activities" ON strava_activities;
CREATE POLICY "No direct write - strava_activities"
  ON strava_activities FOR INSERT
  WITH CHECK (false); -- Only Edge Functions (service_role) can insert
