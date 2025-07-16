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
import Select from 'react-select';

interface RingGroup {
  id: string;
  name: string;
  number?: string;
  type?: string;
  strategy?: string;
  timeout?: number;
  extensions?: string[];
  is_active?: boolean;
  created_by?: string;
  timeout_action_type?: string | null;
  timeout_action?: string | null;
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
    timeout_action_type: null as string | null,
    timeout_action: null as string | null,
  });
  const [extensions, setExtensions] = useState<{ id: string; number: string; name: string }[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const timeoutActionTypes = [
    { value: 'extension', label: 'Ramal' },
    { value: 'custom', label: 'Custom (número ou SIP URI)' },
    { value: 'ivr', label: 'URA (em breve)', isDisabled: true },
    { value: 'trunk', label: 'Tronco (em breve)', isDisabled: true },
    { value: 'ai_agent', label: 'Agente IA (em breve)', isDisabled: true },
  ];

  // Adicionar ao formData
  const [surveyConfig, setSurveyConfig] = useState({
    enabled: false,
    survey_template_id: null as number | null
  });
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveys, setSurveys] = useState<{ id: number; name: string; question_text: string }[]>([]);

  useEffect(() => {
    loadRingGroups();
  }, [tenantId]);

  // Carregar ramais ao abrir o modal
  useEffect(() => {
    if (!tenantId || !isDialogOpen) return;
    const loadExtensions = async () => {
      try {
        const data = await api.getExtensions(tenantId);
        setExtensions(Array.isArray(data) ? data : []);
      } catch (error) {
        setExtensions([]);
      }
    };
    loadExtensions();
  }, [tenantId, isDialogOpen]);

  // Carregar pesquisas disponíveis
  useEffect(() => {
    if (!tenantId || !isDialogOpen) return;
    const loadSurveys = async () => {
      try {
        const data = await api.getSurveys(tenantId);
        setSurveys(Array.isArray(data) ? data : []);
      } catch (error) {
        setSurveys([]);
      }
    };
    loadSurveys();
  }, [tenantId, isDialogOpen]);

  // Carregar configuração da pesquisa ao editar
  useEffect(() => {
    if (editingRingGroup) {
      setSurveyLoading(true);
      api.getRingGroupSurvey(editingRingGroup.id).then((data) => {
        if (data) setSurveyConfig({
          enabled: !!data.enabled,
          survey_template_id: data.survey_template_id
        });
        else setSurveyConfig({ enabled: false, survey_template_id: null });
      }).finally(() => setSurveyLoading(false));
    } else {
      setSurveyConfig({ enabled: false, survey_template_id: null });
    }
  }, [editingRingGroup]);

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

  // Salvar configuração da pesquisa junto com o grupo
  const handleSave = async () => {
    if (!tenantId) return;
    if (!formData.number || !formData.number.trim()) {
      toast.error('O campo "Número" do grupo é obrigatório.');
      return;
    }
    if (formData.timeout_action_type && !formData.timeout_action) {
      toast.error('Selecione o destino da ação após timeout.');
      return;
    }
    try {
      // Montar payload conforme o modelo do banco
      const payload = {
        name: formData.name,
        number: formData.number,
        type: formData.type,
        strategy: formData.type, // redundante, mas mantém compatibilidade
        timeout: Number(formData.timeout) || 30,
        extensions: formData.extensions,
        created_by: user?.id || null,
        timeout_action_type: formData.timeout_action_type || null,
        timeout_action: formData.timeout_action || null,
      };
      if (editingRingGroup) {
        await api.updateRingGroup(editingRingGroup.id, payload);
        // Salvar config pesquisa
        await api.updateRingGroupSurvey(editingRingGroup.id, surveyConfig);
        toast.success('Grupo de toque atualizado com sucesso!');
      } else {
        const newGroup = await api.createRingGroup(tenantId, payload);
        // Salvar config pesquisa
        if (newGroup?.id) await api.updateRingGroupSurvey(newGroup.id, surveyConfig);
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
      timeout_action_type: (ringGroup as any).timeout_action_type || null,
      timeout_action: (ringGroup as any).timeout_action || null,
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
      timeout_action_type: null,
      timeout_action: null,
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
            Contact Center
          </h1>
          <p className="text-gray-600">
            Gerencie os grupos de ramais para distribuição de chamadas
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contact Center
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-lg mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRingGroup ? 'Editar Contact Center' : 'Novo Contact Center'}
              </DialogTitle>
              <DialogDescription>
                {editingRingGroup ? 'Atualize as informações do contact center' : 'Crie um novo contact center'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Contact Center</Label>
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
                <Label htmlFor="extensions">Ramais do Contact Center</Label>
                {extensions.length === 0 ? (
                  <div className="text-gray-500 text-sm p-2 border rounded bg-gray-50">
                    Nenhum ramal cadastrado. Crie ramais para poder vinculá-los ao contact center.
                  </div>
                ) : (
                  <Select
                    isMulti
                    name="extensions"
                    options={extensions.map(ext => ({ value: ext.id, label: `${ext.number} - ${ext.name}` }))}
                    value={extensions.filter(ext => formData.extensions.includes(ext.id)).map(ext => ({ value: ext.id, label: `${ext.number} - ${ext.name}` }))}
                    onChange={(selected) => {
                      setFormData({
                        ...formData,
                        extensions: Array.isArray(selected) ? selected.map(opt => opt.value) : [],
                      });
                    }}
                    classNamePrefix="react-select"
                    placeholder="Selecione os ramais do contact center..."
                  />
                )}
              </div>
              {/* Botão Avançadas */}
              <Button type="button" variant="outline" onClick={() => setShowAdvanced(v => !v)} className="mt-2 mb-2">
                Avançadas {showAdvanced ? '▲' : '▼'}
              </Button>
              {showAdvanced && (
                <div className="border rounded p-3 bg-gray-50 mb-2">
                  <Label htmlFor="timeout_action_type">Ação após timeout</Label>
                  <Select
                    id="timeout_action_type"
                    name="timeout_action_type"
                    options={timeoutActionTypes}
                    value={timeoutActionTypes.find(opt => opt.value === formData.timeout_action_type) || null}
                    onChange={opt => setFormData(f => ({ ...f, timeout_action_type: opt?.value, timeout_action: '' }))}
                    isClearable
                  />
                  {formData.timeout_action_type === 'extension' && (
                    <div className="mt-2">
                      <Label htmlFor="timeout_action">Ramal destino</Label>
                      <Select
                        id="timeout_action"
                        name="timeout_action"
                        options={extensions.map(ext => ({ value: ext.id, label: `${ext.number} - ${ext.name}` }))}
                        value={extensions.find(ext => ext.id === formData.timeout_action) ? { value: formData.timeout_action, label: `${extensions.find(ext => ext.id === formData.timeout_action)?.number} - ${extensions.find(ext => ext.id === formData.timeout_action)?.name}` } : null}
                        onChange={opt => setFormData(f => ({ ...f, timeout_action: opt?.value }))}
                        isClearable
                      />
                    </div>
                  )}
                  {formData.timeout_action_type === 'custom' && (
                    <div className="mt-2">
                      <Label htmlFor="timeout_action">Destino customizado</Label>
                      <Input
                        id="timeout_action"
                        name="timeout_action"
                        placeholder="Digite o número, SIP URI ou destino externo"
                        value={formData.timeout_action || ''}
                        onChange={e => setFormData(f => ({ ...f, timeout_action: e.target.value }))}
                      />
                    </div>
                  )}
                  {(formData.timeout_action_type === 'ivr' || formData.timeout_action_type === 'trunk' || formData.timeout_action_type === 'ai_agent') && (
                    <div className="mt-2 text-gray-400 italic">Em breve</div>
                  )}
                </div>
              )}
              <Label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={surveyConfig.enabled}
                  onChange={e => setSurveyConfig(s => ({ ...s, enabled: e.target.checked }))}
                  className="mr-2"
                />
                Ativar pesquisa de satisfação pós-chamada
              </Label>
              {surveyConfig.enabled && (
                <div className="mt-2">
                  <Label htmlFor="survey_template">Selecionar pesquisa</Label>
                  <Select
                    value={surveys.find(s => s.id === surveyConfig.survey_template_id)}
                    onChange={(option) => setSurveyConfig(s => ({ 
                      ...s, 
                      survey_template_id: option?.id || null 
                    }))}
                    options={surveys}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.id.toString()}
                    placeholder="Selecione uma pesquisa..."
                    isClearable
                  />
                  {surveyConfig.survey_template_id && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {surveys.find(s => s.id === surveyConfig.survey_template_id)?.question_text || ''}
                    </p>
                  )}
                </div>
              )}
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
          <CardTitle>Contact Centers Configurados</CardTitle>
          <CardDescription>
            Lista de todos os contact centers configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRingGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {tenantId ? 'Nenhum contact center encontrado' : 'Selecione uma empresa para visualizar os contact centers'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Estratégia</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Detalhes</TableHead>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          const dateStr = `${yyyy}-${mm}-${dd}`;
                          window.location.href = `/reports/analytics?group=${group.id}&date=${dateStr}`;
                        }}
                      >
                        Ver Detalhes
                      </Button>
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
