import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Phone, PhoneOff, Search, RefreshCw, Clock, Users, AlertTriangle, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface ActiveCall {
  id: string;
  call_id: string;
  direction: 'inbound' | 'outbound';
  caller_number: string;
  caller_name?: string;
  called_number: string;
  called_name?: string;
  status: 'ringing' | 'answered' | 'held' | 'transferring';
  start_time: string;
  answer_time?: string;
  duration: number;
  extension?: string;
  trunk?: string;
  tenant_id: string;
  channel_a: string;
  channel_b?: string;
  codec?: string;
  ip_address?: string;
}

const ActiveCalls: React.FC = () => {
  const { user, hasPermission, logActivity } = useAuth();
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Verificar permissões
  if (!hasPermission('calls.view')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-gray-600">Você não tem permissão para visualizar chamadas ativas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchActiveCalls();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActiveCalls, 3000); // Atualiza a cada 3 segundos
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchActiveCalls = async () => {
    try {
      const response = await api.getActiveCalls(user?.tenant_id || '');
      setCalls(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      if (loading) setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar chamadas ativas:', error);
      setCalls([]);
      if (loading) {
        toast.error('Erro ao carregar chamadas ativas');
        setLoading(false);
      }
    }
  };

  const handleHangup = async (callId: string, callerNumber: string) => {
    if (!hasPermission('calls.hangup')) {
      toast.error('Você não tem permissão para desligar chamadas');
      return;
    }

    try {
      await api.hangupCall(callId);
      await logActivity('hangup', 'call', { 
        call_id: callId, 
        caller_number: callerNumber 
      });
      toast.success('Chamada desligada com sucesso');
      fetchActiveCalls();
    } catch (error) {
      toast.error('Erro ao desligar chamada');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing': return 'bg-blue-100 text-blue-800';
      case 'answered': return 'bg-green-100 text-green-800';
      case 'held': return 'bg-yellow-100 text-yellow-800';
      case 'transferring': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ringing': return <Phone className="h-4 w-4 animate-pulse" />;
      case 'answered': return <PhoneCall className="h-4 w-4" />;
      case 'held': return <Clock className="h-4 w-4" />;
      case 'transferring': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const filteredCalls = (calls || []).filter(call => {
    const matchesSearch = searchTerm === '' || 
      call?.caller_number?.includes(searchTerm) ||
      call?.called_number?.includes(searchTerm) ||
      call?.caller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call?.called_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDirection = filterDirection === 'all' || call?.direction === filterDirection;
    const matchesStatus = filterStatus === 'all' || call?.status === filterStatus;
    
    return matchesSearch && matchesDirection && matchesStatus;
  });

  const getCallStats = () => {
    const callsArray = calls || [];
    const total = callsArray.length;
    const inbound = callsArray.filter(c => c?.direction === 'inbound').length;
    const outbound = callsArray.filter(c => c?.direction === 'outbound').length;
    const answered = callsArray.filter(c => c?.status === 'answered').length;
    const ringing = callsArray.filter(c => c?.status === 'ringing').length;
    
    return { total, inbound, outbound, answered, ringing };
  };

  const stats = getCallStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamadas Ativas</h1>
          <p className="text-gray-600">Monitore chamadas em tempo real</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Pausar' : 'Atualizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActiveCalls}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-[#7C45D0]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entrada</p>
                <p className="text-2xl font-bold">{stats.inbound}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saída</p>
                <p className="text-2xl font-bold">{stats.outbound}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <PhoneCall className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atendidas</p>
                <p className="text-2xl font-bold">{stats.answered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600 animate-pulse" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tocando</p>
                <p className="text-2xl font-bold">{stats.ringing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDirection} onValueChange={setFilterDirection}>
              <SelectTrigger>
                <SelectValue placeholder="Direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="inbound">Entrada</SelectItem>
                <SelectItem value="outbound">Saída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ringing">Tocando</SelectItem>
                <SelectItem value="answered">Atendida</SelectItem>
                <SelectItem value="held">Em espera</SelectItem>
                <SelectItem value="transferring">Transferindo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Chamadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Chamadas Ativas ({filteredCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C45D0]"></div>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              {calls.length === 0 ? 'Nenhuma chamada ativa' : 'Nenhuma chamada encontrada com os filtros aplicados'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => (
                <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(call.status)}
                        <Badge className={getStatusColor(call.status)}>
                          {call.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getDirectionColor(call.direction)}>
                            {call.direction === 'inbound' ? 'ENTRADA' : 'SAÍDA'}
                          </Badge>
                          <span className="font-medium">
                            {call.caller_number} → {call.called_number}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {call.caller_name && (
                            <span>De: {call.caller_name}</span>
                          )}
                          {call.called_name && (
                            <span>Para: {call.called_name}</span>
                          )}
                          {call.extension && (
                            <span>Ramal: {call.extension}</span>
                          )}
                          {call.trunk && (
                            <span>Tronco: {call.trunk}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatDuration(call.duration)}</p>
                        <p className="text-gray-500">
                          Início: {formatTime(call.start_time)}
                        </p>
                        {call.answer_time && (
                          <p className="text-gray-500">
                            Atendida: {formatTime(call.answer_time)}
                          </p>
                        )}
                      </div>
                      
                      {hasPermission('calls.hangup') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleHangup(call.call_id, call.caller_number)}
                        >
                          <PhoneOff className="h-4 w-4 mr-1" />
                          Desligar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Detalhes técnicos */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <div className="flex items-center space-x-6">
                      <span>ID: {call.call_id}</span>
                      <span>Canal A: {call.channel_a}</span>
                      {call.channel_b && <span>Canal B: {call.channel_b}</span>}
                      {call.codec && <span>Codec: {call.codec}</span>}
                      {call.ip_address && <span>IP: {call.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveCalls; 