// src/pages/Strava.jsx
// Main Strava page — connect button, activity feed, run analysis
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { redirectToStrava, syncStravaActivities, speedToMinPerKm, formatDuration, getPaceTier } from '../lib/strava';
import RunAnalysis from '../components/RunAnalysis';

// ─── Cardio Journey Stages ─────────────────────────────────────────────────
const CARDIO_STAGES = [
  { id: 'walk',    label: 'Walk',          sub: '13–15 min/km',  emoji: '🦶', color: '#64748b', minKm: 14 },
  { id: 'brisk',   label: 'Brisk Walk',    sub: '10–12 min/km',  emoji: '🚶', color: '#94a3b8', minKm: 11 },
  { id: 'jog',     label: 'Light Jog',     sub: '7–9 min/km',    emoji: '🏃', color: '#f97316', minKm: 8  },
  { id: 'runner',  label: 'Avg Runner',    sub: '5–6 min/km',    emoji: '🏃‍♂️', color: '#f59e0b', minKm: 5.5 },
  { id: 'ma',      label: 'MA Ready',      sub: 'sub 5 min/km',  emoji: '🥋', color: '#10b981', minKm: 5  },
];

// Your current stage index (Brisk Walk = 1) — will update based on best pace
const CURRENT_STAGE_IDX = 1;  // Brisk Walk
const GOAL_STAGE_IDX    = 4;  // MA Ready

// Daily tips to reach the goal — shown in rotating fashion
const DAILY_TIPS = [
  { icon: '🫁', title: 'Can\'t breathe through your nose?', tip: 'You\'re going too fast. Slow down until you can. Nasal breathing = aerobic base building.' },
  { icon: '⏱️', title: 'Don\'t chase distance', tip: 'Chase 20 continuous minutes at ANY pace. No walking breaks. Time on feet beats speed right now.' },
  { icon: '📈', title: 'Add 1 minute every week', tip: '20 min this week → 21 next → 30 min in 10 weeks. Compound progress is invisible until it isn\'t.' },
  { icon: '🥊', title: 'A sparring round is 3 minutes', tip: 'It\'s 3 minutes of near-maximum effort. If you can\'t jog 20 min, you\'ll gas out in round 1.' },
  { icon: '🔢', title: 'Your target: 5km under 30 minutes', tip: 'You\'re at 4.97km in 54 min. That\'s the gap. Close it.' },
  { icon: '🦵', title: 'Heavy legs tire fast', tip: 'Legs that lift heavy get tired fast when running. That\'s normal — keep going. Conditioning takes 8–12 weeks minimum.' },
  { icon: '❄️', title: 'Walk on rest days', tip: 'Jog on training days after gym. Your body adapts to what you consistently demand from it.' },
  { icon: '🔥', title: 'Don\'t quit at the uncomfortable part', tip: 'The people who are good at cardio didn\'t start good at cardio. They just didn\'t quit.' },
  { icon: '💧', title: 'Dehydration kills pace by 10–15%', tip: 'Drink 500ml before your walk. Every single time.' },
  { icon: '🧠', title: 'Your brain will say stop at 60%', tip: 'Your body can go to 85% effort. Learn to tell the difference.' },
];

// ─── CardioJourney Component ───────────────────────────────────────────────
function CardioJourney({ bestPaceMinKm }) {
  // Determine current stage from best pace (default to Brisk Walk = index 1)
  let currentIdx = CURRENT_STAGE_IDX;
  if (bestPaceMinKm) {
    if (bestPaceMinKm <= 5)   currentIdx = 4;
    else if (bestPaceMinKm <= 6)   currentIdx = 3;
    else if (bestPaceMinKm <= 9)   currentIdx = 2;
    else if (bestPaceMinKm <= 12)  currentIdx = 1;
    else                           currentIdx = 0;
  }

  const current = CARDIO_STAGES[currentIdx];
  const goal    = CARDIO_STAGES[GOAL_STAGE_IDX];
  // Progress % across the 5 stages
  const progressPct = (currentIdx / (CARDIO_STAGES.length - 1)) * 100;
  const stagesLeft  = GOAL_STAGE_IDX - currentIdx;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
      {/* Premium ambient glow */}
      <div 
        className="absolute top-0 right-0 w-full h-full pointer-events-none transition-colors duration-1000 mix-blend-screen opacity-30"
        style={{ background: `radial-gradient(circle at top right, ${current.color}40, transparent 60%)` }}
      />
      <div 
        className="absolute inset-0 pointer-events-none rounded-[32px] ring-1 ring-inset ring-white/10"
      />
      
      {/* Card header */}
      <div className="px-6 pt-7 pb-4 flex items-end justify-between relative z-10">
        <div>
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-white/30" />
            Cardio Journey
          </div>
          <div className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
            Stage {currentIdx + 1} <span className="text-neutral-600 font-medium text-lg">/ {CARDIO_STAGES.length}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.2em] mb-1.5">Ultimate Goal</div>
          <div className="text-xs font-black flex items-center gap-1.5 bg-[#10b981]/10 px-3 py-1.5 rounded-full border border-[#10b981]/20 backdrop-blur-md" style={{ color: goal.color }}>
            {goal.emoji} <span className="tracking-wide">{goal.label}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-8 relative z-10">
        {/* Stage nodes timeline */}
        <div className="flex items-center justify-between relative pt-6 pb-4">
          {/* Track Line */}
          <div className="absolute top-[52px] left-[28px] right-[28px] h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ 
                width: `${progressPct}%`, 
                backgroundColor: current.color,
                boxShadow: `0 0 10px ${current.color}` 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40" />
            </div>
          </div>

          {CARDIO_STAGES.map((stage, idx) => {
            const isDone    = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isGoal    = idx === GOAL_STAGE_IDX;
            const isFuture  = idx > currentIdx;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-3 z-10 relative group">
                {/* Status Badge */}
                <div className="h-6 absolute -top-8 w-full flex justify-center">
                  {isCurrent && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)]" style={{ backgroundColor: stage.color, color: '#000' }}>
                      You
                    </span>
                  )}
                  {isGoal && !isCurrent && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">Goal</span>
                  )}
                </div>

                {/* Node circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border transition-all duration-500 ease-out backdrop-blur-md ${isCurrent ? 'scale-110 z-20' : 'scale-100 z-10'}`}
                  style={{
                    background: isCurrent
                      ? `linear-gradient(135deg, ${stage.color}25, rgba(0,0,0,0.8))`
                      : isDone
                      ? `linear-gradient(135deg, ${stage.color}15, rgba(0,0,0,0.6))`
                      : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.8))',
                    borderColor: isCurrent
                      ? stage.color
                      : isDone
                      ? `${stage.color}40`
                      : 'rgba(255,255,255,0.08)',
                    boxShadow: isCurrent ? `0 8px 24px -6px ${stage.color}50, inset 0 0 0 1px ${stage.color}30` : '0 4px 12px rgba(0,0,0,0.3)',
                    opacity: isFuture && !isGoal ? 0.3 : 1,
                    filter: isFuture && !isGoal ? 'grayscale(100%)' : 'none',
                  }}
                >
                  <span className={isDone && !isCurrent ? 'opacity-40 text-xl' : ''}>
                    {isDone && !isCurrent ? '✓' : stage.emoji}
                  </span>
                </div>
                
                {/* Node Label */}
                <div
                  className="text-[9px] font-bold text-center uppercase tracking-wider leading-tight w-16"
                  style={{ 
                    color: isCurrent ? stage.color : isDone ? '#888' : isGoal ? goal.color : '#555',
                    opacity: isFuture && !isGoal ? 0.6 : 1
                  }}
                >
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current vs Goal Comparison Cards (Merged into one sleek panel) */}
        <div className="bg-[#111] rounded-[24px] border border-white/5 p-1 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(90deg, ${current.color}20, transparent, ${goal.color}20)` }} />
          
          <div className="flex relative z-10">
            {/* Current */}
            <div className="flex-1 p-4 rounded-[20px] bg-gradient-to-br from-black/60 to-transparent">
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: current.color }} />
                Current Pace
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl filter drop-shadow-lg">{current.emoji}</div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider mb-0.5" style={{ color: current.color }}>{current.label}</div>
                  <div className="text-sm text-white font-display font-medium tracking-tight">{current.sub}</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center -mx-3 z-10">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-neutral-600 shadow-xl backdrop-blur-xl">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>

            {/* Goal */}
            <div className="flex-1 p-4 rounded-[20px] bg-gradient-to-bl from-black/60 to-transparent text-right flex flex-col items-end">
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-end">
                Target Pace
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goal.color }} />
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className="text-3xl filter drop-shadow-lg">{goal.emoji}</div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider mb-0.5" style={{ color: goal.color }}>{goal.label}</div>
                  <div className="text-sm text-white font-display font-medium tracking-tight">{goal.sub}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar Footer inside the panel */}
          <div className="px-5 pb-5 pt-2 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] text-neutral-400 font-medium">
                {stagesLeft > 0 ? `${stagesLeft} stage${stagesLeft > 1 ? 's' : ''} to MA Ready` : 'Goal Achieved'}
              </div>
              <div className="text-[10px] font-black tracking-wider text-white bg-white/10 px-2 py-0.5 rounded-md">
                {Math.round(progressPct)}%
              </div>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${current.color}60, ${current.color})`,
                  boxShadow: `0 0 10px ${current.color}80`
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Daily Reminders Footer ────────────────────────────────────────────────
function DailyReminders() {
  // Show a different tip each day (rotates daily)
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_TIPS.length;
  const todayTip = DAILY_TIPS[dayIndex];
  
  // Show just 1 upcoming tip as a blurred/dimmed preview
  const nextTip = DAILY_TIPS[(dayIndex + 1) % DAILY_TIPS.length];

  return (
    <div className="space-y-4">
      {/* Today's featured tip */}
      <div className="bg-[#111] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e85d04]" />
        
        <div className="flex items-center justify-between mb-5 relative z-10 pl-2">
          <div className="text-[10px] font-black text-[#e85d04] uppercase tracking-[0.2em] flex items-center gap-2">
            DAILY INSIGHT · TIP {dayIndex + 1} OF {DAILY_TIPS.length}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10 pl-2">
          <div className="text-4xl bg-[#e85d04]/10 p-3.5 rounded-[20px] border border-[#e85d04]/20 shadow-inner shrink-0">
            {todayTip.icon}
          </div>
          <div>
            <div className="text-lg font-black text-white mb-1.5 font-display tracking-tight leading-tight">{todayTip.title}</div>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">{todayTip.tip}</p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em] px-2 mb-2 flex items-center gap-2">
          Upcoming
        </div>
        
        {/* Dimmed/Blurred Preview */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-4 flex items-center gap-4 opacity-40 blur-[1px] hover:blur-none hover:opacity-100 transition-all duration-500">
          <span className="text-xl bg-black/50 w-11 h-11 flex items-center justify-center rounded-[14px] border border-white/5 shrink-0 shadow-inner">
            {nextTip.icon}
          </span>
          <div>
            <div className="text-xs font-bold text-neutral-400 tracking-wide mb-0.5">{nextTip.title}</div>
            <div className="text-[10px] text-neutral-600 leading-snug font-medium line-clamp-1">{nextTip.tip}</div>
          </div>
        </div>
      </div>

      {/* Hard truth banner */}
      <div className="mt-6 bg-gradient-to-r from-[#110505] to-[#1a0505] border border-red-500/20 rounded-[24px] p-5 relative overflow-hidden shadow-xl">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 to-red-800" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2 relative z-10">
          <span className="bg-red-500/20 p-1 rounded-md text-red-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          Reality Check
        </div>
        <p className="text-[11px] text-red-100/70 leading-relaxed font-medium relative z-10 pl-1">
          A sparring round is <strong className="text-white">3 minutes</strong> of near-maximum intensity.
          Most beginners gas out in <strong className="text-red-400">60 seconds</strong>.
          Your fish walk was impressive art — but your lungs need to match it. 🐟
        </p>
      </div>
    </div>
  );
}

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
  const [feedLimit, setFeedLimit] = useState(5);

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

  // Sort by average_speed descending (faster at top)
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const speedA = a.average_speed || 0;
    const speedB = b.average_speed || 0;
    return speedB - speedA; // Higher speed = lower min/km = better pace at top
  });

  const visibleActivities = sortedAndFiltered.slice(0, feedLimit);

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
            Link your Strava account to automatically import runs, rides, and walks into LiftLog. Your activities will appear in History and feed the Run Analysis.
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
        {/* ── Cardio Journey Progress ── */}
        <CardioJourney
          bestPaceMinKm={activities.length > 0
            ? Math.min(...activities
                .filter(a => a.average_speed > 0)
                .map(a => 1000 / a.average_speed / 60)
                .filter(p => isFinite(p))
              ) || null
            : null
          }
        />

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
            {visibleActivities.length === 0 ? (
              <div className="text-center text-neutral-500 text-xs font-bold uppercase tracking-wider py-10">
                No activities yet — tap Sync
              </div>
            ) : (
              <>
                {visibleActivities.map((act) => {
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
                })}
                {feedLimit < sortedAndFiltered.length && (
                  <button
                    onClick={() => setFeedLimit((prev) => prev + 5)}
                    className="w-full py-4 text-center text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
                  >
                    Show More
                  </button>
                )}
              </>
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

        {/* ── Daily Reminders ── */}
        <DailyReminders />
      </div>
    </div>
  );
}
