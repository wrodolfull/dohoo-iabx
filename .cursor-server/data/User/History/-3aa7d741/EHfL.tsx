import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Shield, 
  Settings, 
  Loader2,
  RefreshCw,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  ChevronDown
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import UserForm from '@/components/UserForm';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'agent';
  extension?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Usar tenant do usuário atual (para admin) ou permitir seleção (para superadmin)
  const tenantId = currentUser?.tenant_id || '1'; // Fallback para desenvolvimento
  
  console.log('👤 Usuário atual:', currentUser);
  console.log('🏢 Tenant ID sendo usado:', tenantId);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    setLoading(true);
    console.log('🔍 Iniciando busca de usuários...');
    console.log('📋 Tenant ID:', tenantId);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      const url = `${apiUrl}/tenants/${tenantId}/users`;
      console.log('🌐 URL da requisição:', url);
      
      const response = await fetch(url);
      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        setUsers(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', response.status, errorText);
        toast.error(`Erro ao carregar usuários: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      console.log('🏁 Finalizando busca de usuários');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Usuário removido com sucesso');
        fetchUsers(); // Recarregar lista
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao remover usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao remover usuário');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUserSaved = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedUser(null);
    fetchUsers(); // Recarregar lista
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.extension && user.extension.includes(searchTerm));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 border-red-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'agent': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-3 h-3" />;
      case 'admin': return <Settings className="w-3 h-3" />;
      case 'agent': return <Users className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportUsers = () => {
    const csv = [
      ['Nome', 'Email', 'Papel', 'Ramal', 'Data Criação'].join(','),
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.extension || '',
        formatDate(user.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando usuários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">
            Gerencie usuários, ramais e permissões
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchUsers}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={exportUsers}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema com ramal automático
                </DialogDescription>
              </DialogHeader>
              <UserForm
                mode="create"
                tenantId={tenantId}
                onSave={handleUserSaved}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Com Ramais</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.extension).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Agentes</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'agent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou ramal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os papéis</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="agent">Agente</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Lista de todos os usuários e suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Ramal</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Users className="w-8 h-8" />
                        <p>Nenhum usuário encontrado</p>
                        {searchTerm && (
                          <p className="text-sm">
                            Tente ajustar os filtros de busca
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {user.extension ? (
                          <div className="flex items-center gap-1 text-green-700">
                            <Phone className="w-3 h-3" />
                            <span className="font-medium">{user.extension}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sem ramal</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">{formatDate(user.created_at)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditDialog(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário <strong>{user.name}</strong>?
                                    Esta ação não pode ser desfeita e removerá:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                      <li>Conta de acesso ao sistema</li>
                                      <li>Configurações do ramal {user.extension && `(${user.extension})`}</li>
                                      <li>Histórico de atividades</li>
                                    </ul>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={deletingUserId === user.id}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deletingUserId === user.id ? (
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Excluindo...
                                      </div>
                                    ) : (
                                      'Excluir Usuário'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              mode="edit"
              user={selectedUser}
              tenantId={tenantId}
              onSave={handleUserSaved}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement; 