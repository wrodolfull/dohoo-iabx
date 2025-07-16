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

  // Inicialização inicial para superadmin
  useEffect(() => {
    if (isSuperAdmin && !tenantId) {
      const saved = localStorage.getItem('selectedTenantId');
      if (saved) {
        setTenantId(saved);
        console.log('TenantContext: TenantId inicial carregado do localStorage:', saved);
      } else {
        // Se não há tenant salvo, define um padrão válido
        const defaultTenant = '5f2ef8cf-038b-4126-a8e5-043d7cf882fb'; // Merlin Desk
        setTenantId(defaultTenant);
        localStorage.setItem('selectedTenantId', defaultTenant);
        console.log('TenantContext: TenantId padrão definido:', defaultTenant);
      }
    }
  }, [isSuperAdmin, tenantId]);



  // Persistência no localStorage para superadmin (quando tenantId muda)
  useEffect(() => {
    if (isSuperAdmin && tenantId) {
      localStorage.setItem('selectedTenantId', tenantId);
      console.log('TenantContext: TenantId salvo no localStorage:', tenantId);
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