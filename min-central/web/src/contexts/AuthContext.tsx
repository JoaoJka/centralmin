import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  nick: string;
  cargo: string;
  status: string;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || '';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      checkAuth(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async (authToken?: string) => {
    const t = authToken || token;
    if (!t) {
      setIsLoading(false);
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsLoading(false);
        return true;
      } else {
        logout();
        setIsLoading(false);
        return false;
      }
    } catch {
      logout();
      setIsLoading(false);
      return false;
    }
  };

  const login = async (nick: string, senha: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, senha })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

    sessionStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.usuario);
  };

  const logout = () => {
    sessionStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};