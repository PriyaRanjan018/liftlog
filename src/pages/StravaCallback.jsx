// src/pages/StravaCallback.jsx
// Handles the OAuth redirect from Strava — extracts code, calls edge fn, redirects to /strava
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeStravaCode } from '../lib/strava';

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const err = searchParams.get('error');

    if (err || !code) {
      setStatus('error');
      setError(err === 'access_denied' ? 'You denied access to Strava.' : 'Invalid OAuth callback.');
      return;
    }

    exchangeStravaCode(code)
      .then(() => {
        navigate('/strava?connected=1', { replace: true });
      })
      .catch((e) => {
        setStatus('error');
        setError(e.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-6 text-center">
      {status === 'connecting' ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/30 flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM4.804 7.628l2.086 4.116h3.065L4.804 1.744 0 11.916h3.065l1.739-4.288z" />
            </svg>
          </div>
          <div className="text-white font-black text-lg mb-2">Connecting to Strava...</div>
          <div className="text-neutral-500 text-xs font-bold">Exchanging authorization tokens securely</div>
          <div className="mt-6 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#FC4C02] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <div className="text-white font-black text-lg mb-2">Connection Failed</div>
          <div className="text-red-400 text-xs font-bold mb-6 max-w-xs">{error}</div>
          <button
            onClick={() => navigate('/strava')}
            className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl"
          >
            Go Back
          </button>
        </>
      )}
    </div>
  );
}
