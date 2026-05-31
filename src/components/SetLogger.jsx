import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * SetLogger — per-exercise set logging component
 * exercise: { name, sets, reps, isBodyweight, type }
 * sessionId: UUID of current session
 * color: day-specific accent color
 * onSetsChange: callback when sets are updated
 * onExerciseComplete: callback(exerciseName) when user marks exercise done
 * exerciseLocked: boolean — if true, entire exercise is frozen
 */
export default function SetLogger({
  exercise,
  sessionId,
  color,
  onSetsChange,
  onExerciseComplete,
  exerciseLocked = false,
}) {
  const targetSets = parseInt(exercise.sets) || 3;

  const makeEmptyRow = (num) => ({
    id: null,
    set_number: num,
    weight_kg: '',
    reps_done: exercise.type !== 'timed' && exercise.reps !== 'Max' ? parseInt(exercise.reps) || '' : '',
    duration_sec: exercise.type === 'timed' ? parseInt(exercise.reps) || '' : '',
    is_completed: false,
    locked: false,   // ← set-level permanent lock
    isSaving: false,
  });

  const [rows, setRows] = useState(() =>
    Array.from({ length: targetSets }, (_, i) => makeEmptyRow(i + 1))
  );
  const [completing, setCompleting] = useState(false);
  const hasLoaded = useRef(false);

  // Load existing sets from DB (resume mid-session or show locked state)
  useEffect(() => {
    if (!sessionId || hasLoaded.current) return;
    hasLoaded.current = true;

    supabase
      .from('exercise_sets')
      .select('*')
      .eq('session_id', sessionId)
      .eq('exercise_name', exercise.name)
      .order('set_number')
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Merge DB rows back, preserving extras
          setRows((prev) => {
            const merged = [...prev];
            data.forEach((dbRow) => {
              const idx = dbRow.set_number - 1;
              if (idx >= 0 && idx < merged.length) {
                merged[idx] = {
                  ...merged[idx],
                  id: dbRow.id,
                  weight_kg: dbRow.weight_kg != null ? String(dbRow.weight_kg) : '',
                  reps_done: dbRow.reps_done != null ? String(dbRow.reps_done) : '',
                  duration_sec: dbRow.duration_sec != null ? String(dbRow.duration_sec) : '',
                  is_completed: dbRow.is_completed,
                  locked: dbRow.is_completed, // completed sets become permanently locked
                };
              } else {
                // Extra sets beyond target
                merged.push({
                  id: dbRow.id,
                  set_number: dbRow.set_number,
                  weight_kg: dbRow.weight_kg != null ? String(dbRow.weight_kg) : '',
                  reps_done: dbRow.reps_done != null ? String(dbRow.reps_done) : '',
                  duration_sec: dbRow.duration_sec != null ? String(dbRow.duration_sec) : '',
                  is_completed: dbRow.is_completed,
                  locked: dbRow.is_completed,
                  isSaving: false,
                });
              }
            });
            return merged;
          });
        } else if (!exercise.isBodyweight) {
          // Pre-fill weight from last session
          supabase
            .from('exercise_sets')
            .select('weight_kg')
            .eq('exercise_name', exercise.name)
            .eq('is_completed', true)
            .not('weight_kg', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data: wData }) => {
              if (wData && wData.length > 0 && wData[0].weight_kg) {
                setRows((prev) =>
                  prev.map((row) =>
                    row.is_completed ? row : { ...row, weight_kg: String(wData[0].weight_kg) }
                  )
                );
              }
            });
        }
      });
  }, [sessionId, exercise.name]);

  // Save row to DB
  const saveRow = useCallback(
    async (row) => {
      if (!sessionId) return;
      const payload = {
        session_id: sessionId,
        exercise_name: exercise.name,
        set_number: row.set_number,
        weight_kg: exercise.isBodyweight || exercise.type === 'timed' ? null : parseFloat(row.weight_kg) || null,
        reps_done: exercise.type === 'timed' ? null : parseInt(row.reps_done) || null,
        duration_sec: exercise.type === 'timed' ? parseInt(row.duration_sec) || null : null,
        is_completed: row.is_completed,
      };

      if (row.id) {
        await supabase.from('exercise_sets').update(payload).eq('id', row.id);
      } else {
        const { data } = await supabase
          .from('exercise_sets')
          .insert(payload)
          .select('id')
          .single();
        if (data) {
          setRows((prev) =>
            prev.map((r) =>
              r.set_number === row.set_number ? { ...r, id: data.id } : r
            )
          );
        }
      }
    },
    [sessionId, exercise]
  );

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const updated = prev.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      );
      setTimeout(() => saveRow(updated[index]), 300);
      if (onSetsChange) onSetsChange(updated);
      return updated;
    });
  };

  // Tick = permanent lock + immediate DB save
  const lockSet = async (index) => {
    setRows((prev) => {
      const updated = prev.map((r, i) =>
        i === index
          ? { ...r, is_completed: true, locked: true, isSaving: true }
          : r
      );
      saveRow(updated[index]).then(() => {
        setRows((cur) =>
          cur.map((r, i) => i === index ? { ...r, isSaving: false } : r)
        );
      });
      if (onSetsChange) onSetsChange(updated);
      return updated;
    });
  };

  const addSet = () => {
    setRows((prev) => [...prev, makeEmptyRow(prev.length + 1)]);
  };

  const completedCount = rows.filter((r) => r.is_completed).length;
  const allCompleted = completedCount === rows.length && rows.length > 0;
  const isLocked = exerciseLocked;

  return (
    <div className="mt-2 space-y-2">
      {/* Progress dots bar */}
      <div className="flex items-center justify-between mb-3 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-900/60">
        <div className="flex gap-1.5">
          {rows.map((r, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: r.is_completed ? color : '#262626',
                width: r.is_completed ? '16px' : '10px',
              }}
            />
          ))}
        </div>
        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
          {completedCount} / {rows.length} completed
        </span>
      </div>

      {/* Set rows */}
      {rows.map((row, i) => {
        const isRowLocked = row.locked || isLocked;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-300 ${
              row.is_completed
                ? 'bg-[#0a160a] border border-[#059669]/35 shadow-sm'
                : 'bg-neutral-950 border border-neutral-900/80'
            }`}
          >
            {/* Set badge */}
            <span
              className="text-[10px] font-black w-10 shrink-0 uppercase tracking-wider"
              style={{ color: row.is_completed ? '#059669' : '#555' }}
            >
              Set {row.set_number}
            </span>

            {/* Weight field */}
            {!exercise.isBodyweight && exercise.type !== 'timed' && (
              <div className="flex items-center gap-2">
                <input
                  id={`weight-${exercise.name}-${i}`}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={row.weight_kg}
                  onChange={(e) => updateRow(i, 'weight_kg', e.target.value)}
                  className={`w-16 bg-[#0e0e0e] border rounded-xl px-2.5 py-2 text-center text-sm font-black transition-all ${
                    isRowLocked
                      ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50 cursor-not-allowed'
                      : 'border-neutral-800 text-white focus:border-[#e85d04] focus:ring-1 focus:ring-[#e85d04]/20'
                  }`}
                  disabled={isRowLocked || !sessionId}
                />
                <span className="text-[#333] text-xs font-bold">×</span>
              </div>
            )}

            {/* Reps / Duration field */}
            <div className="flex items-center gap-2 flex-1">
              {exercise.type === 'timed' ? (
                <input
                  id={`dur-${exercise.name}-${i}`}
                  type="number"
                  inputMode="numeric"
                  placeholder="sec"
                  value={row.duration_sec}
                  onChange={(e) => updateRow(i, 'duration_sec', e.target.value)}
                  className={`w-16 bg-[#0e0e0e] border rounded-xl px-2.5 py-2 text-center text-sm font-black transition-all ${
                    isRowLocked
                      ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50 cursor-not-allowed'
                      : 'border-neutral-800 text-white focus:border-[#e85d04]'
                  }`}
                  disabled={isRowLocked || !sessionId}
                />
              ) : (
                <input
                  id={`reps-${exercise.name}-${i}`}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={row.reps_done}
                  onChange={(e) => updateRow(i, 'reps_done', e.target.value)}
                  className={`w-16 bg-[#0e0e0e] border rounded-xl px-2.5 py-2 text-center text-sm font-black transition-all ${
                    isRowLocked
                      ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50 cursor-not-allowed'
                      : 'border-neutral-800 text-white focus:border-[#e85d04]'
                  }`}
                  disabled={isRowLocked || !sessionId}
                />
              )}
              <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                {exercise.type === 'timed' ? 'sec' : exercise.type === 'distance' ? 'm' : 'reps'}
              </span>
            </div>

            {/* Tick button — one-way lock */}
            <button
              id={`complete-set-${exercise.name}-${i}`}
              onClick={() => !isRowLocked && lockSet(i)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base transition-all duration-300 shrink-0 ${
                row.is_completed
                  ? 'bg-[#059669] text-white scale-95 shadow-md shadow-emerald-950/40 cursor-not-allowed'
                  : isLocked
                  ? 'bg-neutral-900 border border-neutral-800 text-[#333] cursor-not-allowed opacity-40'
                  : 'bg-neutral-900 border border-neutral-800 text-[#444] hover:bg-neutral-800 hover:border-neutral-600 hover:text-neutral-200 active:scale-90'
              }`}
              aria-label={row.is_completed ? 'Set locked' : 'Lock set as complete'}
              disabled={isRowLocked || !sessionId || row.isSaving}
            >
              {row.isSaving ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : row.is_completed ? (
                '✓'
              ) : (
                '✓'
              )}
            </button>
          </div>
        );
      })}

      {/* Add Set button — hidden if locked */}
      {sessionId && !isLocked && (
        <button
          id={`add-set-${exercise.name}`}
          onClick={addSet}
          className="w-full py-2.5 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs font-bold uppercase tracking-widest hover:border-neutral-700 hover:text-neutral-300 transition-all duration-200 mt-2"
        >
          + Add Extra Set
        </button>
      )}

      {/* ─── EXERCISE COMPLETE BUTTON ─── */}
      {sessionId && !isLocked && (
        <button
          id={`exercise-done-${exercise.name.replace(/\s+/g, '-')}`}
          onClick={async () => {
            if (completing) return;
            setCompleting(true);
            if (onExerciseComplete) await onExerciseComplete(exercise.name);
            setCompleting(false);
          }}
          disabled={completing || completedCount === 0}
          className={`w-full mt-3 py-3.5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            allCompleted
              ? 'text-white shadow-lg'
              : completedCount === 0
              ? 'bg-neutral-900/50 border border-neutral-800/50 text-neutral-600 cursor-not-allowed'
              : 'border text-amber-400 border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/20'
          }`}
          style={
            allCompleted
              ? { background: `linear-gradient(135deg, ${color}cc, ${color}88)`, boxShadow: `0 4px 20px ${color}25` }
              : {}
          }
        >
          {completing ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : allCompleted ? (
            <>🔒 Exercise Complete — Locked</>
          ) : completedCount === 0 ? (
            <>Complete at least 1 set first</>
          ) : (
            <>✓ Mark Exercise Done ({completedCount}/{rows.length} sets)</>
          )}
        </button>
      )}

      {/* Locked state indicator */}
      {isLocked && (
        <div className="w-full mt-3 py-3 rounded-2xl bg-[#0a160a] border border-[#059669]/30 text-[#059669] text-xs font-black tracking-widest uppercase text-center flex items-center justify-center gap-2">
          🔒 Exercise Locked
        </div>
      )}
    </div>
  );
}
