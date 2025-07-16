import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Menu, Phone, Users, Brain, Plus, Save, ArrowLeft, Loader2, Volume2, Clock, PhoneOff, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Componentes de nós com handles de conexão nas laterais
const MenuNode = ({ data, id }: any) => (
  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-blue-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-blue-500 border-2 border-white"
    />
    <div className="font-semibold text-blue-800 flex items-center gap-2">
      <Menu className="w-4 h-4" />
      Menu
      <div className="ml-auto text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-blue-600 mt-1">{data.message || 'Mensagem'}</div>
    {data.options && (
      <div className="mt-2 space-y-1">
        {data.options.map((opt: any, i: number) => (
          <div key={i} className="text-xs text-blue-700 bg-blue-50 p-1 rounded">
            {opt.key}: {opt.label}
          </div>
        ))}
      </div>
    )}
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-blue-500 border-2 border-white"
    />
  </div>
);

const ExtensionNode = ({ data, id }: any) => (
  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-green-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-green-500 border-2 border-white"
    />
    <div className="font-semibold text-green-800 flex items-center gap-2">
      <Phone className="w-4 h-4" />
      Ramal
      <div className="ml-auto text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-green-600 mt-1">{data.extension || 'Número'}</div>
    <div className="text-xs text-green-700">{data.name || 'Nome'}</div>
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-green-500 border-2 border-white"
    />
  </div>
);

const GroupNode = ({ data, id }: any) => (
  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-purple-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-purple-500 border-2 border-white"
    />
    <div className="font-semibold text-purple-800 flex items-center gap-2">
      <Users className="w-4 h-4" />
      Grupo
      <div className="ml-auto text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-purple-600 mt-1">{data.groupId || 'ID do Grupo'}</div>
    <div className="text-xs text-purple-700">{data.name || 'Nome do Grupo'}</div>
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-purple-500 border-2 border-white"
    />
  </div>
);

const TTSNode = ({ data, id }: any) => (
  <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-orange-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-orange-500 border-2 border-white"
    />
    <div className="font-semibold text-orange-800 flex items-center gap-2">
      <Volume2 className="w-4 h-4" />
      TTS
      <div className="ml-auto text-xs text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-orange-600 mt-1">{data.name || 'Nome do Áudio'}</div>
    <div className="text-xs text-orange-700 truncate">{data.text || 'Texto para sintetizar'}</div>
    {data.audioUrl && (
      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Áudio gerado
      </div>
    )}
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-orange-500 border-2 border-white"
    />
  </div>
);

const ScheduleNode = ({ data, id }: any) => (
  <div className="bg-indigo-100 border-2 border-indigo-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-indigo-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-indigo-500 border-2 border-white"
    />
    <div className="font-semibold text-indigo-800 flex items-center gap-2">
      <Clock className="w-4 h-4" />
      Horário
      <div className="ml-auto text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-indigo-600 mt-1">{data.name || 'Verificação'}</div>
    <div className="text-xs text-indigo-700">{data.schedule || 'Horário não configurado'}</div>
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-indigo-500 border-2 border-white"
    />
  </div>
);

const HangupNode = ({ data, id }: any) => (
  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-red-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-red-500 border-2 border-white"
    />
    <div className="font-semibold text-red-800 flex items-center gap-2">
      <PhoneOff className="w-4 h-4" />
      Encerrar
      <div className="ml-auto text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-red-600 mt-1">Finalizar chamada</div>
    {/* Nó de hangup não tem source handle pois é o final do fluxo */}
  </div>
);

const AINode = ({ data, id }: any) => (
  <div className="bg-cyan-100 border-2 border-cyan-300 rounded-lg p-3 min-w-[200px] relative cursor-pointer hover:bg-cyan-50 transition-colors group">
    <Handle
      type="target"
      position={Position.Left}
      className="w-3 h-3 bg-cyan-500 border-2 border-white"
    />
    <div className="font-semibold text-cyan-800 flex items-center gap-2">
      <Brain className="w-4 h-4" />
      IA
      <div className="ml-auto text-xs text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Clique para editar
      </div>
    </div>
    <div className="text-sm text-cyan-600 mt-1">{data.projectId || 'Projeto'}</div>
    <div className="text-xs text-cyan-700">{data.agentId || 'Agente'}</div>
    <Handle
      type="source"
      position={Position.Right}
      className="w-3 h-3 bg-cyan-500 border-2 border-white"
    />
  </div>
);

const nodeTypes: NodeTypes = {
  menu: MenuNode,
  extension: ExtensionNode,
  group: GroupNode,
  tts: TTSNode,
  schedule: ScheduleNode,
  hangup: HangupNode,
  ai: AINode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const URAEditor = () => {
  const { uraId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { tenantId, selectedTenantId } = useTenant();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [ura, setUra] = useState<any>(null);
  const [uraName, setUraName] = useState('Nova URA');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [ringGroups, setRingGroups] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  // Verificação de autenticação - deve ser feita antes de qualquer early return
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    console.log('URAEditor useEffect:', { uraId, tenantId, selectedTenantId });
    if (uraId) {
      // Tentar carregar a URA mesmo sem tenantId (para debug)
      loadURA();
      loadTenantData();
    } else {
      console.error('uraId não disponível');
      toast.error('ID da URA não encontrado');
      navigate('/ura-builder');
    }
  }, [uraId, tenantId, selectedTenantId]);

  const loadURA = async () => {
    try {
      console.log('Iniciando loadURA com uraId:', uraId);
      setLoading(true);
      const uraData = await api.getURA(uraId);
      console.log('Resposta da API:', uraData);
      
      if (uraData && !uraData.error) {
        setUra(uraData);
        setUraName(uraData.name);
        if (uraData.flow?.nodes) setNodes(uraData.flow.nodes);
        if (uraData.flow?.edges) setEdges(uraData.flow.edges);
        console.log('URA carregada com sucesso');
      } else {
        console.error('URA não encontrada ou erro:', uraData);
        toast.error('URA não encontrada');
        navigate('/ura-builder');
      }
    } catch (error) {
      console.error('Erro ao carregar URA:', error);
      toast.error('Erro ao carregar URA');
      navigate('/ura-builder');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantData = async () => {
    try {
      const currentTenantId = selectedTenantId || tenantId;
      if (!currentTenantId) {
        console.log('Tenant ID não disponível para carregar dados');
        return;
      }

      // Carregar extensões
      const extensionsData = await api.getExtensions(currentTenantId);
      if (extensionsData && !extensionsData.error) {
        console.log('Extensões carregadas:', extensionsData);
        setExtensions(extensionsData);
      }

      // Carregar grupos de toque
      const ringGroupsData = await api.getRingGroups(currentTenantId);
      if (ringGroupsData && !ringGroupsData.error) {
        console.log('Grupos carregados:', ringGroupsData);
        setRingGroups(ringGroupsData);
      }

      // Carregar vozes do ElevenLabs
      const voicesData = await api.getElevenLabsVoices();
      if (voicesData && !voicesData.error) {
        console.log('Vozes carregadas:', voicesData);
        setVoices(voicesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
    }
  };

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    handleNodeClick(node);
  }, []);

  const handleNodeClick = (node: Node) => {
    setEditingNode(node);
    setIsEditModalOpen(true);
  };

  const updateNode = (updatedData: any) => {
    if (!editingNode) return;
    
    console.log('Atualizando nó:', editingNode.id, updatedData);
    
    setNodes(nodes.map(node => 
      node.id === editingNode.id 
        ? { ...node, data: { ...node.data, ...updatedData } }
        : node
    ));
    
    // Atualizar o editingNode localmente para manter o modal sincronizado
    setEditingNode({
      ...editingNode,
      data: { ...editingNode.data, ...updatedData }
    });
  };

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    
    // Posicionamento mais organizado baseado no número de nós existentes
    const existingNodes = nodes.length;
    const position = { 
      x: 100 + (existingNodes % 3) * 300, 
      y: 100 + Math.floor(existingNodes / 3) * 200 
    };
    
    let data = {};
    switch (type) {
      case 'menu':
        data = { 
          message: 'Bem-vindo ao nosso sistema', 
          options: [
            { key: '1', label: 'Falar com atendente' },
            { key: '2', label: 'Informações' },
            { key: '3', label: 'Sair' }
          ] 
        };
        break;
      case 'extension':
        data = { extension: '1001', name: 'Atendente Principal' };
        break;
      case 'group':
        data = { groupId: 'grupo-atendimento', name: 'Grupo de Atendimento' };
        break;
      case 'tts':
        data = { 
          name: 'Mensagem de Boas-vindas', 
          text: 'Obrigado por entrar em contato conosco. Como posso ajudá-lo hoje?' 
        };
        break;
      case 'schedule':
        data = { 
          name: 'Verificar Horário Comercial', 
          schedule: '9:00-18:00,mon-fri' 
        };
        break;
      case 'hangup':
        data = { message: 'Obrigado por sua ligação' };
        break;
      case 'ai':
        data = { 
          projectId: 'assistente-virtual', 
          agentId: 'agente-001' 
        };
        break;
    }

    const newNode: Node = {
      id,
      type,
      position,
      data,
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success(`Nó ${type} adicionado com sucesso!`);
  };

  const deleteSelectedNodes = () => {
    const selectedNodes = nodes.filter(node => node.selected);
    if (selectedNodes.length === 0) {
      toast.error('Nenhum nó selecionado para deletar');
      return;
    }
    
    const selectedIds = selectedNodes.map(node => node.id);
    setNodes(nodes.filter(node => !selectedIds.includes(node.id)));
    setEdges(edges.filter(edge => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)));
    toast.success(`${selectedNodes.length} nó(s) deletado(s) com sucesso!`);
  };

  const clearCanvas = () => {
    if (nodes.length === 0) {
      toast.info('Canvas já está vazio');
      return;
    }
    
    setNodes([]);
    setEdges([]);
    toast.success('Canvas limpo com sucesso!');
  };

  // handleNodeClick and updateNode functions are no longer used

  const saveFlow = async () => {
    if (!uraId) return;
    
    setSaving(true);
    try {
      const flow = { nodes, edges };
      const result = await api.updateURA(uraId, { 
        name: uraName, 
        flow,
        description: ura?.description || '',
        is_active: ura?.is_active || true
      });
      
      if (result?.error) throw new Error(result.error);
      toast.success('URA salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar URA');
      console.error('Error saving URA:', error);
    } finally {
      setSaving(false);
    }
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header compacto */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ura-builder')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Input
            type="text"
            value={uraName}
            onChange={(e) => setUraName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none w-64"
            placeholder="Nome da URA"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={saveFlow} 
            disabled={saving}
            className="bg-[#7C45D0] hover:bg-[#6B3BB8]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de ferramentas horizontal */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Adicionar:</span>
            <Button
              onClick={() => addNode('menu')}
              variant="outline"
              size="sm"
            >
              <Menu className="w-4 h-4 mr-1" />
              Menu
            </Button>
            <Button
              onClick={() => addNode('extension')}
              variant="outline"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-1" />
              Ramal
            </Button>
            <Button
              onClick={() => addNode('group')}
              variant="outline"
              size="sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Grupo
            </Button>
            <Button
              onClick={() => addNode('tts')}
              variant="outline"
              size="sm"
            >
              <Volume2 className="w-4 h-4 mr-1" />
              TTS
            </Button>
            <Button
              onClick={() => addNode('schedule')}
              variant="outline"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              Horário
            </Button>
            <Button
              onClick={() => addNode('hangup')}
              variant="outline"
              size="sm"
            >
              <PhoneOff className="w-4 h-4 mr-1" />
              Encerrar
            </Button>
            <Button
              onClick={() => addNode('ai')}
              variant="outline"
              size="sm"
            >
              <Brain className="w-4 h-4 mr-1" />
              IA
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              {nodes.length} nós • {edges.length} conexões
            </div>
            <Button
              onClick={deleteSelectedNodes}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Deletar Selecionados
            </Button>
            <Button
              onClick={clearCanvas}
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar Canvas
            </Button>
          </div>
        </div>
      </div>
      
      {/* Canvas principal - tela cheia */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          connectionLineStyle={{ stroke: '#7C45D0', strokeWidth: 2 }}
          defaultEdgeOptions={{
            style: { stroke: '#7C45D0', strokeWidth: 2 },
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap 
            nodeColor="#7C45D0"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Controls />
          <Background 
            color="#e5e7eb"
            gap={20}
            size={1}
          />
        </ReactFlow>
      </div>

      {/* Modal de Edição de Nó */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {editingNode?.type?.toUpperCase()}</DialogTitle>
          </DialogHeader>
          
          {editingNode && (
            <div className="space-y-4">
              {editingNode.type === 'menu' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      value={(editingNode.data?.message as string) || ''}
                      onChange={(e) => updateNode({ message: e.target.value })}
                      placeholder="Digite a mensagem do menu..."
                    />
                  </div>
                  <div>
                    <Label>Opções</Label>
                    <div className="space-y-2">
                      {(editingNode.data?.options as any[])?.map((opt: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={opt.key || ''}
                            onChange={(e) => {
                              const newOptions = [...(editingNode.data?.options as any[] || [])];
                              newOptions[index].key = e.target.value;
                              updateNode({ options: newOptions });
                            }}
                            placeholder="Tecla"
                            className="w-16"
                          />
                          <Input
                            value={opt.label || ''}
                            onChange={(e) => {
                              const newOptions = [...(editingNode.data?.options as any[] || [])];
                              newOptions[index].label = e.target.value;
                              updateNode({ options: newOptions });
                            }}
                            placeholder="Descrição"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = (editingNode.data?.options as any[] || []).filter((_, i) => i !== index);
                              updateNode({ options: newOptions });
                            }}
                            className="px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(editingNode.data?.options as any[] || []), { key: '', label: '' }];
                          updateNode({ options: newOptions });
                        }}
                        className="w-full"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Opção
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {editingNode.type === 'extension' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="extension">Selecionar Ramal</Label>
                    <Select
                      value={String((editingNode.data?.extension as string) || '')}
                      onValueChange={(value) => {
                        const selectedExt = extensions.find(ext => ext.extension === value);
                        console.log('Selecionando extensão:', value, selectedExt);
                        console.log('Extensões disponíveis:', extensions.map(ext => ({ id: ext.id, extension: ext.extension, name: ext.name })));
                        updateNode({ 
                          extension: value,
                          name: selectedExt?.name || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ramal" />
                      </SelectTrigger>
                      <SelectContent>
                        {extensions.length > 0 ? (
                          extensions.map((ext) => (
                            <SelectItem key={ext.id} value={String(ext.extension)}>
                              {ext.extension} - {ext.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            Nenhuma extensão disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={(editingNode.data?.name as string) || ''}
                      onChange={(e) => updateNode({ name: e.target.value })}
                      placeholder="Nome do ramal"
                    />
                  </div>
                </div>
              )}

              {editingNode.type === 'group' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="group-id">Selecionar Grupo</Label>
                    <Select
                      value={String((editingNode.data?.groupId as string) || '')}
                      onValueChange={(value) => {
                        const selectedGroup = ringGroups.find(group => group.id === value);
                        updateNode({ 
                          groupId: value,
                          name: selectedGroup?.name || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ringGroups.length > 0 ? (
                          ringGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            Nenhum grupo disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="group-name">Nome do Grupo</Label>
                    <Input
                      id="group-name"
                      value={(editingNode.data?.name as string) || ''}
                      onChange={(e) => updateNode({ name: e.target.value })}
                      placeholder="Nome do grupo"
                    />
                  </div>
                </div>
              )}

              {editingNode.type === 'tts' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="tts-name">Nome do Áudio</Label>
                    <Input
                      id="tts-name"
                      value={(editingNode.data?.name as string) || ''}
                      onChange={(e) => updateNode({ name: e.target.value })}
                      placeholder="Nome do áudio TTS"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tts-voice">Voz</Label>
                    <Select
                      value={(editingNode.data?.voice as string) || ''}
                      onValueChange={(value) => updateNode({ voice: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma voz" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.length > 0 ? (
                          voices.map((voice) => (
                            <SelectItem key={voice.voice_id} value={voice.voice_id}>
                              {voice.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            Nenhuma voz disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tts-text">Texto</Label>
                    <Textarea
                      id="tts-text"
                      value={(editingNode.data?.text as string) || ''}
                      onChange={(e) => updateNode({ text: e.target.value })}
                      placeholder="Digite o texto para sintetizar..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Button
                      onClick={async () => {
                        const text = editingNode.data?.text;
                        const voice = editingNode.data?.voice;
                        if (!text || !voice) {
                          toast.error('Preencha o texto e selecione uma voz');
                          return;
                        }
                        
                        try {
                          setGeneratingAudio(true);
                          toast.loading('Gerando áudio...');
                          const currentTenantId = selectedTenantId || tenantId;
                          const result = await api.generateTTSAudio(currentTenantId, {
                            text,
                            voice_id: voice,
                            name: editingNode.data?.name || 'audio_ura'
                          });
                          
                          if (result && !result.error) {
                            toast.success('Áudio gerado com sucesso!');
                            updateNode({ audioUrl: result.audio_url });
                          } else {
                            toast.error('Erro ao gerar áudio');
                          }
                        } catch (error) {
                          console.error('Erro ao gerar TTS:', error);
                          toast.error('Erro ao gerar áudio');
                        } finally {
                          setGeneratingAudio(false);
                        }
                      }}
                      disabled={generatingAudio}
                      className="w-full"
                    >
                      {generatingAudio ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4 mr-2" />
                      )}
                      {generatingAudio ? 'Gerando...' : 'Gerar Áudio'}
                    </Button>
                  </div>
                </div>
              )}

              {editingNode.type === 'schedule' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="schedule-name">Nome</Label>
                    <Input
                      id="schedule-name"
                      value={(editingNode.data?.name as string) || ''}
                      onChange={(e) => updateNode({ name: e.target.value })}
                      placeholder="Nome da verificação"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule">Horário</Label>
                    <Input
                      id="schedule"
                      value={(editingNode.data?.schedule as string) || ''}
                      onChange={(e) => updateNode({ schedule: e.target.value })}
                      placeholder="Ex: 9:00-18:00,mon-fri"
                    />
                  </div>
                </div>
              )}

              {editingNode.type === 'ai' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="project-id">ID do Projeto</Label>
                    <Input
                      id="project-id"
                      value={(editingNode.data?.projectId as string) || ''}
                      onChange={(e) => updateNode({ projectId: e.target.value })}
                      placeholder="ID do projeto IA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-id">ID do Agente</Label>
                    <Input
                      id="agent-id"
                      value={(editingNode.data?.agentId as string) || ''}
                      onChange={(e) => updateNode({ agentId: e.target.value })}
                      placeholder="ID do agente"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingNode(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingNode(null);
                    toast.success('Alterações salvas!');
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default URAEditor; 