import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Monitor, 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Circle,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  MessageSquare,
  Eye,
  EyeOff,
  Shield,
  UserCheck,
  UserX,
  Coffee,
  Activity,
  Bell,
  RefreshCw,
  Download,
  Upload,
  Headphones,
  Signal
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'Available' | 'Busy' | 'On Break' | 'Offline' | 'Away';
  currentCall?: {
    id: string;
    callerNumber: string;
    callerName?: string;
    startTime: Date;
    duration: number;
    queue: string;
    recording: boolean;
  };
  queue: string;
  extension: string;
  skills: string[];
  callsToday: number;
  averageCallTime: number;
  lastActivity: Date;
  webphoneConnected: boolean;
  audioLevel: number;
  quality: number;
}

interface Queue {
  id: string;
  name: string;
  waitingCalls: number;
  activeAgents: number;
  totalAgents: number;
  averageWaitTime: number;
  serviceLevel: number;
  abandonedCalls: number;
}

interface Notification {
  id: string;
  type: 'call' | 'agent' | 'system' | 'alert';
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

export default function CTIDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [monitoringAgent, setMonitoringAgent] = useState<string | null>(null);
  const [whisperMode, setWhisperMode] = useState(false);
  const [bargeMode, setBargeMode] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(5);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQueue, setFilterQueue] = useState<string>('all');

  // Carregar dados mockados
  useEffect(() => {
    loadMockData();
    
    // Atualização em tempo real
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        updateRealTimeData();
      }
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [realTimeUpdates, autoRefresh]);

  const loadMockData = () => {
    // Dados mockados de agentes
    const mockAgents: Agent[] = [
      {
        id: '1001',
        name: 'João Silva',
        email: 'joao@empresa.com',
        status: 'Busy',
        currentCall: {
          id: 'call-123',
          callerNumber: '+5511999887766',
          callerName: 'Maria Santos',
          startTime: new Date(Date.now() - 180000),
          duration: 180,
          queue: 'Suporte',
          recording: true
        },
        queue: 'Suporte',
        extension: '1001',
        skills: ['Suporte Técnico', 'Linux'],
        callsToday: 23,
        averageCallTime: 165,
        lastActivity: new Date(),
        webphoneConnected: true,
        audioLevel: 75,
        quality: 95
      },
      {
        id: '1002',
        name: 'Maria Costa',
        email: 'maria@empresa.com',
        status: 'Available',
        queue: 'Vendas',
        extension: '1002',
        skills: ['Vendas', 'Produtos'],
        callsToday: 18,
        averageCallTime: 145,
        lastActivity: new Date(Date.now() - 300000),
        webphoneConnected: true,
        audioLevel: 0,
        quality: 98
      },
      {
        id: '1003',
        name: 'Pedro Santos',
        email: 'pedro@empresa.com',
        status: 'On Break',
        queue: 'Suporte',
        extension: '1003',
        skills: ['Suporte', 'Hardware'],
        callsToday: 31,
        averageCallTime: 200,
        lastActivity: new Date(Date.now() - 900000),
        webphoneConnected: false,
        audioLevel: 0,
        quality: 85
      },
      {
        id: '1004',
        name: 'Ana Oliveira',
        email: 'ana@empresa.com',
        status: 'Busy',
        currentCall: {
          id: 'call-124',
          callerNumber: '+5511888776655',
          startTime: new Date(Date.now() - 45000),
          duration: 45,
          queue: 'VIP',
          recording: true
        },
        queue: 'VIP',
        extension: '1004',
        skills: ['VIP', 'Supervisor'],
        callsToday: 12,
        averageCallTime: 120,
        lastActivity: new Date(),
        webphoneConnected: true,
        audioLevel: 85,
        quality: 100
      }
    ];

    const mockQueues: Queue[] = [
      {
        id: 'suporte',
        name: 'Suporte Técnico',
        waitingCalls: 3,
        activeAgents: 2,
        totalAgents: 8,
        averageWaitTime: 45,
        serviceLevel: 87,
        abandonedCalls: 2
      },
      {
        id: 'vendas',
        name: 'Vendas',
        waitingCalls: 1,
        activeAgents: 1,
        totalAgents: 6,
        averageWaitTime: 25,
        serviceLevel: 92,
        abandonedCalls: 1
      },
      {
        id: 'vip',
        name: 'VIP',
        waitingCalls: 0,
        activeAgents: 1,
        totalAgents: 3,
        averageWaitTime: 15,
        serviceLevel: 98,
        abandonedCalls: 0
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'alert',
        message: 'Fila de Suporte com tempo de espera acima de 60s',
        timestamp: new Date(Date.now() - 30000),
        priority: 'high',
        acknowledged: false
      },
      {
        id: '2',
        type: 'agent',
        message: 'Pedro Santos em pausa há mais de 15 minutos',
        timestamp: new Date(Date.now() - 120000),
        priority: 'medium',
        acknowledged: false
      },
      {
        id: '3',
        type: 'system',
        message: 'Gravação automática ativada para todas as chamadas VIP',
        timestamp: new Date(Date.now() - 300000),
        priority: 'low',
        acknowledged: true
      }
    ];

    setAgents(mockAgents);
    setQueues(mockQueues);
    setNotifications(mockNotifications);
  };

  const updateRealTimeData = () => {
    // Simular atualizações em tempo real
    setAgents(prev => prev.map(agent => ({
      ...agent,
      currentCall: agent.currentCall ? {
        ...agent.currentCall,
        duration: Math.floor((Date.now() - agent.currentCall.startTime.getTime()) / 1000)
      } : undefined,
      audioLevel: agent.status === 'Busy' ? Math.floor(Math.random() * 100) : 0,
      quality: 85 + Math.floor(Math.random() * 15)
    })));
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'Available': return 'bg-green-500';
      case 'Busy': return 'bg-red-500';
      case 'On Break': return 'bg-yellow-500';
      case 'Away': return 'bg-orange-500';
      case 'Offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'Available': return <UserCheck className="w-4 h-4" />;
      case 'Busy': return <PhoneCall className="w-4 h-4" />;
      case 'On Break': return <Coffee className="w-4 h-4" />;
      case 'Away': return <Clock className="w-4 h-4" />;
      case 'Offline': return <UserX className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const changeAgentStatus = (agentId: string, newStatus: Agent['status']) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status: newStatus } : agent
    ));
    toast.success(`Status do agente alterado para ${newStatus}`);
  };

  const transferCall = (agentId: string, targetAgent: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent?.currentCall) {
      toast.success(`Chamada transferida para ${targetAgent}`);
      // Implementar lógica de transferência
    }
  };

  const startMonitoring = (agentId: string) => {
    setMonitoringAgent(agentId);
    toast.success(`Iniciando monitoramento do agente ${agentId}`);
  };

  const stopMonitoring = () => {
    setMonitoringAgent(null);
    toast.info('Monitoramento interrompido');
  };

  const startWhisper = (agentId: string) => {
    setWhisperMode(true);
    toast.success(`Modo whisper ativado para agente ${agentId}`);
  };

  const startBarge = (agentId: string) => {
    setBargeMode(true);
    toast.success(`Modo barge-in ativado para agente ${agentId}`);
  };

  const acknowledgeNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, acknowledged: true } : notif
    ));
  };

  const forceLogout = (agentId: string) => {
    changeAgentStatus(agentId, 'Offline');
    toast.warning(`Agente ${agentId} desconectado forçadamente`);
  };

  const filteredAgents = agents.filter(agent => {
    const statusMatch = filterStatus === 'all' || agent.status === filterStatus;
    const queueMatch = filterQueue === 'all' || agent.queue === filterQueue;
    return statusMatch && queueMatch;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="w-8 h-8" />
            CTI Dashboard
          </h1>
          <p className="text-gray-600">Supervisão e Controle de Call Center</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={realTimeUpdates}
              onCheckedChange={setRealTimeUpdates}
            />
            <Label>Tempo Real</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
            <Label>Alertas</Label>
          </div>

          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo das Filas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queues.map((queue) => (
          <Card key={queue.id}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{queue.name}</h3>
                  <Badge variant={queue.waitingCalls > 0 ? "destructive" : "default"}>
                    {queue.waitingCalls} esperando
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Agentes Ativos</p>
                    <p className="font-medium">{queue.activeAgents}/{queue.totalAgents}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo Médio</p>
                    <p className="font-medium">{queue.averageWaitTime}s</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Nível de Serviço</p>
                    <Progress value={queue.serviceLevel} className="h-2 mt-1" />
                  </div>
                  <div>
                    <p className="text-gray-600">Abandonadas</p>
                    <p className="font-medium text-red-600">{queue.abandonedCalls}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="calls">Chamadas Ativas</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        {/* Tab Agentes */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agentes Online</CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Available">Disponível</SelectItem>
                      <SelectItem value="Busy">Ocupado</SelectItem>
                      <SelectItem value="On Break">Em Pausa</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterQueue} onValueChange={setFilterQueue}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Fila" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {queues.map(queue => (
                        <SelectItem key={queue.id} value={queue.name}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAgents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                          {getStatusIcon(agent.status)}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-sm text-gray-600">{agent.extension} • {agent.queue}</p>
                        </div>

                        {agent.webphoneConnected && (
                          <div className="flex items-center gap-2">
                            <Headphones className="w-4 h-4 text-green-600" />
                            <div className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              <Progress value={agent.quality} className="w-8 h-2" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {agent.currentCall && (
                          <div className="text-right mr-4">
                            <p className="text-sm font-medium">{agent.currentCall.callerNumber}</p>
                            <p className="text-xs text-gray-600">
                              {formatDuration(agent.currentCall.duration)}
                              {agent.currentCall.recording && (
                                <Circle className="w-3 h-3 inline ml-1 text-red-500 fill-current" />
                              )}
                            </p>
                          </div>
                        )}

                        {/* Controles de Supervisão */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startMonitoring(agent.id)}
                            disabled={!agent.currentCall}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startWhisper(agent.id)}
                            disabled={!agent.currentCall}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Controle do Agente: {agent.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Alterar Status</Label>
                                  <Select 
                                    value={agent.status} 
                                    onValueChange={(value) => changeAgentStatus(agent.id, value as Agent['status'])}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Available">Disponível</SelectItem>
                                      <SelectItem value="On Break">Em Pausa</SelectItem>
                                      <SelectItem value="Away">Ausente</SelectItem>
                                      <SelectItem value="Offline">Offline</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {agent.currentCall && (
                                  <div className="space-y-2">
                                    <Button
                                      className="w-full"
                                      onClick={() => startBarge(agent.id)}
                                    >
                                      <Phone className="w-4 h-4 mr-2" />
                                      Barge In
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        // Implementar transferência
                                      }}
                                    >
                                      <SkipForward className="w-4 h-4 mr-2" />
                                      Transferir Chamada
                                    </Button>
                                  </div>
                                )}

                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => forceLogout(agent.id)}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Forçar Logout
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    <div className="mt-3 grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <p>Chamadas hoje: {agent.callsToday}</p>
                      </div>
                      <div>
                        <p>Tempo médio: {formatDuration(agent.averageCallTime)}</p>
                      </div>
                      <div>
                        <p>Última atividade: {agent.lastActivity.toLocaleTimeString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Nível de áudio (se em chamada) */}
                    {agent.currentCall && agent.audioLevel > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3" />
                          <Progress value={agent.audioLevel} className="flex-1 h-2" />
                          <span className="text-xs">{agent.audioLevel}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Chamadas Ativas */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Chamadas em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.filter(agent => agent.currentCall).map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{agent.name} ({agent.extension})</h3>
                        <p className="text-sm text-gray-600">
                          {agent.currentCall!.callerNumber} • {agent.currentCall!.queue}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{formatDuration(agent.currentCall!.duration)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {agent.currentCall!.recording && (
                            <Badge variant="destructive">
                              <Circle className="w-3 h-3 mr-1 fill-current" />
                              Gravando
                            </Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Monitoramento */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoringAgent ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Monitorando Agente {monitoringAgent}</h3>
                        <p className="text-sm text-gray-600">Escuta silenciosa ativa</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Volume2 className="w-4 h-4" />
                          Whisper
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                          Barge
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={stopMonitoring}
                        >
                          <EyeOff className="w-4 h-4" />
                          Parar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Controles de áudio */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Volume de Escuta</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <Progress value={75} className="flex-1" />
                            <span className="text-sm">75%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Qualidade do Áudio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Signal className="w-4 h-4" />
                            <Progress value={95} className="flex-1" />
                            <span className="text-sm">95%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <EyeOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhuma sessão de monitoramento ativa</p>
                  <p className="text-sm text-gray-500">Selecione um agente para iniciar o monitoramento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Central de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border rounded-lg ${getPriorityColor(notification.priority)} ${
                      notification.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {notification.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {notification.type === 'agent' && <Users className="w-4 h-4 text-blue-600" />}
                          {notification.type === 'system' && <Settings className="w-4 h-4 text-gray-600" />}
                          {notification.type === 'call' && <Phone className="w-4 h-4 text-green-600" />}
                          
                          <Badge variant="outline" className="text-xs">
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {!notification.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeNotification(notification.id)}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 