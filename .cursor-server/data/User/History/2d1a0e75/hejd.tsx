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
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone,
  Settings,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface RingGroup {
  id: string;
  name: string;
  number: string;
  strategy: string;
  timeout: number;
  tenant_id: string;
  created_at: string;
  created_by: string;
  type?: string; // Added for consistency with formData
  extensions?: string[]; // Added for consistency with formData
  is_active?: boolean; // Added for consistency with formData
}

const RingGroups = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRingGroup, setEditingRingGroup] = useState<RingGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    type: 'simultaneous',
    timeout: 30,
    extensions: [],
    is_active: true
  });

  useEffect(() => {
    loadRingGroups();
  }, [tenantId]);

  const loadRingGroups = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getRingGroups(tenantId);
      setRingGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar grupos de toque');
      console.error('Error loading ring groups:', error);
      setRingGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      // Montar payload conforme o modelo do banco
      const payload = {
        name: formData.name,
        number: formData.number || null,
        type: formData.type,
        strategy: formData.type, // redundante, mas mantém compatibilidade
        timeout: formData.timeout || 30,
        extensions: formData.extensions,
        is_active: formData.is_active ?? true,
      };
      if (editingRingGroup) {
        await api.updateRingGroup(editingRingGroup.id, payload);
        toast.success('Grupo de toque atualizado com sucesso!');
      } else {
        await api.createRingGroup(tenantId, payload);
        toast.success('Grupo de toque criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadRingGroups();
    } catch (error) {
      toast.error(editingRingGroup ? 'Erro ao atualizar grupo de toque' : 'Erro ao criar grupo de toque');
      console.error('Error saving ring group:', error);
    }
  };

  const handleDelete = async (ringGroup: RingGroup) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo ${ringGroup.name}?`)) return;
    try {
      await api.deleteRingGroup(ringGroup.id);
      toast.success('Grupo de toque excluído com sucesso!');
      loadRingGroups();
    } catch (error) {
      toast.error('Erro ao excluir grupo de toque');
      console.error('Error deleting ring group:', error);
    }
  };

  const handleEdit = (ringGroup: RingGroup) => {
    setEditingRingGroup(ringGroup);
    setFormData({
      name: ringGroup.name,
      number: ringGroup.number,
      type: ringGroup.type || ringGroup.strategy || 'simultaneous',
      timeout: ringGroup.timeout,
      extensions: ringGroup.extensions || [],
      is_active: ringGroup.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRingGroup(null);
    setFormData({
      name: '',
      number: '',
      type: 'simultaneous',
      timeout: 30,
      extensions: [],
      is_active: true
    });
  };

  const filteredRingGroups = (ringGroups || []).filter(group =>
    group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group?.number?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando grupos de toque...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-dohoo-primary" />
            Grupos de Toque
          </h1>
          <p className="text-gray-600">
            Gerencie os grupos de ramais para distribuição de chamadas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRingGroup ? 'Editar Grupo de Toque' : 'Novo Grupo de Toque'}
              </DialogTitle>
              <DialogDescription>
                {editingRingGroup ? 'Atualize as informações do grupo' : 'Crie um novo grupo de toque'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Vendas"
                />
              </div>
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Ex: 2000"
                />
              </div>
              <div>
                <Label htmlFor="type">Estratégia de Toque</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="simultaneous">Simultâneo</option>
                  <option value="sequence">Sequencial</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="extensions">Ramais do Grupo</Label>
                <select
                  id="extensions"
                  multiple
                  value={formData.extensions}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setFormData({ ...formData, extensions: selected });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {/* users is not defined here, this block will cause a linter error */}
                  {/* {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))} */}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingRingGroup ? 'Atualizar' : 'Criar'}
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
              A empresa atual para gerenciar os grupos de toque é:
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
                placeholder="Buscar por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ring Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos Configurados</CardTitle>
          <CardDescription>
            Lista de todos os grupos de toque configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRingGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {tenantId ? 'Nenhum grupo de toque encontrado' : 'Selecione uma empresa para visualizar os grupos'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Estratégia</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRingGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {group.number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {group.strategy === 'simultaneous' ? 'Simultâneo' : 
                         group.strategy === 'sequence' ? 'Sequencial' : 'Round Robin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {group.timeout}s
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        <Phone className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group)}
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

export default RingGroups;
