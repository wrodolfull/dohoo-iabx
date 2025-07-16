import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Brain } from 'lucide-react';

interface AINodeData {
  projectId?: string;
  agentId?: string;
  sessionId?: string;
  webhook?: string;
}

function AINode({ data }: { data: AINodeData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<AINodeData>(data || {
    projectId: 'projeto-dialogflow',
    agentId: 'agent-atendimento',
    sessionId: 'session-default',
    webhook: 'https://webhook.exemplo.com'
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-orange-500 min-w-[180px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Brain className="w-4 h-4 mr-2 text-orange-600" />
            <span className="text-sm font-medium">IA</span>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Integração IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    value={nodeData.projectId}
                    onChange={(e) => setNodeData({...nodeData, projectId: e.target.value})}
                    placeholder="Ex: meu-projeto-dialogflow"
                  />
                </div>
                <div>
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input
                    id="agentId"
                    value={nodeData.agentId}
                    onChange={(e) => setNodeData({...nodeData, agentId: e.target.value})}
                    placeholder="Ex: agent-atendimento"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <Input
                    id="webhook"
                    value={nodeData.webhook}
                    onChange={(e) => setNodeData({...nodeData, webhook: e.target.value})}
                    placeholder="https://webhook.exemplo.com"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-xs text-gray-600 mb-1">
          Dialogflow CX
        </div>
        <div className="text-xs text-gray-500">
          {nodeData.projectId}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(AINode); 