import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Play,
  Pause,
  BarChart3,
  Activity,
  Headphones,
  UserCheck,
  Timer,
  Volume2,
  Mic,
  MicOff,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

interface CallCenterMetrics {
  totalCalls: number;
  activeCalls: number;
  waitingCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  averageWaitTime: number;
  averageCallDuration: number;
  serviceLevel: number;
  activeAgents: number;
  totalAgents: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'break' | 'offline';
  currentCall?: string;
  queue: string;
  lastActivity: string;
  callsHandled: number;
  averageCallTime: number;
  skills: string[];
}

interface CallQueue {
  id: string;
  name: string;
  description: string;
  strategy: 'round_robin' | 'least_recent' | 'fewest_calls' | 'ring_all';
  maxWaitTime: number;
  abandonTimeout: number;
  musicOnHold: string;
  enabled: boolean;
  agentCount: number;
  waitingCalls: number;
  priority: number;
}

interface CallRecord {
  id: string;
  callId: string;
  callerNumber: string;
  calledNumber: string;
  queue: string;
  agent?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  waitTime: number;
  status: 'completed' | 'abandoned' | 'active' | 'transferred';
  recordingUrl?: string;
  satisfaction?: number;
}

export default function CallCenterDashboard() {
  const [metrics, setMetrics] = useState<CallCenterMetrics>({
    totalCalls: 0,
    activeCalls: 0,
    waitingCalls: 0,
    completedCalls: 0,
    abandonedCalls: 0,
    averageWaitTime: 0,
    averageCallDuration: 0,
    serviceLevel: 0,
    activeAgents: 0,
    totalAgents: 0
  });
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queues, setQueues] = useState<CallQueue[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<CallQueue | null>(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [isEditingQueue, setIsEditingQueue] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
    
    // Atualização em tempo real a cada 5 segundos
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        loadDashboardData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simular dados ou buscar da API
      const [metricsData, agentsData, queuesData, callsData] = await Promise.all([
        api.getCallCenterMetrics(),
        api.getCallCenterAgents(),
        api.getCallCenterQueues(),
        api.getCallCenterCalls()
      ]);

      setMetrics(metricsData);
      setAgents(agentsData);
      setQueues(queuesData);
      setCalls(callsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Usar dados de exemplo se a API falhar
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setMetrics({
      totalCalls: 1247,
      activeCalls: 12,
      waitingCalls: 3,
      completedCalls: 1189,
      abandonedCalls: 43,
      averageWaitTime: 45,
      averageCallDuration: 180,
      serviceLevel: 87.5,
      activeAgents: 15,
      totalAgents: 20
    });

    setAgents([
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@empresa.com',
        status: 'busy',
        currentCall: 'call-123',
        queue: 'support',
        lastActivity: new Date().toISOString(),
        callsHandled: 23,
        averageCallTime: 165,
        skills: ['Suporte', 'Vendas']
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@empresa.com',
        status: 'available',
        queue: 'sales',
        lastActivity: new Date().toISOString(),
        callsHandled: 31,
        averageCallTime: 145,
        skills: ['Vendas', 'Atendimento']
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@empresa.com',
        status: 'break',
        queue: 'support',
        lastActivity: new Date().toISOString(),
        callsHandled: 18,
        averageCallTime: 200,
        skills: ['Suporte Técnico']
      }
    ]);

    setQueues([
      {
        id: '1',
        name: 'Suporte Técnico',
        description: 'Atendimento para problemas técnicos',
        strategy: 'least_recent',
        maxWaitTime: 300,
        abandonTimeout: 180,
        musicOnHold: 'default.wav',
        enabled: true,
        agentCount: 8,
        waitingCalls: 2,
        priority: 1
      },
      {
        id: '2',
        name: 'Vendas',
        description: 'Atendimento comercial e vendas',
        strategy: 'round_robin',
        maxWaitTime: 120,
        abandonTimeout: 90,
        musicOnHold: 'sales.wav',
        enabled: true,
        agentCount: 6,
        waitingCalls: 1,
        priority: 2
      }
    ]);

    setCalls([
      {
        id: '1',
        callId: 'call-123',
        callerNumber: '+5511999887766',
        calledNumber: '4000',
        queue: 'Suporte Técnico',
        agent: 'João Silva',
        startTime: new Date(Date.now() - 120000).toISOString(),
        duration: 120,
        waitTime: 30,
        status: 'active',
        recordingUrl: 'https://example.com/recordings/call-123.wav'
      },
      {
        id: '2',
        callId: 'call-124',
        callerNumber: '+5511888776655',
        calledNumber: '4001',
        queue: 'Vendas',
        agent: 'Maria Santos',
        startTime: new Date(Date.now() - 300000).toISOString(),
        endTime: new Date(Date.now() - 60000).toISOString(),
        duration: 240,
        waitTime: 15,
        status: 'completed',
        recordingUrl: 'https://example.com/recordings/call-124.wav',
        satisfaction: 4
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'break': return 'Pausa';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadRecording = async (recordingUrl: string, callId: string) => {
    try {
      const response = await fetch(recordingUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${callId}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Gravação baixada com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar gravação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Call Center</h1>
          <p className="text-gray-600">Monitoramento em tempo real</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={realTimeUpdates}
              onCheckedChange={setRealTimeUpdates}
            />
            <Label>Atualização em Tempo Real</Label>
          </div>
          
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chamadas Ativas</p>
                <p className="text-3xl font-bold">{metrics.activeCalls}</p>
              </div>
              <PhoneCall className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.waitingCalls} em espera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agentes Ativos</p>
                <p className="text-3xl font-bold">{metrics.activeAgents}/{metrics.totalAgents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round((metrics.activeAgents / metrics.totalAgents) * 100)}% disponibilidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio de Espera</p>
                <p className="text-3xl font-bold">{metrics.averageWaitTime}s</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Meta: &lt; 60s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nível de Serviço</p>
                <p className="text-3xl font-bold">{metrics.serviceLevel}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={metrics.serviceLevel} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="queues">Filas</TabsTrigger>
          <TabsTrigger value="calls">Chamadas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agentes Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  Status dos Agentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-600">{agent.queue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {getStatusLabel(agent.status)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {agent.callsHandled} chamadas hoje
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filas Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status das Filas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {queues.map((queue) => (
                    <div key={queue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{queue.name}</p>
                        <p className="text-sm text-gray-600">{queue.agentCount} agentes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {queue.waitingCalls}
                        </p>
                        <p className="text-xs text-gray-500">em espera</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agentes */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gerenciar Agentes</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Novo Agente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Agente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Nome</Label>
                        <Input placeholder="Nome do agente" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" placeholder="email@empresa.com" />
                      </div>
                      <div>
                        <Label>Fila</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma fila" />
                          </SelectTrigger>
                          <SelectContent>
                            {queues.map((queue) => (
                              <SelectItem key={queue.id} value={queue.id}>
                                {queue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Habilidades</Label>
                        <Input placeholder="Ex: Suporte, Vendas, Técnico" />
                      </div>
                      <Button className="w-full">Adicionar Agente</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(agent.status)}`} />
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-sm text-gray-600">{agent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{agent.callsHandled} chamadas</p>
                          <p className="text-xs text-gray-600">Tempo médio: {formatDuration(agent.averageCallTime)}</p>
                        </div>
                        <Badge variant="outline">
                          {agent.queue}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filas */}
        <TabsContent value="queues">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gerenciar Filas</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Phone className="w-4 h-4 mr-2" />
                      Nova Fila
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Fila</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome da Fila</Label>
                          <Input placeholder="Ex: Suporte Técnico" />
                        </div>
                        <div>
                          <Label>Prioridade</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Alta (1)</SelectItem>
                              <SelectItem value="2">Média (2)</SelectItem>
                              <SelectItem value="3">Baixa (3)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea placeholder="Descrição da fila" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estratégia de Distribuição</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="round_robin">Round Robin</SelectItem>
                              <SelectItem value="least_recent">Menos Recente</SelectItem>
                              <SelectItem value="fewest_calls">Menos Chamadas</SelectItem>
                              <SelectItem value="ring_all">Tocar Todos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tempo Máximo de Espera (s)</Label>
                          <Input type="number" placeholder="300" />
                        </div>
                      </div>
                      <Button className="w-full">Criar Fila</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queues.map((queue) => (
                  <div key={queue.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{queue.name}</h3>
                        <p className="text-sm text-gray-600">{queue.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{queue.agentCount}</p>
                          <p className="text-xs text-gray-600">Agentes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-600">{queue.waitingCalls}</p>
                          <p className="text-xs text-gray-600">Esperando</p>
                        </div>
                        <Switch checked={queue.enabled} />
                        <Button variant="outline" size="sm">
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chamadas */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Chamadas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calls.map((call) => (
                  <div key={call.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {call.status === 'active' ? (
                          <PhoneCall className="w-5 h-5 text-green-600" />
                        ) : call.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : call.status === 'abandoned' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <PhoneOff className="w-5 h-5 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium">{call.callerNumber} → {call.calledNumber}</p>
                          <p className="text-sm text-gray-600">
                            {call.queue} {call.agent && `• ${call.agent}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {call.status === 'active' ? 'Em andamento' : formatDuration(call.duration)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Espera: {formatDuration(call.waitTime)}
                          </p>
                        </div>
                        {call.recordingUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadRecording(call.recordingUrl!, call.callId)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Gravação
                          </Button>
                        )}
                        <Badge 
                          variant={call.status === 'active' ? 'default' : 
                                  call.status === 'completed' ? 'secondary' : 'destructive'}
                        >
                          {call.status === 'active' ? 'Ativa' :
                           call.status === 'completed' ? 'Concluída' :
                           call.status === 'abandoned' ? 'Abandonada' : 'Transferida'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Relatório de Performance Diário
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Relatório de Tempos de Espera
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Relatório de Produtividade dos Agentes
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Todas as Gravações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Chamadas:</span>
                    <span className="font-bold">{metrics.totalCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chamadas Completadas:</span>
                    <span className="font-bold text-green-600">{metrics.completedCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chamadas Abandonadas:</span>
                    <span className="font-bold text-red-600">{metrics.abandonedCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Abandono:</span>
                    <span className="font-bold">
                      {((metrics.abandonedCalls / metrics.totalCalls) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duração Média:</span>
                    <span className="font-bold">{formatDuration(metrics.averageCallDuration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 