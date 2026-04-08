import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta?.env?.VITE_API_URL || '/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем токен при монтировании
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error();
      }).then(data => {
        setUser(data);
        localStorage.setItem('auth-user', JSON.stringify(data));
      }).catch(() => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    setUser(null);
  }, []);

  const updateBalance = useCallback((newBalance) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, balance: newBalance };
      localStorage.setItem('auth-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getToken = useCallback(() => localStorage.getItem('auth-token'), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateBalance, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
