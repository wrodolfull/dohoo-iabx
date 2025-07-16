import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Phone, 
  Users, 
  Activity, 
  TrendingUp, 
  PhoneCall, 
  PhoneOff,
  Clock,
  ArrowUpRight,
  Server,
  Headphones,
  Star,
  BarChart3
} from "lucide-react";
import { format, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  extensions: number;
  ringGroups: number;
  trunks: number;
  activeCalls: number;
  totalCalls: number;
  uptime: string;
}

const Dashboard = () => {
  const { tenantId } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    extensions: 0,
    ringGroups: 0,
    trunks: 0,
    activeCalls: 0,
    totalCalls: 0,
    uptime: '0d 0h 0m'
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'geral'|'grupo'|'ramal'>('geral');
  // Simulação de rating (futuro: IA)
  const rating = tab === 'geral' ? 4.2 : tab === 'grupo' ? 4.0 : 3.8;

  // Novo estado para estatísticas detalhadas de chamadas
  const [callStats, setCallStats] = useState({ received: 0, missed: 0, avgDuration: 0 });

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      // Buscar apenas as rotas que funcionam para os cards principais
      const [extensions, ringGroups, trunks, activeCalls, fsStatus] = await Promise.all([
        api.getExtensions(tenantId),
        api.getRingGroups(tenantId),
        api.getTrunks(tenantId),
        api.getActiveCalls(tenantId),
        api.getFreeSwitchStatus()
      ]);
      // Comentário: Não existe rota de estatísticas de chamadas (/reports/calls) no backend atualmente
      const getArray = (res: any) => Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setStats({
        extensions: getArray(extensions).length,
        ringGroups: getArray(ringGroups).length,
        trunks: getArray(trunks).length,
        activeCalls: Array.isArray(activeCalls?.data) ? activeCalls.data.length : Array.isArray(activeCalls) ? activeCalls.length : 0,
        totalCalls: '-', // Não disponível
        uptime: fsStatus?.uptime || '-'
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      // Mesmo em caso de erro, garantir que os cards principais não quebrem
      setStats(s => ({
        ...s,
        extensions: 0,
        ringGroups: 0,
        trunks: 0,
        activeCalls: 0,
        uptime: '-'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Selecione uma empresa para visualizar o dashboard.</div>
      </div>
    );
  }

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-dohoo-primary" />
          Dashboard
        </h1>
        <p className="text-gray-600">
          Visão geral do seu sistema VoIP
        </p>
      </div>

      {/* Tenant Selector for Superadmin */}
      {/* REMOVIDO: Seletor de Tenant agora é global via useTenant */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ramais</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.extensions}</div>
            <p className="text-xs text-muted-foreground">
              Ramais configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ringGroups}</div>
            <p className="text-xs text-muted-foreground">
              Contact Center ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Troncos</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trunks}</div>
            <p className="text-xs text-muted-foreground">
              Provedores SIP conectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamadas Ativas</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCalls}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento agora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status - SUBSTITUIR POR AVALIAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Avaliação de Atendimento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nível de Atendimento</CardTitle>
              <CardDescription>
                Avaliação automática baseada em transcrição e IA (em breve)
              </CardDescription>
            </div>
            <BarChart3 className="w-6 h-6 text-dohoo-primary" />
          </CardHeader>
          <CardContent>
            {/* Abas */}
            <div className="flex gap-2 mb-4">
              <Button variant={tab === 'geral' ? 'default' : 'outline'} size="sm" onClick={() => setTab('geral')}>Geral</Button>
              <Button variant={tab === 'grupo' ? 'default' : 'outline'} size="sm" onClick={() => setTab('grupo')}>Por Grupo</Button>
              <Button variant={tab === 'ramal' ? 'default' : 'outline'} size="sm" onClick={() => setTab('ramal')}>Por Ramal</Button>
            </div>
            {/* Estrelas de avaliação (simulado) */}
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-6 h-6 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="ml-2 text-lg font-bold">{rating.toFixed(1)} / 5.0</span>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              {tab === 'geral' && 'Média geral das avaliações de atendimento.'}
              {tab === 'grupo' && 'Média por grupo de atendimento.'}
              {tab === 'ramal' && 'Média por ramal.'}
            </div>
            <Button variant="link" className="p-0 text-dohoo-primary" onClick={() => window.location.href='/reports/analytics'}>
              Ver completo
            </Button>
          </CardContent>
        </Card>
        {/* Card Estatísticas de Chamadas permanece igual */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Chamadas</CardTitle>
            <CardDescription>
              Resumo das chamadas do dia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Chamadas Recebidas</span>
              </div>
              <span className="text-lg font-bold">{callStats.received}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PhoneOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Chamadas Perdidas</span>
              </div>
              <span className="text-lg font-bold">{callStats.missed}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Tempo Médio</span>
              </div>
              <span className="text-lg font-bold">{callStats.avgDuration > 0 ? `${Math.floor(callStats.avgDuration / 60)}m ${callStats.avgDuration % 60}s` : '-'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Taxa de Atendimento</span>
              </div>
              <span className="text-lg font-bold">85%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Novo Ramal
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Novo Grupo
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Novo Tronco
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              Chamadas Ativas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
