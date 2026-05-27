import { getProgressColor } from '../lib/calculations';

/**
 * ProgressBar component
 * percent: 0–100+
 * label: string (e.g. "4 of 5 sets")
 * color: optional override
 */
export default function ProgressBar({ percent, label, color }) {
  const barColor = color || getProgressColor(percent);
  const clampedPct = Math.min(percent, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <span className="text-xs text-[#888]">{label}</span>
        )}
        <span
          className="text-xs font-bold ml-auto"
          style={{ color: barColor }}
        >
          {Math.round(percent)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#222] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedPct}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}66`,
          }}
        />
      </div>
    </div>
  );
}
