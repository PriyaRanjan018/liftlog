import { useState } from 'react';
import SetLogger from './SetLogger';
import { getStageColor } from '../lib/progression';

/**
 * ExerciseCard — expandable exercise card with set logger
 * exercise: { name, sets, reps, note, isBodyweight, isTimed }
 * sessionId: UUID
 * color: day accent color
 * onSetsChange: callback
 */
export default function ExerciseCard({ exercise, sessionId, color, onSetsChange }) {
  const [expanded, setExpanded] = useState(false);

  const targetSets = parseInt(exercise.sets) || 0;
  const isBodyweight = exercise.isBodyweight;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        expanded 
          ? 'shadow-lg border-neutral-800' 
          : 'bg-[#121212]/90 border-[#1e1e1e] hover:border-neutral-800/80 hover:bg-[#151515]'
      }`}
      style={{
        boxShadow: expanded ? `0 10px 30px -10px ${color}10` : 'none',
        backgroundColor: expanded ? '#161616' : undefined,
        borderColor: expanded ? `${color}35` : undefined,
      }}
    >
      {/* Header row — tap to expand */}
      <button
        id={`exercise-card-${exercise.name.replace(/\s+/g, '-')}`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left focus:outline-none"
      >
        {/* Expand indicator (modern plus/minus transition) */}
        <span
          className="text-[#666] transition-transform duration-300 font-bold text-xs w-4 h-4 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-full"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', color: expanded ? color : undefined }}
        >
          {expanded ? '−' : '＋'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[15px] text-white tracking-tight">{exercise.name}</div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1 truncate">
            <span>💡</span>
            <span className="truncate">{exercise.note}</span>
          </div>
          {/* Progression badge */}
          {exercise._progression && (() => {
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
              background: `${color}10`,
              borderColor: `${color}25`,
              color: color,
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
          <SetLogger
            exercise={exercise}
            sessionId={sessionId}
            color={color}
            onSetsChange={onSetsChange}
          />
        </div>
      )}
    </div>
  );
}
