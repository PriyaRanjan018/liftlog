// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const OWNER_EMAIL = 'priyaranjanpradhan005@gmail.com';

export function AuthProvider({ children }) {
  const [mode, setMode] = useState('loading');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session, true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session, false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session, isInitial) => {
    if (!session) {
      setMode((prev) => (prev === 'viewer' ? 'viewer' : 'landing'));
      return;
    }

    const email = session.user.email;
    if (email === OWNER_EMAIL) {
      setMode('owner');
      setLoginError('');
    } else {
      await supabase.auth.signOut();
      setLoginError(`Unauthorized email: ${email}. Only the owner can log in.`);
      setMode((prev) => (prev === 'viewer' ? 'viewer' : 'landing'));
    }
  };

  const enterViewerMode = useCallback(() => {
    setMode('viewer');
    setLoginError('');
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoginError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoginError(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setMode('landing');
    setLoginError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      mode,
      isOwner: mode === 'owner',
      isViewer: mode === 'viewer',
      isLanding: mode === 'landing',
      isLoading: mode === 'loading',
      enterViewerMode,
      loginWithGoogle,
      logout,
      loginError,
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
