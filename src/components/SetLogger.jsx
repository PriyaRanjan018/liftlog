import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * SetLogger — per-exercise set logging component
 * exercise: { name, sets, reps, isBodyweight, isTimed }
 * sessionId: UUID of current session
 * color: day-specific accent color
 * onSetsChange: callback when sets are updated
 */
export default function SetLogger({ exercise, sessionId, color, onSetsChange }) {
  const targetSets = parseInt(exercise.sets) || 3;

  // Initialize set rows
  const makeEmptyRow = (num) => ({
    id: null,
    set_number: num,
    weight_kg: '',
    reps_done: exercise.reps !== 'Max' ? exercise.reps.split('-')[0] : '',
    duration_sec: '',
    is_completed: false,
    isSaving: false,
  });

  const [rows, setRows] = useState(() =>
    Array.from({ length: targetSets }, (_, i) => makeEmptyRow(i + 1))
  );
  const [lastWeight, setLastWeight] = useState(null);

  // Pre-fill weight from last session
  useEffect(() => {
    if (exercise.isBodyweight) return;
    supabase
      .from('exercise_sets')
      .select('weight_kg')
      .eq('exercise_name', exercise.name)
      .eq('is_completed', true)
      .not('weight_kg', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0 && data[0].weight_kg) {
          setLastWeight(data[0].weight_kg);
          setRows((prev) =>
            prev.map((row) =>
              row.is_completed ? row : { ...row, weight_kg: String(data[0].weight_kg) }
            )
          );
        }
      });
  }, [exercise.name, exercise.isBodyweight]);

  // Auto-save a row on any change
  const saveRow = useCallback(
    async (row) => {
      if (!sessionId) return;
      const payload = {
        session_id: sessionId,
        exercise_name: exercise.name,
        set_number: row.set_number,
        weight_kg: exercise.isBodyweight ? null : parseFloat(row.weight_kg) || null,
        reps_done: exercise.isTimed ? null : parseInt(row.reps_done) || null,
        duration_sec: exercise.isTimed ? parseInt(row.duration_sec) || null : null,
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
      // Debounce save
      setTimeout(() => saveRow(updated[index]), 300);
      if (onSetsChange) onSetsChange(updated);
      return updated;
    });
  };

  const toggleComplete = (index) => {
    setRows((prev) => {
      const updated = prev.map((r, i) =>
        i === index ? { ...r, is_completed: !r.is_completed } : r
      );
      saveRow(updated[index]);
      if (onSetsChange) onSetsChange(updated);
      return updated;
    });
  };

  const addSet = () => {
    setRows((prev) => [...prev, makeEmptyRow(prev.length + 1)]);
  };

  const completedCount = rows.filter((r) => r.is_completed).length;

  return (
    <div className="mt-2 space-y-2">
      {/* Progress dots bar */}
      <div className="flex items-center justify-between mb-3 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-900/60">
        <div className="flex gap-1.5">
          {rows.map((r, i) => (
            <div
              key={i}
              className="w-2.5 h-1.5 rounded-full transition-all duration-300"
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
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-300 ${
            row.is_completed
              ? 'bg-[#0d1a0d] border border-[#059669]/40 shadow-sm'
              : 'bg-neutral-950 border border-neutral-900/80 hover:border-neutral-800'
          }`}
        >
          {/* Set badge */}
          <span
            className="text-[10px] font-black w-10 shrink-0 uppercase tracking-wider"
            style={{ color: row.is_completed ? '#059669' : '#555' }}
          >
            Set {row.set_number}
          </span>

          {/* Weight field (if not bodyweight) */}
          {!exercise.isBodyweight && (
            <div className="flex items-center gap-2">
              <input
                id={`weight-${exercise.name}-${i}`}
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={row.weight_kg}
                onChange={(e) => updateRow(i, 'weight_kg', e.target.value)}
                className={`w-16 bg-[#0e0e0e] border rounded-xl px-2.5 py-2 text-center text-sm font-black transition-all ${
                  row.is_completed 
                    ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50' 
                    : 'border-neutral-800 text-white focus:border-[#e85d04] focus:ring-1 focus:ring-[#e85d04]/20'
                }`}
                disabled={row.is_completed || !sessionId}
              />
              <span className="text-[#333] text-xs font-bold font-display">×</span>
            </div>
          )}

          {/* Reps/Duration field */}
          <div className="flex items-center gap-2 flex-1">
            {exercise.isTimed ? (
              <input
                id={`dur-${exercise.name}-${i}`}
                type="number"
                inputMode="numeric"
                placeholder="sec"
                value={row.duration_sec}
                onChange={(e) => updateRow(i, 'duration_sec', e.target.value)}
                className={`w-16 bg-[#0e0e0e] border rounded-xl px-2.5 py-2 text-center text-sm font-black transition-all ${
                  row.is_completed 
                    ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50' 
                    : 'border-neutral-800 text-white focus:border-[#e85d04]'
                }`}
                disabled={row.is_completed || !sessionId}
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
                  row.is_completed 
                    ? 'border-transparent text-neutral-500 bg-[#0e0e0e]/50' 
                    : 'border-neutral-800 text-white focus:border-[#e85d04]'
                }`}
                disabled={row.is_completed || !sessionId}
              />
            )}
            <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
              {exercise.isTimed ? 'sec' : 'reps'}
            </span>
          </div>

          {/* Complete button */}
          <button
            id={`complete-set-${exercise.name}-${i}`}
            onClick={() => toggleComplete(i)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base transition-all duration-300 shrink-0 ${
              row.is_completed
                ? 'bg-[#059669] text-white scale-95 shadow-md shadow-emerald-950/40'
                : 'bg-neutral-900 border border-neutral-800 text-[#444] hover:bg-neutral-800 hover:text-neutral-300'
            }`}
            aria-label={row.is_completed ? 'Mark set incomplete' : 'Mark set complete'}
            disabled={!sessionId}
          >
            ✓
          </button>
        </div>
      ))}

      {/* Add Set button */}
      {sessionId && (
        <button
          id={`add-set-${exercise.name}`}
          onClick={addSet}
          className="w-full py-2.5 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs font-bold uppercase tracking-widest hover:border-neutral-700 hover:text-neutral-300 transition-all duration-200 mt-2"
        >
          + Add Extra Set
        </button>
      )}
    </div>
  );
}
