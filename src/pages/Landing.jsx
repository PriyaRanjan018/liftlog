// src/pages/Landing.jsx
// The first screen anyone sees — two buttons: VIEW PROGRESS (public) or SIGN IN WITH GOOGLE (owner login)

import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { enterViewerMode, loginWithGoogle, loginError } = useAuth();

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[#FC4C02]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo + Title */}
      <div className="text-center mb-12 relative z-10">
        <div className="w-20 h-20 mx-auto mb-5 rounded-[28px] bg-gradient-to-br from-[#FC4C02]/20 to-[#FC4C02]/5 border border-[#FC4C02]/20 flex items-center justify-center shadow-[0_0_60px_rgba(252,76,2,0.2)]">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight font-display mb-1">FitTrack</h1>
        <p className="text-neutral-500 text-sm font-medium">Personal Fitness Tracker</p>
      </div>

      {/* Two main buttons */}
      <div className="w-full max-w-sm space-y-4 relative z-10">
        {/* VIEW PROGRESS — public, no password */}
        <button
          id="view-progress-btn"
          onClick={enterViewerMode}
          className="w-full py-5 rounded-[20px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-black text-base tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg"
        >
          <span className="text-xl">👁️</span>
          <span>View Progress</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-bold uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded-lg">Public</span>
        </button>

        {/* MY DASHBOARD — owner login via Google */}
        <button
          id="my-dashboard-btn"
          onClick={loginWithGoogle}
          className="w-full py-5 rounded-[20px] font-black text-base tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-white flex items-center justify-center gap-3 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(252,76,2,0.15), rgba(232,64,0,0.08))',
            border: '1px solid rgba(252,76,2,0.25)',
            boxShadow: '0 0 40px rgba(252,76,2,0.1)',
          }}
        >
          <span className="text-xl">🔐</span>
          <span>Sign in with Google</span>
          <span className="ml-auto text-[10px] text-[#FC4C02]/80 font-bold uppercase tracking-widest bg-[#FC4C02]/10 px-2 py-1 rounded-lg">Owner</span>
        </button>
      </div>
      
      {loginError && (
        <p className="mt-6 text-red-400 text-[11px] font-bold text-center px-4 leading-snug relative z-10 bg-red-500/10 py-2 rounded-lg border border-red-500/20 max-w-xs mx-auto">
          {loginError}
        </p>
      )}

      <p className="mt-10 text-neutral-700 text-[10px] font-bold uppercase tracking-widest relative z-10">
        Secure · Private · No sign-up required
      </p>
    </div>
  );
}
