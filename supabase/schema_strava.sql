-- LiftLog — Strava Integration Schema
-- Run this in your Supabase SQL editor AFTER schema.sql

-- 1. Strava OAuth tokens (single-user store)
CREATE TABLE IF NOT EXISTS strava_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id BIGINT NOT NULL UNIQUE,
  athlete_name TEXT,
  athlete_profile TEXT,         -- profile pic URL
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,   -- Unix timestamp
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Strava activities imported into LiftLog
CREATE TABLE IF NOT EXISTS strava_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strava_id BIGINT NOT NULL UNIQUE,   -- Strava's own activity ID (prevents duplicate imports)
  athlete_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL,            -- Run, Ride, Walk, Swim, etc.
  start_date TIMESTAMPTZ NOT NULL,
  elapsed_time INTEGER NOT NULL,       -- seconds
  moving_time INTEGER NOT NULL,        -- seconds
  distance DECIMAL(10,2) NOT NULL,     -- metres
  average_speed DECIMAL(8,4),          -- m/s
  max_speed DECIMAL(8,4),              -- m/s
  average_heartrate DECIMAL(5,1),
  max_heartrate DECIMAL(5,1),
  total_elevation_gain DECIMAL(8,2),   -- metres
  suffer_score INTEGER,
  kudos_count INTEGER DEFAULT 0,
  map_summary_polyline TEXT,           -- for future map display
  imported_at TIMESTAMPTZ DEFAULT now(),
  -- Link to workout_sessions if auto-imported
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL
);

-- 3. Running goals (for the "How far to go" feature)
CREATE TABLE IF NOT EXISTS running_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,                 -- e.g. "MA Base Cardio"
  target_pace_min_km DECIMAL(5,2) NOT NULL,  -- target pace in min/km (e.g. 6.0 = 6:00/km)
  target_distance_km DECIMAL(5,2) NOT NULL,  -- target distance in km
  deadline DATE,
  achieved BOOLEAN DEFAULT false,
  achieved_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default running goals for Martial Arts preparation
INSERT INTO running_goals (label, target_pace_min_km, target_distance_km, deadline)
VALUES
  ('Light Jog Threshold', 9.0, 5.0, NULL),
  ('Average Runner', 6.0, 5.0, NULL),
  ('MA Cardio Base', 5.0, 5.0, NULL)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strava_activities_date ON strava_activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_strava_activities_sport ON strava_activities(sport_type);
CREATE INDEX IF NOT EXISTS idx_strava_activities_strava_id ON strava_activities(strava_id);

-- RLS (open for single-user)
ALTER TABLE strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON strava_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON strava_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON running_goals FOR ALL USING (true) WITH CHECK (true);
