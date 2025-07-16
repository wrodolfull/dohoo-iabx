import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Users, Plus, Edit, Trash2, Search, Phone, Clock, Shuffle } from "lucide-react";
import { toast } from "sonner";

interface RingGroup {
  id: string;
  name: string;
  type: 'simultaneous' | 'sequential';
  tenant_id: string;
  created_at: string;
}

interface Extension {
  id: string;
  name: string;
  number: string;
}

const RingGroups = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id || '';
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RingGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'simultaneous' as 'simultaneous' | 'sequential'
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [groupsData, extensionsData] = await Promise.all([
        api.getRingGroups(tenantId),
        api.getExtensions(tenantId)
      ]);
      setRingGroups(Array.isArray(groupsData) ? groupsData : []);
      setExtensions(Array.isArray(extensionsData) ? extensionsData : []);
    } catch (error) {
      toast.error('Erro ao carregar grupos de toque');
      console.error('Error loading data:', error);
      // Garantir que os arrays sejam definidos mesmo em caso de erro
      setRingGroups([]);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingGroup) {
        await api.updateRingGroup(editingGroup.id, formData);
        toast.success('Grupo atualizado com sucesso!');
      } else {
        await api.createRingGroup(tenantId, formData);
        toast.success('Grupo criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(editingGroup ? 'Erro ao atualizar grupo' : 'Erro ao criar grupo');
      console.error('Error saving ring group:', error);
    }
  };

  const handleDelete = async (group: RingGroup) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) return;
    try {
      await api.deleteRingGroup(group.id);
      toast.success('Grupo excluído com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir grupo');
      console.error('Error deleting ring group:', error);
    }
  };

  const handleEdit = (group: RingGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      type: group.type
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      type: 'simultaneous'
    });
  };

  const getTypeIcon = (type: string) => {
    return type === 'simultaneous' ? <Shuffle className="w-4 h-4" /> : <Clock className="w-4 h-4" />;
  };

  const getTypeLabel = (type: string) => {
    return type === 'simultaneous' ? 'Simultâneo' : 'Sequencial';
  };

  const filteredGroups = (ringGroups || []).filter(group =>
    group?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando grupos...</div>
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
            Configure grupos de ramais para distribuir chamadas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do grupo de toque
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Atendimento Comercial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Toque</Label>
                <Select value={formData.type} onValueChange={(value: 'simultaneous' | 'sequential') => 
                  setFormData({ ...formData, type: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simultaneous">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        Simultâneo
                      </div>
                    </SelectItem>
                    <SelectItem value="sequential">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Sequencial
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingGroup ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar grupos por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {group.name}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getTypeIcon(group.type)}
                  {getTypeLabel(group.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{getTypeLabel(group.type)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ramais:</span>
                  <Badge variant="secondary">
                    0 configurados
                  </Badge>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(group)}
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

      {(!ringGroups || ringGroups.length === 0) && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum grupo cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro grupo de toque</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RingGroups;
