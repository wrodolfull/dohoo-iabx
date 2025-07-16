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
  ArrowDownToLine, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Users,
  Bot,
  Target,
  Building,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from '@/hooks/useTenant';

interface InboundRoute {
  id: string;
  did: string;
  caller_id_name?: string;
  destination_type: string;
  destination_id: string;
  tenant_id: string;
  created_at: string;
}

interface Extension {
  id: string;
  name: string;
  number: string;
}

interface RingGroup {
  id: string;
  name: string;
}

interface URA {
  id: string;
  name: string;
}

const InboundRoutes = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [routes, setRoutes] = useState<InboundRoute[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [uras, setUras] = useState<URA[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<InboundRoute | null>(null);
  const [formData, setFormData] = useState({
    did: '',
    caller_id_name: '',
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [routesData, extensionsData, groupsData, urasData] = await Promise.all([
        api.getInboundRoutes(tenantId),
        api.getExtensions(tenantId),
        api.getRingGroups(tenantId),
        api.getURA(tenantId)
      ]);
      setRoutes(routesData || []);
      setExtensions(extensionsData || []);
      setRingGroups(groupsData || []);
      setUras(urasData || []);
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
        await api.updateInboundRoute(editingRoute.id, formData);
        toast.success('Rota atualizada com sucesso!');
      } else {
        await api.createInboundRoute(tenantId, formData);
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

  const handleDelete = async (route: InboundRoute) => {
    if (!confirm(`Tem certeza que deseja excluir a rota para ${route.did}?`)) return;
    try {
      await api.deleteInboundRoute(route.id);
      toast.success('Rota excluída com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir rota');
      console.error('Error deleting route:', error);
    }
  };

  const handleEdit = (route: InboundRoute) => {
    setEditingRoute(route);
    setFormData({
      did: route.did,
      caller_id_name: route.caller_id_name || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      did: '',
      caller_id_name: '',
    });
  };

  // Filtro de busca
  const filteredRoutes = routes.filter(route =>
    route.did.toLowerCase().includes(search.toLowerCase()) ||
    (route.caller_id_name || '').toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowDownToLine className="w-8 h-8 text-dohoo-primary" />
            Rotas de Entrada
          </h1>
          <p className="text-gray-600">
            Gerencie as rotas de entrada (DIDs) e seus destinos
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
                {editingRoute ? 'Editar Rota de Entrada' : 'Nova Rota de Entrada'}
              </DialogTitle>
              <DialogDescription>
                Configure uma rota de entrada para direcionar chamadas recebidas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="did">DID (número de entrada)</Label>
                <Input
                  id="did"
                  value={formData.did}
                  onChange={e => setFormData({ ...formData, did: e.target.value })}
                  placeholder="Ex: 11999990000"
                />
              </div>
              <div>
                <Label htmlFor="caller_id_name">Identificador de Chamada (Caller ID Name)</Label>
                <Input
                  id="caller_id_name"
                  value={formData.caller_id_name}
                  onChange={e => setFormData({ ...formData, caller_id_name: e.target.value })}
                  placeholder="Nome que aparecerá no ramal ao receber a chamada"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.did || !formData.caller_id_name}>
                {editingRoute ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro de Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por DID ou identificador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Rotas */}
      <Card>
        <CardHeader>
          <CardTitle>Rotas de Entrada ({routes.length})</CardTitle>
          <CardDescription>
            Lista de todas as rotas de entrada configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownToLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma rota encontrada</h3>
              <p className="text-gray-600">
                Crie sua primeira rota para começar a receber chamadas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoutes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{route.did} {route.caller_id_name && <span className="text-xs text-gray-500 ml-2">({route.caller_id_name})</span>}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {route.destination_type === 'ura' ? uras.find(u => u.id === route.destination_id)?.name : route.destination_id}
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

export default InboundRoutes; 