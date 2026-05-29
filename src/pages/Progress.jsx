import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getWeekDates } from '../lib/calculations';
import { days, MAJOR_LIFTS } from '../data/split';
import ProgressBar from '../components/ProgressBar';
import ChartLine from '../components/ChartLine';
import { getCurrentTrainingWeek, getDeadliftVariation, getPullUpVariation, getStageColor } from '../lib/progression';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function Progress() {
  const [view, setView] = useState('week');
  const [weekData, setWeekData] = useState(null);
  const [liftData, setLiftData] = useState({});
  const [personalRecords, setPersonalRecords] = useState([]);
  const [volumeChart, setVolumeChart] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingWeek, setTrainingWeek] = useState(1);

  useEffect(() => {
    loadWeekData();
    loadPersonalRecords();
    loadMonthlyVolume();
    getCurrentTrainingWeek().then(setTrainingWeek);
  }, []);

  useEffect(() => {
    if (view === 'week') loadWeekData();
  }, [view]);

  const loadWeekData = async () => {
    setLoading(true);
    const thisWeekDates = getWeekDates(0);
    const lastWeekDates = getWeekDates(-1);

    // Sessions this week and last week
    const allDates = [...thisWeekDates, ...lastWeekDates];
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('*, exercise_sets(*)')
      .in('session_date', allDates);

    const sessMap = {};
    (sessions || []).forEach((s) => {
      sessMap[s.session_date] = s;
    });

    // Weekly completion
    const nonRestDays = thisWeekDates.filter((d, i) => {
      const dayObj = days[i];
      return dayObj && dayObj.dayType !== 'rest' && dayObj.dayType !== 'active_recovery';
    });
    const completedDays = nonRestDays.filter((d) => sessMap[d]?.completed).length;
    const completionPct = nonRestDays.length > 0
      ? (completedDays / nonRestDays.length) * 100
      : 0;

    // Per-day status
    const dayStatuses = thisWeekDates.map((date, i) => {
      const dayObj = days[i] || {};
      const s = sessMap[date];
      if (dayObj.dayType === 'rest') return { day: dayObj.day, icon: '/assets/icons/icon_rest.webp', status: 'rest' };
      if (dayObj.dayType === 'active_recovery') return { day: dayObj.day, icon: '/assets/icons/icon_recovery.webp', status: 'recovery' };
      if (s?.completed) return { day: dayObj.day, icon: '/assets/icons/icon_done.webp', status: 'done' };
      const today = new Date().toISOString().split('T')[0];
      if (date < today) return { day: dayObj.day, icon: '/assets/icons/icon_missed.webp', status: 'missed' };
      return { day: dayObj.day, icon: '/assets/icons/icon_upcoming.webp', status: 'upcoming' };
    });

    // Major lift comparison (this week vs last week)
    const liftComparisons = {};
    for (const lift of MAJOR_LIFTS) {
      let thisBest = 0;
      let lastBest = 0;

      thisWeekDates.forEach((date) => {
        const s = sessMap[date];
        if (s?.exercise_sets) {
          s.exercise_sets
            .filter((es) => es.exercise_name === lift && es.weight_kg)
            .forEach((es) => {
              if (es.weight_kg > thisBest) thisBest = parseFloat(es.weight_kg);
            });
        }
      });

      lastWeekDates.forEach((date) => {
        const s = sessMap[date];
        if (s?.exercise_sets) {
          s.exercise_sets
            .filter((es) => es.exercise_name === lift && es.weight_kg)
            .forEach((es) => {
              if (es.weight_kg > lastBest) lastBest = parseFloat(es.weight_kg);
            });
        }
      });

      liftComparisons[lift] = { thisBest, lastBest };
    }

    setWeekData({ completedDays, nonRestDays: nonRestDays.length, completionPct, dayStatuses });
    setLiftData(liftComparisons);
    setLoading(false);
  };

  const loadPersonalRecords = async () => {
    const { data } = await supabase
      .from('personal_records')
      .select('*')
      .in('exercise_name', MAJOR_LIFTS);
    setPersonalRecords(data || []);
  };

  const loadMonthlyVolume = async () => {
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const dates = getWeekDates(-w);
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .in('session_date', dates)
        .eq('completed', true);

      if (!sessions || sessions.length === 0) {
        weeks.push({ label: `W-${w}`, value: 0 });
        continue;
      }

      const sessionIds = sessions.map((s) => s.id);
      const { data: sets } = await supabase
        .from('exercise_sets')
        .select('weight_kg, reps_done')
        .in('session_id', sessionIds)
        .eq('is_completed', true);

      const vol = (sets || []).reduce((sum, s) => sum + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps_done) || 0), 0);
      const weekLabel = w === 0 ? 'This Week' : `${w}w Ago`;
      weeks.push({ label: weekLabel, value: Math.round(vol) });
    }
    setVolumeChart(weeks);
  };

  const loadExerciseHistory = async (exerciseName) => {
    if (selectedExercise === exerciseName) {
      setSelectedExercise(null);
      setExerciseHistory([]);
      return;
    }
    setSelectedExercise(exerciseName);

    const { data } = await supabase
      .from('exercise_sets')
      .select('weight_kg, reps_done, created_at, session_id')
      .eq('exercise_name', exerciseName)
      .eq('is_completed', true)
      .not('weight_kg', 'is', null)
      .order('created_at', { ascending: true })
      .limit(24);

    const bySession = {};
    (data || []).forEach((s) => {
      if (!bySession[s.session_id] || s.weight_kg > bySession[s.session_id].weight_kg) {
        bySession[s.session_id] = s;
      }
    });

    const sorted = Object.values(bySession)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-8)
      .map((s) => ({
        label: new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: parseFloat(s.weight_kg),
      }));

    setExerciseHistory(sorted);
  };

  const trendIcon = (thisBest, lastBest) => {
    if (!thisBest && !lastBest) return { icon: '—', color: '#666', bg: 'rgba(255,255,255,0.03)' };
    if (!lastBest) return { icon: '↑ NEW', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (thisBest > lastBest) return { icon: `↑ +${(thisBest - lastBest).toFixed(1)}kg`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (thisBest < lastBest) return { icon: `↓ ${(thisBest - lastBest).toFixed(1)}kg`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    return { icon: '→', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  };

  return (
    <div className="min-h-screen bg-[#060606] pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b border-neutral-900/60 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-orange-500/10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display">Progress</h1>
            <p className="text-neutral-500 text-xs mt-1">Strength progression & training metrics</p>
          </div>
          {/* Week / Month toggler */}
          <div className="flex bg-neutral-950 border border-neutral-900 rounded-2xl p-1 shadow-inner">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                id={`progress-view-${v}`}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  view === v
                    ? 'bg-neutral-800 text-white shadow'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* WEEK VIEW */}
        {view === 'week' && (
          <>
            {loading ? (
              <div className="text-center text-neutral-500 py-8 text-xs font-bold uppercase tracking-wider">Loading metrics...</div>
            ) : (
              <>
                {/* ─── PROGRESSION TRACKER ─── */}
                {(() => {
                  const dl = getDeadliftVariation(trainingWeek);
                  const pu = getPullUpVariation(trainingWeek);
                  const paths = [
                    {
                      label: 'DEADLIFT PATH',
                      ex: dl,
                      nextLabel: dl._progression.unlockWeek
                        ? `Week ${dl._progression.unlockWeek} (${dl._progression.unlockWeek - trainingWeek} week${dl._progression.unlockWeek - trainingWeek !== 1 ? 's' : ''} away)`
                        : 'Max stage reached 🏆',
                    },
                    {
                      label: 'PULL-UP PATH',
                      ex: pu,
                      nextLabel: pu._progression.unlockWeek
                        ? `Week ${pu._progression.unlockWeek} (${pu._progression.unlockWeek - trainingWeek} week${pu._progression.unlockWeek - trainingWeek !== 1 ? 's' : ''} away)`
                        : 'Max stage reached 🏆',
                    },
                  ];
                  return (
                    <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase">
                          My Progression Tracker
                        </div>
                        <div className="text-[9px] font-black px-2 py-1 rounded-lg bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase tracking-wider">
                          Week {trainingWeek}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {paths.map(({ label, ex, nextLabel }) => {
                          const p = ex._progression;
                          const color = getStageColor(p.stage, p.totalStages);
                          const pct = Math.round((p.stage / p.totalStages) * 100);
                          const isMaxed = p.stage === p.totalStages;
                          return (
                            <div key={label} className="border-b border-neutral-900 last:border-0 pb-4 last:pb-0">
                              <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">{label}</div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-extrabold text-white">{ex.name}</div>
                                <span
                                  className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider"
                                  style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                                >
                                  Stage {p.stage}/{p.totalStages}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900 mb-1.5">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${color}70, ${color})`,
                                    boxShadow: `0 0 8px ${color}40`,
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-bold">
                                <span style={{ color }}>{p.stageLabel}</span>
                                {!isMaxed && (
                                  <span className="text-neutral-600">Next unlock: {nextLabel}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-900 flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <p className="text-[10px] text-neutral-500 leading-relaxed">
                          Training weeks count only when you tap <strong className="text-neutral-300">Complete Workout</strong>. Skipped weeks don't advance your stage.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Weekly completion */}
                <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                    Current Week Completion
                  </div>
                  <div className="flex items-end justify-between mb-3.5">
                    <span className="text-3xl font-black text-white font-display leading-none">
                      {weekData?.completedDays} <span className="text-neutral-600 text-base font-normal">/ {weekData?.nonRestDays}</span>
                    </span>
                    <span className="text-neutral-400 text-xs font-bold uppercase tracking-wide">Sessions Cleared</span>
                  </div>
                  <ProgressBar
                    percent={weekData?.completionPct || 0}
                    label={`${Math.round(weekData?.completionPct || 0)}% completed`}
                  />
                </div>

                {/* Day status row */}
                <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                    Weekly Calendar Timeline
                  </div>
                  <div className="flex justify-between">
                    {(weekData?.dayStatuses || []).map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <span className="text-lg w-9 h-9 flex items-center justify-center bg-neutral-950 border border-neutral-900 rounded-xl filter drop-shadow-sm">
                          {d.icon.includes('/assets/icons/') ? (
                            <img src={d.icon} alt={d.status} className="w-5 h-5 object-contain" />
                          ) : (
                            d.icon
                          )}
                        </span>
                        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compound Lifts Comparisons */}
                <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
                  <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                    Strength Tracker (This vs Last Week)
                  </div>
                  <div className="space-y-4">
                    {MAJOR_LIFTS.map((lift) => {
                      const data = liftData[lift] || { thisBest: 0, lastBest: 0 };
                      const trend = trendIcon(data.thisBest, data.lastBest);
                      const isExpanded = selectedExercise === lift;

                      return (
                        <div key={lift} className="border-b border-neutral-900 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              id={`lift-${lift.replace(/\s+/g, '-')}`}
                              onClick={() => loadExerciseHistory(lift)}
                              className="text-sm font-extrabold text-white hover:text-[#e85d04] transition-colors text-left"
                            >
                              {lift} <span className="text-[10px] text-neutral-600 font-bold ml-1">▾</span>
                            </button>
                            <div className="flex items-center gap-2">
                              {data.thisBest > 0 && (
                                <span className="text-xs text-white font-black font-display">{data.thisBest} kg</span>
                              )}
                              <span 
                                className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider"
                                style={{ color: trend.color, backgroundColor: trend.bg }}
                              >
                                {trend.icon}
                              </span>
                            </div>
                          </div>

                          {data.thisBest > 0 && (
                            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900/60 p-0.5">
                              <div
                                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-600 to-amber-500"
                                style={{
                                  width: `${Math.min((data.thisBest / 160) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          )}

                          {isExpanded && exerciseHistory.length > 0 && (
                            <div className="mt-4 bg-neutral-950 border border-neutral-900 rounded-2xl p-4 animate-fade-in">
                              <ChartLine data={exerciseHistory} color="#e85d04" unit="kg" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* MONTH VIEW */}
        {view === 'month' && (
          <>
            {/* Weekly volume bar chart */}
            <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                Total Weekly Volume (kg)
              </div>
              {volumeChart.some((w) => w.value > 0) ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={volumeChart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                    <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#121212', border: '1px solid #222', borderRadius: 16, fontSize: 11, fontWeight: 'bold' }}
                      formatter={(v) => [`${Math.round(v).toLocaleString()} kg`, 'Workout Volume']}
                    />
                    <Bar dataKey="value" fill="url(#colorVolume)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e85d04" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#d9480f" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-neutral-500 text-xs py-8 font-bold uppercase tracking-wider">No logged sessions in past month</div>
              )}
            </div>

            {/* Personal Records */}
            <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-5 shadow-sm">
              <div className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                👑 personal record matrix
              </div>
              {personalRecords.length === 0 ? (
                <p className="text-neutral-500 text-xs text-center py-6 font-bold uppercase tracking-wider">No PR metrics recorded yet</p>
              ) : (
                <div className="space-y-2.5">
                  {MAJOR_LIFTS.map((lift) => {
                    const pr = personalRecords.find((p) => p.exercise_name === lift);
                    if (!pr) return (
                      <div key={lift} className="flex items-center justify-between py-3 border-b border-neutral-900/60 last:border-0">
                        <span className="text-xs font-bold text-neutral-500">{lift}</span>
                        <span className="text-[9px] bg-neutral-950 text-neutral-600 border border-neutral-900 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">No Entry</span>
                      </div>
                    );
                    const isExpanded = selectedExercise === lift;

                    return (
                      <div key={lift} className="border-b border-neutral-900 last:border-0 pb-3 last:pb-0">
                        <button
                          id={`pr-${lift.replace(/\s+/g, '-')}`}
                          onClick={() => loadExerciseHistory(lift)}
                          className="w-full flex items-center justify-between hover:bg-neutral-950 rounded-2xl p-2 -mx-2 transition-all"
                        >
                          <div className="text-left">
                            <div className="text-sm font-extrabold text-white">{lift}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              Cleared on {new Date(pr.achieved_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-[#e85d04] font-display">
                              {pr.record_weight} kg
                            </div>
                            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">× {pr.record_reps} Reps</div>
                          </div>
                        </button>
                        {isExpanded && exerciseHistory.length > 0 && (
                          <div className="mt-3 bg-neutral-950 border border-neutral-900 rounded-2xl p-4 animate-fade-in">
                            <ChartLine data={exerciseHistory} color="#e85d04" unit="kg" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Exercises */}
            <div className="space-y-2">
              {MAJOR_LIFTS.map((lift) => {
                const isExpanded = selectedExercise === lift;
                return (
                  <div key={lift}>
                    {!personalRecords.some(p => p.exercise_name === lift) && (
                      <>
                        <button
                          id={`month-lift-${lift.replace(/\s+/g, '-')}`}
                          onClick={() => loadExerciseHistory(lift)}
                          className="w-full flex items-center justify-between bg-[#121212] border border-neutral-900 hover:border-neutral-800 rounded-2xl px-4.5 py-4 text-left transition-all"
                        >
                          <span className="text-xs font-bold text-neutral-400">
                            {lift} Progression
                          </span>
                          <span className="text-xs text-neutral-500">▾</span>
                        </button>
                        {isExpanded && exerciseHistory.length > 0 && (
                          <div className="mt-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-4 animate-fade-in">
                            <ChartLine data={exerciseHistory} color="#e85d04" unit="kg" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
