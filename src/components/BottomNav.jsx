import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Today', icon: '/assets/icons/icon_full_body.webp', id: 'nav-today' },
  { to: '/history', label: 'History', icon: '/assets/icons/icon_history.webp', id: 'nav-history' },
  { to: '/progress', label: 'Progress', icon: '/assets/icons/icon_progress.webp', id: 'nav-progress' },
  { to: '/stats', label: 'Stats', icon: '/assets/icons/icon_stats.webp', id: 'nav-stats' },
  { to: '/strava', label: 'Strava', icon: null, stravaIcon: true, id: 'nav-strava' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto rounded-3xl bg-black/60 backdrop-blur-xl border border-white/5 shadow-2xl safe-bottom overflow-hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            id={tab.id}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-black uppercase tracking-wider transition-all duration-300 min-h-[50px] ${
                isActive
                  ? 'text-white scale-105'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {tab.stravaIcon ? (
                  <svg
                    className={`w-6 h-6 transition-all duration-300 ${isActive ? '-translate-y-0.5' : 'opacity-40'}`}
                    viewBox="0 0 24 24"
                    fill={isActive ? '#FC4C02' : 'white'}
                    style={isActive ? { filter: 'drop-shadow(0 0 8px rgba(252,76,2,0.6))' } : {}}
                  >
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
                  </svg>
                ) : (
                  <img
                    src={tab.icon}
                    alt={tab.label}
                    className={`w-6 h-6 object-contain transition-transform duration-300 ${isActive ? '-translate-y-0.5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-60 grayscale'}`}
                  />
                )}
                <span className="font-extrabold">{tab.label}</span>
                
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-1 bg-gradient-to-r from-[#e85d04] to-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(232,93,4,0.6)] animate-fade-in" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
