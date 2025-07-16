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
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Building,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from '@/hooks/useTenant';

interface Extension {
  id: string;
  number: string;
  name: string;
  user_id: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const Extensions = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    user_id: '',
    is_active: true
  });

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [extensionsData, usersData] = await Promise.all([
        api.getExtensions(tenantId),
        api.getUsers(tenantId)
      ]);
      setExtensions(extensionsData || []);
      setUsers(usersData || []);
    } catch (error) {
      toast.error('Erro ao carregar ramais');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingExtension) {
        await api.updateExtension(editingExtension.id, formData);
        toast.success('Ramal atualizado com sucesso!');
      } else {
        await api.createExtension(tenantId, formData);
        toast.success('Ramal criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(editingExtension ? 'Erro ao atualizar ramal' : 'Erro ao criar ramal');
      console.error('Error saving extension:', error);
    }
  };

  const handleDelete = async (extension: Extension) => {
    if (!confirm(`Tem certeza que deseja excluir o ramal ${extension.number}?`)) return;
    try {
      await api.deleteExtension(extension.id);
      toast.success('Ramal excluído com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir ramal');
      console.error('Error deleting extension:', error);
    }
  };

  const handleEdit = (extension: Extension) => {
    setEditingExtension(extension);
    setFormData({
      number: extension.number,
      name: extension.name,
      user_id: extension.user_id,
      is_active: extension.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExtension(null);
    setFormData({
      number: '',
      name: '',
      user_id: '',
      is_active: true
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando ramais...</span>
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
            <Phone className="w-8 h-8 text-dohoo-primary" />
            Ramais
          </h1>
          <p className="text-gray-600">
            Gerencie os ramais e suas associações com usuários
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Ramal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExtension ? 'Editar Ramal' : 'Novo Ramal'}
              </DialogTitle>
              <DialogDescription>
                Configure um novo ramal e associe a um usuário
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="number">Número do Ramal</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="Ex: 1001"
                />
              </div>
              
              <div>
                <Label htmlFor="name">Nome do Ramal</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <Label htmlFor="user_id">Usuário</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({...formData, user_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{user.name}</span>
                          <span className="text-gray-500">({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.number || !formData.name}>
                {editingExtension ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Ramais */}
      <Card>
        <CardHeader>
          <CardTitle>Ramais ({extensions.length})</CardTitle>
          <CardDescription>
            Lista de todos os ramais configurados e suas associações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extensions.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum ramal encontrado</h3>
              <p className="text-gray-600">
                Crie seu primeiro ramal para começar a configurar o sistema
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {extensions.map((extension) => (
                <div key={extension.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{extension.number} - {extension.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getUserName(extension.user_id)}
                        <span className="text-gray-400">({getUserEmail(extension.user_id)})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={extension.is_active ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {extension.is_active ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {extension.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(extension)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(extension)}
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

export default Extensions;
