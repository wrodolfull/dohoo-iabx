import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Server, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Globe,
  Shield,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface Trunk {
  id: string;
  name: string;
  host: string;
  username: string;
  password: string;
  port: number;
  tenant_id: string;
  created_at: string;
  created_by: string;
}

const Trunks = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrunk, setEditingTrunk] = useState<Trunk | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
    port: 5060
  });

  useEffect(() => {
    loadTrunks();
  }, [tenantId]);

  const loadTrunks = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getTrunks(tenantId);
      setTrunks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar troncos');
      console.error('Error loading trunks:', error);
      setTrunks([]);
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
    if (!confirm(`Tem certeza que deseja excluir o tronco ${trunk.name}?`)) return;
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
      host: trunk.host,
      username: trunk.username,
      password: trunk.password,
      port: trunk.port
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTrunk(null);
    setFormData({
      name: '',
      host: '',
      username: '',
      password: '',
      port: 5060
    });
  };

  const filteredTrunks = (trunks || []).filter(trunk =>
    trunk?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trunk?.host?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Gerencie as conexões com provedores SIP externos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Tronco
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTrunk ? 'Editar Tronco SIP' : 'Novo Tronco SIP'}
              </DialogTitle>
              <DialogDescription>
                {editingTrunk ? 'Atualize as informações do tronco' : 'Configure um novo tronco SIP'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Tronco</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Provedor XYZ"
                />
              </div>
              
              <div>
                <Label htmlFor="host">Host/IP</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="sip.provedor.com.br"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario_sip"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="senha_sip"
                />
              </div>
              
              <div>
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5060 })}
                  placeholder="5060"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingTrunk ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tenant Selector for Superadmin */}
      {user?.role === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle>Empresa Atual</CardTitle>
            <CardDescription>
              A empresa atual para gerenciar os troncos SIP é:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{tenantId ? `Tenant ${tenantId.slice(0, 8)}` : 'Nenhum tenant selecionado'}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trunks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Troncos Configurados</CardTitle>
          <CardDescription>
            Lista de todos os troncos SIP configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrunks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {tenantId ? 'Nenhum tronco encontrado' : 'Selecione uma empresa para visualizar os troncos'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Porta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrunks.map((trunk) => (
                  <TableRow key={trunk.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-gray-400" />
                        {trunk.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {trunk.host}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        {trunk.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {trunk.port}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        <Activity className="w-3 h-3 mr-1" />
                        Conectado
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(trunk)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trunk)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Trunks;
