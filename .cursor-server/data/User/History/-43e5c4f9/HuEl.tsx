import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Phone, 
  BarChart3,
  Activity,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  averageWaitTime: number;
  peakHours: string[];
  agentPerformance: Array<{
    name: string;
    callsHandled: number;
    averageCallTime: number;
    rating: number;
  }>;
  hourlyData: Array<{
    hour: string;
    calls: number;
    answered: number;
    abandoned: number;
  }>;
}

export default function RingGroupsAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCalls: 0,
    answeredCalls: 0,
    abandonedCalls: 0,
    averageWaitTime: 0,
    peakHours: [],
    agentPerformance: [],
    hourlyData: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedGroup]);

  const loadAnalytics = async () => {
    // Simular dados de analytics
    const mockData: AnalyticsData = {
      totalCalls: Math.floor(Math.random() * 1000) + 500,
      answeredCalls: Math.floor(Math.random() * 800) + 400,
      abandonedCalls: Math.floor(Math.random() * 200) + 50,
      averageWaitTime: Math.floor(Math.random() * 60) + 20,
      peakHours: ['09:00', '14:00', '16:00'],
      agentPerformance: [
        { name: 'João Silva', callsHandled: 45, averageCallTime: 180, rating: 4.8 },
        { name: 'Maria Santos', callsHandled: 52, averageCallTime: 165, rating: 4.9 },
        { name: 'Pedro Costa', callsHandled: 38, averageCallTime: 195, rating: 4.6 },
        { name: 'Ana Lima', callsHandled: 41, averageCallTime: 175, rating: 4.7 }
      ],
      hourlyData: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        calls: Math.floor(Math.random() * 50),
        answered: Math.floor(Math.random() * 40),
        abandoned: Math.floor(Math.random() * 10)
      }))
    };

    setAnalytics(mockData);
  };

  const answerRate = analytics.totalCalls > 0 
    ? ((analytics.answeredCalls / analytics.totalCalls) * 100).toFixed(1)
    : '0';

  const abandonRate = analytics.totalCalls > 0
    ? ((analytics.abandonedCalls / analytics.totalCalls) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-dohoo-primary" />
            Analytics Ring Groups
          </h1>
          <p className="text-gray-600">
            Análise detalhada e insights dos grupos de atendimento
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
          
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Grupos</SelectItem>
              <SelectItem value="1">Suporte Técnico</SelectItem>
              <SelectItem value="2">Vendas</SelectItem>
              <SelectItem value="3">Atendimento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCalls}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atendimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{answerRate}%</div>
            <Progress value={Number(answerRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{abandonRate}%</div>
            <Progress value={Number(abandonRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageWaitTime}s</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-500" />
              -5s vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Hora */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Chamadas por Hora</CardTitle>
            <CardDescription>
              Volume de chamadas ao longo do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.hourlyData.slice(8, 18).map((data, index) => (
                <div key={data.hour} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{data.hour}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Recebidas: {data.calls}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Atendidas: {data.answered}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Abandonadas: {data.abandoned}</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <Progress value={(data.answered / Math.max(data.calls, 1)) * 100} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance dos Agentes */}
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Agentes</CardTitle>
            <CardDescription>
              Ranking dos agentes por performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.agentPerformance.map((agent, index) => (
                <div key={agent.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dohoo-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-dohoo-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-600">
                        {agent.callsHandled} chamadas • {Math.floor(agent.averageCallTime / 60)}min média
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <div className="text-lg font-bold text-yellow-500">★</div>
                      <span className="font-medium">{agent.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Insights e Recomendações
          </CardTitle>
          <CardDescription>
            Análise automática baseada nos dados coletados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">Horários de Pico</h4>
              <p className="text-sm text-blue-700 mt-1">
                Os horários com maior volume são: {analytics.peakHours.join(', ')}. 
                Considere alocar mais agentes nestes períodos.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900">Performance Positiva</h4>
              <p className="text-sm text-green-700 mt-1">
                Taxa de atendimento de {answerRate}% está acima da média do setor (85%). 
                Continue mantendo este padrão de excelência.
              </p>
            </div>
            
            {Number(abandonRate) > 15 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900">Atenção Necessária</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Taxa de abandono de {abandonRate}% está acima do ideal (10%). 
                  Recomenda-se revisar o dimensionamento da equipe.
                </p>
              </div>
            )}
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900">Oportunidade de Melhoria</h4>
              <p className="text-sm text-purple-700 mt-1">
                Tempo médio de espera pode ser reduzido implementando um sistema de callback 
                para chamadas com espera superior a 60 segundos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 