// src/context/AuthContext.jsx
// Global auth state: 'loading' | 'landing' | 'viewer' | 'owner'
// Import useAuth() in any component to check access mode.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isOwnerAuthenticated, saveOwnerToken, clearOwnerToken } from '../lib/auth';
import { checkHasPasskey, registerFingerprint, loginWithFingerprint } from '../lib/webauthn';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 'loading' → checking session on mount
  // 'landing' → first visit, show landing screen
  // 'viewer'  → public read-only mode
  // 'owner'   → authenticated owner, full access
  const [mode, setMode] = useState('loading');
  const [hasPasskey, setHasPasskey] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // On mount: check session and passkey status
    if (isOwnerAuthenticated()) {
      setMode('owner');
    } else {
      checkHasPasskey().then(has => {
        setHasPasskey(has);
        setMode('landing');
      }).catch(() => {
        setMode('landing');
      });
    }
  }, []);

  const logout = useCallback(() => {
    clearOwnerToken();
    setMode('landing');
    setLoginError('');
  }, []);

  const attemptLogin = useCallback(async () => {
    setLoginError('');
    try {
      let token;
      if (hasPasskey) {
        token = await loginWithFingerprint();
      } else {
        token = await registerFingerprint();
        setHasPasskey(true);
      }
      saveOwnerToken(token);
      setMode('owner');
    } catch (err) {
      setLoginError(err.message);
    }
  }, [hasPasskey]);

  return (
    <AuthContext.Provider value={{
      mode,
      isOwner: mode === 'owner',
      isViewer: mode === 'viewer',
      isLanding: mode === 'landing',
      isLoading: mode === 'loading',
      enterViewerMode,
      attemptLogin,
      logout,
      loginError,
      hasPasskey,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
