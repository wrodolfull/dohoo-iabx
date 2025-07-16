import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, Download, Search, Filter, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  tenant_id: string;
  action: string;
  resource: string;
  details?: string;
  ip_address?: string;
  user_agent: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const AuditLogs: React.FC = () => {
  const { user, hasPermission, logActivity } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // últimos 7 dias
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Verificar permissões
  if (!hasPermission('audit_logs.view')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-gray-600">Você não tem permissão para visualizar logs de auditoria.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterRole, filterSeverity, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getAuditLogs({
        action: filterAction !== 'all' ? filterAction : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        days: parseInt(dateRange),
        tenant_id: user?.role === 'superadmin' ? undefined : user?.tenant_id
      });
      setLogs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await api.exportAuditLogs({
        action: filterAction !== 'all' ? filterAction : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        days: parseInt(dateRange),
        tenant_id: user?.role === 'superadmin' ? undefined : user?.tenant_id
      });
      
      // Criar e baixar arquivo CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      await logActivity('export', 'audit_logs', { 
        filters: { filterAction, filterRole, filterSeverity, dateRange }
      });
      
      toast.success('Logs exportados com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar logs');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': case 'edit': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="text-gray-600">Monitore todas as atividades do sistema</p>
        </div>
        {hasPermission('audit_logs.export') && (
          <Button onClick={exportLogs} className="bg-[#7C45D0] hover:bg-[#6B3BC0]">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuário, ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criar</SelectItem>
                <SelectItem value="update">Atualizar</SelectItem>
                <SelectItem value="delete">Excluir</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último dia</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C45D0]"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Nenhum log encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(log.severity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {log.action.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{log.resource}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">{log.user_name}</span> ({log.user_email})
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{log.user_role}</Badge>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalhes do Log</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuário</label>
                    <p className="text-sm">{selectedLog.user_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedLog.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Função</label>
                    <Badge variant="outline">{selectedLog.user_role}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ação</label>
                    <Badge className={getActionColor(selectedLog.action)}>
                      {selectedLog.action.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Recurso</label>
                    <p className="text-sm">{selectedLog.resource}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severidade</label>
                    <Badge className={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                    <p className="text-sm">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP</label>
                    <p className="text-sm">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detalhes</label>
                    <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                    </pre>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-xs text-gray-600 break-all">{selectedLog.user_agent}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs; 