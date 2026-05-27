-- FitTrack — Supabase Schema
-- Run this in your Supabase SQL editor

-- 1. Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL,
  day_type TEXT NOT NULL,  -- 'push','pull','legs_core','full_body','athletic','rest','active_recovery'
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Individual sets logged per exercise
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(5,2),       -- NULL for bodyweight exercises
  reps_done INTEGER,
  duration_sec INTEGER,          -- for timed exercises (plank, mountain climbers)
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Body measurements
CREATE TABLE IF NOT EXISTS body_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logged_date DATE NOT NULL UNIQUE,
  weight_kg DECIMAL(4,1) NOT NULL,
  chest_cm DECIMAL(4,1),
  waist_cm DECIMAL(4,1),
  arm_cm DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Personal records (auto-updated on new best set)
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name TEXT NOT NULL UNIQUE,
  record_weight DECIMAL(5,2),
  record_reps INTEGER,
  achieved_date DATE,
  session_id UUID REFERENCES workout_sessions(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sets_session ON exercise_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON exercise_sets(exercise_name);
CREATE INDEX IF NOT EXISTS idx_body_stats_date ON body_stats(logged_date);

-- Row Level Security (for single user — disable or set up auth as needed)
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-user app — no auth isolation needed)
-- If you add auth, replace these with user-scoped policies
CREATE POLICY "Allow all" ON workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON body_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON personal_records FOR ALL USING (true) WITH CHECK (true);
