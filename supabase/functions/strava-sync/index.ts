// supabase/functions/strava-sync/index.ts
// Fetches latest Strava activities, refreshes token if expired, auto-imports to workout_sessions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token refresh helper — called automatically when token is expired
async function refreshToken(supabase: any, tokenRow: any): Promise<string> {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Token refresh failed');
  const data = await res.json();

  await supabase.from('strava_tokens').update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('athlete_id', tokenRow.athlete_id);

  return data.access_token;
}

// Maps Strava sport_type to LiftLog day_type
function mapSportToDay(sportType: string): string {
  const type = sportType.toLowerCase();
  if (type.includes('run')) return 'athletic';
  if (type.includes('ride') || type.includes('cycle')) return 'athletic';
  if (type.includes('walk')) return 'active_recovery';
  if (type.includes('swim')) return 'athletic';
  if (type.includes('hike')) return 'active_recovery';
  return 'athletic';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Get stored token (single-user → take the first row)
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('strava_tokens')
      .select('*')
      .single();

    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ error: 'Not connected to Strava', connected: false }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Refresh token if expired (Strava tokens expire every 6h)
    const nowUnix = Math.floor(Date.now() / 1000);
    let accessToken = tokenRow.access_token;
    if (nowUnix >= tokenRow.expires_at - 300) {  // refresh 5 min early
      accessToken = await refreshToken(supabase, tokenRow);
    }

    // 3. Fetch latest 20 activities from Strava
    const activitiesRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=20',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!activitiesRes.ok) {
      throw new Error(`Strava API error: ${activitiesRes.status}`);
    }

    const stravaActivities = await activitiesRes.json();

    // 4. Get already-imported Strava IDs to avoid duplicates
    const { data: existingRows } = await supabase
      .from('strava_activities')
      .select('strava_id');
    const existingIds = new Set((existingRows || []).map((r: any) => r.strava_id));

    // 5. Import new activities
    const newActivities = stravaActivities.filter((a: any) => !existingIds.has(a.id));
    const importedSessions = [];

    for (const act of newActivities) {
      // 5a. Insert into strava_activities table
      const actDate = new Date(act.start_date).toISOString().split('T')[0];

      const { data: actRow, error: actErr } = await supabase
        .from('strava_activities')
        .insert({
          strava_id: act.id,
          athlete_id: tokenRow.athlete_id,
          name: act.name,
          sport_type: act.sport_type || act.type,
          start_date: act.start_date,
          elapsed_time: act.elapsed_time,
          moving_time: act.moving_time,
          distance: act.distance,
          average_speed: act.average_speed,
          max_speed: act.max_speed,
          average_heartrate: act.average_heartrate || null,
          max_heartrate: act.max_heartrate || null,
          total_elevation_gain: act.total_elevation_gain,
          suffer_score: act.suffer_score || null,
          kudos_count: act.kudos_count || 0,
          map_summary_polyline: act.map?.summary_polyline || null,
        })
        .select()
        .single();

      if (actErr) {
        console.error('Error inserting activity:', actErr);
        continue;
      }

      // 5b. Auto-create workout_session for this activity
      const dayType = mapSportToDay(act.sport_type || act.type || '');
      const distKm = (act.distance / 1000).toFixed(2);
      const paceSecPerKm = act.distance > 0 ? act.moving_time / (act.distance / 1000) : 0;
      const paceMin = Math.floor(paceSecPerKm / 60);
      const paceSec = Math.round(paceSecPerKm % 60);
      const notes = `🏃 Strava Import — ${act.name} · ${distKm}km · Pace: ${paceMin}:${String(paceSec).padStart(2, '0')} min/km`;

      const { data: sessionRow } = await supabase
        .from('workout_sessions')
        .insert({
          session_date: actDate,
          day_type: dayType,
          completed: true,
          completed_at: act.start_date,
          notes,
        })
        .select()
        .single();

      // 5c. Link session back to strava_activities row
      if (sessionRow) {
        await supabase
          .from('strava_activities')
          .update({ session_id: sessionRow.id })
          .eq('id', actRow.id);

        importedSessions.push({
          name: act.name,
          date: actDate,
          distanceKm: parseFloat(distKm),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        athlete: {
          id: tokenRow.athlete_id,
          name: tokenRow.athlete_name,
          profile: tokenRow.athlete_profile,
        },
        total: stravaActivities.length,
        newImports: importedSessions.length,
        imported: importedSessions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('strava-sync error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
