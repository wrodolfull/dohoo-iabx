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
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface OutboundRoute {
  id: string;
  preset?: string;
  regex_pattern?: string;
  techprefix?: string;
  cn_domain?: string;
  trunk: string;
  trunk_fallback?: string;
  caller_id_number?: string;
  caller_id_name?: string;
  destination_type?: 'extension' | 'ringgroup' | 'custom';
  destination_id?: string;
  is_active?: boolean;
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
  const { tenantId } = useTenant();
  const [routes, setRoutes] = useState<OutboundRoute[]>([]);
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OutboundRoute | null>(null);
  const [ringGroups, setRingGroups] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    preset: '',
    regex_pattern: '',
    techprefix: '',
    cn_domain: '',
    trunk: '',
    trunk_fallback: '',
    caller_id_number: '',
    caller_id_name: '',
    destination_type: 'extension',
    destination_id: '',
    is_active: true,
    priority: 1
  });

  useEffect(() => {
    if (tenantId) {
      loadData();
      api.getRingGroups(tenantId).then(setRingGroups);
      api.getExtensions(tenantId).then(setExtensions);
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
    if (!confirm(`Tem certeza que deseja excluir a rota para ${route.preset || route.regex_pattern}?`)) return;
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
      preset: route.preset || '',
      regex_pattern: route.regex_pattern || '',
      techprefix: route.techprefix || '',
      cn_domain: route.cn_domain || '',
      trunk: route.trunk,
      trunk_fallback: route.trunk_fallback || '',
      caller_id_number: route.caller_id_number || '',
      caller_id_name: route.caller_id_name || '',
      destination_type: route.destination_type || 'extension',
      destination_id: route.destination_id || '',
      is_active: route.is_active !== false,
      priority: route.priority
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      preset: '',
      regex_pattern: '',
      techprefix: '',
      cn_domain: '',
      trunk: '',
      trunk_fallback: '',
      caller_id_number: '',
      caller_id_name: '',
      destination_type: 'extension',
      destination_id: '',
      is_active: true,
      priority: 1
    });
  };

  const getTrunkName = (trunkId: string) => {
    const trunk = trunks.find(t => t.id === trunkId);
    return trunk ? trunk.name : trunkId;
  };

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
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? 'Editar Rota' : 'Nova Rota de Saída'}
              </DialogTitle>
              <DialogDescription>
                Configure como as chamadas serão direcionadas para provedores externos
              </DialogDescription>
            </DialogHeader>
            <Accordion type="multiple" defaultValue={["basico"]} className="space-y-2">
              <AccordionItem value="basico">
                <AccordionTrigger>Básico</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preset">Preset</Label>
                      <Select
                        value={formData.preset}
                        onValueChange={value => setFormData({ ...formData, preset: value === 'none' ? '' : value, regex_pattern: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um preset ou use regex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="ldn">LDN</SelectItem>
                          <SelectItem value="movel">Móvel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="regex_pattern">Regex Customizado</Label>
                      <Input
                        id="regex_pattern"
                        value={formData.regex_pattern}
                        onChange={e => setFormData({ ...formData, regex_pattern: e.target.value, preset: '' })}
                        placeholder="Ex: ^([0-9]{10,11})$"
                        disabled={!!formData.preset}
                      />
                    </div>
                    <div>
                      <Label htmlFor="trunk">Tronco Principal</Label>
                      <Select
                        value={formData.trunk}
                        onValueChange={value => setFormData({ ...formData, trunk: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tronco principal" />
                        </SelectTrigger>
                        <SelectContent>
                          {trunks.map(trunk => (
                            trunk.id && <SelectItem key={trunk.id} value={trunk.id}>{trunk.name}</SelectItem>
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
                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                        id="is_active"
                      />
                      <Label htmlFor="is_active">Ativo</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="avancado">
                <AccordionTrigger>Avançado</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="techprefix">Techprefix (opcional)</Label>
                      <Input
                        id="techprefix"
                        value={formData.techprefix}
                        onChange={e => setFormData({ ...formData, techprefix: e.target.value })}
                        placeholder="Ex: 31"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cn_domain">CN_DOMAIN/DDI (opcional)</Label>
                      <Input
                        id="cn_domain"
                        value={formData.cn_domain}
                        onChange={e => setFormData({ ...formData, cn_domain: e.target.value })}
                        placeholder="Ex: 31"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trunk_fallback">Tronco Fallback (opcional)</Label>
                      <Select
                        value={formData.trunk_fallback}
                        onValueChange={value => setFormData({ ...formData, trunk_fallback: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tronco de fallback" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {trunks.map(trunk => (
                            trunk.id && <SelectItem key={trunk.id} value={trunk.id}>{trunk.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="caller_id_number">Caller ID Number (opcional)</Label>
                      <Input
                        id="caller_id_number"
                        value={formData.caller_id_number}
                        onChange={e => setFormData({ ...formData, caller_id_number: e.target.value })}
                        placeholder="Ex: 31999999999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="caller_id_name">Caller ID Name (opcional)</Label>
                      <Input
                        id="caller_id_name"
                        value={formData.caller_id_name}
                        onChange={e => setFormData({ ...formData, caller_id_name: e.target.value })}
                        placeholder="Ex: Empresa X"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="destino">
                <AccordionTrigger>Destino</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="destination_type">Destino</Label>
                      <Select
                        value={formData.destination_type}
                        onValueChange={value => setFormData({ ...formData, destination_type: value, destination_id: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="extension">Ramal</SelectItem>
                          <SelectItem value="ringgroup">Contact Center</SelectItem>
                          <SelectItem value="custom">Custom (número ou SIP URI)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.destination_type === 'extension' && (
                      <div>
                        <Label htmlFor="destination_id">Ramal</Label>
                        <Select
                          value={formData.destination_id}
                          onValueChange={value => setFormData({ ...formData, destination_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ramal" />
                          </SelectTrigger>
                          <SelectContent>
                            {extensions.map(ext => (
                              ext.id && <SelectItem key={ext.id} value={ext.id}>{ext.number} - {ext.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.destination_type === 'ringgroup' && (
                      <div>
                        <Label htmlFor="destination_id">Contact Center</Label>
                        <Select
                          value={formData.destination_id}
                          onValueChange={value => setFormData({ ...formData, destination_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {ringGroups.map(rg => (
                              rg.id && <SelectItem key={rg.id} value={rg.id}>{rg.number} - {rg.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.destination_type === 'custom' && (
                      <div>
                        <Label htmlFor="destination_id">Destino Customizado</Label>
                        <Input
                          id="destination_id"
                          value={formData.destination_id}
                          onChange={e => setFormData({ ...formData, destination_id: e.target.value })}
                          placeholder="Ex: 0800123456 ou SIP URI"
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-4 pb-2 mt-4 border-t z-10">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!(formData.preset || formData.regex_pattern) || !formData.trunk}>
                {editingRoute ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                      <div className="font-medium">
                        {route.preset ? `Preset: ${route.preset}` : route.regex_pattern ? `Regex: ${route.regex_pattern}` : ''}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        {getTrunkName(route.trunk)}
                        {route.trunk_fallback && (
                          <span className="ml-2 text-xs text-gray-500">Fallback: {getTrunkName(route.trunk_fallback)}</span>
                        )}
                        <Badge variant="outline">Prioridade: {route.priority}</Badge>
                        {route.is_active === false && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
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