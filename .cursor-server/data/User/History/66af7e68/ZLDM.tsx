import React, { useCallback, useEffect, useState } from 'react';
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
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MenuNode from '../components/URANodes/MenuNode';
import ExtensionNode from '../components/URANodes/ExtensionNode';
import GroupNode from '../components/URANodes/GroupNode';
import AINode from '../components/URANodes/AINode';
import { Menu, Phone, Users, Brain, Plus } from 'lucide-react';

const nodeTypes: NodeTypes = {
  menu: MenuNode,
  extension: ExtensionNode,
  group: GroupNode,
  ai: AINode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function URABuilder() {
  const { user } = useAuth();
  const tenantId = user?.company || '';
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [uraId, setUraId] = useState<string | null>(null);
  const [uraName, setUraName] = useState('Nova URA');

  useEffect(() => {
    if (tenantId) {
      api.getURA(tenantId).then((uras) => {
        if (uras && uras.length > 0) {
          const ura = uras[0];
          setUraId(ura.id);
          setUraName(ura.name);
          const flow = ura.flow;
          if (flow?.nodes) setNodes(flow.nodes);
          if (flow?.edges) setEdges(flow.edges);
        }
      });
    }
  }, [tenantId]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    
    let data = {};
    switch (type) {
      case 'menu':
        data = { message: 'Bem-vindo', options: [{ key: '1', label: 'Opção 1' }] };
        break;
      case 'extension':
        data = { extension: '1001', name: 'Ramal' };
        break;
      case 'group':
        data = { groupId: 'grupo-1', name: 'Grupo' };
        break;
      case 'ai':
        data = { projectId: 'projeto-ia', agentId: 'agent' };
        break;
    }

    const newNode: Node = {
      id,
      type,
      position,
      data,
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const saveFlow = async () => {
    if (!tenantId) return;
    
    const flow = { nodes, edges };
    try {
      if (uraId) {
        await api.updateURA(uraId, { name: uraName, flow });
      } else {
        const result = await api.createURA(tenantId, { name: uraName, flow });
        setUraId(result.id);
      }
      alert('URA salva com sucesso!');
    } catch (error) {
      alert('Erro ao salvar URA');
    }
  };

  return (
    <div className="h-screen flex">
      {/* Toolbar lateral */}
      <Card className="w-64 h-full rounded-none border-r">
        <CardHeader>
          <CardTitle className="text-lg">Blocos URA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => addNode('menu')}
            variant="outline"
            className="w-full justify-start"
          >
            <Menu className="w-4 h-4 mr-2" />
            Menu
          </Button>
          <Button
            onClick={() => addNode('extension')}
            variant="outline"
            className="w-full justify-start"
          >
            <Phone className="w-4 h-4 mr-2" />
            Ramal
          </Button>
          <Button
            onClick={() => addNode('group')}
            variant="outline"
            className="w-full justify-start"
          >
            <Users className="w-4 h-4 mr-2" />
            Grupo
          </Button>
          <Button
            onClick={() => addNode('ai')}
            variant="outline"
            className="w-full justify-start"
          >
            <Brain className="w-4 h-4 mr-2" />
            IA
          </Button>
        </CardContent>
      </Card>

      {/* Canvas principal */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={uraName}
              onChange={(e) => setUraName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none"
            />
            <Button onClick={saveFlow} className="bg-[#7C45D0] hover:bg-[#6B3BB8]">
              Salvar URA
            </Button>
          </div>
        </div>
        
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
