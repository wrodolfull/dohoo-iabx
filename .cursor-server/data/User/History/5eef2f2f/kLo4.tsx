import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
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
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Users,
  Server,
  Crown,
  Zap,
  Building
} from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_extensions: number;
  max_concurrent_calls: number;
  storage_gb: number;
  features: string[];
  created_at: string;
}

const Plans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    max_extensions: 10,
    max_concurrent_calls: 5,
    storage_gb: 1,
    features: ''
  });

  // Só superadmin pode gerenciar planos
  const canManagePlans = user?.role === 'superadmin';

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getPlans();
      setPlans(data || []);
    } catch (error) {
      toast.error('Erro ao carregar planos');
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const planData = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, planData);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await api.createPlan(planData);
        toast.success('Plano criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadPlans();
    } catch (error) {
      toast.error(editingPlan ? 'Erro ao atualizar plano' : 'Erro ao criar plano');
      console.error('Error saving plan:', error);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) return;
    try {
      await api.deletePlan(plan.id);
      toast.success('Plano excluído com sucesso!');
      loadPlans();
    } catch (error) {
      toast.error('Erro ao excluir plano');
      console.error('Error deleting plan:', error);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      max_extensions: plan.max_extensions,
      max_concurrent_calls: plan.max_concurrent_calls,
      storage_gb: plan.storage_gb,
      features: plan.features.join(', ')
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      max_extensions: 10,
      max_concurrent_calls: 5,
      storage_gb: 1,
      features: ''
    });
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('basic') || planName.toLowerCase().includes('básico')) {
      return <Building className="w-6 h-6 text-blue-500" />;
    } else if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('profissional')) {
      return <Zap className="w-6 h-6 text-purple-500" />;
    } else if (planName.toLowerCase().includes('enterprise') || planName.toLowerCase().includes('empresarial')) {
      return <Crown className="w-6 h-6 text-gold-500" />;
    }
    return <CreditCard className="w-6 h-6 text-gray-500" />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!canManagePlans) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">Acesso Restrito</h3>
        <p className="text-gray-600">Apenas super administradores podem gerenciar planos</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-dohoo-primary" />
            Planos
          </h1>
          <p className="text-gray-600">
            Configure planos de assinatura e recursos disponíveis
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                Configure os recursos e preços do plano
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    placeholder="Plano Básico"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Mensal (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="99.90"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ideal para pequenas empresas"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_extensions">Ramais</Label>
                  <Input
                    id="max_extensions"
                    type="number"
                    placeholder="10"
                    value={formData.max_extensions}
                    onChange={(e) => setFormData({ ...formData, max_extensions: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_concurrent_calls">Chamadas</Label>
                  <Input
                    id="max_concurrent_calls"
                    type="number"
                    placeholder="5"
                    value={formData.max_concurrent_calls}
                    onChange={(e) => setFormData({ ...formData, max_concurrent_calls: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage_gb">Storage GB</Label>
                  <Input
                    id="storage_gb"
                    type="number"
                    placeholder="1"
                    value={formData.storage_gb}
                    onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Recursos (separados por vírgula)</Label>
                <Input
                  id="features"
                  placeholder="Gravação, URA, Relatórios"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingPlan ? 'Atualizar' : 'Criar Plano'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getPlanIcon(plan.name)}
                  {plan.name}
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-dohoo-primary">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-xs text-gray-500">por mês</div>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="text-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Phone className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="font-bold">{plan.max_extensions}</div>
                    <div className="text-xs text-gray-500">Ramais</div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="font-bold">{plan.max_concurrent_calls}</div>
                    <div className="text-xs text-gray-500">Chamadas</div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Server className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="font-bold">{plan.storage_gb}GB</div>
                    <div className="text-xs text-gray-500">Storage</div>
                  </div>
                </div>

                {plan.features.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Recursos:</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.features.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(plan)}
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

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum plano cadastrado</h3>
              <p className="text-gray-600 mb-4">Crie seu primeiro plano de assinatura</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Plans;
