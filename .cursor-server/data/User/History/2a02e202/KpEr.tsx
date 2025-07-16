import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { 
  Download, 
  Play, 
  Pause,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  FileText,
  Volume2,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface CallRecord {
  id: string;
  callId: string;
  callerNumber: string;
  calledNumber: string;
  agentName?: string;
  queueName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  waitTime: number;
  status: 'completed' | 'abandoned' | 'transferred' | 'failed';
  recordingUrl?: string;
  satisfaction?: number;
  transferredTo?: string;
  hangupCause?: string;
  cost?: number;
}

interface ReportFilter {
  startDate: Date | null;
  endDate: Date | null;
  queue: string;
  agent: string;
  status: string;
  minDuration: string;
  maxDuration: string;
  callerNumber: string;
  satisfactionMin: string;
}

interface MetricSummary {
  totalCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  averageDuration: number;
  averageWaitTime: number;
  totalDuration: number;
  satisfactionAverage: number;
  answerRate: number;
  firstCallResolution: number;
  cost: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedReports() {
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary>({
    totalCalls: 0,
    completedCalls: 0,
    abandonedCalls: 0,
    averageDuration: 0,
    averageWaitTime: 0,
    totalDuration: 0,
    satisfactionAverage: 0,
    answerRate: 0,
    firstCallResolution: 0,
    cost: 0
  });
  
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
    endDate: new Date(),
    queue: '',
    agent: '',
    status: '',
    minDuration: '',
    maxDuration: '',
    callerNumber: '',
    satisfactionMin: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadReportData();
  }, [filters]);

  // Filtrar dados quando os filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [calls, filters]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Simular dados de chamadas - em produção viria da API
      const mockCalls = generateMockCallData();
      setCalls(mockCalls);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const generateMockCallData = (): CallRecord[] => {
    const calls: CallRecord[] = [];
    const statuses = ['completed', 'abandoned', 'transferred', 'failed'];
    const queues = ['Suporte Técnico', 'Vendas', 'Atendimento VIP', 'Cobrança'];
    const agents = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Ferreira'];
    
    for (let i = 1; i <= 150; i++) {
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
      const duration = status === 'abandoned' ? 0 : Math.floor(Math.random() * 600) + 30;
      const waitTime = Math.floor(Math.random() * 180) + 5;
      
      calls.push({
        id: i.toString(),
        callId: `call-${1000 + i}`,
        callerNumber: `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
        calledNumber: `400${Math.floor(Math.random() * 10)}`,
        agentName: status !== 'abandoned' ? agents[Math.floor(Math.random() * agents.length)] : undefined,
        queueName: queues[Math.floor(Math.random() * queues.length)],
        startTime: startTime.toISOString(),
        endTime: status !== 'abandoned' ? new Date(startTime.getTime() + duration * 1000).toISOString() : undefined,
        duration,
        waitTime,
        status,
        recordingUrl: Math.random() > 0.3 ? `https://recordings.example.com/call-${1000 + i}.wav` : undefined,
        satisfaction: status === 'completed' && Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : undefined,
        cost: Math.random() * 2 + 0.1,
        hangupCause: status === 'failed' ? 'NETWORK_ERROR' : status === 'abandoned' ? 'CALLER_HANGUP' : 'NORMAL_CLEARING'
      });
    }

    return calls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const applyFilters = () => {
    let filtered = calls;

    // Filtro por data
    if (filters.startDate) {
      filtered = filtered.filter(call => new Date(call.startTime) >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(call => new Date(call.startTime) <= filters.endDate!);
    }

    // Outros filtros
    if (filters.queue) {
      filtered = filtered.filter(call => call.queueName.toLowerCase().includes(filters.queue.toLowerCase()));
    }
    if (filters.agent) {
      filtered = filtered.filter(call => call.agentName?.toLowerCase().includes(filters.agent.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(call => call.status === filters.status);
    }
    if (filters.callerNumber) {
      filtered = filtered.filter(call => call.callerNumber.includes(filters.callerNumber));
    }
    if (filters.minDuration) {
      filtered = filtered.filter(call => call.duration >= parseInt(filters.minDuration));
    }
    if (filters.maxDuration) {
      filtered = filtered.filter(call => call.duration <= parseInt(filters.maxDuration));
    }
    if (filters.satisfactionMin) {
      filtered = filtered.filter(call => 
        call.satisfaction && call.satisfaction >= parseInt(filters.satisfactionMin)
      );
    }

    setFilteredCalls(filtered);
    calculateMetrics(filtered);
  };

  const calculateMetrics = (calls: CallRecord[]) => {
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const abandonedCalls = calls.filter(c => c.status === 'abandoned').length;
    
    const durations = calls.filter(c => c.duration > 0).map(c => c.duration);
    const waitTimes = calls.map(c => c.waitTime);
    const satisfactions = calls.filter(c => c.satisfaction).map(c => c.satisfaction!);
    
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const satisfactionAverage = satisfactions.length > 0 ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length : 0;
    const answerRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const cost = calls.reduce((total, call) => total + (call.cost || 0), 0);

    setMetrics({
      totalCalls,
      completedCalls,
      abandonedCalls,
      averageDuration,
      averageWaitTime,
      totalDuration,
      satisfactionAverage,
      answerRate,
      firstCallResolution: Math.random() * 20 + 75, // Mock
      cost
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Concluída', variant: 'default' as const, icon: CheckCircle },
      abandoned: { label: 'Abandonada', variant: 'destructive' as const, icon: XCircle },
      transferred: { label: 'Transferida', variant: 'secondary' as const, icon: Phone },
      failed: { label: 'Falhou', variant: 'destructive' as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const downloadRecording = async (recordingUrl: string, callId: string) => {
    try {
      // Simular download
      toast.success(`Download da gravação ${callId} iniciado!`);
      
      // Em produção, fazer o download real
      // const response = await fetch(recordingUrl);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `recording-${callId}.wav`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      toast.error('Erro ao baixar gravação');
    }
  };

  const playRecording = (callId: string) => {
    if (playingRecording === callId) {
      setPlayingRecording(null);
      toast.info('Reprodução pausada');
    } else {
      setPlayingRecording(callId);
      toast.info('Iniciando reprodução...');
      // Aqui você implementaria a reprodução real do áudio
    }
  };

  const exportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      setLoading(true);
      
      // Simular export
      toast.success(`Relatório em ${format.toUpperCase()} gerado com sucesso!`);
      
      // Em produção, gerar o arquivo real
      const data = filteredCalls.map(call => ({
        'ID da Chamada': call.callId,
        'Número do Chamador': call.callerNumber,
        'Número Chamado': call.calledNumber,
        'Agente': call.agentName || 'N/A',
        'Fila': call.queueName,
        'Data/Hora': formatDate(call.startTime),
        'Duração': formatDuration(call.duration),
        'Tempo de Espera': formatDuration(call.waitTime),
        'Status': call.status,
        'Satisfação': call.satisfaction || 'N/A',
        'Custo': call.cost ? `R$ ${call.cost.toFixed(2)}` : 'N/A'
      }));
      
      console.log(`Dados para export em ${format}:`, data);
      
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllRecordings = async () => {
    const recordingsCount = filteredCalls.filter(call => call.recordingUrl).length;
    if (recordingsCount === 0) {
      toast.warning('Nenhuma gravação encontrada nos resultados filtrados');
      return;
    }
    
    toast.success(`Iniciando download de ${recordingsCount} gravações...`);
    // Implementar download em lote
  };

  // Dados para gráficos
  const getChartData = () => {
    const statusData = [
      { name: 'Concluídas', value: metrics.completedCalls, color: COLORS[0] },
      { name: 'Abandonadas', value: metrics.abandonedCalls, color: COLORS[1] },
      { name: 'Transferidas', value: filteredCalls.filter(c => c.status === 'transferred').length, color: COLORS[2] },
      { name: 'Falharam', value: filteredCalls.filter(c => c.status === 'failed').length, color: COLORS[3] }
    ];

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourCalls = filteredCalls.filter(call => 
        new Date(call.startTime).getHours() === hour
      ).length;
      return { hour: `${hour}:00`, calls: hourCalls };
    });

    return { statusData, hourlyData };
  };

  const { statusData, hourlyData } = getChartData();

  // Paginação
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const currentCalls = filteredCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-gray-600">Análise completa de chamadas e gravações</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={downloadAllRecordings} variant="outline">
            <Volume2 className="w-4 h-4 mr-2" />
            Baixar Todas Gravações
          </Button>
          
          <div className="flex items-center gap-1">
            <Button onClick={() => exportReport('csv')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => exportReport('excel')} variant="outline">
              Excel
            </Button>
            <Button onClick={() => exportReport('pdf')} variant="outline">
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Data Início</Label>
              <DatePicker
                date={filters.startDate}
                onDateChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <DatePicker
                date={filters.endDate}
                onDateChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
              />
            </div>
            <div>
              <Label>Fila</Label>
              <Input
                placeholder="Nome da fila"
                value={filters.queue}
                onChange={(e) => setFilters(prev => ({ ...prev, queue: e.target.value }))}
              />
            </div>
            <div>
              <Label>Agente</Label>
              <Input
                placeholder="Nome do agente"
                value={filters.agent}
                onChange={(e) => setFilters(prev => ({ ...prev, agent: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="abandoned">Abandonada</SelectItem>
                  <SelectItem value="transferred">Transferida</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número do Chamador</Label>
              <Input
                placeholder="Ex: +5511999888777"
                value={filters.callerNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, callerNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label>Duração Mínima (s)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minDuration}
                onChange={(e) => setFilters(prev => ({ ...prev, minDuration: e.target.value }))}
              />
            </div>
            <div>
              <Label>Satisfação Mínima</Label>
              <Select value={filters.satisfactionMin} onValueChange={(value) => setFilters(prev => ({ ...prev, satisfactionMin: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Qualquer</SelectItem>
                  <SelectItem value="1">1 estrela +</SelectItem>
                  <SelectItem value="2">2 estrelas +</SelectItem>
                  <SelectItem value="3">3 estrelas +</SelectItem>
                  <SelectItem value="4">4 estrelas +</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Chamadas</p>
                <p className="text-3xl font-bold">{metrics.totalCalls}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {metrics.completedCalls} concluídas, {metrics.abandonedCalls} abandonadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Atendimento</p>
                <p className="text-3xl font-bold">{metrics.answerRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={metrics.answerRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-3xl font-bold">{formatDuration(Math.round(metrics.averageDuration))}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Espera: {formatDuration(Math.round(metrics.averageWaitTime))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
                <p className="text-3xl font-bold">{metrics.satisfactionAverage.toFixed(1)}/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(metrics.satisfactionAverage)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chamadas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Chamadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detalhes das Chamadas ({filteredCalls.length} registros)</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCurrentPage(1)} variant="outline" size="sm">
                Primeira
              </Button>
              <Button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <Button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              <Button onClick={() => setCurrentPage(totalPages)} variant="outline" size="sm">
                Última
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chamada</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>Agente/Fila</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Espera</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Satisfação</TableHead>
                  <TableHead>Gravação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-mono text-sm">
                      {call.callId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PhoneIncoming className="w-4 h-4 text-green-600" />
                        <span className="font-mono text-sm">{call.callerNumber}</span>
                        <span>→</span>
                        <span className="font-mono text-sm">{call.calledNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {call.agentName && (
                          <p className="font-medium">{call.agentName}</p>
                        )}
                        <p className="text-sm text-gray-600">{call.queueName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(call.startTime).toLocaleDateString('pt-BR')}</p>
                        <p className="text-gray-600">{new Date(call.startTime).toLocaleTimeString('pt-BR')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {formatDuration(call.duration)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-orange-600">
                        {formatDuration(call.waitTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(call.status)}
                    </TableCell>
                    <TableCell>
                      {call.satisfaction ? (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < call.satisfaction!
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm ml-1">{call.satisfaction}/5</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {call.recordingUrl ? (
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => playRecording(call.callId)}
                            variant="outline"
                            size="sm"
                          >
                            {playingRecording === call.callId ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => downloadRecording(call.recordingUrl!, call.callId)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">Não disponível</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Chamada {call.callId}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Número do Chamador</Label>
                                <p className="font-mono">{call.callerNumber}</p>
                              </div>
                              <div>
                                <Label>Número Chamado</Label>
                                <p className="font-mono">{call.calledNumber}</p>
                              </div>
                              <div>
                                <Label>Agente</Label>
                                <p>{call.agentName || 'N/A'}</p>
                              </div>
                              <div>
                                <Label>Fila</Label>
                                <p>{call.queueName}</p>
                              </div>
                              <div>
                                <Label>Data/Hora de Início</Label>
                                <p>{formatDate(call.startTime)}</p>
                              </div>
                              <div>
                                <Label>Data/Hora de Fim</Label>
                                <p>{call.endTime ? formatDate(call.endTime) : 'N/A'}</p>
                              </div>
                              <div>
                                <Label>Duração</Label>
                                <p>{formatDuration(call.duration)}</p>
                              </div>
                              <div>
                                <Label>Tempo de Espera</Label>
                                <p>{formatDuration(call.waitTime)}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div>{getStatusBadge(call.status)}</div>
                              </div>
                              <div>
                                <Label>Custo</Label>
                                <p>{call.cost ? `R$ ${call.cost.toFixed(2)}` : 'N/A'}</p>
                              </div>
                            </div>
                            
                            {call.transferredTo && (
                              <div>
                                <Label>Transferida Para</Label>
                                <p>{call.transferredTo}</p>
                              </div>
                            )}
                            
                            {call.hangupCause && (
                              <div>
                                <Label>Motivo do Desligamento</Label>
                                <p>{call.hangupCause}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 