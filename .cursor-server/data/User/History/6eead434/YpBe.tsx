import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Server, 
  Save, 
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface DialplanRule {
  id: string;
  name: string;
  condition: string;
  destination_number: string;
  context: string;
  actions: string[];
  enabled: boolean;
  priority: number;
}

interface SipProfile {
  id: string;
  name: string;
  type: 'internal' | 'external';
  port: number;
  rtp_ip: string;
  sip_ip: string;
  context: string;
  codec_prefs: string;
  dtmf_duration: number;
  enabled: boolean;
  custom_params: Record<string, string>;
}

interface FreeSwitchConfig {
  log_level: string;
  max_sessions: number;
  sessions_per_second: number;
  rtp_start_port: number;
  rtp_end_port: number;
  dialplan_hunt_on_failure: boolean;
  continue_on_fail: boolean;
  hangup_after_bridge: boolean;
}

const FreeSwitchAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dialplan');
  
  // States para dialplans
  const [dialplans, setDialplans] = useState<DialplanRule[]>([]);
  const [selectedDialplan, setSelectedDialplan] = useState<DialplanRule | null>(null);
  const [isEditingDialplan, setIsEditingDialplan] = useState(false);
  
  // States para perfis SIP
  const [sipProfiles, setSipProfiles] = useState<SipProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SipProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // State para controle de erro
  const [hasError, setHasError] = useState(false);
  
  // States para configurações globais
  const [freeswitchConfig, setFreeswitchConfig] = useState<FreeSwitchConfig>({
    log_level: 'INFO',
    max_sessions: 1000,
    sessions_per_second: 30,
    rtp_start_port: 16384,
    rtp_end_port: 32768,
    dialplan_hunt_on_failure: true,
    continue_on_fail: true,
    hangup_after_bridge: true
  });

  // Estados para visualização
  const [showRawXML, setShowRawXML] = useState(false);
  const [fsStatus, setFsStatus] = useState<'running' | 'stopped' | 'restarting'>('running');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      
      // Carregar dialplans
      try {
        const dialplansResponse = await api.getDialplans();
        setDialplans(Array.isArray(dialplansResponse) ? dialplansResponse : []);
      } catch (error) {
        console.error('Error loading dialplans:', error);
        setDialplans([]);
      }
      
      // Carregar perfis SIP
      try {
        const profilesResponse = await api.getSipProfiles();
        setSipProfiles(Array.isArray(profilesResponse) ? profilesResponse : []);
      } catch (error) {
        console.error('Error loading SIP profiles:', error);
        setSipProfiles([]);
      }
      
      // Carregar configuração global
      try {
        const configResponse = await api.getFreeSwitchConfig();
        if (configResponse) {
          setFreeswitchConfig(configResponse);
        }
      } catch (error) {
        console.error('Error loading FreeSWITCH config:', error);
      }
      
      // Verificar status do FreeSWITCH
      try {
        const statusResponse = await api.getFreeSwitchStatus();
        setFsStatus(statusResponse?.status || 'stopped');
      } catch {
        setFsStatus('stopped');
      }
      
    } catch (error) {
      console.error('Error loading FreeSWITCH data:', error);
      setHasError(true);
      
      // Fallback para dados mock se a API falhar
      const mockDialplans: DialplanRule[] = [
        {
          id: '1',
          name: 'Default Extension Routing',
          condition: '^(\\d{4})$',
          destination_number: '$1',
          context: 'default',
          actions: ['bridge user/$1@${domain_name}'],
          enabled: true,
          priority: 10
        }
      ];
      
      const mockProfiles: SipProfile[] = [
        {
          id: '1',
          name: 'internal',
          type: 'internal',
          port: 5060,
          rtp_ip: 'auto',
          sip_ip: 'auto',
          context: 'default',
          codec_prefs: 'PCMU,PCMA,G729',
          dtmf_duration: 2000,
          enabled: true,
          custom_params: {
            'auth-calls': 'true',
            'apply-nat-acl': 'nat.auto'
          }
        }
      ];

      setDialplans(mockDialplans);
      setSipProfiles(mockProfiles);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDialplan = async (dialplan: DialplanRule) => {
    try {
      setSaving(true);
      
      if (dialplan.id === 'new') {
        // Criar novo dialplan
        const response = await api.createDialplan({
          name: dialplan.name,
          condition: dialplan.condition,
          destination_number: dialplan.destination_number,
          context: dialplan.context,
          actions: dialplan.actions,
          enabled: dialplan.enabled,
          priority: dialplan.priority
        });
        
        setDialplans([...dialplans, response]);
        toast.success('Dialplan criado com sucesso!');
      } else {
        // Atualizar dialplan existente
        const response = await api.updateDialplan(dialplan.id, {
          name: dialplan.name,
          condition: dialplan.condition,
          destination_number: dialplan.destination_number,
          context: dialplan.context,
          actions: dialplan.actions,
          enabled: dialplan.enabled,
          priority: dialplan.priority
        });
        
        setDialplans(dialplans.map(d => d.id === dialplan.id ? response : d));
        toast.success('Dialplan atualizado com sucesso!');
      }
      
      setSelectedDialplan(null);
      setIsEditingDialplan(false);
      
    } catch (error) {
      toast.error('Erro ao salvar dialplan');
      console.error('Error saving dialplan:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDialplan = async (id: string) => {
    try {
      await api.deleteDialplan(id);
      setDialplans(dialplans.filter(d => d.id !== id));
      toast.success('Dialplan excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir dialplan');
    }
  };

  const handleSaveProfile = async (profile: SipProfile) => {
    try {
      setSaving(true);
      
      if (profile.id === 'new') {
        // Criar novo perfil
        const response = await api.createSipProfile({
          name: profile.name,
          type: profile.type,
          port: profile.port,
          rtp_ip: profile.rtp_ip,
          sip_ip: profile.sip_ip,
          context: profile.context,
          codec_prefs: profile.codec_prefs,
          dtmf_duration: profile.dtmf_duration,
          enabled: profile.enabled,
          custom_params: profile.custom_params
        });
        
        setSipProfiles([...sipProfiles, response]);
        toast.success('Perfil SIP criado com sucesso!');
      } else {
        // Atualizar perfil existente
        const response = await api.updateSipProfile(profile.id, {
          name: profile.name,
          type: profile.type,
          port: profile.port,
          rtp_ip: profile.rtp_ip,
          sip_ip: profile.sip_ip,
          context: profile.context,
          codec_prefs: profile.codec_prefs,
          dtmf_duration: profile.dtmf_duration,
          enabled: profile.enabled,
          custom_params: profile.custom_params
        });
        
        setSipProfiles(sipProfiles.map(p => p.id === profile.id ? response : p));
        toast.success('Perfil SIP atualizado com sucesso!');
      }
      
      setSelectedProfile(null);
      setIsEditingProfile(false);
      
    } catch (error) {
      toast.error('Erro ao salvar perfil SIP');
      console.error('Error saving SIP profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await api.deleteSipProfile(id);
      setSipProfiles(sipProfiles.filter(p => p.id !== id));
      toast.success('Perfil SIP excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir perfil SIP');
    }
  };

  const handleReloadFreeSWITCH = async () => {
    try {
      setFsStatus('restarting');
      
      const response = await api.reloadFreeSWITCH();
      
      if (response.success) {
        setFsStatus('running');
        toast.success('FreeSWITCH recarregado com sucesso!');
      } else {
        setFsStatus('stopped');
        toast.error('Erro ao recarregar FreeSWITCH');
      }
    } catch (error) {
      setFsStatus('stopped');
      toast.error('Erro ao recarregar FreeSWITCH');
    }
  };

  const handleExportConfig = () => {
    const config = {
      dialplans,
      sipProfiles,
      freeswitchConfig
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'freeswitch-config.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Configuração exportada com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando configurações do FreeSWITCH...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Server className="w-8 h-8 text-dohoo-primary" />
            FreeSWITCH Avançado
          </h1>
          <p className="text-gray-600">
            Configurações avançadas do FreeSWITCH para Superadmins
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleReloadFreeSWITCH} 
            disabled={fsStatus === 'restarting'}
            variant={fsStatus === 'running' ? 'default' : 'destructive'}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${fsStatus === 'restarting' ? 'animate-spin' : ''}`} />
            {fsStatus === 'restarting' ? 'Reiniciando...' : 'Reload FS'}
          </Button>
        </div>
      </div>

      {/* Status do FreeSWITCH */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                fsStatus === 'running' ? 'bg-green-500' : 
                fsStatus === 'restarting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                Status: {
                  fsStatus === 'running' ? 'Executando' :
                  fsStatus === 'restarting' ? 'Reiniciando' : 'Parado'
                }
              </span>
            </div>
            <Badge variant={fsStatus === 'running' ? 'default' : 'destructive'}>
              {fsStatus === 'running' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dialplan">Dialplan</TabsTrigger>
          <TabsTrigger value="profiles">Perfis SIP</TabsTrigger>
          <TabsTrigger value="global">Configuração Global</TabsTrigger>
          <TabsTrigger value="raw">XML Bruto</TabsTrigger>
        </TabsList>

        {/* Dialplan Management */}
        <TabsContent value="dialplan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Dialplans */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Regras de Dialplan</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDialplan({
                        id: 'new',
                        name: '',
                        condition: '',
                        destination_number: '',
                        context: 'default',
                        actions: [''],
                        enabled: true,
                        priority: 100
                      });
                      setIsEditingDialplan(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dialplans.map((dialplan) => (
                    <div
                      key={dialplan.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedDialplan(dialplan);
                        setIsEditingDialplan(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{dialplan.name}</h4>
                          <p className="text-sm text-gray-600">
                            Condição: {dialplan.condition}
                          </p>
                          <p className="text-sm text-gray-500">
                            Contexto: {dialplan.context} | Prioridade: {dialplan.priority}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={dialplan.enabled ? 'default' : 'secondary'}>
                            {dialplan.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDialplan(dialplan.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor de Dialplan */}
            {isEditingDialplan && selectedDialplan && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDialplan.id === 'new' ? 'Nova Regra' : 'Editar Regra'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Regra</Label>
                    <Input
                      value={selectedDialplan.name}
                      onChange={(e) => setSelectedDialplan({
                        ...selectedDialplan,
                        name: e.target.value
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contexto</Label>
                      <Select
                        value={selectedDialplan.context}
                        onValueChange={(value) => setSelectedDialplan({
                          ...selectedDialplan,
                          context: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">default</SelectItem>
                          <SelectItem value="public">public</SelectItem>
                          <SelectItem value="features">features</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Input
                        type="number"
                        value={selectedDialplan.priority}
                        onChange={(e) => setSelectedDialplan({
                          ...selectedDialplan,
                          priority: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Condição (Regex)</Label>
                    <Input
                      value={selectedDialplan.condition}
                      onChange={(e) => setSelectedDialplan({
                        ...selectedDialplan,
                        condition: e.target.value
                      })}
                      placeholder="Ex: ^(\d{4})$"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Destino</Label>
                    <Input
                      value={selectedDialplan.destination_number}
                      onChange={(e) => setSelectedDialplan({
                        ...selectedDialplan,
                        destination_number: e.target.value
                      })}
                      placeholder="Ex: $1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ações</Label>
                    <Textarea
                      value={selectedDialplan.actions.join('\n')}
                      onChange={(e) => setSelectedDialplan({
                        ...selectedDialplan,
                        actions: e.target.value.split('\n').filter(a => a.trim())
                      })}
                      placeholder="Uma ação por linha. Ex: bridge user/$1@${domain_name}"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedDialplan.enabled}
                        onCheckedChange={(checked) => setSelectedDialplan({
                          ...selectedDialplan,
                          enabled: checked
                        })}
                      />
                      <Label>Ativo</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDialplan(null);
                          setIsEditingDialplan(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={() => handleSaveDialplan(selectedDialplan)}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* SIP Profiles Management */}
        <TabsContent value="profiles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Perfis SIP */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Perfis SIP</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProfile({
                        id: 'new',
                        name: '',
                        type: 'internal',
                        port: 5060,
                        rtp_ip: 'auto',
                        sip_ip: 'auto',
                        context: 'default',
                        codec_prefs: 'PCMU,PCMA',
                        dtmf_duration: 2000,
                        enabled: true,
                        custom_params: {}
                      });
                      setIsEditingProfile(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Perfil
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sipProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsEditingProfile(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{profile.name}</h4>
                          <p className="text-sm text-gray-600">
                            Tipo: {profile.type} | Porta: {profile.port}
                          </p>
                          <p className="text-sm text-gray-500">
                            Contexto: {profile.context}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={profile.type === 'internal' ? 'default' : 'secondary'}>
                            {profile.type}
                          </Badge>
                          <Badge variant={profile.enabled ? 'default' : 'secondary'}>
                            {profile.enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(profile.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor de Perfil SIP */}
            {isEditingProfile && selectedProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedProfile.id === 'new' ? 'Novo Perfil' : 'Editar Perfil'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Perfil</Label>
                      <Input
                        value={selectedProfile.name}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          name: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={selectedProfile.type}
                        onValueChange={(value: 'internal' | 'external') => setSelectedProfile({
                          ...selectedProfile,
                          type: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Porta SIP</Label>
                      <Input
                        type="number"
                        value={selectedProfile.port}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          port: parseInt(e.target.value) || 5060
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contexto</Label>
                      <Input
                        value={selectedProfile.context}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          context: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>IP SIP</Label>
                      <Input
                        value={selectedProfile.sip_ip}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          sip_ip: e.target.value
                        })}
                        placeholder="auto ou IP específico"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>IP RTP</Label>
                      <Input
                        value={selectedProfile.rtp_ip}
                        onChange={(e) => setSelectedProfile({
                          ...selectedProfile,
                          rtp_ip: e.target.value
                        })}
                        placeholder="auto ou IP específico"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Codecs Preferidos</Label>
                    <Input
                      value={selectedProfile.codec_prefs}
                      onChange={(e) => setSelectedProfile({
                        ...selectedProfile,
                        codec_prefs: e.target.value
                      })}
                      placeholder="PCMU,PCMA,G729"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Parâmetros Customizados (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(selectedProfile.custom_params, null, 2)}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          setSelectedProfile({
                            ...selectedProfile,
                            custom_params: params
                          });
                        } catch (error) {
                          // Ignore JSON parsing errors while typing
                        }
                      }}
                      rows={6}
                      placeholder='{"auth-calls": "true", "apply-nat-acl": "nat.auto"}'
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedProfile.enabled}
                        onCheckedChange={(checked) => setSelectedProfile({
                          ...selectedProfile,
                          enabled: checked
                        })}
                      />
                      <Label>Ativo</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProfile(null);
                          setIsEditingProfile(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={() => handleSaveProfile(selectedProfile)}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Global Configuration */}
        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Global do FreeSWITCH</CardTitle>
              <CardDescription>
                Configurações globais que afetam todo o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nível de Log</Label>
                  <Select
                    value={freeswitchConfig.log_level}
                    onValueChange={(value) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      log_level: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEBUG">DEBUG</SelectItem>
                      <SelectItem value="INFO">INFO</SelectItem>
                      <SelectItem value="NOTICE">NOTICE</SelectItem>
                      <SelectItem value="WARNING">WARNING</SelectItem>
                      <SelectItem value="ERROR">ERROR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Sessões</Label>
                  <Input
                    type="number"
                    value={freeswitchConfig.max_sessions}
                    onChange={(e) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      max_sessions: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sessões por Segundo</Label>
                  <Input
                    type="number"
                    value={freeswitchConfig.sessions_per_second}
                    onChange={(e) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      sessions_per_second: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Porta RTP Inicial</Label>
                  <Input
                    type="number"
                    value={freeswitchConfig.rtp_start_port}
                    onChange={(e) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      rtp_start_port: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Porta RTP Final</Label>
                  <Input
                    type="number"
                    value={freeswitchConfig.rtp_end_port}
                    onChange={(e) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      rtp_end_port: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={freeswitchConfig.dialplan_hunt_on_failure}
                    onCheckedChange={(checked) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      dialplan_hunt_on_failure: checked
                    })}
                  />
                  <Label>Continuar procurando no dialplan em caso de falha</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={freeswitchConfig.continue_on_fail}
                    onCheckedChange={(checked) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      continue_on_fail: checked
                    })}
                  />
                  <Label>Continuar em caso de falha</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={freeswitchConfig.hangup_after_bridge}
                    onCheckedChange={(checked) => setFreeswitchConfig({
                      ...freeswitchConfig,
                      hangup_after_bridge: checked
                    })}
                  />
                  <Label>Desligar após bridge</Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={async () => {
                    try {
                      await api.updateFreeSwitchConfig(freeswitchConfig);
                      toast.success('Configurações salvas!');
                    } catch (error) {
                      toast.error('Erro ao salvar configurações');
                    }
                  }}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw XML Configuration */}
        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Configuração XML Bruta</CardTitle>
                  <CardDescription>
                    Visualize e edite diretamente os arquivos XML do FreeSWITCH
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowRawXML(!showRawXML)}
                >
                  {showRawXML ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showRawXML ? 'Ocultar' : 'Mostrar'} XML
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showRawXML && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dialplan XML</Label>
                    <Textarea
                      className="font-mono text-sm"
                      rows={15}
                      value={`<?xml version="1.0" encoding="utf-8"?>
<include>
  <context name="default">
    ${dialplans.map(d => `
    <extension name="${d.name}" priority="${d.priority}">
      <condition field="destination_number" expression="${d.condition}">
        ${d.actions.map(action => `<action application="${action.split(' ')[0]}" data="${action.split(' ').slice(1).join(' ')}"/>`).join('\n        ')}
      </condition>
    </extension>`).join('')}
  </context>
</include>`}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Perfil SIP XML</Label>
                    <Textarea
                      className="font-mono text-sm"
                      rows={20}
                      value={`<?xml version="1.0" encoding="utf-8"?>
<include>
  ${sipProfiles.map(p => `
  <profile name="${p.name}">
    <settings>
      <param name="sip-port" value="${p.port}"/>
      <param name="context" value="${p.context}"/>
      <param name="rtp-ip" value="${p.rtp_ip}"/>
      <param name="sip-ip" value="${p.sip_ip}"/>
      <param name="codec-prefs" value="${p.codec_prefs}"/>
      <param name="dtmf-duration" value="${p.dtmf_duration}"/>
      ${Object.entries(p.custom_params).map(([key, value]) => 
        `<param name="${key}" value="${value}"/>`
      ).join('\n      ')}
    </settings>
  </profile>`).join('')}
</include>`}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FreeSwitchAdmin; 