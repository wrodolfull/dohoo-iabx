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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MessageSquare,
  CheckCircle,
  XCircle,
  X,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import Select from 'react-select';

interface Survey {
  id: number;
  name: string;
  question_text: string;
  survey_type: string;
  options?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SurveyOption {
  value: string;
  label: string;
  description?: string;
}

interface RingGroup {
  id: string;
  name: string;
  survey_template_id?: number;
}

const Surveys = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    question_text: '',
    survey_type: 'dtmf',
    options: null,
  });
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);

  const surveyTypes = [
    { value: 'dtmf', label: 'DTMF (1-5)' },
    { value: 'yes_no', label: 'Sim/Não' },
    { value: 'custom', label: 'Personalizado' },
  ];

  // Opções padrão para cada tipo de pesquisa
  const getDefaultOptions = (type: string) => {
    switch (type) {
      case 'dtmf':
        return [
          { value: '1', label: '1 - Muito Ruim', description: 'Avaliação muito ruim' },
          { value: '2', label: '2 - Ruim', description: 'Avaliação ruim' },
          { value: '3', label: '3 - Regular', description: 'Avaliação regular' },
          { value: '4', label: '4 - Bom', description: 'Avaliação boa' },
          { value: '5', label: '5 - Excelente', description: 'Avaliação excelente' },
        ];
      case 'yes_no':
        return [
          { value: '1', label: 'Sim', description: 'Resposta positiva' },
          { value: '0', label: 'Não', description: 'Resposta negativa' },
        ];
      case 'custom':
        return [
          { value: '1', label: 'Opção 1', description: 'Primeira opção' },
          { value: '2', label: 'Opção 2', description: 'Segunda opção' },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    loadSurveys();
    loadRingGroups();
  }, [tenantId]);

  const loadSurveys = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getSurveys(tenantId);
      setSurveys(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar pesquisas');
      console.error('Error loading surveys:', error);
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRingGroups = async () => {
    if (!tenantId) return;
    try {
      const data = await api.getRingGroups(tenantId);
      setRingGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      setRingGroups([]);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!formData.name || !formData.name.trim()) {
      toast.error('O nome da pesquisa é obrigatório.');
      return;
    }
    if (!formData.question_text || !formData.question_text.trim()) {
      toast.error('A pergunta da pesquisa é obrigatória.');
      return;
    }
    
    // Validar opções
    if (!formData.options || !Array.isArray(formData.options) || formData.options.length === 0) {
      toast.error('A pesquisa deve ter pelo menos uma opção configurada.');
      return;
    }
    
    for (let i = 0; i < formData.options.length; i++) {
      const option = formData.options[i];
      if (!option.value || !option.value.trim()) {
        toast.error(`Opção ${i + 1}: O valor é obrigatório.`);
        return;
      }
      if (!option.label || !option.label.trim()) {
        toast.error(`Opção ${i + 1}: O rótulo é obrigatório.`);
        return;
      }
    }
    
    try {
      const payload = {
        name: formData.name,
        question_text: formData.question_text,
        survey_type: formData.survey_type,
        options: formData.options,
      };

      let response;
      if (editingSurvey) {
        response = await api.updateSurvey(editingSurvey.id.toString(), payload);
        toast.success('Pesquisa atualizada com sucesso!');
      } else {
        response = await api.createSurvey(tenantId, payload);
        toast.success('Pesquisa criada com sucesso!');
      }
      
      // Verificar status do provisionamento
      if (response.provision_status === 'success') {
        toast.success(response.provision_message || 'Pesquisa salva e provisionada com sucesso!');
      } else {
        toast.warning('Pesquisa salva, mas houve um problema no provisionamento automático.');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadSurveys();
    } catch (error: any) {
      const errorMessage = error.error || (editingSurvey ? 'Erro ao atualizar pesquisa' : 'Erro ao criar pesquisa');
      toast.error(errorMessage);
      console.error('Error saving survey:', error);
    }
  };

  const handleDelete = async (survey: Survey) => {
    if (!confirm(`Tem certeza que deseja excluir a pesquisa "${survey.name}"?\n\nEsta ação também removerá a configuração do FreeSWITCH.`)) return;
    try {
      await api.deleteSurvey(survey.id.toString());
      toast.success('Pesquisa excluída com sucesso!');
      loadSurveys();
    } catch (error: any) {
      const errorMessage = error.error || 'Erro ao excluir pesquisa';
      toast.error(errorMessage);
      console.error('Error deleting survey:', error);
    }
  };

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setFormData({
      name: survey.name,
      question_text: survey.question_text,
      survey_type: survey.survey_type,
      options: survey.options || getDefaultOptions(survey.survey_type),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSurvey(null);
    setFormData({
      name: '',
      question_text: '',
      survey_type: 'dtmf',
      options: getDefaultOptions('dtmf'),
    });
  };

  const handleSurveyTypeChange = (option: any) => {
    const newType = option?.value || 'dtmf';
    setFormData({
      ...formData,
      survey_type: newType,
      options: getDefaultOptions(newType),
    });
  };

  const updateOption = (index: number, field: 'value' | 'label' | 'description', newValue: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: newValue };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(formData.options || []), { 
      value: `${(formData.options || []).length + 1}`, 
      label: `Opção ${(formData.options || []).length + 1}`, 
      description: '' 
    }];
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (formData.options || []).filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando pesquisas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pesquisas de Satisfação</h1>
          <p className="text-muted-foreground">
            Gerencie os templates de pesquisa de satisfação pós-chamada
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pesquisa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSurvey ? 'Editar Pesquisa' : 'Nova Pesquisa'}
              </DialogTitle>
              <DialogDescription>
                Configure o template de pesquisa de satisfação
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Pesquisa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Avaliação de Atendimento"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="question">Pergunta</Label>
                <Textarea
                  id="question"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Como você avalia seu atendimento? (1 a 5)"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Pesquisa</Label>
                <Select
                  value={surveyTypes.find(t => t.value === formData.survey_type)}
                  onChange={handleSurveyTypeChange}
                  options={surveyTypes}
                  placeholder="Selecione o tipo"
                />
              </div>
              
              {/* Configuração de Opções */}
              <div className="grid gap-2">
                <Label>Opções de Resposta</Label>
                <div className="space-y-3">
                  {(formData.options || []).map((option: SurveyOption, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <Input
                          value={option.value}
                          onChange={(e) => updateOption(index, 'value', e.target.value)}
                          placeholder="Valor (ex: 1, 2, 3...)"
                          className="text-sm"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          placeholder="Rótulo (ex: Excelente, Bom...)"
                          className="text-sm"
                        />
                        <Input
                          value={option.description || ''}
                          onChange={(e) => updateOption(index, 'description', e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="text-sm"
                        />
                      </div>
                      {(formData.options || []).length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingSurvey ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pesquisas</CardTitle>
              <CardDescription>
                {surveys.length} pesquisa(s) encontrada(s)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pesquisas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Opções</TableHead>
                <TableHead>Vinculada a</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhuma pesquisa encontrada' : 'Nenhuma pesquisa criada ainda'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar primeira pesquisa
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {survey.question_text}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {surveyTypes.find(t => t.value === survey.survey_type)?.label || survey.survey_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {survey.options && Array.isArray(survey.options) ? (
                          <div className="space-y-1">
                            {survey.options.slice(0, 3).map((option: any, index: number) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                {option.value}: {option.label}
                              </div>
                            ))}
                            {survey.options.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{survey.options.length - 3} mais...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Padrão</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Mostrar nomes dos Ring Groups vinculados */}
                      {(() => {
                        const linked = ringGroups.filter(rg => rg.survey_template_id === survey.id);
                        if (linked.length === 0) return <span className="text-xs text-muted-foreground">Não vinculada</span>;
                        return linked.map(rg => (
                          <span key={rg.id} className="inline-block bg-blue-50 text-blue-800 rounded px-2 py-0.5 text-xs mr-1">
                            {rg.name}
                          </span>
                        ));
                      })()}
                    </TableCell>
                    <TableCell>
                      {survey.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(survey.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(survey)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(survey)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Surveys; 