import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Volume2, Play, Settings, Loader2, CheckCircle, XCircle, Mic, Headphones, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface URA {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  is_active: boolean;
  flow: any;
  created_at: string;
  updated_at: string;
}

interface AudioFile {
  id: string;
  name: string;
  text: string;
  voice_id: string;
  file_path: string;
  created_at: string;
}

const URABuilder = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [uras, setUras] = useState<URA[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isURADialogOpen, setIsURADialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const [editingURA, setEditingURA] = useState<URA | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    is_active: true
  });
  const [audioFormData, setAudioFormData] = useState<{
    name: string;
    text: string;
    voice_id: string;
  }>({
    name: '',
    text: '',
    voice_id: '21m00Tcm4TlvDq8ikWAM' // Default voice ID
  });
  const [search, setSearch] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // ElevenLabs voices (exemplo)
  const voices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Feminino)' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Feminino)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Feminino)' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Masculino)' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Feminino)' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Josh (Masculino)' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculino)' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Masculino)' }
  ];

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [urasData, audioFilesData, templatesData] = await Promise.all([
        api.getURAs(tenantId),
        api.getAudioFiles(tenantId),
        api.getURATemplates()
      ]);
      setUras(Array.isArray(urasData) ? urasData : []);
      setAudioFiles(Array.isArray(audioFilesData) ? audioFilesData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error('Error loading data:', error);
      setUras([]);
      setAudioFiles([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveURA = async () => {
    if (!tenantId) return;
    if (!formData.name.trim()) {
      toast.error('O nome da URA é obrigatório!');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        flow: editingURA?.flow || { 
          nodes: [
            {
              id: 'start-1',
              type: 'start',
              position: { x: 100, y: 100 },
              data: {
                routesCount: 0,
                routes: [],
                autoCreate: true,
                defaultDid: '',
                defaultDestinationType: 'ura',
                defaultDestinationId: ''
              }
            }
          ], 
          edges: [] 
        }
      };
      
      let result;
      if (editingURA) {
        result = await api.updateURA(editingURA.id, payload);
        if (result?.error) throw new Error(result.error);
        toast.success('URA atualizada com sucesso!');
      } else {
        result = await api.createURA(tenantId, payload);
        if (result?.error) throw new Error(result.error);
        toast.success('URA criada com sucesso!');
      }
      setIsURADialogOpen(false);
      resetURAForm();
      loadData();
    } catch (error: any) {
      toast.error(editingURA ? 'Erro ao atualizar URA' : 'Erro ao criar URA');
      console.error('Error saving URA:', error);
    }
  };

  const handleDeleteURA = async (ura: URA) => {
    if (!confirm(`Tem certeza que deseja excluir a URA "${ura.name}"?`)) return;
    try {
      await api.deleteURA(ura.id);
      toast.success('URA excluída com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir URA');
      console.error('Error deleting URA:', error);
    }
  };

  const handleEditURA = (ura: URA) => {
    setEditingURA(ura);
    setFormData({
      name: ura.name,
      description: ura.description || '',
      is_active: ura.is_active
    });
    setIsURADialogOpen(true);
  };

  const resetURAForm = () => {
    setEditingURA(null);
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  const handleGenerateAudio = async () => {
    if (!audioFormData.name.trim() || !audioFormData.text.trim()) {
      toast.error('Nome e texto são obrigatórios!');
      return;
    }
    
    setIsGeneratingAudio(true);
    try {
      const payload = {
        name: audioFormData.name,
        text: audioFormData.text,
        voice_id: audioFormData.voice_id
      };
      
      const result = await api.generateTTSAudio(tenantId, payload);
      if (result?.error) throw new Error(result.error);
      
      toast.success('Áudio gerado com sucesso!');
      setIsAudioDialogOpen(false);
      setAudioFormData({
        name: '',
        text: '',
        voice_id: '21m00Tcm4TlvDq8ikWAM'
      });
      loadData(); // Recarregar lista de áudios
    } catch (error) {
      toast.error('Erro ao gerar áudio');
      console.error('Error generating audio:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayAudio = (audioFile: AudioFile) => {
    // TODO: Implementar reprodução de áudio
    toast.info(`Reproduzindo: ${audioFile.name}`);
  };

  const handleProvisionURA = async (ura: URA) => {
    try {
      const result = await api.provisionURA(ura.id);
      if (result?.error) throw new Error(result.error);
      toast.success(`URA "${ura.name}" provisionada no FreeSWITCH!`);
    } catch (error) {
      toast.error('Erro ao provisionar URA no FreeSWITCH');
      console.error('Error provisioning URA:', error);
    }
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      is_active: true
    });
    setIsTemplateDialogOpen(false);
    setIsURADialogOpen(true);
  };

  const handleSaveURAWithTemplate = async () => {
    if (!tenantId) return;
    if (!formData.name.trim()) {
      toast.error('O nome da URA é obrigatório!');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        flow: selectedTemplate?.flow || { 
          nodes: [
            {
              id: 'start-1',
              type: 'start',
              position: { x: 100, y: 100 },
              data: {
                routesCount: 0,
                routes: [],
                autoCreate: true,
                defaultDid: '',
                defaultDestinationType: 'ura',
                defaultDestinationId: ''
              }
            }
          ], 
          edges: [] 
        }
      };
      
      const result = await api.createURA(tenantId, payload);
      if (result?.error) throw new Error(result.error);
      
      toast.success('URA criada com template com sucesso!');
      setIsURADialogOpen(false);
      resetURAForm();
      setSelectedTemplate(null);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao criar URA com template');
      console.error('Error creating URA with template:', error);
    }
  };

  const handleValidateURA = async (ura: URA) => {
    if (!ura.flow) {
      toast.error('URA não possui fluxo configurado');
      return;
    }
    
    try {
      const validation = await api.validateURAFlow(ura.flow);
      
      if (validation.valid) {
        toast.success('URA válida!', {
          description: validation.warnings.length > 0 
            ? `Avisos: ${validation.warnings.join(', ')}` 
            : undefined
        });
      } else {
        toast.error('URA inválida!', {
          description: validation.errors.join(', ')
        });
      }
    } catch (error) {
      toast.error('Erro ao validar URA');
      console.error('Error validating URA:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando URAs...</span>
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
            <Settings className="w-8 h-8 text-dohoo-primary" />
            Construtor de URA
          </h1>
          <p className="text-gray-600">
            Crie e gerencie URAs (Unidade de Resposta Audível) com integração TTS
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!tenantId}>
                <FileText className="w-4 h-4 mr-2" />
                Usar Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Templates de URA</DialogTitle>
                <DialogDescription>
                  Escolha um template pré-configurado para começar rapidamente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleUseTemplate(template)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAudioDialogOpen} onOpenChange={setIsAudioDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!tenantId}>
                <Volume2 className="w-4 h-4 mr-2" />
                Criar Áudio TTS
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Áudio TTS</DialogTitle>
                <DialogDescription>
                  Gere áudios usando ElevenLabs para usar nas suas URAs
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="audio-name">Nome do Áudio</Label>
                  <Input
                    id="audio-name"
                    value={audioFormData.name}
                    onChange={(e) => setAudioFormData({...audioFormData, name: e.target.value})}
                    placeholder="Ex: Boas-vindas"
                  />
                </div>
                
                <div>
                  <Label htmlFor="voice">Voz</Label>
                  <Select 
                    value={audioFormData.voice_id} 
                    onValueChange={(value) => setAudioFormData({...audioFormData, voice_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="text">Texto para Conversão</Label>
                  <Textarea
                    id="text"
                    value={audioFormData.text}
                    onChange={(e) => setAudioFormData({...audioFormData, text: e.target.value})}
                    placeholder="Digite o texto que será convertido em áudio..."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAudioDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerateAudio} 
                  disabled={!audioFormData.name || !audioFormData.text || isGeneratingAudio}
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Gerar Áudio
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isURADialogOpen} onOpenChange={setIsURADialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetURAForm} disabled={!tenantId}>
                <Plus className="w-4 h-4 mr-2" />
                Nova URA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingURA ? 'Editar URA' : 'Nova URA'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma nova URA para seu sistema
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da URA</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: URA Principal"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva a função desta URA..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Ativa</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsURADialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={selectedTemplate ? handleSaveURAWithTemplate : handleSaveURA} 
                  disabled={!formData.name}
                >
                  {editingURA ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtro de Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de URAs */}
      <Card>
        <CardHeader>
          <CardTitle>URAs ({uras.length})</CardTitle>
          <CardDescription>
            Lista de todas as URAs configuradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uras.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma URA encontrada</h3>
              <p className="text-gray-600">
                Crie sua primeira URA para começar a configurar o sistema
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uras
                .filter(ura =>
                  ura.name.toLowerCase().includes(search.toLowerCase()) ||
                  (ura.description && ura.description.toLowerCase().includes(search.toLowerCase()))
                )
                .map((ura) => (
                  <div key={ura.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{ura.name}</div>
                        <div className="text-sm text-gray-600">
                          {ura.description || 'Sem descrição'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Badge 
                            variant={ura.is_active ? 'default' : 'secondary'}
                            className="flex items-center gap-1"
                          >
                            {ura.is_active ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {ura.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <span>•</span>
                          <span>Nós: {ura.flow?.nodes?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateURA(ura)}
                        title="Validar Fluxo"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
          <Button
            variant="outline"
                        size="sm"
                        onClick={() => window.open(`/ura-editor/${ura.id}`, '_blank')}
                        title="Abrir Editor Visual"
          >
                        <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
                        size="sm"
                        onClick={() => handleProvisionURA(ura)}
                        title="Provisionar no FreeSWITCH"
          >
                        <Headphones className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
                        size="sm"
                        onClick={() => handleEditURA(ura)}
          >
                        <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
                        size="sm"
                        onClick={() => handleDeleteURA(ura)}
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

      {/* Lista de Áudios TTS */}
      <Card>
        <CardHeader>
          <CardTitle>Áudios TTS ({audioFiles.length})</CardTitle>
          <CardDescription>
            Áudios gerados com ElevenLabs para uso nas URAs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audioFiles.length === 0 ? (
            <div className="text-center py-12">
              <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum áudio encontrado</h3>
              <p className="text-gray-600">
                Crie seu primeiro áudio TTS para usar nas URAs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {audioFiles.map((audioFile) => (
                <div key={audioFile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Volume2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{audioFile.name}</div>
                      <div className="text-sm text-gray-600">
                        {audioFile.text.length > 50 
                          ? `${audioFile.text.substring(0, 50)}...` 
                          : audioFile.text
                        }
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Voz: {voices.find(v => v.id === audioFile.voice_id)?.name || audioFile.voice_id}
                      </div>
          </div>
        </div>
        
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayAudio(audioFile)}
                    >
                      <Play className="w-4 h-4" />
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

export default URABuilder;
