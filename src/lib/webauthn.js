// src/lib/webauthn.js
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Perform a WebAuthn action by communicating with the Supabase Edge Function
 */
async function performWebAuthnAction(action, extraBody = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Get hostname for RP ID (e.g., localhost or your-app.vercel.app)
  const rpID = window.location.hostname;
  const expectedOrigin = window.location.origin;

  const response = await fetch(`${supabaseUrl}/functions/v1/webauthn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, expectedOrigin, rpID, ...extraBody }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Server error');
  return data;
}

export async function checkHasPasskey() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // Use anon key just to check count (needs RLS to allow select count)
  // Wait, RLS prevents anon from reading.
  // Instead, just call generate-authentication and see if it fails with 404
  try {
    const rpID = window.location.hostname;
    const expectedOrigin = window.location.origin;
    const res = await fetch(`${supabaseUrl}/functions/v1/webauthn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate-authentication', expectedOrigin, rpID }),
    });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

export async function registerFingerprint() {
  // 1. Get registration options from server
  const { options } = await performWebAuthnAction('generate-registration');

  // 2. Prompt user to register fingerprint
  let credential;
  try {
    credential = await startRegistration(options);
  } catch (err) {
    throw new Error('Registration cancelled or failed: ' + err.message);
  }

  // 3. Send credential back to server to verify and store
  const { verified, token } = await performWebAuthnAction('verify-registration', {
    credential,
    expectedChallenge: options.challenge,
  });

  if (!verified) throw new Error('Verification failed');
  return token; // JWT
}

export async function loginWithFingerprint() {
  // 1. Get auth options from server
  const { options } = await performWebAuthnAction('generate-authentication');

  // 2. Prompt user to authenticate
  let credential;
  try {
    credential = await startAuthentication(options);
  } catch (err) {
    throw new Error('Authentication cancelled or failed: ' + err.message);
  }

  // 3. Send credential back to verify
  const { verified, token } = await performWebAuthnAction('verify-authentication', {
    credential,
    expectedChallenge: options.challenge,
  });

  if (!verified) throw new Error('Verification failed');
  return token; // JWT
}
