import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateVolume, formatVolume, calculateStreak } from '../lib/calculations';
import Calendar from '../components/Calendar';
import { days } from '../data/split';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const displayMonth = new Date();
  displayMonth.setMonth(displayMonth.getMonth() + monthOffset);

  useEffect(() => {
    loadSessions();
    calculateStreak().then(setStreak);
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('session_date', { ascending: false });
    setSessions(data || []);
    setRecentSessions((data || []).slice(0, 7));
    setLoading(false);
  };

  const handleDayClick = async (dateStr) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setSelectedSessionData(null);
      return;
    }
    setSelectedDate(dateStr);

    const session = sessions.find((s) => s.session_date === dateStr);
    if (!session) {
      setSelectedSessionData(null);
      return;
    }

    // Load sets
    const { data: sets } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_id', session.id)
      .order('exercise_name')
      .order('set_number');

    // Load exercise completions
    const { data: completions } = await supabase
      .from('exercise_completions')
      .select('exercise_name')
      .eq('session_id', session.id);

    // Load Strava activities for this date — IST day window (UTC+5:30)
    const dayStart = new Date(`${dateStr}T00:00:00+05:30`).toISOString();
    const dayEnd   = new Date(`${dateStr}T23:59:59+05:30`).toISOString();
    const { data: stravaActivities } = await supabase
      .from('strava_activities')
      .select('name, sport_type, distance, moving_time, total_elevation_gain')
      .gte('start_date', dayStart)
      .lte('start_date', dayEnd);

    const vol = calculateVolume(sets || []);
    setSelectedSessionData({
      session,
      sets: sets || [],
      volume: vol,
      completedExercises: (completions || []).map(c => c.exercise_name),
      stravaActivities: stravaActivities || [],
    });
  };

  const getDayInfo = (dayType) => {
    return days.find((d) => d.dayType === dayType) || days[0];
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-[#060606] pb-32">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 border-b border-neutral-900/60 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-emerald-500/10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display">History</h1>
            <p className="text-neutral-500 text-xs mt-1">Review your logged workouts & consistency</p>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-3.5 py-2 shadow-sm">
            <span>🔥</span>
            <span className="font-extrabold text-white text-sm">{streak}</span>
            <span className="text-[#666] text-xs">streak</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Calendar */}
        <Calendar
          sessions={sessions}
          onDayClick={handleDayClick}
          selectedDate={selectedDate}
          month={displayMonth}
          onMonthChange={(delta) => setMonthOffset((o) => o + delta)}
        />

        {/* Selected Session detail */}
        {selectedSessionData && (
          <div className="bg-[#121212] border border-neutral-900 rounded-3xl overflow-hidden animate-fade-in shadow-lg">
            {/* Session header with volume + run stats */}
            <div
              className="p-5 border-b border-neutral-900/80"
              style={{
                background: `linear-gradient(135deg, ${getDayInfo(selectedSessionData.session.day_type).color}10 0%, #121212 90%)`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div
                    className="text-[10px] font-black tracking-widest uppercase mb-1"
                    style={{ color: getDayInfo(selectedSessionData.session.day_type).color }}
                  >
                    {formatDate(selectedSessionData.session.session_date)}
                  </div>
                  <div className="text-xl font-black text-white font-display">
                    {getDayInfo(selectedSessionData.session.day_type).label}
                  </div>
                  {selectedSessionData.session.notes && (
                    <div className="text-[10px] text-neutral-500 mt-1 font-medium">
                      {selectedSessionData.session.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-neutral-500 tracking-wider uppercase mb-1">
                    Total Volume
                  </div>
                  <div className="text-xl font-black text-white font-display">
                    {formatVolume(selectedSessionData.volume)}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {selectedSessionData.completedExercises.length} exercises done
                  </div>
                </div>
              </div>

              {/* Strava run/walk row */}
              {selectedSessionData.stravaActivities.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedSessionData.stravaActivities.map((act, i) => {
                    const distKm = (act.distance / 1000).toFixed(2);
                    const mins = Math.floor(act.moving_time / 60);
                    const secs = act.moving_time % 60;
                    const pace = act.distance > 0
                      ? `${Math.floor(act.moving_time / (act.distance / 1000) / 60)}:${String(Math.round(act.moving_time / (act.distance / 1000) % 60)).padStart(2, '0')} /km`
                      : null;
                    const isRun = act.sport_type?.toLowerCase().includes('run');
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-[#0d1520] border border-[#0ea5e9]/20 rounded-2xl px-4 py-3"
                      >
                        <span className="text-xl">{isRun ? '🏃' : '🚶'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest">
                            {act.sport_type} — {act.name}
                          </div>
                          <div className="text-xs text-neutral-300 font-bold mt-0.5">
                            {distKm} km · {mins}m {secs}s
                            {pace && <span className="text-neutral-500 ml-2 font-medium">{pace} pace</span>}
                          </div>
                        </div>
                        {act.total_elevation_gain > 0 && (
                          <div className="text-right">
                            <div className="text-[10px] text-neutral-500 font-black tracking-wider">ELEV</div>
                            <div className="text-xs font-black text-white">{Math.round(act.total_elevation_gain)}m</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Exercise sets breakdown */}
            <div className="p-5">
              {selectedSessionData.sets.length === 0 ? (
                <p className="text-neutral-500 text-xs text-center py-6 font-bold uppercase tracking-wider">
                  No logged sets found for session
                </p>
              ) : (
                <ExerciseSetsView
                  sets={selectedSessionData.sets}
                  completedExercises={selectedSessionData.completedExercises}
                />
              )}
            </div>
          </div>
        )}

        {selectedDate && !selectedSessionData && (
          <div className="bg-[#121212] border border-neutral-900 rounded-3xl p-6 text-center text-neutral-500 text-xs font-bold uppercase tracking-widest shadow-inner">
            No session logged on {formatDate(selectedDate)}
          </div>
        )}

        {/* Recent sessions tracker */}
        <div>
          <h2 className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-3.5 px-1">
            Recent Training Runs
          </h2>

          {loading ? (
            <div className="text-center text-neutral-500 py-8 text-xs font-bold uppercase tracking-wider">Loading history...</div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center text-neutral-500 py-8 text-xs font-bold uppercase tracking-wider">
              No recorded sessions. Log a workout to start!
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const dayInfo = getDayInfo(s.day_type);
                return (
                  <button
                    key={s.id}
                    id={`session-${s.id}`}
                    onClick={() => handleDayClick(s.session_date)}
                    className="w-full bg-[#121212] border border-neutral-900/80 rounded-2xl p-4 flex items-center gap-4 hover:border-neutral-800 transition-all duration-200 text-left"
                  >
                    <img src={dayInfo.icon} alt={dayInfo.label} className="w-8 h-8 object-contain filter drop-shadow-md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider leading-none mb-1.5">
                        {formatDate(s.session_date)}
                      </div>
                      <div className="font-extrabold text-sm tracking-tight" style={{ color: dayInfo.color }}>
                        {dayInfo.label}
                      </div>
                    </div>
                    <div className="text-right">
                      {s.completed ? (
                        <span className="text-[9px] bg-[#0d1a0d] border border-[#059669]/30 text-[#059669] rounded-xl px-2.5 py-1 font-black uppercase tracking-wider">
                          ✓ Cleared
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#1a1a0d] border border-amber-500/30 text-amber-500 rounded-xl px-2.5 py-1 font-black uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Group sets by exercise, show per-exercise completion status
function ExerciseSetsView({ sets, completedExercises = [] }) {
  const byExercise = {};
  sets.forEach((s) => {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
    byExercise[s.exercise_name].push(s);
  });

  return (
    <div className="space-y-4">
      {Object.entries(byExercise).map(([name, exSets]) => {
        const isDone = completedExercises.includes(name);
        const completedSets = exSets.filter(s => s.is_completed).length;
        const vol = exSets.reduce((t, s) => t + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps_done) || 0), 0);

        return (
          <div
            key={name}
            className={`border-b border-neutral-900 last:border-0 pb-4 last:pb-0`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">{name}</span>
                {isDone && (
                  <span className="text-[9px] bg-[#0d1a0d] border border-[#059669]/30 text-[#059669] rounded-lg px-2 py-0.5 font-black uppercase tracking-wider">
                    🔒 Done
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-[9px] text-neutral-600 font-black uppercase tracking-wider">{completedSets}/{exSets.length} sets</div>
                {vol > 0 && (
                  <div className="text-[10px] font-black text-neutral-400">{Math.round(vol).toLocaleString()} kg</div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              {exSets.map((set, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 text-xs px-3.5 py-2.5 rounded-xl border ${
                    set.is_completed
                      ? 'bg-[#0d1a0d]/60 border-[#059669]/20'
                      : 'bg-neutral-950 border-neutral-900'
                  }`}
                >
                  <span className="text-neutral-500 font-extrabold text-[10px] uppercase w-12">Set {set.set_number}</span>
                  {set.weight_kg && (
                    <span className="text-white font-extrabold font-display">{set.weight_kg} kg</span>
                  )}
                  {set.reps_done && (
                    <span className="text-neutral-400 font-bold">× {set.reps_done} reps</span>
                  )}
                  {set.duration_sec && (
                    <span className="text-neutral-400 font-bold">{set.duration_sec} sec</span>
                  )}
                  <span className="ml-auto text-xs">{set.is_completed ? '✅' : '⬜'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
