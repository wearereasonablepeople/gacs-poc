import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'tenant_owner' | 'tenant_admin';
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_ROLES = ['tenant_owner', 'tenant_admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.user && ALLOWED_ROLES.includes(data.user.role)) {
        setUser(data.user);
      } else {
        // Platform admins or other roles are not allowed
        setUser(null);
        await api.post('/auth/logout').catch(() => {});
        navigate('/login');
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (email: string, password: string, tenantSlug: string) => {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        tenantSlug,
      });

      if (!ALLOWED_ROLES.includes(data.user.role)) {
        await api.post('/auth/logout').catch(() => {});
        throw new Error('Access denied. Only tenant owners and admins can access this panel.');
      }

      setUser(data.user);
      navigate('/');
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const isOwner = user?.role === 'tenant_owner';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
