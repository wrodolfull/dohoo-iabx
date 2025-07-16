import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Download, 
  Calendar,
  Clock,
  Phone,
  TrendingUp,
  TrendingDown,
  Users,
  PhoneCall,
  PhoneOff
} from "lucide-react";
import { toast } from "sonner";

interface CallRecord {
  id: string;
  caller_id: string;
  destination: string;
  start_time: string;
  duration: number;
  status: string;
  direction: string;
}

interface Stats {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  totalDuration: number;
}

const Reports = () => {
  const { user } = useAuth();
  const tenantId = user?.company || '';
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCalls: 0,
    answeredCalls: 0,
    missedCalls: 0,
    avgDuration: 0,
    totalDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    direction: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadReports();
  }, [tenantId, filters]);

  const loadReports = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      // Simular dados de relatório
      const mockCalls: CallRecord[] = [
        {
          id: '1',
          caller_id: '1140001234',
          destination: '1001',
          start_time: new Date().toISOString(),
          duration: 120,
          status: 'answered',
          direction: 'inbound'
        },
        {
          id: '2',
          caller_id: '1002',
          destination: '1140005678',
          start_time: new Date(Date.now() - 3600000).toISOString(),
          duration: 45,
          status: 'answered',
          direction: 'outbound'
        },
        {
          id: '3',
          caller_id: '1140009999',
          destination: '1003',
          start_time: new Date(Date.now() - 7200000).toISOString(),
          duration: 0,
          status: 'missed',
          direction: 'inbound'
        }
      ];

      setCalls(mockCalls);
      
      // Calcular estatísticas
      const totalCalls = mockCalls.length;
      const answeredCalls = mockCalls.filter(c => c.status === 'answered').length;
      const missedCalls = totalCalls - answeredCalls;
      const totalDuration = mockCalls.reduce((sum, call) => sum + call.duration, 0);
      const avgDuration = answeredCalls > 0 ? totalDuration / answeredCalls : 0;

      setStats({
        totalCalls,
        answeredCalls,
        missedCalls,
        avgDuration,
        totalDuration
      });
    } catch (error) {
      toast.error('Erro ao carregar relatórios');
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      'Data/Hora,Origem,Destino,Duração,Status,Direção',
      ...calls.map(call => [
        new Date(call.start_time).toLocaleString('pt-BR'),
        call.caller_id,
        call.destination,
        `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`,
        call.status === 'answered' ? 'Atendida' : 'Perdida',
        call.direction === 'inbound' ? 'Entrada' : 'Saída'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_chamadas_${filters.startDate}_${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    return status === 'answered' ? 
      <Badge variant="default" className="bg-green-500">Atendida</Badge> :
      <Badge variant="destructive">Perdida</Badge>;
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? 
      <Phone className="w-4 h-4 text-blue-500" /> :
      <PhoneCall className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-dohoo-primary" />
            Relatórios
          </h1>
          <p className="text-gray-600">
            Análise detalhada de chamadas e estatísticas do sistema
          </p>
        </div>
        
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direction">Direção</Label>
              <Select value={filters.direction} onValueChange={(value) => 
                setFilters({ ...filters, direction: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="inbound">Entrada</SelectItem>
                  <SelectItem value="outbound">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => 
                setFilters({ ...filters, status: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="answered">Atendidas</SelectItem>
                  <SelectItem value="missed">Perdidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <div className="text-sm text-gray-600">Total Chamadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.answeredCalls}</div>
                <div className="text-sm text-gray-600">Atendidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.missedCalls}</div>
                <div className="text-sm text-gray-600">Perdidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</div>
                <div className="text-sm text-gray-600">Duração Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
                <div className="text-sm text-gray-600">Total Falado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Chamadas (CDR)</CardTitle>
          <CardDescription>
            Detalhamento de todas as chamadas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {getDirectionIcon(call.direction)}
                  <div>
                    <div className="font-medium">
                      {call.direction === 'inbound' ? call.caller_id : call.destination}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(call.start_time).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{formatDuration(call.duration)}</div>
                    <div className="text-sm text-gray-500">
                      {call.direction === 'inbound' ? `→ ${call.destination}` : `← ${call.caller_id}`}
                    </div>
                  </div>
                  {getStatusBadge(call.status)}
                </div>
              </div>
            ))}
          </div>

          {calls.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma chamada encontrada</h3>
              <p className="text-gray-600">Ajuste os filtros para visualizar os dados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chamadas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Gráfico de chamadas por hora será implementado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>Gráfico de taxa de atendimento será implementado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
