import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenantId: string;
  setTenantId: (id: string) => void;
  isSuperAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [tenantId, setTenantId] = useState<string>('');

  // Inicializa tenantId para admin normal
  useEffect(() => {
    console.log('TenantContext: Inicializando tenantId', { isSuperAdmin, userTenantId: user?.tenant_id });
    if (!isSuperAdmin && user?.tenant_id) {
      setTenantId(user.tenant_id);
      console.log('TenantContext: TenantId definido para admin normal:', user.tenant_id);
    }
  }, [isSuperAdmin, user?.tenant_id]);

  // Persistência no localStorage para superadmin
  useEffect(() => {
    if (isSuperAdmin && tenantId) {
      localStorage.setItem('selectedTenantId', tenantId);
      console.log('TenantContext: TenantId salvo no localStorage:', tenantId);
    }
  }, [isSuperAdmin, tenantId]);

  // Carrega tenantId salvo do localStorage para superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = localStorage.getItem('selectedTenantId');
      if (saved && saved !== tenantId) {
        setTenantId(saved);
        console.log('TenantContext: TenantId carregado do localStorage:', saved);
      }
    }
  }, [isSuperAdmin, tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, isSuperAdmin }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext must be used within a TenantProvider');
  return ctx;
}; 