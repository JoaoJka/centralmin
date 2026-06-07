// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  nick: string;
  cargo: string;
  ministry?: string;
  avatar?: string;
  modLevel?: number;
  disponivel?: boolean;
  verificado?: boolean;
  aprovado?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (nick: string, senha: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext(undefined as unknown as AuthContextType | undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'https://mincentral-back.netlify.app/.netlify/functions';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null as AuthUser | null);
  const [token, setToken] = useState(null as string | null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (authToken: string) => {
    try {
      // CORRIGIDO: /auth/me em vez de /me
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || data);
        setIsLoading(false);
        return true;
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (nick: string, senha: string) => {
    setIsLoading(true);
    
    try {
      // CORRIGIDO: /auth/login em vez de /auth
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick, senha })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const checkAuth = async () => {
    if (!token) {
      setIsLoading(false);
      return false;
    }
    return validateToken(token);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};