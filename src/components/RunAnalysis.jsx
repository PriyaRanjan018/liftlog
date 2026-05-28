// src/components/RunAnalysis.jsx
// "How was my run?" — Brutal honest assessment card with goal progress
import { useMemo } from 'react';
import { speedToMinPerKm, getPaceTier, minKmToDisplay } from '../lib/strava';

// The 4 pace tiers on the spectrum
const PACE_TIERS = [
  { label: 'Casual Walk', minKm: 14, color: '#64748b' },
  { label: 'Brisk Walk', minKm: 11, color: '#94a3b8' },
  { label: 'Light Jog', minKm: 8, color: '#f97316' },
  { label: 'Average Runner', minKm: 5.5, color: '#f59e0b' },
  { label: 'MA Cardio Base', minKm: 5, color: '#10b981' },
];

// Goals in ascending difficulty order
const RUNNING_GOALS = [
  {
    id: 'light_jog',
    label: 'Light Jog',
    targetPace: 9.0,
    targetDist: 5.0,
    color: '#f97316',
    description: 'Stop walking — jog the whole 5k',
  },
  {
    id: 'avg_runner',
    label: 'Average Runner',
    targetPace: 6.0,
    targetDist: 5.0,
    color: '#f59e0b',
    description: '5km in 30 min — minimum for real cardio',
  },
  {
    id: 'ma_base',
    label: 'MA Cardio Base',
    targetPace: 5.0,
    targetDist: 5.0,
    color: '#10b981',
    description: 'Sub 5:00/km — ready for MA sparring rounds',
  },
];

// Get the position % on the 15→5 min/km scale (clamped)
function paceToPercent(minKm) {
  const MIN = 15;
  const MAX = 4.5;
  const clamped = Math.max(MAX, Math.min(MIN, minKm));
  return ((MIN - clamped) / (MIN - MAX)) * 100;
}

// Calculate progress toward a pace goal as a percentage
function paceProgressPercent(currentPace, targetPace) {
  // currentPace=15 means 0%, currentPace=targetPace means 100%
  const startPace = 15; // worst reference pace
  const total = startPace - targetPace;
  const done = startPace - currentPace;
  return Math.min(100, Math.max(0, (done / total) * 100));
}

export default function RunAnalysis({ activity }) {
  const paceMinKm = useMemo(() => {
    if (!activity?.average_speed) return null;
    return 1000 / activity.average_speed / 60;
  }, [activity?.average_speed]);

  if (!activity || !paceMinKm) return null;

  const distKm = activity.distance / 1000;
  const tier = getPaceTier(paceMinKm);
  const paceDisplay = speedToMinPerKm(activity.average_speed);
  const posPercent = paceToPercent(paceMinKm);

  // Which goal is the next one to achieve?
  const nextGoal = RUNNING_GOALS.find((g) => paceMinKm > g.targetPace) || null;

  // Time it would take at current pace for 5km vs goal
  const currentTime5km = paceMinKm * 5; // minutes
  const savedMinutes = nextGoal ? currentTime5km - nextGoal.targetPace * 5 : 0;

  return (
    <div className="bg-[#121212] border border-neutral-900 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-900/60 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-[60px] opacity-15 pointer-events-none"
          style={{ backgroundColor: tier.color }}
        />
        <div className="text-[9px] font-black text-neutral-500 tracking-widest uppercase mb-1">
          Run Analysis
        </div>
        <div className="text-lg font-black text-white truncate pr-12">{activity.name}</div>
        <div className="text-[10px] text-neutral-500 font-bold mt-0.5">
          {new Date(activity.start_date).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-900 border-b border-neutral-900">
        {[
          { label: 'Distance', value: `${distKm.toFixed(2)}`, unit: 'km' },
          { label: 'Pace', value: paceDisplay, unit: 'min/km' },
          {
            label: 'Time',
            value: (() => {
              const s = activity.moving_time;
              const m = Math.floor(s / 60);
              const ss = s % 60;
              return `${m}:${String(ss).padStart(2, '0')}`;
            })(),
            unit: 'min',
          },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-3.5 text-center">
            <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">
              {stat.label}
            </div>
            <div className="text-xl font-black text-white leading-none font-display">
              {stat.value}
            </div>
            <div className="text-[9px] text-neutral-600 font-bold">{stat.unit}</div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* ── Pace Spectrum ── */}
        <div>
          <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2.5">
            <span>Walk</span>
            <span>Where you are</span>
            <span>🥋 MA</span>
          </div>

          {/* The gradient bar */}
          <div className="relative h-4 rounded-full overflow-visible bg-neutral-950 border border-neutral-900">
            {/* Gradient fill */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, #64748b 0%, #94a3b8 20%, #f97316 45%, #f59e0b 70%, #10b981 100%)',
                opacity: 0.35,
              }}
            />

            {/* Goal markers */}
            {RUNNING_GOALS.map((g) => (
              <div
                key={g.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${paceToPercent(g.targetPace)}%` }}
              >
                <div
                  className="w-1 h-4 rounded-sm opacity-60"
                  style={{ backgroundColor: g.color }}
                />
              </div>
            ))}

            {/* Your position indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-700"
              style={{ left: `${posPercent}%` }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-[#0a0a0a] shadow-lg flex items-center justify-center text-[10px]"
                style={{
                  backgroundColor: tier.color,
                  boxShadow: `0 0 12px ${tier.color}80`,
                }}
              >
                {tier.emoji}
              </div>
            </div>
          </div>

          {/* Tier labels below bar */}
          <div className="flex justify-between mt-1.5">
            {RUNNING_GOALS.map((g) => (
              <div
                key={g.id}
                className="text-[8px] font-black uppercase tracking-widest"
                style={{
                  color: paceMinKm <= g.targetPace ? g.color : '#444',
                  textAlign: 'center',
                  width: '33%',
                }}
              >
                {g.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Brutal Honest Verdict ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            backgroundColor: `${tier.color}08`,
            borderColor: `${tier.color}25`,
          }}
        >
          <div
            className="text-[9px] font-black uppercase tracking-widest mb-1"
            style={{ color: tier.color }}
          >
            {tier.emoji} Verdict
          </div>
          <div className="text-sm font-black text-white mb-2">
            You&apos;re at <span style={{ color: tier.color }}>{tier.label}</span> pace
            ({paceDisplay} min/km)
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            {paceMinKm > 12
              ? "That's a slow stroll. Nothing wrong with starting — but be honest with yourself: this is not cardio training."
              : paceMinKm > 9
              ? "A brisk walk. Good for recovery days, but won't build the cardio base you need. Push to a jog."
              : paceMinKm > 7
              ? "Light jog territory. You're building real cardio now. Keep the pace, extend the distance."
              : paceMinKm > 6
              ? "Solid runner pace. This is what average fit people maintain. Push for sub-6 to hit MA-ready."
              : paceMinKm > 5
              ? "Strong pace. You're runner-level. One more push to sub-5 and your cardio base is built."
              : "Sub-5 pace. MA cardio base unlocked. A sparring round won't gas you out anymore. 🥋"}
          </p>
        </div>

        {/* ── Goal Progress Cards ── */}
        <div>
          <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3">
            Progress Toward Goals
          </div>
          <div className="space-y-3">
            {RUNNING_GOALS.map((goal) => {
              const achieved = paceMinKm <= goal.targetPace;
              const progress = paceProgressPercent(paceMinKm, goal.targetPace);
              const paceGap = paceMinKm - goal.targetPace;
              const timeGapMin = paceGap * 5; // minutes saved over 5km

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: achieved ? `${goal.color}10` : '#0d0d0d',
                    borderColor: achieved ? `${goal.color}40` : '#1c1c1c',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div
                        className="text-xs font-black"
                        style={{ color: achieved ? goal.color : '#888' }}
                      >
                        {achieved ? '✅ ' : ''}
                        {goal.label}
                      </div>
                      <div className="text-[9px] text-neutral-600 mt-0.5">{goal.description}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div
                        className="text-sm font-black font-display leading-none"
                        style={{ color: achieved ? goal.color : '#555' }}
                      >
                        {minKmToDisplay(goal.targetPace)}
                      </div>
                      <div className="text-[9px] text-neutral-600 font-bold">min/km</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color,
                        boxShadow: achieved ? `0 0 8px ${goal.color}60` : 'none',
                      }}
                    />
                  </div>

                  {!achieved && (
                    <div className="mt-1.5 text-[9px] text-neutral-600 font-bold">
                      {Math.round(progress)}% there · Need to cut{' '}
                      <span className="text-neutral-400">
                        {paceGap.toFixed(1)} min/km ({timeGapMin.toFixed(0)} min off 5km time)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Next Action ── */}
        {nextGoal && (
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <div className="text-[10px] font-black text-neutral-300 mb-1">Next Milestone</div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                To hit{' '}
                <span className="font-black" style={{ color: nextGoal.color }}>
                  {nextGoal.label}
                </span>{' '}
                ({minKmToDisplay(nextGoal.targetPace)} min/km), you need to shave{' '}
                <strong className="text-neutral-300">
                  {(paceMinKm - nextGoal.targetPace).toFixed(1)} min/km
                </strong>{' '}
                off your pace. That saves you{' '}
                <strong className="text-neutral-300">
                  {((paceMinKm - nextGoal.targetPace) * 5).toFixed(0)} minutes
                </strong>{' '}
                over a 5km.
                <br />
                <span className="text-neutral-600">
                  Every Saturday athletic day — push pace, not distance.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
