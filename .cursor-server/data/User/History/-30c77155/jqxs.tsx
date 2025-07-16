import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowUpFromLine, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Server,
  Building,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from '@/hooks/useTenant';
import TenantSelector from '@/components/TenantSelector';

interface OutboundRoute {
  id: string;
  pattern: string;
  trunk_id: string;
  priority: number;
  tenant_id: string;
  created_at: string;
}

interface Trunk {
  id: string;
  name: string;
  host: string;
}

const OutboundRoutes = () => {
  const { user } = useAuth();
  const { isSuperAdmin, tenantId, selectedTenantId, handleTenantChange } = useTenant();
  const [routes, setRoutes] = useState<OutboundRoute[]>([]);
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OutboundRoute | null>(null);
  const [formData, setFormData] = useState({
    pattern: '',
    trunk_id: '',
    priority: 1
  });

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [routesData, trunksData] = await Promise.all([
        api.getOutboundRoutes(tenantId),
        api.getTrunks(tenantId)
      ]);
      setRoutes(routesData || []);
      setTrunks(trunksData || []);
    } catch (error) {
      toast.error('Erro ao carregar rotas');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingRoute) {
        await api.updateOutboundRoute(editingRoute.id, formData);
        toast.success('Rota atualizada com sucesso!');
      } else {
        await api.createOutboundRoute(tenantId, formData);
        toast.success('Rota criada com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(editingRoute ? 'Erro ao atualizar rota' : 'Erro ao criar rota');
      console.error('Error saving route:', error);
    }
  };

  const handleDelete = async (route: OutboundRoute) => {
    if (!confirm(`Tem certeza que deseja excluir a rota para ${route.pattern}?`)) return;
    try {
      await api.deleteOutboundRoute(route.id);
      toast.success('Rota excluída com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir rota');
      console.error('Error deleting route:', error);
    }
  };

  const handleEdit = (route: OutboundRoute) => {
    setEditingRoute(route);
    setFormData({
      pattern: route.pattern,
      trunk_id: route.trunk_id,
      priority: route.priority
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      pattern: '',
      trunk_id: '',
      priority: 1
    });
  };

  const getTrunkName = (trunkId: string) => {
    const trunk = trunks.find(t => t.id === trunkId);
    return trunk ? trunk.name : trunkId;
  };

  // Se for superadmin e não há tenant selecionado
  if (isSuperAdmin && !selectedTenantId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Selecione uma Empresa</h3>
          <p className="text-gray-600">Escolha uma empresa para gerenciar suas rotas de saída</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando rotas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowUpFromLine className="w-8 h-8 text-dohoo-primary" />
            Rotas de Saída
          </h1>
          <p className="text-gray-600">
            Gerencie como as chamadas são direcionadas para provedores externos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? 'Editar Rota' : 'Nova Rota de Saída'}
              </DialogTitle>
              <DialogDescription>
                Configure como as chamadas serão direcionadas para provedores externos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pattern">Padrão de Número</Label>
                <Input
                  id="pattern"
                  value={formData.pattern}
                  onChange={(e) => setFormData({...formData, pattern: e.target.value})}
                  placeholder="Ex: 9. ou 0800"
                />
              </div>
              
              <div>
                <Label htmlFor="trunk_id">Tronco</Label>
                <Select
                  value={formData.trunk_id}
                  onValueChange={(value) => setFormData({...formData, trunk_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tronco" />
                  </SelectTrigger>
                  <SelectContent>
                    {trunks.map(trunk => (
                      <SelectItem key={trunk.id} value={trunk.id}>
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          <span>{trunk.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  placeholder="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.pattern || !formData.trunk_id}>
                {editingRoute ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Tenant para SuperAdmin */}
      {isSuperAdmin && (
        <TenantSelector
          selectedTenantId={selectedTenantId}
          onTenantChange={handleTenantChange}
          title="Selecionar Empresa"
          description="Escolha a empresa cujas rotas de saída você deseja gerenciar"
        />
      )}

      {/* Lista de Rotas */}
      <Card>
        <CardHeader>
          <CardTitle>Rotas de Saída ({routes.length})</CardTitle>
          <CardDescription>
            Lista de todas as rotas configuradas para direcionamento de chamadas externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-12">
              <ArrowUpFromLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma rota encontrada</h3>
              <p className="text-gray-600">
                Crie sua primeira rota de saída para começar a direcionar chamadas externas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{route.pattern}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        {getTrunkName(route.trunk_id)}
                        <Badge variant="outline">Prioridade: {route.priority}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(route)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(route)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutboundRoutes; 