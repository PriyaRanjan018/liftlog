/**
 * Calendar component for History screen
 * sessions: [{ session_date, day_type, completed }]
 * onDayClick: (dateStr) => void
 * selectedDate: string | null
 * month: Date object for the displayed month
 * onMonthChange: (delta) => void
 */
export default function Calendar({ sessions = [], onDayClick, selectedDate, month, onMonthChange }) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const monthLabel = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build session map
  const sessionMap = {};
  sessions.forEach((s) => {
    sessionMap[s.session_date] = s;
  });

  // Get first day of month and total days
  const firstDay = new Date(year, monthIdx, 1).getDay(); // 0=Sun
  const totalDays = new Date(year, monthIdx + 1, 0).getDate();

  // Adjust: week starts Monday (0=Mon, 6=Sun)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDayStatus = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const jsDay = d.getDay();
    const restDays = [2, 0]; // Tue=2, Sun=0
    const isRestDay = restDays.includes(jsDay);

    const session = sessionMap[dateStr];
    const isPast = d < today;
    const isToday = d.toDateString() === today.toDateString();

    if (session) {
      if (session.completed) return 'completed';
      if (isRestDay) return 'rest';
      return 'started';
    }
    if (isRestDay) return 'rest';
    if (isPast && !isToday) return 'missed';
    return 'upcoming';
  };

  const DAYS_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-[#121212] rounded-3xl border border-neutral-900 p-5 shadow-sm">
      {/* Month header navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          id="cal-prev-month"
          onClick={() => onMonthChange(-1)}
          className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-800 transition-all flex items-center justify-center font-bold"
        >
          ‹
        </button>
        <span className="text-xs font-black text-white uppercase tracking-widest font-display">{monthLabel}</span>
        <button
          id="cal-next-month"
          onClick={() => onMonthChange(1)}
          className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-800 transition-all flex items-center justify-center font-bold"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-3.5">
        {DAYS_HEADER.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-neutral-600 font-black tracking-widest uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = getDayStatus(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = new Date(dateStr + 'T00:00:00').toDateString() === today.toDateString();

          return (
            <button
              key={dateStr}
              id={`cal-day-${dateStr}`}
              onClick={() => onDayClick(dateStr)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all duration-200 relative ${
                isSelected 
                  ? 'bg-neutral-950 border border-[#e85d04]/60 shadow-[0_0_15px_rgba(232,93,4,0.1)] scale-105' 
                  : 'hover:bg-neutral-950 hover:border-neutral-900 border border-transparent'
              } ${isToday && !isSelected ? 'border border-[#e85d04]/30' : ''}`}
            >
              <span
                className={`text-xs leading-none mb-1.5 font-bold ${
                  isToday ? 'text-[#e85d04]' : 'text-neutral-400'
                }`}
              >
                {day}
              </span>
              {/* Status dot */}
              {status === 'completed' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] glow-green" />
              )}
              {status === 'rest' && (
                <span className="text-[8px] text-neutral-600 leading-none font-bold">—</span>
              )}
              {status === 'missed' && (
                <span className="w-1.5 h-1.5 rounded-full border border-neutral-800 bg-neutral-950" />
              )}
              {status === 'started' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
              )}
              {status === 'upcoming' && (
                <span className="w-1 h-1 rounded-full bg-neutral-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend key indicators */}
      <div className="flex gap-4 mt-5 flex-wrap pt-4 border-t border-neutral-950">
        {[
          { color: '#059669', label: 'Done' },
          { color: '#f59e0b', label: 'Started' },
          { color: null, label: 'Missed', border: '#262626' },
          { color: '#555', label: '— Rest' },
        ].map(({ color, label, border }) => (
          <div key={label} className="flex items-center gap-1.5 text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">
            <span
              className="w-2.5 h-2.5 rounded-full block"
              style={{
                backgroundColor: color || 'transparent',
                border: border ? `1px solid ${border}` : 'none',
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
