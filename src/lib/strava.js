// src/lib/strava.js
// Frontend helpers for Strava OAuth & Supabase Edge Function calls

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;

// ─── OAuth Redirect ────────────────────────────────────────────────────────
// Redirects user to Strava consent page. On approval, Strava sends them
// back to /strava/callback?code=XXXX
export function redirectToStrava() {
  const redirectUri = `${window.location.origin}/strava/callback`;
  const scope = 'activity:read_all';
  const url =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${STRAVA_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&approval_prompt=auto` +
    `&scope=${scope}`;
  window.location.href = url;
}

// ─── Edge Function caller helper ──────────────────────────────────────────
async function callEdgeFunction(fnName, body = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  // Try to parse as JSON — if it fails, show the raw text
  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`[${fnName}] Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    // Show the full error detail from the edge function
    const msg = data?.error || data?.message || JSON.stringify(data) || `HTTP ${res.status}`;
    throw new Error(`[${fnName}] ${msg}`);
  }
  return data;
}


// ─── Exchange OAuth code (calls strava-auth edge fn) ──────────────────────
export async function exchangeStravaCode(code) {
  return callEdgeFunction('strava-auth', { code });
}

// ─── Sync latest activities (calls strava-sync edge fn) ───────────────────
export async function syncStravaActivities() {
  return callEdgeFunction('strava-sync', {});
}

// ─── Pace helpers ─────────────────────────────────────────────────────────
// Convert m/s → min/km string (e.g. "10:57")
export function speedToMinPerKm(metersPerSec) {
  if (!metersPerSec || metersPerSec <= 0) return '—';
  const secPerKm = 1000 / metersPerSec;
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Convert seconds → "Xh Xm Xs" label
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// min/km numeric (e.g. 10.95) → "10:57" display
export function minKmToDisplay(minKm) {
  const mins = Math.floor(minKm);
  const secs = Math.round((minKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ─── Determine pace tier label + color ───────────────────────────────────
export function getPaceTier(minPerKm) {
  if (minPerKm <= 5) return { label: 'MA Cardio Base', color: '#10b981', emoji: '🥋' };
  if (minPerKm <= 6) return { label: 'Average Runner', color: '#f59e0b', emoji: '🏃' };
  if (minPerKm <= 7) return { label: 'Light Jog', color: '#f97316', emoji: '🚶‍♂️' };
  if (minPerKm <= 9) return { label: 'Brisk Walk', color: '#e85d04', emoji: '🚶' };
  if (minPerKm <= 12) return { label: 'Walk', color: '#94a3b8', emoji: '🦶' };
  return { label: 'Very Slow', color: '#64748b', emoji: '🐢' };
}
