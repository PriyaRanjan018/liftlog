import { useState, useEffect, useRef } from 'react';
import { getDayForDate, getDayIndex, days } from '../data/split';
import { supabase } from '../lib/supabase';
import { calculateStreak, checkAndUpdatePRs } from '../lib/calculations';
import ExerciseCard from '../components/ExerciseCard';

// Array of motivating training quotes to inspire the user
const MOTIVATIONAL_QUOTES = [
  "No shortcuts. Just consistency and pure effort. Let's get it. ⚡",
  "Progressive overload is the law. Add that 2.5kg. Speak with action. 🏋️‍♂️",
  "Sweat equity pays the highest interest. Do the work today. 🔥",
  "Show up. Especially on the days you don't feel like it. Master yourself. 🥊",
  "The only bad workout is the one that didn't happen. Let's work. 🏆",
  "Master the compounds, conquer the day. Bench, Squat, Deadlift. 👑",
  "Your future self is waiting. Build the machine. 🦾",
];

// Toast notification component
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-[#059669] text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-xl border border-[#34d399]/50 flex items-center gap-2 glow-green">
        <span>🏆</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function Today() {
  const todayData = getDayForDate();
  const todayIdx = getDayIndex();
  const todayStr = new Date().toISOString().split('T')[0];

  // Swipe state: which day index to show (default today)
  const [viewIdx, setViewIdx] = useState(todayIdx);
  const viewDay = days[viewIdx];
  const isToday = viewIdx === todayIdx;

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [sessionSets, setSessionSets] = useState([]);
  const [dailyQuote, setDailyQuote] = useState('');

  // Touch swipe handling
  const touchStartX = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isToday) loadTodaySession();
    calculateStreak().then(setStreak);
    // Pick a quote based on current day of month so it's consistent all day
    const dayOfMonth = new Date().getDate();
    setDailyQuote(MOTIVATIONAL_QUOTES[dayOfMonth % MOTIVATIONAL_QUOTES.length]);
  }, [viewIdx]);

  const loadTodaySession = async () => {
    setSessionLoading(true);
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('session_date', todayStr)
      .single();
    setSession(data || null);
    setSessionLoading(false);
  };

  const createSession = async () => {
    if (session) {
      setToast('Session already exists for today!');
      return;
    }
    const { data } = await supabase
      .from('workout_sessions')
      .insert({
        session_date: todayStr,
        day_type: todayData.dayType,
        completed: false,
      })
      .select('*')
      .single();
    setSession(data);
  };

  const completeWorkout = async () => {
    if (!session) return;
    setCompleting(true);

    // Load all sets for this session
    const { data: sets } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_id', session.id);

    // Check for PRs
    const newPRs = await checkAndUpdatePRs(session.id, sets || []);

    // Mark session complete
    await supabase
      .from('workout_sessions')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', session.id);

    setSession((s) => ({ ...s, completed: true }));

    if (newPRs.length > 0) {
      setToast(`NEW PR! ${newPRs[0].exerciseName}: ${newPRs[0].weight}kg × ${newPRs[0].reps}`);
    } else {
      setToast('Workout completed! Keep building!');
    }

    calculateStreak().then(setStreak);
    setCompleting(false);
  };

  const resetWorkout = async () => {
    if (!session) return;
    const confirmReset = window.confirm(
      "Are you sure you want to reset today's session? This will permanently delete all sets logged today."
    );
    if (!confirmReset) return;

    try {
      // 1. Delete personal records achieved in this session
      await supabase.from('personal_records').delete().eq('session_id', session.id);
      
      // 2. Delete the session (cascades to exercise_sets)
      await supabase.from('workout_sessions').delete().eq('id', session.id);
      
      // 3. Reset local states
      setSession(null);
      setSessionSets([]);
      setToast('Workout reset successfully!');
      
      // 4. Recalculate streak
      const newStreak = await calculateStreak();
      setStreak(newStreak);
    } catch (err) {
      console.error('Error resetting session:', err);
      alert('Failed to reset session. Please try again.');
    }
  };

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setViewIdx((i) => (i + 1) % 7);
      else setViewIdx((i) => (i - 1 + 7) % 7);
    }
    touchStartX.current = null;
  };

  // REST day screen
  if (viewDay.dayType === 'rest') {
    return (
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen bg-[#060606] flex flex-col items-center justify-between pb-32 pt-12 px-6 relative overflow-hidden"
      >
        {/* Soft atmospheric gradient behind */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#4a5568]/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-3.5 py-2">
              <span>🔥</span>
              <span className="font-extrabold text-white text-sm">{streak}</span>
              <span className="text-[#666] text-xs">day streak</span>
            </div>
            <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1.5 rounded-xl uppercase font-bold tracking-widest">
              Recovery
            </span>
          </div>

          <DaySwiper viewIdx={viewIdx} setViewIdx={setViewIdx} todayIdx={todayIdx} />
        </div>

        <div className="text-center my-auto py-8 animate-fade-in w-full max-w-sm">
          <div className="text-7xl mb-6 filter drop-shadow-[0_10px_15px_rgba(74,85,104,0.3)]">😴</div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-display">REST DAY</h1>
          <p className="text-[#6d7b92] text-xs font-bold tracking-wider uppercase mb-8">Optimal Rebuilding · {viewDay.focus}</p>
          
          <div className="glass-card rounded-3xl p-6 text-left space-y-4 shadow-xl">
            {[
              { icon: '💤', title: 'Deep Sleep', text: 'Target 8 hours — growth hormone peaks during REM.' },
              { icon: '🚶', title: 'Active Flow', text: 'Light 20 min walk to flush metabolic waste.' },
              { icon: '🧘', title: 'Mobility Work', text: '10-15 min stretching: hip flexors & chest.' },
              { icon: '🥚', title: 'Protein Loading', text: 'Aim for 130g+ protein. Muscles grow at rest.' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="text-2xl mt-0.5">{icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight mb-0.5">{title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational quote footer */}
        <div className="text-center max-w-xs text-xs text-neutral-500 italic px-4 mt-4">
          "The recovery is just as important as the workout. Honor your body."
        </div>
      </div>
    );
  }

  // ACTIVE RECOVERY screen
  if (viewDay.dayType === 'active_recovery') {
    return (
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen bg-[#060606] flex flex-col items-center justify-between pb-32 pt-12 px-6 relative overflow-hidden"
      >
        {/* Soft atmospheric gradient behind */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#78716c]/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-3.5 py-2">
              <span>🔥</span>
              <span className="font-extrabold text-white text-sm">{streak}</span>
              <span className="text-[#666] text-xs">day streak</span>
            </div>
            <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1.5 rounded-xl uppercase font-bold tracking-widest">
              Recovery
            </span>
          </div>

          <DaySwiper viewIdx={viewIdx} setViewIdx={setViewIdx} todayIdx={todayIdx} />
        </div>

        <div className="text-center my-auto py-8 animate-fade-in w-full max-w-sm">
          <div className="text-7xl mb-6 filter drop-shadow-[0_10px_15px_rgba(120,113,108,0.3)]">🚶</div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 font-display">ACTIVE RECOVERY</h1>
          <p className="text-[#a8a29e] text-xs font-bold tracking-wider uppercase mb-8">Mobility & Aerobic base · {viewDay.day}</p>
          
          <div className="glass-card rounded-3xl p-6 text-left space-y-4 shadow-xl">
            {[
              { icon: '🏃', title: 'Aerobic Flush', text: '30-40 min light jog (Zone 2) — fat burning & aerobic capacity.' },
              { icon: '🧘', title: 'Static Stretch', text: '20 min full body: hamstrings, hips, and chest openers.' },
              { icon: '🚿', title: 'Vasoconstriction', text: 'Cold shower to reduce systemic inflammation.' },
              { icon: '📋', title: 'Pre-emptive Nutrition', text: 'Plan & prep your meals for the upcoming week.' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="text-2xl mt-0.5">{icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight mb-0.5">{title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational quote footer */}
        <div className="text-center max-w-xs text-xs text-neutral-500 italic px-4 mt-4">
          "Discipline is doing what needs to be done, even when you don't want to."
        </div>
      </div>
    );
  }

  // WORKOUT DAY screen
  const isReadOnly = !isToday;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#060606] pb-32"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${viewDay.color}15 0%, #060606 80%)`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Soft colored glowing backdrop orbed at top right */}
        <div 
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
          style={{ backgroundColor: viewDay.color }}
        />

        {/* Streak + Swiper control */}
        <div className="flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-3.5 py-2 text-sm shadow-md"
          >
            <span>🔥</span>
            <span className="font-extrabold text-white">{streak}</span>
            <span className="text-neutral-500 text-xs">day streak</span>
          </div>

          {isReadOnly ? (
            <span className="text-[10px] bg-neutral-900/80 border border-neutral-800 text-neutral-400 px-3 py-1.5 rounded-xl uppercase font-bold tracking-widest">
              Preview Mode
            </span>
          ) : (
            <span 
              className="text-[10px] border px-3 py-1.5 rounded-xl uppercase font-bold tracking-widest"
              style={{ 
                color: viewDay.color, 
                borderColor: `${viewDay.color}40`,
                backgroundColor: `${viewDay.color}10` 
              }}
            >
              Today
            </span>
          )}
        </div>

        {/* Day label */}
        <div className="mb-6">
          <div className="text-[10px] tracking-widest font-black uppercase mb-1.5" style={{ color: viewDay.color }}>
            {viewDay.day} SPLIT
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white leading-none font-display mb-2 flex items-center gap-2">
            <img src={viewDay.icon} alt={viewDay.label} className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
            <span>{viewDay.label}</span>
          </h1>
          <p className="text-neutral-400 text-sm">{viewDay.focus}</p>
        </div>

        {/* Day swiper dots */}
        <DaySwiper viewIdx={viewIdx} setViewIdx={setViewIdx} todayIdx={todayIdx} />
      </div>

      {/* Motivational message banner */}
      <div className="px-5 mt-5">
        <div className="bg-[#121212] border border-neutral-900 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">💡</span>
          <p className="text-xs text-neutral-400 leading-relaxed italic">
            {dailyQuote}
          </p>
        </div>
      </div>

      {/* Exercise list */}
      <div key={session?.id || 'no-session'} className="px-5 pt-4 space-y-3">
        {viewDay.exercises.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">No exercises today</div>
        ) : (
          viewDay.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.name}
              exercise={exercise}
              sessionId={isReadOnly ? null : session?.id}
              color={viewDay.color}
              onSetsChange={setSessionSets}
            />
          ))
        )}
      </div>

      {/* Rest time tip info card */}
      <div className="mx-5 mt-5 p-4 bg-neutral-950/60 border border-neutral-900 rounded-2xl flex items-start gap-3">
        <span className="text-lg">⏱️</span>
        <div>
          <h4 className="text-xs font-bold text-white mb-0.5">Optimal Rest Protocols</h4>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Compounds (Bench/Squat/Deadlift) → <strong className="text-neutral-300">3-4 min</strong> to restore ATP path.<br/>
            Accessory/Isolation exercises → <strong className="text-neutral-300">60-90 sec</strong>.
          </p>
        </div>
      </div>

      {/* Complete workout CTA */}
      {isToday && (
        <div className="px-5 mt-8">
          {!session && !sessionLoading && (
            <button
              id="start-workout-btn"
              onClick={createSession}
              className="w-full py-4.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 text-white shadow-xl glow-orange"
              style={{
                background: `linear-gradient(135deg, ${viewDay.color}, #d9480f)`,
              }}
            >
              START WORKOUT
            </button>
          )}

          {session && !session.completed && (
            <button
              id="complete-workout-btn"
              onClick={completeWorkout}
              disabled={completing}
              className="w-full py-4.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 text-white shadow-xl glow-green"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
              }}
            >
              {completing ? 'SAVING PROGRESS...' : 'COMPLETE WORKOUT ✓'}
            </button>
          )}

          {session?.completed && (
            <div className="w-full py-4.5 rounded-2xl font-black text-sm tracking-widest uppercase text-center bg-[#0d1a0d] border border-[#059669]/40 text-[#059669] shadow-inner">
              ✅ WORKOUT COMPLETED
            </div>
          )}

          {session && (
            <button
              id="reset-workout-btn"
              onClick={resetWorkout}
              className="w-full mt-3.5 py-3 rounded-2xl border border-red-500/20 text-red-500/80 bg-red-950/10 hover:bg-red-950/20 hover:text-red-400 text-xs font-black tracking-widest uppercase transition-all duration-200"
            >
              Reset Today's Session
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Day switcher dots / buttons
function DaySwiper({ viewIdx, setViewIdx, todayIdx }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
      {days.map((d, i) => {
        const isActive = viewIdx === i;
        const isToday = i === todayIdx;
        return (
          <button
            key={i}
            id={`day-swiper-${d.day}`}
            onClick={() => setViewIdx(i)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl transition-all duration-300 ${
              isActive 
                ? 'bg-neutral-900 border border-neutral-800 scale-105 shadow-md' 
                : 'bg-neutral-950/40 border border-transparent opacity-45 hover:opacity-75'
            } ${isToday ? 'relative' : ''}`}
            style={{
              borderColor: isActive ? `${d.color}35` : 'transparent',
              boxShadow: isActive ? `0 4px 15px ${d.color}15` : 'none',
            }}
          >
            <img 
              src={d.icon} 
              alt={d.day} 
              className={`w-6 h-6 mb-1 object-contain transition-all duration-300 ${isActive ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'grayscale opacity-60'}`} 
            />
            <span
              className="text-[9px] font-black tracking-widest uppercase"
              style={{ color: isActive ? d.color : '#666' }}
            >
              {d.day}
            </span>
            {isToday && !isActive && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
