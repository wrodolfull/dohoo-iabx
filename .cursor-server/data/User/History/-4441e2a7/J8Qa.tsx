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
  Headphones
} from "lucide-react";

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

  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const [extensions, ringGroups, trunks] = await Promise.all([
        api.getExtensions(tenantId),
        api.getRingGroups(tenantId),
        api.getTrunks(tenantId)
      ]);

      setStats({
        extensions: extensions?.length || 0,
        ringGroups: ringGroups?.length || 0,
        trunks: trunks?.length || 0,
        activeCalls: Math.floor(Math.random() * 10), // Simulado
        totalCalls: Math.floor(Math.random() * 1000), // Simulado
        uptime: '5d 12h 34m' // Simulado
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
              Grupos de toque ativos
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

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Monitoramento em tempo real do FreeSWITCH
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-500">
                  <Activity className="w-3 h-3 mr-1" />
                  Online
                </Badge>
                <span className="text-sm font-medium">FreeSWITCH</span>
              </div>
              <span className="text-sm text-gray-600">Uptime: {stats.uptime}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span>45%</span>
              </div>
              <Progress value={45} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memória</span>
                <span>62%</span>
              </div>
              <Progress value={62} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Canais Ativos</span>
                <span>{stats.activeCalls}/100</span>
              </div>
              <Progress value={(stats.activeCalls / 100) * 100} />
            </div>
          </CardContent>
        </Card>

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
              <span className="text-lg font-bold">{Math.floor(stats.totalCalls * 0.6)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PhoneOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Chamadas Perdidas</span>
              </div>
              <span className="text-lg font-bold">{Math.floor(stats.totalCalls * 0.1)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Tempo Médio</span>
              </div>
              <span className="text-lg font-bold">3m 45s</span>
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
