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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  XCircle,
  Server,
  Settings,
  Globe,
  Shield,
  Activity,
  Search
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
  // FreeSWITCH integration fields
  sip_domain?: string;
  context?: string;
  dialplan?: string;
  codec_prefs?: string;
  extension_range_start?: number;
  extension_range_end?: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contact_email: '',
    plan_id: '',
    status: 'active',
    sip_domain: '',
    context: '',
    dialplan: 'XML',
    codec_prefs: 'PCMU,PCMA,G729',
    extension_range_start: 1000,
    extension_range_end: 1999
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
        toast.info('Configurações FreeSWITCH aplicadas automaticamente');
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
    if (!confirm(`Tem certeza que deseja excluir a empresa "${tenant.name}"?\n\nISTO IRÁ REMOVER TODAS AS CONFIGURAÇÕES FREESWITCH!`)) return;
    try {
      await api.deleteTenant(tenant.id);
      toast.success('Empresa excluída com sucesso!');
      toast.info('Configurações FreeSWITCH removidas');
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
      status: tenant.status,
      sip_domain: tenant.sip_domain || '',
      context: tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`,
      dialplan: tenant.dialplan || 'XML',
      codec_prefs: tenant.codec_prefs || 'PCMU,PCMA,G729',
      extension_range_start: tenant.extension_range_start || 1000,
      extension_range_end: tenant.extension_range_end || 1999
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
      status: 'active',
      sip_domain: '',
      context: '',
      dialplan: 'XML',
      codec_prefs: 'PCMU,PCMA,G729',
      extension_range_start: 1000,
      extension_range_end: 1999
    });
  };

  const generateSipDomain = () => {
    const domain = formData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.local';
    setFormData({ ...formData, sip_domain: domain });
  };

  const generateContext = () => {
    const context = `context_${formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
    setFormData({ ...formData, context: context });
  };

  const syncWithFreeSWITCH = async (tenant: Tenant) => {
    try {
      await api.syncTenantWithFreeSWITCH(tenant.id);
      toast.success('Sincronização com FreeSWITCH concluída!');
      loadData();
    } catch (error) {
      toast.error('Erro ao sincronizar com FreeSWITCH');
      console.error('Error syncing with FreeSWITCH:', error);
    }
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

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Gerencie empresas clientes e suas configurações FreeSWITCH
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
              <DialogDescription>
                Configure a empresa e suas integrações com FreeSWITCH
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informações Básicas
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Empresa XYZ"
                    />
                  </div>

                  <div>
                    <Label htmlFor="domain">Domínio</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="empresa.com.br"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Email de Contato</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="admin@empresa.com.br"
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan_id">Plano</Label>
                    <Select value={formData.plan_id} onValueChange={(value) =>
                      setFormData({ ...formData, plan_id: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.max_extensions} ramais
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="suspended">Suspensa</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configurações FreeSWITCH */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Configurações FreeSWITCH
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sip_domain">Domínio SIP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sip_domain"
                        value={formData.sip_domain}
                        onChange={(e) => setFormData({ ...formData, sip_domain: e.target.value })}
                        placeholder="empresa.sip.local"
                      />
                      <Button type="button" variant="outline" onClick={generateSipDomain}>
                        Auto
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="context">Contexto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="context"
                        value={formData.context}
                        onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                        placeholder="context_empresa"
                      />
                      <Button type="button" variant="outline" onClick={generateContext}>
                        Auto
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dialplan">Dialplan</Label>
                    <Select value={formData.dialplan} onValueChange={(value) =>
                      setFormData({ ...formData, dialplan: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XML">XML</SelectItem>
                        <SelectItem value="LUA">LUA</SelectItem>
                        <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="codec_prefs">Codecs Preferidos</Label>
                    <Input
                      id="codec_prefs"
                      value={formData.codec_prefs}
                      onChange={(e) => setFormData({ ...formData, codec_prefs: e.target.value })}
                      placeholder="PCMU,PCMA,G729"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="extension_range_start">Faixa de Ramais - Início</Label>
                    <Input
                      id="extension_range_start"
                      type="number"
                      value={formData.extension_range_start}
                      onChange={(e) => setFormData({ ...formData, extension_range_start: parseInt(e.target.value) || 1000 })}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="extension_range_end">Faixa de Ramais - Fim</Label>
                    <Input
                      id="extension_range_end"
                      type="number"
                      value={formData.extension_range_end}
                      onChange={(e) => setFormData({ ...formData, extension_range_end: parseInt(e.target.value) || 1999 })}
                      placeholder="1999"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingTenant ? 'Atualizar' : 'Criar'} Empresa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as empresas e suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma empresa encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Domínio SIP</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Ramais</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">{tenant.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <code className="text-sm">{tenant.sip_domain || 'Não configurado'}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <code className="text-sm">{tenant.context || 'Não configurado'}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {tenant.extension_range_start || 1000} - {tenant.extension_range_end || 1999}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tenant.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncWithFreeSWITCH(tenant)}
                          title="Sincronizar com FreeSWITCH"
                        >
                          <Activity className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tenant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tenant)}
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

export default Tenants; 