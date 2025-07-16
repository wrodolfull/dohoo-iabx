import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Phone, 
  Clock, 
  TrendingUp, 
  Activity, 
  PhoneCall, 
  UserCheck, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface RingGroupMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  averageWaitTime: number;
  averageCallDuration: number;
  answerRate: number;
  availableAgents: number;
  totalAgents: number;
}

interface RingGroupAgent {
  id: string;
  name: string;
  extension: string;
  status: 'available' | 'busy' | 'offline' | 'break';
  currentCall?: string;
  callsHandled: number;
  averageCallTime: number;
  lastActivity: string;
  ringGroupId: string;
}

interface RingGroupCall {
  id: string;
  callerNumber: string;
  ringGroupName: string;
  agent?: string;
  startTime: string;
  waitTime: number;
  status: 'waiting' | 'answered' | 'completed';
  duration?: number;
}

interface RingGroup {
  id: string;
  name: string;
  strategy: string;
  extensions: string[];
  activeCalls: number;
  waitingCalls: number;
  availableAgents: number;
  totalAgents: number;
  answerRate: number;
  averageWaitTime: number;
}

export default function RingGroupsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RingGroupMetrics>({
    totalCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
    abandonedCalls: 0,
    averageWaitTime: 0,
    averageCallDuration: 0,
    answerRate: 0,
    availableAgents: 0,
    totalAgents: 0
  });

  const [ringGroups, setRingGroups] = useState<RingGroup[]>([]);
  const [agents, setAgents] = useState<RingGroupAgent[]>([]);
  const [activeCalls, setActiveCalls] = useState<RingGroupCall[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 5000); // Atualizar a cada 5 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedGroup]);

  const loadDashboardData = async () => {
    try {
      const tenantId = user?.tenant_id || '1';
      
      // Carregar dados dos ring groups
      const ringGroupsData = await api.getRingGroups(tenantId);
      const extensionsData = await api.getExtensions(tenantId);
      
      // Simular métricas baseadas nos ring groups reais
      const mockMetrics = generateMockMetrics(ringGroupsData);
      const mockAgents = generateMockAgents(extensionsData, ringGroupsData);
      const mockCalls = generateMockCalls(ringGroupsData);
      const enhancedRingGroups = enhanceRingGroupsWithMetrics(ringGroupsData);
      
      setMetrics(mockMetrics);
      setRingGroups(enhancedRingGroups);
      setAgents(mockAgents);
      setActiveCalls(mockCalls);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = (ringGroups: any[]): RingGroupMetrics => {
    const totalAgents = Array.isArray(ringGroups) ? ringGroups.reduce((acc, rg) => acc + (rg.extensions?.length || 0), 0) : 0;
    const activeCalls = Math.floor(Math.random() * 15);
    const totalCalls = Math.floor(Math.random() * 200) + 100;
    
    return {
      totalCalls,
      activeCalls,
      completedCalls: Math.floor(totalCalls * 0.85),
      abandonedCalls: Math.floor(totalCalls * 0.15),
      averageWaitTime: Math.floor(Math.random() * 45) + 15,
      averageCallDuration: Math.floor(Math.random() * 180) + 120,
      answerRate: Math.floor(Math.random() * 20) + 80,
      availableAgents: Math.floor(totalAgents * 0.7),
      totalAgents
    };
  };

  const generateMockAgents = (extensions: any[], ringGroups: any[]): RingGroupAgent[] => {
    const safeExtensions = Array.isArray(extensions) ? extensions : [];
    const safeRingGroups = Array.isArray(ringGroups) ? ringGroups : [];
    return safeExtensions.slice(0, 12).map((ext, index) => {
      const ringGroup = safeRingGroups[index % safeRingGroups.length];
      const statuses = ['available', 'busy', 'offline', 'break'] as const;
      
      return {
        id: ext.id,
        name: ext.name,
        extension: ext.number,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        callsHandled: Math.floor(Math.random() * 25),
        averageCallTime: Math.floor(Math.random() * 180) + 60,
        lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        ringGroupId: ringGroup?.id || ''
      };
    });
  };

  const generateMockCalls = (ringGroups: any[]): RingGroupCall[] => {
    const safeRingGroups = Array.isArray(ringGroups) ? ringGroups : [];
    return Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => {
      const ringGroup = safeRingGroups[i % safeRingGroups.length];
      const statuses = ['waiting', 'answered', 'completed'] as const;
      
      return {
        id: `call-${i + 1}`,
        callerNumber: `+5511999${String(Math.floor(Math.random() * 900000) + 100000)}`,
        ringGroupName: ringGroup?.name || 'Grupo 1',
        startTime: new Date(Date.now() - Math.random() * 600000).toISOString(),
        waitTime: Math.floor(Math.random() * 120),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      };
    });
  };

  const enhanceRingGroupsWithMetrics = (ringGroups: any[]): RingGroup[] => {
    return ringGroups.map(rg => ({
      ...rg,
      activeCalls: Math.floor(Math.random() * 5),
      waitingCalls: Math.floor(Math.random() * 3),
      availableAgents: Math.floor((rg.extensions?.length || 0) * 0.7),
      totalAgents: rg.extensions?.length || 0,
      answerRate: Math.floor(Math.random() * 20) + 80,
      averageWaitTime: Math.floor(Math.random() * 60) + 10
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      case 'break': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
      case 'break': return 'Pausa';
      default: return 'Desconhecido';
    }
  };

  const filteredData = selectedGroup === 'all' ? {
    ringGroups,
    agents,
    calls: activeCalls
  } : {
    ringGroups: ringGroups.filter(rg => rg.id === selectedGroup),
    agents: agents.filter(agent => agent.ringGroupId === selectedGroup),
    calls: activeCalls.filter(call => {
      const group = ringGroups.find(rg => rg.name === call.ringGroupName);
      return group?.id === selectedGroup;
    })
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-dohoo-primary" />
            Dashboard Ring Groups
          </h1>
          <p className="text-gray-600">
            Monitoramento e análise em tempo real dos grupos de atendimento
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Grupos</SelectItem>
              {ringGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? 'Pausar' : 'Auto'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamadas Ativas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeCalls}</div>
            <p className="text-xs text-muted-foreground">
              Em atendimento nos grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Disponíveis</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.availableAgents}/{metrics.totalAgents}
            </div>
            <Progress value={(metrics.availableAgents / metrics.totalAgents) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atendimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.answerRate}%</div>
            <Progress value={metrics.answerRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.averageWaitTime}s</div>
            <p className="text-xs text-muted-foreground">
              Média do dia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ring Groups Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Status dos Ring Groups
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real de cada grupo de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredData.ringGroups.map((group) => (
              <Card key={group.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant={group.activeCalls > 0 ? "default" : "secondary"}>
                      {group.strategy}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ativas:</span>
                      <span className="ml-2 font-medium text-green-600">{group.activeCalls}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Aguardando:</span>
                      <span className="ml-2 font-medium text-orange-600">{group.waitingCalls}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agentes:</span>
                      <span className="ml-2 font-medium">{group.availableAgents}/{group.totalAgents}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taxa:</span>
                      <span className="ml-2 font-medium text-blue-600">{group.answerRate}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disponibilidade</span>
                      <span>{Math.round((group.availableAgents / group.totalAgents) * 100)}%</span>
                    </div>
                    <Progress value={(group.availableAgents / group.totalAgents) * 100} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agentes e Chamadas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status dos Agentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Agentes Online
            </CardTitle>
            <CardDescription>
              Status atual dos agentes nos ring groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.agents.slice(0, 8).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">Ramal {agent.extension}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={agent.status === 'available' ? 'default' : 'secondary'}>
                      {getStatusText(agent.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {agent.callsHandled} chamadas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chamadas Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5" />
              Chamadas em Andamento
            </CardTitle>
            <CardDescription>
              Monitoramento das chamadas ativas nos ring groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.calls.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhuma chamada ativa no momento
                </div>
              ) : (
                filteredData.calls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{call.callerNumber}</div>
                      <div className="text-sm text-muted-foreground">{call.ringGroupName}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        call.status === 'answered' ? 'default' : 
                        call.status === 'waiting' ? 'secondary' : 'outline'
                      }>
                        {call.status === 'answered' ? 'Atendida' : 
                         call.status === 'waiting' ? 'Aguardando' : 'Finalizada'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {call.waitTime}s de espera
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 