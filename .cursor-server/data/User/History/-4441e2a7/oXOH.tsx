import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
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
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (selectedTenant) {
      loadDashboardData();
    }
  }, [selectedTenant]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'superadmin') {
        // Para superadmin, carregar lista de tenants
        const tenantsData = await api.getTenants();
        setTenants(tenantsData || []);
        
        // Selecionar o primeiro tenant por padrão
        if (tenantsData && tenantsData.length > 0) {
          setSelectedTenant(tenantsData[0].id);
        }
      } else if (user?.tenant_id) {
        // Para usuários normais, usar o tenant_id do usuário
        setSelectedTenant(user.tenant_id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!selectedTenant) return;
    
    try {
      setLoading(true);
      const [extensions, ringGroups, trunks] = await Promise.all([
        api.getExtensions(selectedTenant),
        api.getRingGroups(selectedTenant),
        api.getTrunks(selectedTenant)
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
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalCalls}</div>
                <div className="text-sm text-gray-600">Total Hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.floor(stats.totalCalls * 0.85)}</div>
                <div className="text-sm text-gray-600">Atendidas</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PhoneCall className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Chamadas Entrada</span>
                </div>
                <span className="text-sm font-medium">{Math.floor(stats.totalCalls * 0.6)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PhoneOff className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Chamadas Saída</span>
                </div>
                <span className="text-sm font-medium">{Math.floor(stats.totalCalls * 0.4)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">Tempo Médio</span>
                </div>
                <span className="text-sm font-medium">2m 34s</span>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col justify-center">
              <Phone className="w-6 h-6 mb-2" />
              <span>Novo Ramal</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col justify-center">
              <Users className="w-6 h-6 mb-2" />
              <span>Novo Grupo</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col justify-center">
              <Server className="w-6 h-6 mb-2" />
              <span>Novo Tronco</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
