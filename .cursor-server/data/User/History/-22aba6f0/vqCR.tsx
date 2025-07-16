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
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  Globe,
  Shield,
  Activity,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Trunk {
  id: string;
  name: string;
  ip_domain: string;
  transport: string;
  port: number;
  codecs: string;
  auth_user: string;
  auth_password: string;
  tenant_id: string;
  created_at: string;
}

const Trunks = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id || '';
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrunk, setEditingTrunk] = useState<Trunk | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ip_domain: '',
    transport: 'udp',
    port: 5060,
    codecs: 'PCMU,PCMA,G729',
    auth_user: '',
    auth_password: ''
  });

  useEffect(() => {
    loadTrunks();
  }, [tenantId]);

  const loadTrunks = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getTrunks(tenantId);
      setTrunks(data || []);
    } catch (error) {
      toast.error('Erro ao carregar troncos');
      console.error('Error loading trunks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingTrunk) {
        await api.updateTrunk(editingTrunk.id, formData);
        toast.success('Tronco atualizado com sucesso!');
      } else {
        await api.createTrunk(tenantId, formData);
        toast.success('Tronco criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadTrunks();
    } catch (error) {
      toast.error(editingTrunk ? 'Erro ao atualizar tronco' : 'Erro ao criar tronco');
      console.error('Error saving trunk:', error);
    }
  };

  const handleDelete = async (trunk: Trunk) => {
    if (!confirm(`Tem certeza que deseja excluir o tronco "${trunk.name}"?`)) return;
    try {
      await api.deleteTrunk(trunk.id);
      toast.success('Tronco excluído com sucesso!');
      loadTrunks();
    } catch (error) {
      toast.error('Erro ao excluir tronco');
      console.error('Error deleting trunk:', error);
    }
  };

  const handleEdit = (trunk: Trunk) => {
    setEditingTrunk(trunk);
    setFormData({
      name: trunk.name,
      ip_domain: trunk.ip_domain,
      transport: trunk.transport,
      port: trunk.port,
      codecs: trunk.codecs,
      auth_user: trunk.auth_user,
      auth_password: trunk.auth_password
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTrunk(null);
    setFormData({
      name: '',
      ip_domain: '',
      transport: 'udp',
      port: 5060,
      codecs: 'PCMU,PCMA,G729',
      auth_user: '',
      auth_password: ''
    });
  };

  const getStatusBadge = (trunk: Trunk) => {
    // Simulação de status baseado em dados
    const isOnline = Math.random() > 0.3;
    return (
      <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando troncos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Server className="w-8 h-8 text-dohoo-primary" />
            Troncos SIP
          </h1>
          <p className="text-gray-600">
            Configure provedores de telefonia e conectividade externa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tronco
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTrunk ? 'Editar Tronco' : 'Novo Tronco SIP'}
              </DialogTitle>
              <DialogDescription>
                Configure a conexão com seu provedor de telefonia
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Tronco</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Provedor Principal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip_domain">Servidor/IP</Label>
                  <Input
                    id="ip_domain"
                    placeholder="sip.provedor.com"
                    value={formData.ip_domain}
                    onChange={(e) => setFormData({ ...formData, ip_domain: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transport">Protocolo</Label>
                  <Select value={formData.transport} onValueChange={(value) => 
                    setFormData({ ...formData, transport: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="5060"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5060 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codecs">Codecs</Label>
                <Input
                  id="codecs"
                  placeholder="PCMU,PCMA,G729"
                  value={formData.codecs}
                  onChange={(e) => setFormData({ ...formData, codecs: e.target.value })}
                />
                <p className="text-xs text-gray-500">Separados por vírgula</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auth_user">Usuário</Label>
                  <Input
                    id="auth_user"
                    placeholder="usuario_sip"
                    value={formData.auth_user}
                    onChange={(e) => setFormData({ ...formData, auth_user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth_password">Senha</Label>
                  <Input
                    id="auth_password"
                    type="password"
                    placeholder="senha_sip"
                    value={formData.auth_password}
                    onChange={(e) => setFormData({ ...formData, auth_password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingTrunk ? 'Atualizar' : 'Criar Tronco'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trunks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trunks.map((trunk) => (
          <Card key={trunk.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {trunk.name}
                </CardTitle>
                {getStatusBadge(trunk)}
              </div>
              <CardDescription className="font-mono text-sm">
                {trunk.ip_domain}:{trunk.port}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Protocolo:</span>
                  <Badge variant="outline">
                    {trunk.transport.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Usuário:</span>
                  <span className="font-mono">{trunk.auth_user || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Codecs:</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {trunk.codecs.split(',').length} codecs
                  </span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(trunk)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(trunk)}
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

      {trunks.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Server className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum tronco configurado</h3>
              <p className="text-gray-600 mb-4">Configure seu primeiro provedor de telefonia</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Tronco
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Trunks;
