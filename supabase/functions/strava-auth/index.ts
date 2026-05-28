// supabase/functions/strava-auth/index.ts
// Handles Strava OAuth code exchange — keeps client_secret server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Strava credentials not configured in Edge Function secrets');
    }

    // Exchange code for tokens with Strava
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      throw new Error(`Strava token exchange failed: ${JSON.stringify(err)}`);
    }

    const tokenData = await tokenRes.json();
    const { athlete, access_token, refresh_token, expires_at } = tokenData;

    // Store tokens in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: upsertError } = await supabase.from('strava_tokens').upsert(
      {
        athlete_id: athlete.id,
        athlete_name: `${athlete.firstname} ${athlete.lastname}`,
        athlete_profile: athlete.profile_medium || athlete.profile,
        access_token,
        refresh_token,
        expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'athlete_id' },
    );

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        success: true,
        athlete: {
          id: athlete.id,
          name: `${athlete.firstname} ${athlete.lastname}`,
          profile: athlete.profile_medium || athlete.profile,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('strava-auth error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
