import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stocksense_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stocksense_token');
    if (token) {
      api.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('stocksense_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('stocksense_token');
          localStorage.removeItem('stocksense_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const tokenNow = localStorage.getItem('stocksense_token');
      if (!tokenNow) setUser(null);
    };
    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('stocksense_token', res.data.token);
    localStorage.setItem('stocksense_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.signup(name, email, password);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
