import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('slk:unauthorized', onUnauthorized);
    return () => window.removeEventListener('slk:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const setCredits = useCallback((credits) => {
    setUser((u) => (u ? { ...u, credits } : u));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, setCredits }),
    [user, loading, login, logout, refreshUser, setCredits]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
