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
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
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
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (selectedTenant) {
      loadExtensions();
    }
  }, [selectedTenant]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'superadmin') {
        // Para superadmin, carregar lista de tenants
        const tenantsData = await api.getTenants();
        setTenants(tenantsData || []);
        
        // Selecionar o primeiro tenant por padrão
        if (tenantsData && tenantsData.length > 0) {
          setSelectedTenant(tenantsData[0].id);
        }
      } else if (user?.tenant_id) {
        // Para usuários normais, usar o tenant_id do usuário
        setSelectedTenant(user.tenant_id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadExtensions = async () => {
    if (!selectedTenant) return;
    try {
      setLoading(true);
      const data = await api.getExtensions(selectedTenant);
      setExtensions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar ramais');
      console.error('Error loading extensions:', error);
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    try {
      if (editingExtension) {
        await api.updateExtension(editingExtension.id, formData);
        toast.success('Ramal atualizado com sucesso!');
      } else {
        await api.createExtension(selectedTenant, formData);
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

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado para a área de transferência!');
      } else {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const generateSipUri = (extension: Extension) => {
    return `sip:${extension.number}@${user?.domain || 'localhost'}:5060`;
  };

  const generateQRCode = (extension: Extension) => {
    const sipUri = generateSipUri(extension);
    const qrData = `${sipUri}?password=${extension.sip_password}`;
    
    // Simulação - em um app real, você usaria uma biblioteca de QR Code
    toast.info(`QR Code gerado para ${extension.name}`);
  };

  const filteredExtensions = (extensions || []).filter(ext =>
    ext?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext?.number?.includes(searchTerm)
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
            <Button onClick={resetForm} disabled={!selectedTenant}>
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
                {editingExtension ? 'Atualize as informações do ramal' : 'Crie um novo ramal SIP'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Ex: 1001"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha SIP</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={formData.sip_password}
                    onChange={(e) => setFormData({ ...formData, sip_password: e.target.value })}
                    placeholder="Senha do ramal"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Gerar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingExtension ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tenant Selector for Superadmin */}
      {user?.role === 'superadmin' && tenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Empresa</CardTitle>
            <CardDescription>
              Escolha a empresa para gerenciar os ramais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select 
              value={selectedTenant} 
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name || `Tenant ${tenant.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

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

      {/* Extensions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ramais Configurados</CardTitle>
          <CardDescription>
            Lista de todos os ramais SIP configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExtensions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedTenant ? 'Nenhum ramal encontrado' : 'Selecione uma empresa para visualizar os ramais'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Senha SIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExtensions.map((extension) => (
                  <TableRow key={extension.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {extension.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {extension.number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm">
                          {showPasswords[extension.id] ? extension.sip_password : '••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(extension.id)}
                        >
                          {showPasswords[extension.id] ? 
                            <EyeOff className="w-4 h-4" /> : 
                            <Eye className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(extension.sip_password)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        <PhoneCall className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateQRCode(extension)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(extension)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(extension)}
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

export default Extensions;
