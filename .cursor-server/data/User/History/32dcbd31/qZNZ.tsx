import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceMetrics {
  groupId: string;
  groupName: string;
  sla: number;
  answerRate: number;
  averageWaitTime: number;
  averageCallDuration: number;
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  agentUtilization: number;
  trend: 'up' | 'down' | 'stable';
  grade: 'A' | 'B' | 'C' | 'D';
}

interface AgentPerformance {
  id: string;
  name: string;
  extension: string;
  groupName: string;
  callsHandled: number;
  averageHandleTime: number;
  firstCallResolution: number;
  customerRating: number;
  utilizationRate: number;
  availabilityRate: number;
  status: 'excellent' | 'good' | 'needs_improvement';
}

export default function RingGroupsPerformance() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('answerRate');
  const [groupMetrics, setGroupMetrics] = useState<PerformanceMetrics[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentPerformance[]>([]);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    // Simular dados de performance
    const mockGroups: PerformanceMetrics[] = [
      {
        groupId: '1',
        groupName: 'Suporte Técnico',
        sla: 95,
        answerRate: 92,
        averageWaitTime: 25,
        averageCallDuration: 180,
        totalCalls: 450,
        answeredCalls: 414,
        abandonedCalls: 36,
        firstCallResolution: 87,
        customerSatisfaction: 4.6,
        agentUtilization: 78,
        trend: 'up',
        grade: 'A'
      },
      {
        groupId: '2',
        groupName: 'Vendas',
        sla: 90,
        answerRate: 88,
        averageWaitTime: 32,
        averageCallDuration: 210,
        totalCalls: 320,
        answeredCalls: 282,
        abandonedCalls: 38,
        firstCallResolution: 92,
        customerSatisfaction: 4.4,
        agentUtilization: 85,
        trend: 'stable',
        grade: 'B'
      },
      {
        groupId: '3',
        groupName: 'Atendimento Geral',
        sla: 85,
        answerRate: 81,
        averageWaitTime: 45,
        averageCallDuration: 150,
        totalCalls: 280,
        answeredCalls: 227,
        abandonedCalls: 53,
        firstCallResolution: 75,
        customerSatisfaction: 4.1,
        agentUtilization: 72,
        trend: 'down',
        grade: 'C'
      }
    ];

    const mockAgents: AgentPerformance[] = [
      {
        id: '1',
        name: 'Maria Santos',
        extension: '1001',
        groupName: 'Suporte Técnico',
        callsHandled: 65,
        averageHandleTime: 165,
        firstCallResolution: 92,
        customerRating: 4.8,
        utilizationRate: 85,
        availabilityRate: 92,
        status: 'excellent'
      },
      {
        id: '2',
        name: 'João Silva',
        extension: '1002',
        groupName: 'Vendas',
        callsHandled: 58,
        averageHandleTime: 195,
        firstCallResolution: 88,
        customerRating: 4.6,
        utilizationRate: 82,
        availabilityRate: 89,
        status: 'excellent'
      },
      {
        id: '3',
        name: 'Pedro Costa',
        extension: '1003',
        groupName: 'Suporte Técnico',
        callsHandled: 52,
        averageHandleTime: 180,
        firstCallResolution: 85,
        customerRating: 4.5,
        utilizationRate: 78,
        availabilityRate: 88,
        status: 'good'
      },
      {
        id: '4',
        name: 'Ana Lima',
        extension: '1004',
        groupName: 'Atendimento Geral',
        callsHandled: 45,
        averageHandleTime: 160,
        firstCallResolution: 70,
        customerRating: 4.2,
        utilizationRate: 65,
        availabilityRate: 82,
        status: 'needs_improvement'
      }
    ];

    setGroupMetrics(mockGroups);
    setAgentMetrics(mockAgents);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs_improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'needs_improvement': return 'Precisa Melhorar';
      default: return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-dohoo-primary" />
            Performance Ring Groups
          </h1>
          <p className="text-gray-600">
            Análise de performance e benchmarking dos grupos de atendimento
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="answerRate">Taxa de Atendimento</SelectItem>
              <SelectItem value="averageWaitTime">Tempo de Espera</SelectItem>
              <SelectItem value="firstCallResolution">Resolução 1ª Chamada</SelectItem>
              <SelectItem value="customerSatisfaction">Satisfação Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              SLA Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">90%</div>
            <Progress value={90} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Grupos no SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2/3</div>
            <p className="text-xs text-muted-foreground">67% dos grupos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Satisfação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">4.4</div>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Agentes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">4 grupos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking dos Grupos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ranking de Performance dos Grupos
          </CardTitle>
          <CardDescription>
            Comparação de performance baseada em múltiplas métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Taxa Atendimento</TableHead>
                <TableHead>Tempo Espera</TableHead>
                <TableHead>Resolução 1ª</TableHead>
                <TableHead>Satisfação</TableHead>
                <TableHead>Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupMetrics
                .sort((a, b) => b.answerRate - a.answerRate)
                .map((group, index) => (
                  <TableRow key={group.groupId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        {group.groupName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getGradeColor(group.grade)} text-white`}>
                        {group.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{group.sla}%</span>
                        {group.sla >= 90 ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{group.answerRate}%</div>
                        <Progress value={group.answerRate} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={group.averageWaitTime <= 30 ? 'text-green-600' : 'text-red-600'}>
                        {group.averageWaitTime}s
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={group.firstCallResolution >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                        {group.firstCallResolution}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{group.customerSatisfaction}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTrendIcon(group.trend)}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Individual dos Agentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Performance Individual dos Agentes
          </CardTitle>
          <CardDescription>
            Métricas detalhadas por agente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agentMetrics.map((agent) => (
              <Card key={agent.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>
                        Ramal {agent.extension} • {agent.groupName}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(agent.status)}>
                      {getStatusText(agent.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Chamadas:</span>
                      <span className="ml-2 font-medium">{agent.callsHandled}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tempo Médio:</span>
                      <span className="ml-2 font-medium">{Math.floor(agent.averageHandleTime / 60)}min</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolução 1ª:</span>
                      <span className="ml-2 font-medium text-green-600">{agent.firstCallResolution}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avaliação:</span>
                      <span className="ml-2 font-medium text-yellow-600">{agent.customerRating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilização</span>
                        <span>{agent.utilizationRate}%</span>
                      </div>
                      <Progress value={agent.utilizationRate} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disponibilidade</span>
                        <span>{agent.availabilityRate}%</span>
                      </div>
                      <Progress value={agent.availabilityRate} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metas e Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metas e Objetivos
          </CardTitle>
          <CardDescription>
            Progresso em relação às metas estabelecidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Atendimento</span>
                <span>87% / 90%</span>
              </div>
              <Progress value={87} />
              <p className="text-xs text-muted-foreground">3% para atingir a meta</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tempo Médio de Espera</span>
                <span>34s / 30s</span>
              </div>
              <Progress value={88} className="[&>div]:bg-orange-500" />
              <p className="text-xs text-muted-foreground">4s acima da meta</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Satisfação do Cliente</span>
                <span>4.4 / 4.5</span>
              </div>
              <Progress value={98} className="[&>div]:bg-yellow-500" />
              <p className="text-xs text-muted-foreground">0.1 ponto para a meta</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resolução 1ª Chamada</span>
                <span>85% / 80%</span>
              </div>
              <Progress value={100} className="[&>div]:bg-green-500" />
              <p className="text-xs text-green-600">Meta atingida! 🎉</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 