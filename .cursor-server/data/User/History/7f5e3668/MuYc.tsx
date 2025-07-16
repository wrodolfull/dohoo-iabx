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
  Target
} from "lucide-react";
import { toast } from "sonner";

interface InboundRoute {
  id: string;
  did: string;
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
  const tenantId = user?.company || '';
  const [routes, setRoutes] = useState<InboundRoute[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [uras, setUras] = useState<URA[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<InboundRoute | null>(null);
  const [formData, setFormData] = useState({
    did: '',
    destination_type: 'extension',
    destination_id: ''
  });

  useEffect(() => {
    loadData();
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
      destination_type: route.destination_type,
      destination_id: route.destination_id
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      did: '',
      destination_type: 'extension',
      destination_id: ''
    });
  };

  const getDestinationName = (route: InboundRoute) => {
    switch (route.destination_type) {
      case 'extension':
        const ext = extensions.find(e => e.id === route.destination_id);
        return ext ? `${ext.number} - ${ext.name}` : route.destination_id;
      case 'ringgroup':
        const group = ringGroups.find(g => g.id === route.destination_id);
        return group ? group.name : route.destination_id;
      case 'ura':
        const ura = uras.find(u => u.id === route.destination_id);
        return ura ? ura.name : route.destination_id;
      default:
        return route.destination_id;
    }
  };

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case 'extension': return <Phone className="w-4 h-4" />;
      case 'ringgroup': return <Users className="w-4 h-4" />;
      case 'ura': return <Bot className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDestinationOptions = () => {
    switch (formData.destination_type) {
      case 'extension':
        return extensions.map(ext => ({
          value: ext.id,
          label: `${ext.number} - ${ext.name}`
        }));
      case 'ringgroup':
        return ringGroups.map(group => ({
          value: group.id,
          label: group.name
        }));
      case 'ura':
        return uras.map(ura => ({
          value: ura.id,
          label: ura.name
        }));
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando rotas...</div>
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
            Configure o roteamento de chamadas recebidas por DID
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? 'Editar Rota' : 'Nova Rota de Entrada'}
              </DialogTitle>
              <DialogDescription>
                Configure para onde as chamadas devem ser direcionadas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="did">Número DID</Label>
                <Input
                  id="did"
                  placeholder="Ex: 1140001234"
                  value={formData.did}
                  onChange={(e) => setFormData({ ...formData, did: e.target.value })}
                />
                <p className="text-xs text-gray-500">Número recebido do provedor</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_type">Tipo de Destino</Label>
                <Select 
                  value={formData.destination_type} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, destination_type: value, destination_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extension">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Ramal
                      </div>
                    </SelectItem>
                    <SelectItem value="ringgroup">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Grupo de Toque
                      </div>
                    </SelectItem>
                    <SelectItem value="ura">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        URA
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_id">Destino</Label>
                <Select 
                  value={formData.destination_id} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, destination_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDestinationOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingRoute ? 'Atualizar' : 'Criar Rota'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5" />
                  {route.did}
                </CardTitle>
                <Badge variant="default">Ativa</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getDestinationIcon(route.destination_type)}
                    {route.destination_type === 'extension' ? 'Ramal' :
                     route.destination_type === 'ringgroup' ? 'Grupo' : 'URA'}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600">Destino:</span>
                  <div className="font-medium mt-1">
                    {getDestinationName(route)}
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(route)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ArrowDownToLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma rota configurada</h3>
              <p className="text-gray-600 mb-4">Configure sua primeira rota de entrada</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Rota
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InboundRoutes; 