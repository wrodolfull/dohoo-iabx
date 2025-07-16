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
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Phone,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  contact_email: string;
  plan_id: string;
  status: string;
  max_extensions: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  max_extensions: number;
  price: number;
}

const Tenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contact_email: '',
    plan_id: '',
    status: 'active'
  });

  // Só superadmin pode ver todas as empresas
  const canManageTenants = user?.role === 'superadmin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, plansData] = await Promise.all([
        api.getTenants(),
        api.getPlans()
      ]);
      setTenants(tenantsData || []);
      setPlans(plansData || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingTenant) {
        await api.updateTenant(editingTenant.id, formData);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await api.createTenant(formData);
        toast.success('Empresa criada com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(editingTenant ? 'Erro ao atualizar empresa' : 'Erro ao criar empresa');
      console.error('Error saving tenant:', error);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${tenant.name}"?`)) return;
    try {
      await api.deleteTenant(tenant.id);
      toast.success('Empresa excluída com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir empresa');
      console.error('Error deleting tenant:', error);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain,
      contact_email: tenant.contact_email,
      plan_id: tenant.plan_id,
      status: tenant.status
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      domain: '',
      contact_email: '',
      plan_id: '',
      status: 'active'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      'active': 'default',
      'suspended': 'destructive',
      'trial': 'secondary'
    };
    const labels: { [key: string]: string } = {
      'active': 'Ativa',
      'suspended': 'Suspensa',
      'trial': 'Trial'
    };
    return <Badge variant={variants[status]}>{labels[status] || status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Plano não encontrado';
  };

  if (!canManageTenants) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">Acesso Restrito</h3>
        <p className="text-gray-600">Apenas super administradores podem gerenciar empresas</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="w-8 h-8 text-dohoo-primary" />
            Empresas
          </h1>
          <p className="text-gray-600">
            Gerencie empresas clientes e suas configurações
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações da empresa cliente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  placeholder="Empresa LTDA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  placeholder="empresa.com.br"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">E-mail de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_id">Plano</Label>
                <Select 
                  value={formData.plan_id} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, plan_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          <span className="text-sm text-gray-500">
                            {plan.max_extensions} ramais
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Ativa
                      </div>
                    </SelectItem>
                    <SelectItem value="trial">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Trial
                      </div>
                    </SelectItem>
                    <SelectItem value="suspended">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Suspensa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingTenant ? 'Atualizar' : 'Criar Empresa'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <div className="text-sm text-gray-600">Total Empresas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {tenants.filter(t => t.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {tenants.filter(t => t.status === 'trial').length}
                </div>
                <div className="text-sm text-gray-600">Trial</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {tenants.filter(t => t.status === 'suspended').length}
                </div>
                <div className="text-sm text-gray-600">Suspensas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(tenant.status)}
                  {tenant.name}
                </CardTitle>
                {getStatusBadge(tenant.status)}
              </div>
              <CardDescription>{tenant.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Plano:</span>
                  <Badge variant="outline">{getPlanName(tenant.plan_id)}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ramais:</span>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{tenant.max_extensions} máx</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contato:</span>
                  <span className="text-xs">{tenant.contact_email}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Criada em:</span>
                  <span className="text-xs">
                    {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(tenant)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(tenant)}
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

      {tenants.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma empresa cadastrada</h3>
              <p className="text-gray-600 mb-4">Adicione sua primeira empresa cliente</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Empresa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tenants; 