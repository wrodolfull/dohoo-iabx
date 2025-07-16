import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente Supabase não configuradas no frontend');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
  logActivity: (action: string, resource: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    'monitoring.view', 'monitoring.control',
    // FreeSWITCH Avançado
    'freeswitch-admin.view', 'freeswitch-admin.edit', 'freeswitch-admin.reload'
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
    'reports', 'calls', 'settings', 'schedules', 'freeswitch-admin', 'callcenter', 'advanced-reports', 'surveys'
  ],
  admin: [
    'dashboard', 'extensions', 'ringgroups', 'ura', 'trunks', 
    'routes', 'users', 'reports', 'calls', 'settings', 'schedules', 'callcenter', 'advanced-reports', 'surveys'
  ],
  agent: [
    'dashboard', 'extensions', 'reports', 'calls', 'profile', 'callcenter', 'advanced-reports'
  ]
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      
      // Autenticação com backend API
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na autenticação');
      }

      const { user: userData, token } = await response.json();
      
      // Armazenar token no localStorage
      localStorage.setItem('auth_token', token);
      
      // Preparar dados do usuário com permissões
      const userWithPermissions = {
        ...userData,
        permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.agent
      };

      setUser(userWithPermissions);
      setIsAuthenticated(true);

      // Log da atividade de login
      await logActivity('login', 'auth', { 
        user_id: userData.id, 
        email: userData.email,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Login realizado com sucesso:', userWithPermissions);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Log da atividade de logout
        await logActivity('logout', 'auth', { 
          user_id: user.id, 
          email: user.email,
          timestamp: new Date().toISOString()
        });
      }
      
      // Fazer logout no backend API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Limpar token e estado local
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Mesmo com erro, limpar estado local
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  };

  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    const userResources = ROLE_RESOURCES[user.role] || [];
    return userResources.includes(resource);
  };

  const logActivity = async (action: string, resource: string, details?: any) => {
    try {
      if (!user) return;

      const logData = {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_role: user.role,
        tenant_id: user.tenant_id,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ip_address: null, // Será preenchido pelo backend se necessário
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: action.includes('delete') ? 'warning' : 'info'
      };

      // Tentar salvar no Supabase
      const { error } = await supabase.from('audit_logs').insert([logData]);
      
      if (error) {
        console.error('❌ Erro ao salvar log de auditoria:', error);
        // Não falhar a operação principal por causa do log
      }
    } catch (error) {
      console.error('❌ Erro no sistema de logs:', error);
    }
  };

  // Verificar sessão existente ao carregar
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
        
        // Verificar se o token ainda é válido
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const responseData = await response.json();
          const userData = responseData.user || responseData; // Compatibilidade com ambos formatos
          
          // Preparar dados do usuário com permissões
          const userWithPermissions = {
            ...userData,
            permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.agent
          };
          
          setUser(userWithPermissions);
          setIsAuthenticated(true);
        } else {
          // Token inválido, remover
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Definir permissões baseadas no role
  const permissions = useMemo(() => {
    if (!user?.role) return [];
    
    switch (user.role) {
      case 'superadmin':
        return [
          'dashboard', 'extensions', 'ringgroups', 'ura', 'trunks', 'ivr',
          'routes', 'users', 'tenants', 'freeswitch-admin', 'plans', 'audit-logs',
          'reports', 'calls', 'settings', 'schedules', 'advanced-reports'
        ];
      case 'admin':
        return [
          'dashboard', 'extensions', 'ringgroups', 'ura', 'trunks', 'ivr',
          'routes', 'users', 'reports', 'calls', 'settings', 'schedules', 'advanced-reports'
        ];
      case 'agent':
        return [
          'dashboard', 'extensions', 'reports', 'calls', 'profile', 'advanced-reports'
        ];
      default:
        return ['dashboard', 'profile'];
    }
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
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
