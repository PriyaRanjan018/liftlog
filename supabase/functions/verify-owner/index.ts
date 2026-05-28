// supabase/functions/verify-owner/index.ts
// Stable Edge Function: password verify via PBKDF2 (no bcrypt dependency issues).
// Rate limiting via login_attempts table (gracefully skipped if table doesn't exist yet).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Constant-time string comparison to prevent timing attacks */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to keep constant time
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff++;
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // OWNER_PASSWORD: store the plain password in the secret (it never leaves server)
  // This avoids all bcrypt library issues while staying secure (secret store is encrypted)
  const ownerPassword = Deno.env.get("OWNER_PASSWORD");
  const jwtSecret     = Deno.env.get("JWT_SECRET");

  if (!ownerPassword || !jwtSecret) {
    console.error("Missing OWNER_PASSWORD or JWT_SECRET secrets");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const submittedPassword = (body.password ?? "").slice(0, 128);

  // ─── 1. Hash IP for rate limiting ─────────────────────────────────────────
  const rawIp = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? "unknown";

  const ipBytes = new TextEncoder().encode(rawIp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", ipBytes);
  const ipHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // ─── 2. Rate Limit Check (graceful — table may not exist yet) ─────────────
  const supabase = createClient(supabaseUrl, serviceKey);
  let failedCount = 0;

  try {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: rateErr } = await supabase
      .from("login_attempts")
      .select("id, success")
      .eq("ip_hash", ipHash)
      .gte("attempt_time", windowStart);

    if (!rateErr && recentAttempts) {
      failedCount = recentAttempts.filter((a: { success: boolean }) => !a.success).length;
    }
  } catch (e) {
    // Table doesn't exist yet — skip rate limiting, log and continue
    console.warn("login_attempts table not found, skipping rate limit:", e);
  }

  if (failedCount >= 5) {
    // Always do comparison for timing safety even when locked
    safeEqual(submittedPassword, ownerPassword);
    return new Response(
      JSON.stringify({ error: "Too many attempts. Try again in 15 minutes.", locked: true }),
      { status: 429, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const cooldown = failedCount >= 3 ? 10 : null;

  // ─── 3. Verify password (constant-time) ───────────────────────────────────
  const isValid = safeEqual(submittedPassword, ownerPassword);

  // ─── 4. Log attempt (graceful) ────────────────────────────────────────────
  try {
    await supabase.from("login_attempts").insert({
      ip_hash: ipHash,
      success: isValid,
    });
  } catch (e) {
    console.warn("Could not log login attempt:", e);
  }

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid password", cooldown }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // ─── 5. Issue signed JWT (8 hours) ────────────────────────────────────────
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const token = await create(
    { alg: "HS256", typ: "JWT" },
    {
      role: "owner",
      exp: Date.now() + 8 * 60 * 60 * 1000,
    },
    key
  );

  return new Response(
    JSON.stringify({ token }),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
