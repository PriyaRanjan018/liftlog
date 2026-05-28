// src/pages/Strava.jsx
// Main Strava page — connect button, activity feed, run analysis
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { redirectToStrava, syncStravaActivities, speedToMinPerKm, formatDuration, getPaceTier } from '../lib/strava';
import RunAnalysis from '../components/RunAnalysis';

const SPORT_ICONS = {
  Run: '🏃',
  VirtualRun: '🏃',
  Walk: '🚶',
  Hike: '🥾',
  Ride: '🚴',
  VirtualRide: '🚴',
  Swim: '🏊',
  WeightTraining: '🏋️',
  Workout: '💪',
  Yoga: '🧘',
};

function SportBadge({ sportType }) {
  const emoji = SPORT_ICONS[sportType] || '🏅';
  return (
    <span className="text-base">{emoji}</span>
  );
}

export default function Strava() {
  const [searchParams] = useSearchParams();
  const [athlete, setAthlete] = useState(null);        // connected athlete info
  const [activities, setActivities] = useState([]);    // from strava_activities table
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null); // for RunAnalysis
  const [filter, setFilter] = useState('All');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load connection status + activities from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);

    // Check if connected (token exists)
    const { data: tokenRow } = await supabase
      .from('strava_tokens')
      .select('athlete_id, athlete_name, athlete_profile')
      .single();

    if (tokenRow) {
      setAthlete({
        id: tokenRow.athlete_id,
        name: tokenRow.athlete_name,
        profile: tokenRow.athlete_profile,
      });

      // Load activities
      const { data: acts } = await supabase
        .from('strava_activities')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(30);

      setActivities(acts || []);

      // Auto-select the most recent run for analysis
      const latestRun = (acts || []).find(
        (a) => a.sport_type === 'Run' || a.sport_type === 'VirtualRun',
      );
      if (latestRun) setSelectedActivity(latestRun);
    } else {
      setAthlete(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // If just connected via OAuth callback, show toast
    if (searchParams.get('connected') === '1') {
      showToast('✅ Strava connected! Syncing activities...');
      // Auto-sync on first connect
      handleSync(true);
    }
  }, []);

  const handleSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncStravaActivities();
      setSyncResult(result);

      if (!silent) {
        showToast(
          result.newImports > 0
            ? `✅ Imported ${result.newImports} new activit${result.newImports === 1 ? 'y' : 'ies'}`
            : '✅ All up to date — no new activities',
        );
      }

      await loadData();
    } catch (err) {
      showToast(`❌ Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Unique sport types for filter
  const sportTypes = ['All', ...Array.from(new Set(activities.map((a) => a.sport_type)))];

  const filtered = filter === 'All'
    ? activities
    : activities.filter((a) => a.sport_type === filter);

  // ─── Not Connected State ──────────────────────────────────────────────────
  if (!loading && !athlete) {
    return (
      <div className="min-h-screen bg-[#060606] pb-32">
        {/* Header */}
        <div className="px-5 pt-12 pb-6 border-b border-neutral-900/60 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-[#FC4C02]/10 pointer-events-none" />
          <h1 className="text-3xl font-black text-white tracking-tight font-display">Strava</h1>
          <p className="text-neutral-500 text-xs mt-1">Connect to import runs & cardio</p>
        </div>

        <div className="px-5 pt-8 flex flex-col items-center text-center">
          {/* Strava logo area */}
          <div className="w-24 h-24 rounded-3xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(252,76,2,0.15)]">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Connect Strava</h2>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mb-8">
            Link your Strava account to automatically import runs, rides, and walks into FitTrack. Your activities will appear in History and feed the Run Analysis.
          </p>

          {/* What you get */}
          <div className="w-full bg-[#121212] border border-neutral-900 rounded-3xl p-5 mb-8 text-left space-y-3">
            <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">What you get</div>
            {[
              { icon: '📥', title: 'Auto-import activities', desc: 'Runs & rides appear in History automatically' },
              { icon: '📊', title: 'Run Analysis', desc: 'Brutal honest pace assessment vs your MA goals' },
              { icon: '🎯', title: 'Goal tracking', desc: 'See how far you are from 5km sub-30 min' },
              { icon: '🔒', title: 'Secure via Edge Functions', desc: 'Your Strava secret never touches the browser' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <div className="text-xs font-black text-white">{item.title}</div>
                  <div className="text-[10px] text-neutral-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            id="strava-connect-btn"
            onClick={redirectToStrava}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(252,76,2,0.3)]"
            style={{ background: 'linear-gradient(135deg, #FC4C02, #e84000)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
            </svg>
            Connect with Strava
          </button>

          <p className="text-[10px] text-neutral-600 mt-4">
            You'll be taken to Strava to approve access. We only request <strong className="text-neutral-500">read</strong> permissions — we never post on your behalf.
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="text-neutral-500 text-xs font-black uppercase tracking-wider animate-pulse">
          Loading Strava data...
        </div>
      </div>
    );
  }

  // ─── Connected State ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060606] pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl uppercase tracking-wider whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-neutral-900/60 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-[#FC4C02]/10 pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {athlete?.profile ? (
              <img
                src={athlete.profile}
                alt={athlete.name}
                className="w-10 h-10 rounded-2xl object-cover border-2 border-[#FC4C02]/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">
                {athlete?.name?.split(' ')[0] || 'Strava'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#FC4C02] rounded-full" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  Connected
                </span>
              </div>
            </div>
          </div>

          <button
            id="strava-sync-btn"
            onClick={() => handleSync()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: syncing ? 'transparent' : 'rgba(252,76,2,0.1)',
              borderColor: '#FC4C0230',
              color: '#FC4C02',
            }}
          >
            <span className={syncing ? 'animate-spin' : ''}>↻</span>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Quick stats row */}
        {activities.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-neutral-900/60">
            {[
              { label: 'Activities', value: activities.length },
              {
                label: 'Total km',
                value: (activities.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1),
              },
              {
                label: 'Runs',
                value: activities.filter((a) => a.sport_type === 'Run').length,
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-lg font-black text-white leading-none font-display">
                  {stat.value}
                </div>
                <div className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* ── Run Analysis (most recent run) ── */}
        {selectedActivity && (
          <div>
            <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3">
              Latest Run Analysis
            </div>
            <RunAnalysis activity={selectedActivity} />
          </div>
        )}

        {/* ── Activity Feed ── */}
        <div className="bg-[#121212] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-4 border-b border-neutral-900/60 flex items-center justify-between">
            <div className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">
              Activity Feed
            </div>
            <div className="text-[10px] text-neutral-600 font-bold">
              {activities.length} total
            </div>
          </div>

          {/* Sport filter tabs */}
          {sportTypes.length > 2 && (
            <div className="flex gap-1.5 px-5 py-3 border-b border-neutral-900/60 overflow-x-auto">
              {sportTypes.map((type) => (
                <button
                  key={type}
                  id={`strava-filter-${type.toLowerCase()}`}
                  onClick={() => setFilter(type)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border"
                  style={
                    filter === type
                      ? { background: 'rgba(252,76,2,0.15)', borderColor: '#FC4C0240', color: '#FC4C02' }
                      : { background: 'transparent', borderColor: '#1c1c1c', color: '#555' }
                  }
                >
                  {SPORT_ICONS[type] || ''} {type}
                </button>
              ))}
            </div>
          )}

          {/* Activity list */}
          <div className="divide-y divide-neutral-900/60">
            {filtered.length === 0 ? (
              <div className="text-center text-neutral-500 text-xs font-bold uppercase tracking-wider py-10">
                No activities yet — tap Sync
              </div>
            ) : (
              filtered.map((act) => {
                const paceMinKm = act.average_speed > 0 ? 1000 / act.average_speed / 60 : null;
                const tier = paceMinKm ? getPaceTier(paceMinKm) : null;
                const isSelected = selectedActivity?.id === act.id;
                const isRun = act.sport_type === 'Run' || act.sport_type === 'VirtualRun';

                return (
                  <button
                    key={act.id}
                    id={`activity-${act.strava_id}`}
                    onClick={() => isRun && setSelectedActivity(isSelected ? null : act)}
                    className={`w-full px-5 py-4 flex items-center gap-4 text-left transition-all ${
                      isSelected
                        ? 'bg-[#FC4C02]/5'
                        : isRun
                        ? 'hover:bg-neutral-950/60 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    {/* Sport icon */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border"
                      style={
                        tier
                          ? { backgroundColor: `${tier.color}12`, borderColor: `${tier.color}25` }
                          : { backgroundColor: '#161616', borderColor: '#1c1c1c' }
                      }
                    >
                      <SportBadge sportType={act.sport_type} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white truncate leading-tight">
                        {act.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                          {new Date(act.start_date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {tier && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                            style={{ color: tier.color, backgroundColor: `${tier.color}15` }}
                          >
                            {tier.label}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-black text-[#FC4C02] uppercase tracking-wider">
                            ▲ Analysing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right stats */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-white font-display leading-none">
                        {(act.distance / 1000).toFixed(2)} km
                      </div>
                      {paceMinKm && (
                        <div className="text-[9px] text-neutral-500 font-bold mt-0.5">
                          {speedToMinPerKm(act.average_speed)} /km
                        </div>
                      )}
                      <div className="text-[9px] text-neutral-600 font-bold">
                        {formatDuration(act.moving_time)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sync info */}
        {syncResult && (
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 text-[10px] text-neutral-500 font-bold">
            Last sync: {syncResult.total} activities checked · {syncResult.newImports} imported to History
          </div>
        )}

        {/* No activities at all → prompt sync */}
        {activities.length === 0 && !syncing && (
          <button
            onClick={() => handleSync()}
            className="w-full py-4 rounded-2xl border border-[#FC4C02]/20 text-[#FC4C02] font-black text-xs uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(252,76,2,0.05)' }}
          >
            ↻ Pull Activities from Strava
          </button>
        )}

        {/* Footer */}
        <div className="text-center text-neutral-600 text-[9px] font-black uppercase tracking-widest py-4">
          Activities auto-import to History · Powered by Strava API
        </div>
      </div>
    </div>
  );
}
