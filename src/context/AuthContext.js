'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'local-demo-user',
  id: 'local-demo-user',
  email: null,
  displayName: 'Demo Parent',
  role: 'parent',
  tier: 'free-demo',
  isDemo: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('urai_storytime_user') : null;
      setUser(raw ? JSON.parse(raw) : DEMO_USER);
    } catch {
      setUser(DEMO_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (nextUser = DEMO_USER) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('urai_storytime_user', JSON.stringify(nextUser));
    }
    return nextUser;
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('urai_storytime_user');
    }
  };

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      loading,
      isAuthenticated: Boolean(user),
      isDemo: user?.isDemo ?? false,
      login,
      logout,
      signIn: login,
      signOut: logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    return {
      user: DEMO_USER,
      currentUser: DEMO_USER,
      loading: false,
      isAuthenticated: true,
      isDemo: true,
      login: async () => DEMO_USER,
      logout: async () => {},
      signIn: async () => DEMO_USER,
      signOut: async () => {},
    };
  }
  return value;
}

export default AuthContext;
