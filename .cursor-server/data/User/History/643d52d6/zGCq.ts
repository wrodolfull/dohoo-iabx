import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useTenant = () => {
  const { user: currentUser } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  // Determinar se é superadmin
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  // Usar tenant selecionado (para superadmin) ou tenant do usuário atual (para admin)
  const tenantId = isSuperAdmin ? selectedTenantId : (currentUser?.tenant_id || '1');

  // Inicializar tenant para admin normal
  useEffect(() => {
    if (!isSuperAdmin && currentUser?.tenant_id) {
      setSelectedTenantId(currentUser.tenant_id);
    }
  }, [isSuperAdmin, currentUser?.tenant_id]);

  const handleTenantChange = (newTenantId: string) => {
    setSelectedTenantId(newTenantId);
    console.log('🏢 Tenant alterado para:', newTenantId);
  };

  return {
    isSuperAdmin,
    tenantId,
    selectedTenantId,
    handleTenantChange
  };
}; 