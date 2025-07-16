import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Menu } from 'lucide-react';

interface MenuNodeData {
  message?: string;
  options?: Array<{ key: string; label: string; target?: string }>;
}

function MenuNode({ data }: { data: MenuNodeData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeData, setNodeData] = useState<MenuNodeData>(data || {
    message: 'Bem-vindo ao atendimento',
    options: [
      { key: '1', label: 'Suporte' },
      { key: '2', label: 'Comercial' },
      { key: '0', label: 'Falar com atendente' }
    ]
  });

  const handleSave = () => {
    // Aqui você atualizaria o nó no react-flow
    setIsEditing(false);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Menu className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-sm font-medium">Menu URA</span>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Menu URA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Input
                    id="message"
                    value={nodeData.message}
                    onChange={(e) => setNodeData({...nodeData, message: e.target.value})}
                    placeholder="Digite a mensagem do menu"
                  />
                </div>
                <div>
                  <Label>Opções</Label>
                  {nodeData.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        placeholder="Tecla"
                        value={option.key}
                        onChange={(e) => {
                          const newOptions = [...(nodeData.options || [])];
                          newOptions[index] = {...option, key: e.target.value};
                          setNodeData({...nodeData, options: newOptions});
                        }}
                        className="w-16"
                      />
                      <Input
                        placeholder="Descrição"
                        value={option.label}
                        onChange={(e) => {
                          const newOptions = [...(nodeData.options || [])];
                          newOptions[index] = {...option, label: e.target.value};
                          setNodeData({...nodeData, options: newOptions});
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSave} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-xs text-gray-600 mb-2">
          {nodeData.message}
        </div>
        <div className="space-y-1">
          {nodeData.options?.slice(0, 3).map((option) => (
            <div key={option.key} className="text-xs bg-blue-50 rounded px-2 py-1">
              {option.key}: {option.label}
            </div>
          ))}
          {(nodeData.options?.length || 0) > 3 && (
            <div className="text-xs text-gray-500">+{(nodeData.options?.length || 0) - 3} opções</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(MenuNode); 