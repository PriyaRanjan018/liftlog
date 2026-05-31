-- exercise_completions table
-- Tracks when a user marks an entire exercise as done (locks it permanently)
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS exercise_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, exercise_name)
);

-- Index for fast per-session lookups
CREATE INDEX IF NOT EXISTS idx_exercise_completions_session
  ON exercise_completions (session_id);

-- RLS: public read (viewer), owner write
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read exercise_completions"
  ON exercise_completions FOR SELECT
  USING (true);

CREATE POLICY "Owner insert exercise_completions"
  ON exercise_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner upsert exercise_completions"
  ON exercise_completions FOR UPDATE
  USING (true);
