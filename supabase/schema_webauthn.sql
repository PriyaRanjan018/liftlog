-- supabase/schema_webauthn.sql
-- WebAuthn passkeys table

CREATE TABLE IF NOT EXISTS passkeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT, -- Stored as JSON string
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS: only the Edge Function (service role) can read/write passkeys
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only - passkeys read" ON passkeys;
CREATE POLICY "Service role only - passkeys read"
  ON passkeys FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "Service role only - passkeys insert" ON passkeys;
CREATE POLICY "Service role only - passkeys insert"
  ON passkeys FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role only - passkeys update" ON passkeys;
CREATE POLICY "Service role only - passkeys update"
  ON passkeys FOR UPDATE
  USING (false);
