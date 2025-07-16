import React, { useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bot, 
  Plus, 
  Save, 
  Play, 
  Phone, 
  Users, 
  MessageSquare,
  ArrowRight,
  Trash2,
  Edit,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface URANode {
  id: string;
  type: 'start' | 'menu' | 'action' | 'transfer';
  title: string;
  description?: string;
  message?: string;
  options?: URAOption[];
  transferTo?: string;
  transferType?: 'extension' | 'group';
  position: { x: number; y: number };
}

interface URAOption {
  key: string;
  label: string;
  action: string;
  nextNodeId?: string;
}

interface URAFlow {
  id: string;
  name: string;
  description: string;
  nodes: URANode[];
  connections: Array<{ from: string; to: string; option?: string }>;
  isActive: boolean;
}

const initialNodes: Node[] = [
  // Exemplo de nó inicial
];
const initialEdges: Edge[] = [];

const URABuilder = () => {
  const tenantId = '';
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [uraId, setUraId] = useState<string | null>(null);

  useEffect(() => {
    // Carregar flow salvo
    api.getURA(tenantId).then((uras) => {
      if (uras && uras.length > 0) {
        setUraId(uras[0].id);
        const flow = uras[0].flow;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
      }
    });
  }, [tenantId]);

  const onConnect = (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds));

  const saveFlow = async () => {
    const flow = { nodes, edges };
    if (uraId) {
      await api.updateURA(uraId, { name: 'URA', flow });
    } else {
      await api.createURA(tenantId, { name: 'URA', flow });
    }
    alert('URA salva!');
  };

  const [flows, setFlows] = useState<URAFlow[]>([
    {
      id: '1',
      name: 'Atendimento Principal',
      description: 'URA principal do sistema',
      nodes: [
        {
          id: 'start',
          type: 'start',
          title: 'Início',
          message: 'Bem-vindo à nossa empresa. Como podemos ajudá-lo?',
          position: { x: 100, y: 100 }
        },
        {
          id: 'menu1',
          type: 'menu',
          title: 'Menu Principal',
          message: 'Para vendas, diga "vendas". Para suporte, diga "suporte". Para falar com um atendente, diga "atendente".',
          options: [
            { key: 'vendas', label: 'Vendas', action: 'goto_node', nextNodeId: 'transfer1' },
            { key: 'suporte', label: 'Suporte', action: 'goto_node', nextNodeId: 'transfer2' },
            { key: 'atendente', label: 'Atendente', action: 'goto_node', nextNodeId: 'transfer3' }
          ],
          position: { x: 300, y: 100 }
        },
        {
          id: 'transfer1',
          type: 'transfer',
          title: 'Transferir Vendas',
          transferTo: '2000',
          transferType: 'group',
          position: { x: 500, y: 50 }
        },
        {
          id: 'transfer2',
          type: 'transfer',
          title: 'Transferir Suporte',
          transferTo: '2001',
          transferType: 'group',
          position: { x: 500, y: 150 }
        }
      ],
      connections: [
        { from: 'start', to: 'menu1' },
        { from: 'menu1', to: 'transfer1', option: 'vendas' },
        { from: 'menu1', to: 'transfer2', option: 'suporte' }
      ],
      isActive: true
    }
  ]);

  const [selectedFlow, setSelectedFlow] = useState<URAFlow | null>(flows[0]);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<URANode | null>(null);
  const [nodeFormData, setNodeFormData] = useState({
    title: '',
    message: '',
    transferTo: '',
    transferType: 'extension' as 'extension' | 'group'
  });

  // Dados simulados
  const availableExtensions = [
    { number: '1001', name: 'João Silva' },
    { number: '1002', name: 'Maria Santos' },
    { number: '1003', name: 'Pedro Costa' }
  ];

  const availableGroups = [
    { number: '2000', name: 'Atendimento Comercial' },
    { number: '2001', name: 'Suporte Técnico' },
    { number: '2002', name: 'Gerência' }
  ];

  const handleCreateNode = (type: URANode['type']) => {
    setEditingNode(null);
    setNodeFormData({
      title: '',
      message: '',
      transferTo: '',
      transferType: 'extension'
    });
    setIsNodeDialogOpen(true);
  };

  const handleSaveNode = () => {
    if (!selectedFlow) return;

    const newNode: URANode = {
      id: editingNode?.id || `node_${Date.now()}`,
      type: editingNode?.type || 'menu',
      title: nodeFormData.title,
      message: nodeFormData.message,
      transferTo: nodeFormData.transferTo,
      transferType: nodeFormData.transferType,
      position: editingNode?.position || { x: 200, y: 200 },
      options: editingNode?.type === 'menu' ? [
        { key: '1', label: 'Opção 1', action: 'goto_node' },
        { key: '2', label: 'Opção 2', action: 'goto_node' }
      ] : undefined
    };

    const updatedFlow = {
      ...selectedFlow,
      nodes: editingNode 
        ? selectedFlow.nodes.map(node => node.id === editingNode.id ? newNode : node)
        : [...selectedFlow.nodes, newNode]
    };

    setFlows(flows.map(flow => flow.id === selectedFlow.id ? updatedFlow : flow));
    setSelectedFlow(updatedFlow);
    setIsNodeDialogOpen(false);
    
    toast.success(editingNode ? 'Nó atualizado!' : 'Nó criado!');
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedFlow) return;
    
    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.filter(node => node.id !== nodeId),
      connections: selectedFlow.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      )
    };

    setFlows(flows.map(flow => flow.id === selectedFlow.id ? updatedFlow : flow));
    setSelectedFlow(updatedFlow);
    toast.success('Nó removido!');
  };

  const handleEditNode = (node: URANode) => {
    setEditingNode(node);
    setNodeFormData({
      title: node.title,
      message: node.message || '',
      transferTo: node.transferTo || '',
      transferType: node.transferType || 'extension'
    });
    setIsNodeDialogOpen(true);
  };

  const handleSaveFlow = () => {
    if (!selectedFlow) return;
    toast.success('Fluxo salvo com sucesso!');
  };

  const handleTestFlow = () => {
    if (!selectedFlow) return;
    toast.info('Iniciando teste do fluxo URA...');
  };

  const getNodeIcon = (type: URANode['type']) => {
    switch (type) {
      case 'start': return Play;
      case 'menu': return MessageSquare;
      case 'transfer': return Phone;
      case 'action': return Settings;
      default: return MessageSquare;
    }
  };

  const getNodeColor = (type: URANode['type']) => {
    switch (type) {
      case 'start': return 'bg-green-100 border-green-300 text-green-800';
      case 'menu': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'transfer': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'action': return 'bg-orange-100 border-orange-300 text-orange-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-dohoo-primary" />
            URA Builder
          </h1>
          <p className="text-gray-600">
            Construa fluxos de URA inteligentes com processamento de IA
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleTestFlow}>
            <Play className="w-4 h-4 mr-2" />
            Testar Fluxo
          </Button>
          <Button onClick={handleSaveFlow}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Fluxo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Componentes URA</CardTitle>
            <CardDescription>
              Arraste os componentes para criar seu fluxo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCreateNode('menu')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Menu de Opções
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCreateNode('transfer')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Transferir Chamada
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCreateNode('action')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Ação Personalizada
            </Button>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Fluxos Salvos</h4>
              <div className="space-y-2">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFlow?.id === flow.id 
                        ? 'border-dohoo-primary bg-dohoo-light/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFlow(flow)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{flow.name}</p>
                        <p className="text-xs text-gray-600">{flow.nodes.length} nós</p>
                      </div>
                      <Badge variant={flow.isActive ? 'default' : 'secondary'} className="text-xs">
                        {flow.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedFlow?.name || 'Nenhum fluxo selecionado'}
              </CardTitle>
              {selectedFlow && (
                <Badge variant={selectedFlow.isActive ? 'default' : 'secondary'}>
                  {selectedFlow.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
            </div>
            <CardDescription>
              {selectedFlow?.description || 'Selecione um fluxo para editar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFlow ? (
              <div style={{ height: '80vh', width: '100%' }}>
                <button onClick={saveFlow} className="mb-2 px-4 py-2 bg-primary text-white rounded">Salvar URA</button>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                >
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </div>
            ) : (
              <div className="min-h-[500px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum fluxo selecionado</p>
                  <p className="text-sm">Selecione um fluxo da lista para editar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Node Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Editar Componente' : 'Novo Componente'}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades do componente URA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Nome do componente"
                value={nodeFormData.title}
                onChange={(e) => setNodeFormData({ ...nodeFormData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem de Áudio</Label>
              <Textarea
                id="message"
                placeholder="Digite a mensagem que será falada pela IA..."
                value={nodeFormData.message}
                onChange={(e) => setNodeFormData({ ...nodeFormData, message: e.target.value })}
                rows={3}
              />
            </div>

            {editingNode?.type === 'transfer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="transferType">Tipo de Transferência</Label>
                  <Select
                    value={nodeFormData.transferType}
                    onValueChange={(value: 'extension' | 'group') => 
                      setNodeFormData({ ...nodeFormData, transferType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="extension">Ramal</SelectItem>
                      <SelectItem value="group">Grupo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferTo">Destino</Label>
                  <Select
                    value={nodeFormData.transferTo}
                    onValueChange={(value) => 
                      setNodeFormData({ ...nodeFormData, transferTo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeFormData.transferType === 'extension' 
                        ? availableExtensions.map((ext) => (
                            <SelectItem key={ext.number} value={ext.number}>
                              {ext.number} - {ext.name}
                            </SelectItem>
                          ))
                        : availableGroups.map((group) => (
                            <SelectItem key={group.number} value={group.number}>
                              {group.number} - {group.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveNode} className="flex-1">
                {editingNode ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default URABuilder;
