import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setToken, getToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('ielts_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Clear a stale session if the token was removed elsewhere.
  useEffect(() => {
    if (session && !getToken()) setSession(null);
  }, [session]);

  const login = useCallback((token, data) => {
    setToken(token);
    localStorage.setItem('ielts_session', JSON.stringify(data));
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    setToken('');
    localStorage.removeItem('ielts_session');
    setSession(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ session, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
