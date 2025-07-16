import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Users, Phone, Settings, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface User {
  id?: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'agent';
  extension?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserFormProps {
  user?: User | null;
  tenantId: string;
  onSave?: (user: User) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  tenantId, 
  onSave, 
  onCancel, 
  mode = 'create' 
}) => {
  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    name: '',
    role: 'agent',
    extension: '',
    ...user
  });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createFreeSwitchUser, setCreateFreeSwitchUser] = useState(true);
  const [availableExtensions, setAvailableExtensions] = useState<{ id: string; number: string; name: string }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualizar formData quando user mudar
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'agent',
        extension: user.extension || '',
      });
    }
  }, [user]);

  // Buscar ramais existentes do tenant
  useEffect(() => {
    if (mode === 'create') {
      fetchAvailableExtensions();
    }
  }, [mode, tenantId]);

  const fetchAvailableExtensions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      const response = await fetch(`${apiUrl}/tenants/${tenantId}/extensions`);
      
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas ramais não vinculados a usuários
        const availableExts = data.filter((ext: any) => !ext.user_id);
        setAvailableExtensions(availableExts);
      }
    } catch (error) {
      console.error('Erro ao buscar ramais:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.name) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (mode === 'create') {
      if (!password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    if (formData.extension && !/^\d+$/.test(formData.extension)) {
      newErrors.extension = 'Ramal deve conter apenas números';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://31.97.250.190:3001';
      
      // Só envia password se for criação
      const submitData = {
        ...formData,
        tenant_id: tenantId,
        createFreeSwitchUser,
        ...(mode === 'create' && { password })
      };

      const url = mode === 'create' 
        ? `${apiUrl}/tenants/${tenantId}/users`
        : `${apiUrl}/users/${user?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao salvar usuário');
      }

      toast.success(
        mode === 'create' 
          ? `Usuário criado com sucesso! ${responseData.extension ? `Ramal: ${responseData.extension}` : ''}`
          : 'Usuário atualizado com sucesso!'
      );

      onSave?.(responseData);

    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {mode === 'create' ? 'Criar Novo Usuário' : 'Editar Usuário'}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Preencha os dados para criar um novo usuário. Você pode associar um ramal existente ou criar sem ramal.'
              : 'Edite as informações do usuário'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: João Silva"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="usuario@empresa.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Senha (apenas para criação) */}
            {mode === 'create' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Papel/Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Papel do Usuário</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getRoleColor('agent')}>
                        {getRoleIcon('agent')}
                        <span className="ml-1">Agente</span>
                      </Badge>
                      <span className="text-sm text-gray-600">- Atendimento básico</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getRoleColor('admin')}>
                        {getRoleIcon('admin')}
                        <span className="ml-1">Admin</span>
                      </Badge>
                      <span className="text-sm text-gray-600">- Gestão completa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="superadmin">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getRoleColor('superadmin')}>
                        {getRoleIcon('superadmin')}
                        <span className="ml-1">Super Admin</span>
                      </Badge>
                      <span className="text-sm text-gray-600">- Acesso total</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configurações de Ramal */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-blue-900">Configurações de Ramal</h3>
              </div>

              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="extension">Ramal (opcional)</Label>
                  {availableExtensions.length > 0 ? (
                    <Select
                      value={formData.extension || 'none'}
                      onValueChange={(value) => handleInputChange('extension', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ramal (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum ramal</SelectItem>
                        {availableExtensions.map((ext) => (
                          <SelectItem key={ext.id} value={ext.number}>
                            {ext.number} - {ext.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhum ramal disponível. Crie um ramal no menu <b>Ramais</b> e depois associe ao usuário.
                      </AlertDescription>
                    </Alert>
                  )}
                  {errors.extension && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.extension}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    Deixe vazio se não quiser atribuir ramal agora
                  </p>
                </div>
              )}

              {mode === 'edit' && (
                <div className="space-y-2">
                  <Label htmlFor="extension">Ramal (opcional)</Label>
                  <Input
                    id="extension"
                    value={formData.extension}
                    onChange={(e) => handleInputChange('extension', e.target.value)}
                    placeholder="Ex: 1001"
                    className={errors.extension ? 'border-red-500' : ''}
                  />
                  {errors.extension && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.extension}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    Deixe vazio se não quiser atribuir ramal
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="createFreeSwitchUser"
                  checked={createFreeSwitchUser}
                  onCheckedChange={setCreateFreeSwitchUser}
                />
                <Label htmlFor="createFreeSwitchUser" className="text-sm">
                  Provisionar no FreeSWITCH
                </Label>
              </div>
              {createFreeSwitchUser && (
                <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                  ℹ️ O usuário será configurado automaticamente no FreeSWITCH com senha SIP gerada
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === 'create' ? 'Criando...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm; 