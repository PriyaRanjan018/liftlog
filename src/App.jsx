// src/App.jsx
// Root app: wraps everything in AuthProvider and routes based on auth mode.
// Landing → Viewer or Owner dashboard. /today is owner-only.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Today from './pages/Today';
import History from './pages/History';
import Progress from './pages/Progress';
import Stats from './pages/Stats';
import Strava from './pages/Strava';
import StravaCallback from './pages/StravaCallback';
import BottomNav from './components/BottomNav';

// Viewer-mode read-only banner
function ViewerBanner() {
  const { logout } = useAuth();
  return (
    <div
      className="sticky top-0 z-40 w-full flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-widest"
      style={{
        background: 'rgba(6,6,6,0.92)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-neutral-500">
        👁️ Viewing Priyaranjan's LiftLog — <span className="text-white">Read Only</span>
      </span>
      <button
        onClick={logout}
        className="text-neutral-600 hover:text-white transition-colors"
      >
        ← Exit
      </button>
    </div>
  );
}

// Guard: remove redirection, just render Today
function TodayGuard() {
  const { isOwner, isViewer } = useAuth();
  // Viewers are allowed now, they just see it read-only
  if (!isOwner && !isViewer) return <Navigate to="/" replace />;
  return <Today />;
}

function AppShell() {
  const { isLoading, isLanding, isViewer } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <div className="text-neutral-600 text-xs font-black uppercase tracking-widest animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  if (isLanding) return <Landing />;

  return (
    <div className="max-w-lg mx-auto relative min-h-screen bg-[#0a0a0a]">
      {/* Viewer banner — sticky at top for viewer mode */}
      {isViewer && <ViewerBanner />}

      <Routes>
        <Route path="/"                   element={<TodayGuard />} />
        <Route path="/history"            element={<History />} />
        <Route path="/progress"           element={<Progress />} />
        <Route path="/stats"              element={<Stats />} />
        <Route path="/strava"             element={<Strava />} />
        <Route path="/strava/callback"    element={<StravaCallback />} />
        {/* Catch-all → home */}
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
