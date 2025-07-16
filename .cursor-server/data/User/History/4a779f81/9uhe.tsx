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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Building,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from '@/hooks/useTenant';

interface Schedule {
  id: string;
  name: string;
  description: string;
  timezone: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface TimeRange {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const Schedules = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'America/Sao_Paulo'
  });

  const daysOfWeek = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const schedulesData = await api.getSchedules(tenantId);
      setSchedules(schedulesData || []);
      setTimeRanges([]); // Por enquanto, não temos getTimeRanges na API
    } catch (error) {
      toast.error('Erro ao carregar horários');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, formData);
        toast.success('Horário atualizado com sucesso!');
      } else {
        await api.createSchedule(formData);
        toast.success('Horário criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(editingSchedule ? 'Erro ao atualizar horário' : 'Erro ao criar horário');
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (!confirm(`Tem certeza que deseja excluir o horário ${schedule.name}?`)) return;
    try {
      await api.deleteSchedule(schedule.id);
      toast.success('Horário excluído com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir horário');
      console.error('Error deleting schedule:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description,
      timezone: schedule.timezone
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      description: '',
      timezone: 'America/Sao_Paulo'
    });
  };

  const getTimeRangesForSchedule = (scheduleId: string) => {
    return timeRanges.filter(tr => tr.schedule_id === scheduleId);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove segundos se houver
  };

  const getScheduleStatus = (schedule: Schedule) => {
    const ranges = getTimeRangesForSchedule(schedule.id);
    if (ranges.length === 0) {
      return { status: 'inactive', label: 'Sem horários', icon: <XCircle className="w-4 h-4" /> };
    }
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().substring(0, 5);
    
    const isActive = ranges.some(range => {
      if (range.day_of_week === currentDay) {
        return currentTime >= range.start_time && currentTime <= range.end_time;
      }
      return false;
    });
    
    return {
      status: isActive ? 'active' : 'inactive',
      label: isActive ? 'Ativo' : 'Inativo',
      icon: isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando horários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-dohoo-primary" />
            Regras de Horário
          </h1>
          <p className="text-gray-600">
            Gerencie horários de funcionamento e disponibilidade
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!tenantId}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
              </DialogTitle>
              <DialogDescription>
                Configure horários de funcionamento para sua empresa
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Horário</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Horário Comercial"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Segunda a Sexta, 8h às 18h"
                />
              </div>
              
              <div>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({...formData, timezone: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                    <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                    <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                    <SelectItem value="America/Maceio">Maceió (GMT-3)</SelectItem>
                    <SelectItem value="America/Aracaju">Aracaju (GMT-3)</SelectItem>
                    <SelectItem value="America/Salvador">Salvador (GMT-3)</SelectItem>
                    <SelectItem value="America/Bahia">Bahia (GMT-3)</SelectItem>
                    <SelectItem value="America/Vitoria">Vitória (GMT-3)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    <SelectItem value="America/Porto_Velho">Porto Velho (GMT-4)</SelectItem>
                    <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                    <SelectItem value="America/Campo_Grande">Campo Grande (GMT-4)</SelectItem>
                    <SelectItem value="America/Goiania">Goiânia (GMT-3)</SelectItem>
                    <SelectItem value="America/Boa_Vista">Boa Vista (GMT-4)</SelectItem>
                    <SelectItem value="America/Palmas">Palmas (GMT-3)</SelectItem>
                    <SelectItem value="America/Teresina">Teresina (GMT-3)</SelectItem>
                    <SelectItem value="America/Sao_Luis">São Luís (GMT-3)</SelectItem>
                    <SelectItem value="America/Natal">Natal (GMT-3)</SelectItem>
                    <SelectItem value="America/Joao_Pessoa">João Pessoa (GMT-3)</SelectItem>
                    <SelectItem value="America/Maceio">Maceió (GMT-3)</SelectItem>
                    <SelectItem value="America/Aracaju">Aracaju (GMT-3)</SelectItem>
                    <SelectItem value="America/Salvador">Salvador (GMT-3)</SelectItem>
                    <SelectItem value="America/Bahia">Bahia (GMT-3)</SelectItem>
                    <SelectItem value="America/Vitoria">Vitória (GMT-3)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    <SelectItem value="America/Porto_Velho">Porto Velho (GMT-4)</SelectItem>
                    <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                    <SelectItem value="America/Campo_Grande">Campo Grande (GMT-4)</SelectItem>
                    <SelectItem value="America/Goiania">Goiânia (GMT-3)</SelectItem>
                    <SelectItem value="America/Boa_Vista">Boa Vista (GMT-4)</SelectItem>
                    <SelectItem value="America/Palmas">Palmas (GMT-3)</SelectItem>
                    <SelectItem value="America/Teresina">Teresina (GMT-3)</SelectItem>
                    <SelectItem value="America/Sao_Luis">São Luís (GMT-3)</SelectItem>
                    <SelectItem value="America/Natal">Natal (GMT-3)</SelectItem>
                    <SelectItem value="America/Joao_Pessoa">João Pessoa (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {editingSchedule ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Horários ({schedules.length})</CardTitle>
          <CardDescription>
            Lista de todas as regras de horário configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum horário encontrado</h3>
              <p className="text-gray-600">
                Crie sua primeira regra de horário para definir períodos de funcionamento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const status = getScheduleStatus(schedule);
                const ranges = getTimeRangesForSchedule(schedule.id);
                
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-gray-600">
                          {schedule.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={status.status === 'active' ? 'default' : 'secondary'}
                            className="flex items-center gap-1"
                          >
                            {status.icon}
                            {status.label}
                          </Badge>
                          {ranges.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {ranges.length} período{ranges.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(schedule)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedules; 