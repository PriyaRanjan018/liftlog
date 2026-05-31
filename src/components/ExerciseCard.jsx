import { useState, useEffect } from 'react';
import SetLogger from './SetLogger';
import { getStageColor } from '../lib/progression';
import { supabase } from '../lib/supabase';

/**
 * ExerciseCard — expandable exercise card with set logger
 * exercise: { name, sets, reps, note, isBodyweight, isTimed }
 * sessionId: UUID
 * color: day accent color
 * onSetsChange: callback
 */
export default function ExerciseCard({ exercise, sessionId, color, onSetsChange }) {
  const [expanded, setExpanded] = useState(false);
  const [exerciseLocked, setExerciseLocked] = useState(false);

  const targetSets = parseInt(exercise.sets) || 0;
  const isBodyweight = exercise.isBodyweight;

  // Check if this exercise is already marked complete in DB (resume after refresh)
  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from('exercise_completions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('exercise_name', exercise.name)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExerciseLocked(true);
      });
  }, [sessionId, exercise.name]);

  const handleExerciseComplete = async (exerciseName) => {
    if (!sessionId) return;
    await supabase.from('exercise_completions').upsert(
      { session_id: sessionId, exercise_name: exerciseName, completed_at: new Date().toISOString() },
      { onConflict: 'session_id,exercise_name' }
    );
    setExerciseLocked(true);
    setExpanded(false); // collapse after locking
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        exerciseLocked
          ? 'bg-[#0a160a] border-[#059669]/30 shadow-sm'
          : expanded
          ? 'shadow-lg border-neutral-800'
          : 'bg-[#121212]/90 border-[#1e1e1e] hover:border-neutral-800/80 hover:bg-[#151515]'
      }`}
      style={{
        boxShadow: expanded && !exerciseLocked ? `0 10px 30px -10px ${color}10` : 'none',
        backgroundColor: exerciseLocked ? '#0a160a' : expanded ? '#161616' : undefined,
        borderColor: exerciseLocked ? '#05966940' : expanded ? `${color}35` : undefined,
      }}
    >
      {/* Header row — tap to expand */}
      <button
        id={`exercise-card-${exercise.name.replace(/\s+/g, '-')}`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left focus:outline-none"
      >
        {/* Expand indicator */}
        <span
          className="text-[#666] transition-transform duration-300 font-bold text-xs w-4 h-4 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-full shrink-0"
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: exerciseLocked ? '#059669' : expanded ? color : undefined,
            borderColor: exerciseLocked ? '#05966940' : undefined,
          }}
        >
          {exerciseLocked ? '🔒' : expanded ? '−' : '＋'}
        </span>

        <div className="flex-1 min-w-0">
          <div
            className="font-extrabold text-[15px] tracking-tight"
            style={{ color: exerciseLocked ? '#059669' : 'white' }}
          >
            {exercise.name}
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 truncate">
            <span>💡</span>
            <span className="truncate">{exerciseLocked ? 'Completed & locked ✓' : exercise.note}</span>
          </div>
          {/* Progression badge */}
          {!exerciseLocked && exercise._progression && (() => {
            const p = exercise._progression;
            const stageColor = getStageColor(p.stage, p.totalStages);
            const pct = Math.round((p.stage / p.totalStages) * 100);
            const isMaxed = p.stage === p.totalStages;
            return (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: stageColor }}>
                    {isMaxed ? '🔓 UNLOCKED' : `🔄 Stage ${p.stage} of ${p.totalStages}`} — {p.stageLabel}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-600">
                    {p.unlockWeek ? `Week ${p.unlockWeek - 1} → ${p.unlockWeek}` : 'Max Stage'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${stageColor}80, ${stageColor})`,
                      boxShadow: `0 0 6px ${stageColor}50`,
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sets × Reps badge */}
        {exercise.sets !== '—' && (
          <div
            className="flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-black border tracking-wide"
            style={{
              background: exerciseLocked ? '#05966912' : `${color}10`,
              borderColor: exerciseLocked ? '#05966930' : `${color}25`,
              color: exerciseLocked ? '#059669' : color,
            }}
          >
            {exercise.sets}
            <span className="text-[#666] font-normal mx-0.5">×</span>
            {exercise.reps}
          </div>
        )}

        {/* Type badges */}
        {isBodyweight && exercise.type !== 'timed' && (
          <span className="flex-shrink-0 text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-lg px-2 py-1 uppercase tracking-wider font-extrabold">
            BW
          </span>
        )}
        {exercise.type === 'timed' && (
          <span className="flex-shrink-0 text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-lg px-2 py-1 uppercase tracking-wider font-extrabold">
            ⏱
          </span>
        )}
        {exercise.type === 'distance' && (
          <span className="flex-shrink-0 text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-lg px-2 py-1 uppercase tracking-wider font-extrabold">
            📏
          </span>
        )}
      </button>

      {/* Expanded: Set Logger */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-900 animate-fade-in">
          {!exerciseLocked && (
            <div className="mt-3.5 text-xs text-neutral-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
              <span>
                Target: <strong className="text-neutral-300 font-bold">{targetSets} sets × {exercise.reps}</strong>
              </span>
              {isBodyweight && exercise.type !== 'timed' && (
                <>
                  <span className="text-neutral-700">•</span>
                  <span className="text-neutral-400 font-medium">Bodyweight Exercise</span>
                </>
              )}
              {exercise.type === 'timed' && (
                <>
                  <span className="text-neutral-700">•</span>
                  <span className="text-neutral-400 font-medium">Timed Sets</span>
                </>
              )}
              {exercise.type === 'distance' && (
                <>
                  <span className="text-neutral-700">•</span>
                  <span className="text-neutral-400 font-medium">Distance Covered</span>
                </>
              )}
            </div>
          )}
          <SetLogger
            exercise={exercise}
            sessionId={sessionId}
            color={color}
            onSetsChange={onSetsChange}
            onExerciseComplete={handleExerciseComplete}
            exerciseLocked={exerciseLocked}
          />
        </div>
      )}
    </div>
  );
}
