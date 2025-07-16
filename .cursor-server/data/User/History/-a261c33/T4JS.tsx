import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
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
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  User,
  Mail,
  Building
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  extension_id?: string;
  created_at: string;
}

const Users = () => {
  // const { user } = useAuth();
  // const tenantId = user?.tenant_id || '';
  const { tenantId } = useTenant();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'agent',
    password: ''
  });

  useEffect(() => {
    if (tenantId) loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getUsers(tenantId);
      console.log('[USERS] API response:', data);
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.error) {
        toast.error('Erro ao carregar usuários: ' + data.error);
        setUsers([]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error('Erro ao carregar usuários');
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await api.createUser(tenantId, formData);
        toast.success('Usuário criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(editingUser ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário');
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
      console.error('Error deleting user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'agent',
      password: ''
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: any } = {
      'superadmin': 'destructive',
      'admin': 'default',
      'agent': 'secondary'
    };
    const labels: { [key: string]: string } = {
      'superadmin': 'Super Admin',
      'admin': 'Administrador',
      'agent': 'Agente'
    };
    return <Badge variant={variants[role]}>{labels[role] || role}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'admin': return <UserCog className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <User className="w-10 h-10 mb-2" />
        Nenhum usuário encontrado para este tenant.
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações e permissões do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Permissão</Label>
                <Select value={formData.role} onValueChange={value => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha de acesso"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-dohoo-primary" />
            Usuários
          </h1>
          <p className="text-gray-600">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações e permissões do usuário
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Agente
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    {users.some(u => u.role === 'superadmin') && (
                      <SelectItem value="superadmin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Super Admin
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Permissões por Nível:</h4>
                <div className="space-y-1 text-gray-600">
                  <div><strong>Agente:</strong> Visualiza apenas próprio ramal</div>
                  <div><strong>Admin:</strong> Gerencia empresa completa</div>
                  <div><strong>Super Admin:</strong> Acesso total sistema</div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingUser ? 'Atualizar' : 'Criar Usuário'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  {user.name}
                </CardTitle>
                {getRoleBadge(user.role)}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Empresa:</span>
                  <div className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span className="text-xs">{user.tenant_id}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Criado em:</span>
                  <span className="text-xs">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(user)}
                    className="text-red-600 hover:text-red-700"
                    disabled={user.id === user?.id} // Não pode deletar a si mesmo
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

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UserCog className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum usuário cadastrado</h3>
              <p className="text-gray-600 mb-4">Adicione seu primeiro usuário</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users; 