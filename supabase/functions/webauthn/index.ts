// supabase/functions/webauthn/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@9.0.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    return new Response(JSON.stringify({ error: "Missing JWT_SECRET" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const { action, expectedOrigin, rpID } = body;
  
  if (!action || !expectedOrigin || !rpID) {
    return new Response(JSON.stringify({ error: "Missing action, expectedOrigin, or rpID" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // 1. Generate Registration Options
  if (action === "generate-registration") {
    // Check if a passkey already exists
    const { count } = await supabase.from("passkeys").select("*", { count: "exact", head: true });
    
    if (count && count > 0) {
      return new Response(JSON.stringify({ error: "A fingerprint is already registered. Only one is allowed." }), { status: 403, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const options = await generateRegistrationOptions({
      rpName: "FitTrack",
      rpID,
      userID: "fittrack-owner-id",
      userName: "Owner",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    return new Response(JSON.stringify({ options }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // 2. Verify Registration
  if (action === "verify-registration") {
    const { credential, expectedChallenge } = body;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Convert Uint8Arrays to Base64url for storage
      const b64CredentialID = btoa(String.fromCharCode(...credentialID)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const b64PublicKey = btoa(String.fromCharCode(...credentialPublicKey)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      const { error } = await supabase.from("passkeys").insert({
        credential_id: b64CredentialID,
        public_key: b64PublicKey,
        counter,
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        transports: JSON.stringify(credential.response.transports || []),
      });

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to store passkey: " + error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
      }

      // Generate JWT
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );

      const token = await create(
        { alg: "HS256", typ: "JWT" },
        { role: "owner", exp: Date.now() + 8 * 60 * 60 * 1000 },
        key
      );

      return new Response(JSON.stringify({ verified: true, token }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Verification failed" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // 3. Generate Authentication Options
  if (action === "generate-authentication") {
    const { data: passkeys, error } = await supabase.from("passkeys").select("credential_id, transports");
    
    if (error || !passkeys || passkeys.length === 0) {
      return new Response(JSON.stringify({ error: "No fingerprint registered." }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map((p: any) => ({
        id: p.credential_id, // SimpleWebAuthn expects base64url or string depending on version, we stored as base64url string
        type: "public-key",
        transports: p.transports ? JSON.parse(p.transports) : undefined,
      })),
      userVerification: "preferred",
    });

    return new Response(JSON.stringify({ options }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // 4. Verify Authentication
  if (action === "verify-authentication") {
    const { credential, expectedChallenge } = body;

    // Get the passkey from DB
    const { data: passkeys } = await supabase.from("passkeys").select("*").eq("credential_id", credential.id);
    if (!passkeys || passkeys.length === 0) {
      return new Response(JSON.stringify({ error: "Passkey not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    
    const passkey = passkeys[0];

    // Convert stored base64url back to Uint8Array
    const decodeB64 = (b64: string) => Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: decodeB64(passkey.credential_id),
          credentialPublicKey: decodeB64(passkey.public_key),
          counter: Number(passkey.counter),
          transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    if (verification.verified) {
      // Update counter
      await supabase.from("passkeys").update({ counter: verification.authenticationInfo.newCounter }).eq("id", passkey.id);

      // Generate JWT
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );

      const token = await create(
        { alg: "HS256", typ: "JWT" },
        { role: "owner", exp: Date.now() + 8 * 60 * 60 * 1000 },
        key
      );

      return new Response(JSON.stringify({ verified: true, token }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Verification failed" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
});
