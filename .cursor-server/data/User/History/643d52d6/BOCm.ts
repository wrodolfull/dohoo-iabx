import { useTenantContext } from '@/contexts/TenantContext';

export const useTenant = () => {
  const { tenantId, setTenantId, isSuperAdmin } = useTenantContext();

  const handleTenantChange = (newTenantId: string) => {
    setTenantId(newTenantId);
    console.log('🏢 Tenant alterado globalmente para:', newTenantId);
  };

  return {
    isSuperAdmin,
    tenantId,
    selectedTenantId: tenantId,
    handleTenantChange
  };
}; 