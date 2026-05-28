// src/pages/Landing.jsx
// The first screen anyone sees — two buttons: VIEW PROGRESS (public) or SIGN IN WITH GOOGLE (owner login)

import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { enterViewerMode, loginWithGoogle, loginError } = useAuth();

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FC4C02]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#059669]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo + Title */}
      <div className="text-center mb-16 relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 rounded-[32px] bg-gradient-to-br from-[#FC4C02]/20 to-[#FC4C02]/5 border border-[#FC4C02]/20 flex items-center justify-center shadow-[0_0_60px_rgba(252,76,2,0.15)] backdrop-blur-xl">
          <svg className="w-12 h-12 filter drop-shadow-[0_0_10px_rgba(252,76,2,0.5)]" viewBox="0 0 24 24" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
          </svg>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter font-display mb-2 drop-shadow-md">LiftLog</h1>
        <p className="text-neutral-400 text-sm font-medium tracking-wide">Personal Fitness Tracker</p>
      </div>

      {/* Main Buttons Container */}
      <div className="w-full max-w-sm space-y-5 relative z-10">
        
        {/* VIEW PROGRESS — public */}
        <button
          id="view-progress-btn"
          onClick={enterViewerMode}
          className="group w-full py-5 px-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 hover:border-white/10 text-white font-black text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 shadow-xl hover:shadow-2xl"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <span>View Progress</span>
          <span className="ml-auto text-[10px] text-neutral-500 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Public</span>
        </button>

        {/* MY DASHBOARD — owner login via Google */}
        <button
          id="my-dashboard-btn"
          onClick={loginWithGoogle}
          className="group w-full py-5 px-6 rounded-[24px] font-black text-base tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white flex items-center gap-4 shadow-[0_10px_30px_rgba(252,76,2,0.15)] hover:shadow-[0_15px_40px_rgba(252,76,2,0.25)] relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(252,76,2,0.15), rgba(232,64,0,0.05))',
            border: '1px solid rgba(252,76,2,0.3)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <span>Sign in with Google</span>
          <span className="ml-auto text-[10px] text-[#FC4C02] font-black uppercase tracking-widest bg-[#FC4C02]/10 px-3 py-1.5 rounded-lg border border-[#FC4C02]/20">Owner</span>
        </button>
      </div>
      
      {loginError && (
        <div className="mt-8 relative z-10 w-full max-w-sm animate-fade-in">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-xl">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <p className="text-red-400 text-xs font-medium leading-relaxed">
              {loginError}
            </p>
          </div>
        </div>
      )}

      <div className="mt-16 text-neutral-600 text-[10px] font-black uppercase tracking-widest relative z-10 flex items-center gap-3">
        <span>Secure</span>
        <span className="w-1 h-1 rounded-full bg-neutral-700" />
        <span>Private</span>
        <span className="w-1 h-1 rounded-full bg-neutral-700" />
        <span>No sign-up required</span>
      </div>
    </div>
  );
}
