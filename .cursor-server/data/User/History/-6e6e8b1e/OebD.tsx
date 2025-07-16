import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'agent';
  company?: string;
  domain?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@empresa.com',
  role: 'admin',
  company: 'Empresa Demo',
  domain: 'empresa.dohoo.com.br'
};

const PERMISSIONS = {
  superadmin: ['*'],
  admin: [
    'dashboard.view',
    'extensions.manage',
    'ringgroups.manage',
    'inbound.manage',
    'outbound.manage',
    'trunks.manage',
    'ura.manage',
    'plans.view',
    'reports.view',
    'settings.manage'
  ],
  agent: [
    'dashboard.view',
    'extensions.view',
    'reports.view'
  ]
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      // Aqui você pode buscar dados adicionais do usuário, como role, company, etc, se estiverem em uma tabela separada
      setUser({
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email,
        email: data.user.email!,
        role: 'admin', // Ajuste conforme sua estrutura de roles no Supabase
        company: '', // Ajuste conforme necessário
        domain: '' // Ajuste conforme necessário
      });
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = PERMISSIONS[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
