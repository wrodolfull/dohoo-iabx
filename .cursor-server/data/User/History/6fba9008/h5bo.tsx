import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Users } from 'lucide-react';

interface GroupNodeData {
  groupId?: string;
  name?: string;
  type?: 'simultaneous' | 'sequential';
}

function GroupNode({ data }: { data: GroupNodeData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<GroupNodeData>(data || {
    groupId: 'group-1',
    name: 'Grupo Suporte',
    type: 'simultaneous'
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[180px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-purple-600" />
            <span className="text-sm font-medium">Grupo</span>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Ring Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="groupId">ID do Grupo</Label>
                  <Input
                    id="groupId"
                    value={nodeData.groupId}
                    onChange={(e) => setNodeData({...nodeData, groupId: e.target.value})}
                    placeholder="Ex: group-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome do Grupo</Label>
                  <Input
                    id="name"
                    value={nodeData.name}
                    onChange={(e) => setNodeData({...nodeData, name: e.target.value})}
                    placeholder="Ex: Grupo Suporte"
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
          ID: {nodeData.groupId}
        </div>
        <div className="text-xs text-gray-500">
          {nodeData.name}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(GroupNode); 