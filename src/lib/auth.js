// src/lib/auth.js
// Handles access mode: 'viewer' (public) or 'owner' (JWT-authenticated)
// No passwords are ever stored or compared here — all auth happens server-side.

const SESSION_KEY = 'fittrack_owner_token';

/** Store the JWT returned from the Edge Function */
export function saveOwnerToken(token) {
  sessionStorage.setItem(SESSION_KEY, token);
}

/** Retrieve the JWT — null if not logged in or tab was closed */
export function getOwnerToken() {
  return sessionStorage.getItem(SESSION_KEY);
}

/** Clear the JWT on logout */
export function clearOwnerToken() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Decode JWT payload (no verification — verification is server-side only) */
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** Returns true only if a valid, non-expired owner JWT exists in sessionStorage */
export function isOwnerAuthenticated() {
  const token = getOwnerToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // exp is in milliseconds (set server-side as Date.now() + 8h)
  if (Date.now() > payload.exp) {
    clearOwnerToken();
    return false;
  }
  return payload.role === 'owner';
}

/**
 * Call the Supabase Edge Function to verify the password server-side.
 * Returns { success: true, token } or { success: false, error, cooldown? }
 * No password logic runs in this file — it's just an HTTP call.
 */
export async function verifyOwnerPassword(password) {
  // Sanitize input — strip dangerous characters before sending
  const sanitized = password
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/['";]/g, '')             // strip SQL-dangerous chars
    .replace(/--|\/\*|\*\//g, '')      // strip SQL comment patterns
    .slice(0, 128);                    // max length

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Use a simple hash of the browser fingerprint as an IP proxy
  // (Real IP hashing happens in the Edge Function)
  const response = await fetch(
    `${supabaseUrl}/functions/v1/verify-owner`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: sanitized }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Invalid password',
      cooldown: data.cooldown || null,
      locked: data.locked || false,
    };
  }

  return { success: true, token: data.token };
}
