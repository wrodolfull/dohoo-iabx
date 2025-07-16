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
import { 
  Settings as SettingsIcon, 
  Save, 
  Server,
  Shield,
  Bell,
  Mail,
  Database,
  Volume2,
  Network,
  Key,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  company_name: string;
  sip_domain: string;
  max_concurrent_calls: number;
  recording_enabled: boolean;
  backup_enabled: boolean;
  notification_email: string;
  smtp_server: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  api_rate_limit: number;
  session_timeout: number;
  log_level: string;
}

const Settings = () => {
  const { user } = useAuth();
  const tenantId = user?.company || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    company_name: '',
    sip_domain: '',
    max_concurrent_calls: 100,
    recording_enabled: true,
    backup_enabled: true,
    notification_email: '',
    smtp_server: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    api_rate_limit: 1000,
    session_timeout: 30,
    log_level: 'info'
  });

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simular carregamento de configurações
      const mockSettings: SystemSettings = {
        company_name: 'Empresa Exemplo',
        sip_domain: 'sip.empresa.com',
        max_concurrent_calls: 50,
        recording_enabled: true,
        backup_enabled: true,
        notification_email: 'admin@empresa.com',
        smtp_server: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'sistema@empresa.com',
        smtp_password: '',
        api_rate_limit: 1000,
        session_timeout: 30,
        log_level: 'info'
      };
      setSettings(mockSettings);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Email de teste enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar email de teste');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-dohoo-primary" />
            Configurações
          </h1>
          <p className="text-gray-600">
            Configure parâmetros do sistema e preferências
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="telephony">Telefonia</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas da empresa e sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sip_domain">Domínio SIP</Label>
                  <Input
                    id="sip_domain"
                    value={settings.sip_domain}
                    onChange={(e) => setSettings({ ...settings, sip_domain: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_concurrent_calls">Chamadas Simultâneas</Label>
                  <Input
                    id="max_concurrent_calls"
                    type="number"
                    value={settings.max_concurrent_calls}
                    onChange={(e) => setSettings({ ...settings, max_concurrent_calls: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification_email">Email de Notificações</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Gravação de Chamadas</Label>
                    <p className="text-sm text-gray-500">Ativar gravação automática de todas as chamadas</p>
                  </div>
                  <Switch
                    checked={settings.recording_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, recording_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-gray-500">Realizar backup diário das configurações</p>
                  </div>
                  <Switch
                    checked={settings.backup_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, backup_enabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telephony Settings */}
        <TabsContent value="telephony">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Configurações de Telefonia
              </CardTitle>
              <CardDescription>
                Parâmetros específicos do FreeSWITCH e SIP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium">Status FreeSWITCH</h4>
                    </div>
                    <Badge variant="default" className="bg-green-500">Online</Badge>
                    <p className="text-sm text-gray-600">Versão: 1.10.7</p>
                    <p className="text-sm text-gray-600">Uptime: 15d 7h 23m</p>
                    <Button variant="outline" size="sm">
                      Reiniciar Serviço
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">Codecs Ativos</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['PCMU', 'PCMA', 'G729', 'G722', 'OPUS'].map((codec) => (
                        <Badge key={codec} variant="secondary">{codec}</Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar Codecs
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configurações SIP</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Porta SIP UDP</Label>
                    <Input value="5060" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta SIP TCP</Label>
                    <Input value="5060" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta SIP TLS</Label>
                    <Input value="5061" readOnly />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Aviso</h4>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Alterações nas configurações de telefonia podem afetar chamadas em andamento.
                  Recomenda-se fazer mudanças fora do horário comercial.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription>
                Configure alertas por email e notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Servidor SMTP
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_server">Servidor</Label>
                    <Input
                      id="smtp_server"
                      value={settings.smtp_server}
                      onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">Porta</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_user">Usuário</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">Senha</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={settings.smtp_password}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={handleTestEmail}>
                  Enviar Email de Teste
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Tipos de Notificação</h4>
                <div className="space-y-3">
                  {[
                    { id: 'system_alerts', label: 'Alertas do Sistema', description: 'Falhas críticas e erros' },
                    { id: 'trunk_status', label: 'Status dos Troncos', description: 'Quando troncos ficam offline' },
                    { id: 'high_usage', label: 'Alto Uso de Recursos', description: 'CPU, memória ou chamadas' },
                    { id: 'daily_reports', label: 'Relatórios Diários', description: 'Resumo diário de atividades' },
                    { id: 'backup_status', label: 'Status do Backup', description: 'Resultado dos backups automáticos' }
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{notification.label}</Label>
                        <p className="text-sm text-gray-500">{notification.description}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Parâmetros de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_rate_limit">Limite de API (req/min)</Label>
                  <Input
                    id="api_rate_limit"
                    type="number"
                    value={settings.api_rate_limit}
                    onChange={(e) => setSettings({ ...settings, api_rate_limit: parseInt(e.target.value) || 1000 })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Políticas de Senha
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Mínimo 8 caracteres', enabled: true },
                    { label: 'Requer letras maiúsculas', enabled: true },
                    { label: 'Requer números', enabled: true },
                    { label: 'Requer símbolos especiais', enabled: false },
                    { label: 'Expiração a cada 90 dias', enabled: false }
                  ].map((policy, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Label>{policy.label}</Label>
                      <Switch defaultChecked={policy.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Logs de Auditoria</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Últimos 30 dias de logs:</span>
                      <span className="font-medium">15.2 MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tentativas de login:</span>
                      <span className="font-medium">1,234 sucessos, 23 falhas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Alterações de config:</span>
                      <span className="font-medium">45 registros</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    Exportar Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Configurações técnicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Nível de Log</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['debug', 'info', 'warn', 'error'].map((level) => (
                    <Button
                      key={level}
                      variant={settings.log_level === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, log_level: level })}
                    >
                      {level.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Banco de Dados</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span>Status da Conexão:</span>
                    <Badge variant="default" className="bg-green-500">Conectado</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho do DB:</span>
                    <span>248.7 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Último Backup:</span>
                    <span>Hoje, 03:00</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Backup Manual</Button>
                    <Button variant="outline" size="sm">Otimizar DB</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cache e Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cache de Configurações</Label>
                      <p className="text-sm text-gray-500">Melhora performance das consultas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compressão de Logs</Label>
                      <p className="text-sm text-gray-500">Reduz espaço em disco</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Zona de Perigo</h4>
                </div>
                <p className="text-sm text-red-700 mt-1 mb-3">
                  Estas ações são irreversíveis e podem causar perda de dados.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm">
                    Reset Configurações
                  </Button>
                  <Button variant="destructive" size="sm">
                    Limpar Todos os Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
