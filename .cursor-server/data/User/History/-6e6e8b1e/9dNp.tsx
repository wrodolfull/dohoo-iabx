import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'agent';
  company?: string;
  domain?: string;
  tenant_id?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
  logActivity: (action: string, resource: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários mock para teste (baseados no banco)
const MOCK_USERS = [
  {
    id: 'superadmin-123',
    name: 'Super Administrador',
    email: 'superadmin@dohoo.com.br',
    role: 'superadmin' as const,
    company: 'Dohoo IABX',
    domain: 'dohoo.com.br',
    tenant_id: null
  },
  {
    id: 'admin-456',
    name: 'Administrador Demo',
    email: 'admin@demo.com',
    role: 'admin' as const,
    company: 'Empresa Demo',
    domain: 'demo.dohoo.com.br',
    tenant_id: 'tenant-demo-123'
  },
  {
    id: 'agent-789',
    name: 'Agente Demo',
    email: 'agente@demo.com',
    role: 'agent' as const,
    company: 'Empresa Demo',
    domain: 'demo.dohoo.com.br',
    tenant_id: 'tenant-demo-123'
  }
];

// Sistema de permissões granulares
const ROLE_PERMISSIONS = {
  superadmin: [
    // Acesso total
    '*',
    // Dashboard
    'dashboard.view', 'dashboard.stats',
    // Tenants/Empresas
    'tenants.view', 'tenants.create', 'tenants.edit', 'tenants.delete',
    // Planos
    'plans.view', 'plans.create', 'plans.edit', 'plans.delete',
    // Usuários (todos os tenants)
    'users.view_all', 'users.create', 'users.edit', 'users.delete',
    // Logs e auditoria
    'audit_logs.view', 'audit_logs.export',
    // Configurações globais
    'settings.global', 'settings.security',
    // Relatórios avançados
    'reports.advanced', 'reports.export',
    // Monitoramento
    'monitoring.view', 'monitoring.control'
  ],
  admin: [
    // Dashboard
    'dashboard.view', 'dashboard.stats',
    // Ramais
    'extensions.view', 'extensions.create', 'extensions.edit', 'extensions.delete',
    // Grupos de toque
    'ringgroups.view', 'ringgroups.create', 'ringgroups.edit', 'ringgroups.delete',
    // URA
    'ura.view', 'ura.create', 'ura.edit', 'ura.delete',
    // Troncos
    'trunks.view', 'trunks.create', 'trunks.edit', 'trunks.delete',
    // Rotas
    'routes.view', 'routes.create', 'routes.edit', 'routes.delete',
    // Usuários (próprio tenant)
    'users.view', 'users.create', 'users.edit', 'users.delete',
    // Relatórios
    'reports.view', 'reports.export',
    // Chamadas ativas
    'calls.view', 'calls.hangup',
    // Configurações
    'settings.view', 'settings.edit',
    // Horários
    'schedules.view', 'schedules.create', 'schedules.edit', 'schedules.delete',
    // Planos (visualização)
    'plans.view'
  ],
  agent: [
    // Dashboard limitado
    'dashboard.view',
    // Ramais (apenas visualização)
    'extensions.view',
    // Relatórios limitados
    'reports.view',
    // Chamadas ativas (apenas visualização)
    'calls.view',
    // Próprio perfil
    'profile.view', 'profile.edit'
  ]
};

// Recursos que cada role pode acessar
const ROLE_RESOURCES = {
  superadmin: [
    'dashboard', 'tenants', 'plans', 'users', 'audit-logs', 
    'extensions', 'ringgroups', 'ura', 'trunks', 'routes',
    'reports', 'calls', 'settings', 'schedules'
  ],
  admin: [
    'dashboard', 'extensions', 'ringgroups', 'ura', 'trunks', 
    'routes', 'users', 'reports', 'calls', 'settings', 'schedules'
  ],
  agent: [
    'dashboard', 'extensions', 'reports', 'calls', 'profile'
  ]
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      // MODO MOCK: Buscar usuário na lista mock
      const mockUser = MOCK_USERS.find(u => u.email === email);
      
      if (mockUser) {
        const userWithPermissions = {
          ...mockUser,
          permissions: ROLE_PERMISSIONS[mockUser.role] || ROLE_PERMISSIONS.agent
        };

        setUser(userWithPermissions);
        setIsAuthenticated(true);

        // Log da atividade de login
        await logActivity('login', 'auth', { 
          user_id: mockUser.id, 
          email: mockUser.email,
          timestamp: new Date().toISOString()
        });

        console.log('✅ Login realizado com sucesso:', userWithPermissions);
        return;
      }

      // MODO REAL: Tentar autenticação com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Erro na autenticação Supabase:', error);
        throw new Error('Email ou senha incorretos');
      }
      
      if (data.user) {
        // Buscar dados do usuário na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          throw new Error('Usuário não encontrado no sistema');
        }

        const userWithPermissions = {
          id: data.user.id,
          name: userData.name || data.user.email,
          email: data.user.email!,
          role: userData.role || 'agent',
          company: userData.company,
          domain: userData.domain,
          tenant_id: userData.tenant_id,
          permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.agent
        };

        setUser(userWithPermissions);
        setIsAuthenticated(true);

        // Log da atividade de login
        await logActivity('login', 'auth', { 
          user_id: data.user.id, 
          email: data.user.email,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (user) {
      // Log da atividade de logout
      await logActivity('logout', 'auth', { 
        user_id: user.id, 
        email: user.email,
        timestamp: new Date().toISOString()
      });
    }
    
    // Limpar estado local
    setUser(null);
    setIsAuthenticated(false);
    
    // Tentar logout do Supabase (se estiver autenticado)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Supabase:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    
    const userResources = ROLE_RESOURCES[user.role] || [];
    return userResources.includes(resource);
  };

  const logActivity = async (action: string, resource: string, details?: any) => {
    if (!user) return;

    try {
      const logData = {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_role: user.role,
        tenant_id: user.tenant_id,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ip_address: null, // Pode ser obtido do cliente se necessário
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await supabase.from('audit_logs').insert([logData]);
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  };

  useEffect(() => {
    // Verificar se há sessão ativa no Supabase
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && data.session.user) {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.session.user.email)
            .single();

          if (userData) {
            setUser({
              id: data.session.user.id,
              name: userData.name || data.session.user.email,
              email: data.session.user.email!,
              role: userData.role || 'agent',
              company: userData.company,
              domain: userData.domain,
              tenant_id: userData.tenant_id,
              permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.agent
            });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasPermission,
      canAccess,
      logActivity
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
