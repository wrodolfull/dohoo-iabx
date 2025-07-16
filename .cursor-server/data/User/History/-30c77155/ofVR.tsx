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
  Server,
  Phone,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface OutboundRoute {
  id: string;
  prefix: string;
  trunk_id: string;
  rule: string;
  tenant_id: string;
  created_at: string;
}

interface Trunk {
  id: string;
  name: string;
  ip_domain: string;
}

const OutboundRoutes = () => {
  const { user } = useAuth();
  const tenantId = user?.company || '';
  const [routes, setRoutes] = useState<OutboundRoute[]>([]);
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OutboundRoute | null>(null);
  const [formData, setFormData] = useState({
    prefix: '',
    trunk_id: '',
    rule: ''
  });

  useEffect(() => {
    loadData();
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
    if (!confirm(`Tem certeza que deseja excluir a rota para o prefixo ${route.prefix}?`)) return;
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
      prefix: route.prefix,
      trunk_id: route.trunk_id,
      rule: route.rule
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      prefix: '',
      trunk_id: '',
      rule: ''
    });
  };

  const getTrunkName = (trunkId: string) => {
    const trunk = trunks.find(t => t.id === trunkId);
    return trunk ? trunk.name : 'Tronco não encontrado';
  };

  const getRouteTypeLabel = (prefix: string) => {
    if (prefix.startsWith('0')) return 'Local';
    if (prefix.startsWith('0800')) return 'Gratuito';
    if (prefix.startsWith('9')) return 'Celular';
    if (prefix.startsWith('00')) return 'Internacional';
    return 'Personalizado';
  };

  const getRouteTypeBadge = (prefix: string) => {
    const type = getRouteTypeLabel(prefix);
    const variants: { [key: string]: any } = {
      'Local': 'default',
      'Celular': 'secondary',
      'Gratuito': 'destructive',
      'Internacional': 'outline',
      'Personalizado': 'outline'
    };
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>;
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
            <ArrowUpFromLine className="w-8 h-8 text-dohoo-primary" />
            Rotas de Saída
          </h1>
          <p className="text-gray-600">
            Configure regras de discagem e roteamento para chamadas externas
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
                {editingRoute ? 'Editar Rota' : 'Nova Rota de Saída'}
              </DialogTitle>
              <DialogDescription>
                Configure regras para roteamento de chamadas externas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefixo/Padrão</Label>
                <Input
                  id="prefix"
                  placeholder="Ex: 9, 0, 00"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Prefixo para identificar o tipo de chamada
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trunk_id">Tronco SIP</Label>
                <Select 
                  value={formData.trunk_id} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, trunk_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tronco" />
                  </SelectTrigger>
                  <SelectContent>
                    {trunks.map((trunk) => (
                      <SelectItem key={trunk.id} value={trunk.id}>
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          {trunk.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule">Regra de Discagem</Label>
                <Input
                  id="rule"
                  placeholder="Ex: ^9(\d+)$ -> $1"
                  value={formData.rule}
                  onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Regex para transformar o número discado
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Exemplos de Regras:</h4>
                <div className="space-y-1 text-gray-600">
                  <div><code>^9(\d{8,9})$</code> - Celulares (remove 9)</div>
                  <div><code>^0(\d{10})$</code> - Locais (remove 0)</div>
                  <div><code>^00(\d+)$</code> - Internacional (remove 00)</div>
                </div>
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
                  <Phone className="w-5 h-5" />
                  Prefixo {route.prefix}
                </CardTitle>
                {getRouteTypeBadge(route.prefix)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">Tronco:</span>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    {getTrunkName(route.trunk_id)}
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600">Regra:</span>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                    {route.rule || 'Nenhuma transformação'}
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
              <ArrowUpFromLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma rota configurada</h3>
              <p className="text-gray-600 mb-4">Configure sua primeira rota de saída</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Rota
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Guia de Configuração</CardTitle>
          <CardDescription>
            Exemplos de configurações comuns de rotas de saída
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Padrões Comuns</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900">Celulares (9 + 8-9 dígitos)</div>
                  <div className="text-blue-700">Prefixo: 9 | Regra: ^9(\d{8,9})$</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900">Fixos Locais (0 + 10 dígitos)</div>
                  <div className="text-green-700">Prefixo: 0 | Regra: ^0(\d{10})$</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium text-purple-900">Internacional (00 + código)</div>
                  <div className="text-purple-700">Prefixo: 00 | Regra: ^00(\d+)$</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Como Funcionam as Regras</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-mono">^9(\d{8})$</div>
                  <div className="text-gray-600">Captura números que começam com 9 seguidos de 8 dígitos</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-mono">(\d+)</div>
                  <div className="text-gray-600">Captura os dígitos em um grupo</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-mono">$1</div>
                  <div className="text-gray-600">Substitui pelo primeiro grupo capturado</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutboundRoutes; 