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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Phone, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode, 
  Copy,
  Eye,
  EyeOff,
  User,
  Settings,
  PhoneCall,
  PhoneOff
} from "lucide-react";
import { toast } from "sonner";

interface Extension {
  id: string;
  name: string;
  number: string;
  sip_password: string;
  tenant_id: string;
  created_at: string;
  created_by: string;
}

const Extensions = () => {
  const { user } = useAuth();
  const tenantId = user?.company || '';
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    sip_password: ''
  });

  useEffect(() => {
    loadExtensions();
  }, [tenantId]);

  const loadExtensions = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const data = await api.getExtensions(tenantId);
      setExtensions(data || []);
    } catch (error) {
      toast.error('Erro ao carregar ramais');
      console.error('Error loading extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingExtension) {
        await api.updateExtension(editingExtension.id, formData);
        toast.success('Ramal atualizado com sucesso!');
      } else {
        await api.createExtension(tenantId, formData);
        toast.success('Ramal criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadExtensions();
    } catch (error) {
      toast.error(editingExtension ? 'Erro ao atualizar ramal' : 'Erro ao criar ramal');
      console.error('Error saving extension:', error);
    }
  };

  const handleDelete = async (extension: Extension) => {
    if (!confirm(`Tem certeza que deseja excluir o ramal ${extension.number}?`)) return;
    try {
      await api.deleteExtension(extension.id);
      toast.success('Ramal excluído com sucesso!');
      loadExtensions();
    } catch (error) {
      toast.error('Erro ao excluir ramal');
      console.error('Error deleting extension:', error);
    }
  };

  const handleEdit = (extension: Extension) => {
    setEditingExtension(extension);
    setFormData({
      name: extension.name,
      number: extension.number,
      sip_password: extension.sip_password
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExtension(null);
    setFormData({
      name: '',
      number: '',
      sip_password: ''
    });
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, sip_password: password });
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const generateSipUri = (extension: Extension) => {
    return `sip:${extension.number}@${extension.domain}:${extension.port}`;
  };

  const generateQRCode = (extension: Extension) => {
    const sipUri = generateSipUri(extension);
    const qrData = `${sipUri}?password=${extension.password}`;
    
    // Simulação - em um app real, você usaria uma biblioteca de QR Code
    toast.info(`QR Code gerado para ${extension.name}`);
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando ramais...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Phone className="w-8 h-8 text-dohoo-primary" />
            Ramais
          </h1>
          <p className="text-gray-600">
            Gerencie os ramais SIP do seu sistema
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Ramal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExtension ? 'Editar Ramal' : 'Novo Ramal'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do ramal SIP
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome do usuário"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  placeholder="Ex: 1001"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha SIP</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    placeholder="Senha do ramal"
                    value={formData.sip_password}
                    onChange={(e) => setFormData({ ...formData, sip_password: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingExtension ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou número do ramal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Extensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExtensions.map((extension) => (
          <Card key={extension.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {extension.name}
                </CardTitle>
                <Badge variant="outline">
                  {extension.number}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ramal:</span>
                  <span className="font-medium">{extension.number}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <PhoneCall className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(extension)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(extension)}
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

      {extensions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum ramal cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro ramal SIP</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Ramal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Extensions;
