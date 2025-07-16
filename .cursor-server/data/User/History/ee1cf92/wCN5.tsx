import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  contact_email: string;
  status: string;
}

interface TenantSelectorProps {
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
  title?: string;
  description?: string;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({
  selectedTenantId,
  onTenantChange,
  title = "Selecionar Empresa",
  description = "Escolha a empresa que você deseja gerenciar"
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      const response = await fetch(`${apiUrl}/tenants`);
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
        
        // Selecionar o primeiro tenant por padrão se não houver nenhum selecionado
        if (data.length > 0 && !selectedTenantId) {
          onTenantChange(data[0].id);
        }
      } else {
        toast.error('Erro ao carregar empresas');
      }
    } catch (error) {
      console.error('Erro ao buscar tenants:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleTenantChange = (newTenantId: string) => {
    onTenantChange(newTenantId);
    console.log('🏢 Tenant alterado para:', newTenantId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedTenantId} onValueChange={handleTenantChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>{tenant.name}</span>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchTenants}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantSelector; 