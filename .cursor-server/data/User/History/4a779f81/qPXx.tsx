import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Clock, Plus, Edit2, Trash2, Calendar, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface TimeSlot {
  start: string;
  end: string;
}

interface Schedule {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  is_active: boolean;
  priority: number;
  
  // Horários por dia da semana
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  
  // Feriados e exceções
  holidays: string[]; // array de datas no formato YYYY-MM-DD
  exceptions: { date: string; slots: TimeSlot[] }[];
  
  // Ações durante horário de atendimento
  business_hours_action: 'route' | 'queue' | 'voicemail';
  business_hours_destination: string;
  
  // Ações fora do horário de atendimento
  after_hours_action: 'route' | 'queue' | 'voicemail' | 'hangup';
  after_hours_destination: string;
  after_hours_message: string;
  
  // Configurações avançadas
  timezone: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' }
];

const Schedules: React.FC = () => {
  const { user, hasPermission, logActivity } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Schedule>>({
    name: '',
    description: '',
    is_active: true,
    priority: 1,
    monday: [{ start: '09:00', end: '18:00' }],
    tuesday: [{ start: '09:00', end: '18:00' }],
    wednesday: [{ start: '09:00', end: '18:00' }],
    thursday: [{ start: '09:00', end: '18:00' }],
    friday: [{ start: '09:00', end: '18:00' }],
    saturday: [],
    sunday: [],
    holidays: [],
    exceptions: [],
    business_hours_action: 'route',
    business_hours_destination: '',
    after_hours_action: 'voicemail',
    after_hours_destination: '',
    after_hours_message: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
    timezone: 'America/Sao_Paulo'
  });

  // Verificar permissões
  if (!hasPermission('schedules.view')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-gray-600">Você não tem permissão para visualizar horários de atendimento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.getSchedules(user?.tenant_id);
      setSchedules(response.data);
    } catch (error) {
      toast.error('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const scheduleData = {
        ...formData,
        tenant_id: user?.tenant_id,
        created_by: user?.id
      };

      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, scheduleData);
        await logActivity('update', 'schedule', { schedule_id: editingSchedule.id, name: formData.name });
        toast.success('Horário atualizado com sucesso');
      } else {
        await api.createSchedule(scheduleData);
        await logActivity('create', 'schedule', { name: formData.name });
        toast.success('Horário criado com sucesso');
      }

      setModalOpen(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      toast.error('Erro ao salvar horário');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSchedule(id);
      await logActivity('delete', 'schedule', { schedule_id: id });
      toast.success('Horário excluído com sucesso');
      setDeleteConfirmId(null);
      fetchSchedules();
    } catch (error) {
      toast.error('Erro ao excluir horário');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.updateSchedule(id, { is_active: isActive });
      await logActivity('update', 'schedule', { schedule_id: id, action: isActive ? 'activate' : 'deactivate' });
      toast.success(`Horário ${isActive ? 'ativado' : 'desativado'} com sucesso`);
      fetchSchedules();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      priority: 1,
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [],
      sunday: [],
      holidays: [],
      exceptions: [],
      business_hours_action: 'route',
      business_hours_destination: '',
      after_hours_action: 'voicemail',
      after_hours_destination: '',
      after_hours_message: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
      timezone: 'America/Sao_Paulo'
    });
  };

  const addTimeSlot = (day: string) => {
    const daySlots = formData[day as keyof Schedule] as TimeSlot[] || [];
    setFormData({
      ...formData,
      [day]: [...daySlots, { start: '09:00', end: '18:00' }]
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const daySlots = formData[day as keyof Schedule] as TimeSlot[] || [];
    setFormData({
      ...formData,
      [day]: daySlots.filter((_, i) => i !== index)
    });
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const daySlots = [...(formData[day as keyof Schedule] as TimeSlot[] || [])];
    daySlots[index] = { ...daySlots[index], [field]: value };
    setFormData({
      ...formData,
      [day]: daySlots
    });
  };

  const formatTimeSlots = (slots: TimeSlot[]) => {
    if (!slots || slots.length === 0) return 'Fechado';
    return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
  };

  const isCurrentlyOpen = (schedule: Schedule) => {
    if (!schedule.is_active) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const daySlots = schedule[currentDay as keyof Schedule] as TimeSlot[] || [];
    
    return daySlots.some(slot => {
      return currentTime >= slot.start && currentTime <= slot.end;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horários de Atendimento</h1>
          <p className="text-gray-600">Configure os horários de funcionamento e regras de negócio</p>
        </div>
        {hasPermission('schedules.create') && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingSchedule(null);
                  resetForm();
                }}
                className="bg-[#7C45D0] hover:bg-[#6B3BC0]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Horário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Horário Comercial"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o horário de atendimento..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                {/* Horários da Semana */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Horários da Semana</h3>
                  <div className="space-y-4">
                    {WEEKDAYS.map((day) => (
                      <div key={day.key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{day.label}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(day.key)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Horário
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {((formData[day.key as keyof Schedule] as TimeSlot[]) || []).map((slot, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                                className="w-32"
                              />
                              <span>até</span>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                                className="w-32"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(day.key, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {((formData[day.key as keyof Schedule] as TimeSlot[]) || []).length === 0 && (
                            <p className="text-sm text-gray-500">Fechado</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Durante Horário de Atendimento</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="business_hours_action">Ação</Label>
                        <Select
                          value={formData.business_hours_action}
                          onValueChange={(value) => setFormData({ ...formData, business_hours_action: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="route">Rotear para destino</SelectItem>
                            <SelectItem value="queue">Enviar para fila</SelectItem>
                            <SelectItem value="voicemail">Caixa postal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="business_hours_destination">Destino</Label>
                        <Input
                          id="business_hours_destination"
                          value={formData.business_hours_destination}
                          onChange={(e) => setFormData({ ...formData, business_hours_destination: e.target.value })}
                          placeholder="Ex: 1001, grupo-vendas"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fora do Horário de Atendimento</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="after_hours_action">Ação</Label>
                        <Select
                          value={formData.after_hours_action}
                          onValueChange={(value) => setFormData({ ...formData, after_hours_action: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="route">Rotear para destino</SelectItem>
                            <SelectItem value="queue">Enviar para fila</SelectItem>
                            <SelectItem value="voicemail">Caixa postal</SelectItem>
                            <SelectItem value="hangup">Desligar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="after_hours_destination">Destino</Label>
                        <Input
                          id="after_hours_destination"
                          value={formData.after_hours_destination}
                          onChange={(e) => setFormData({ ...formData, after_hours_destination: e.target.value })}
                          placeholder="Ex: 1001, grupo-vendas"
                        />
                      </div>
                      <div>
                        <Label htmlFor="after_hours_message">Mensagem</Label>
                        <Textarea
                          id="after_hours_message"
                          value={formData.after_hours_message}
                          onChange={(e) => setFormData({ ...formData, after_hours_message: e.target.value })}
                          placeholder="Mensagem para fora do horário..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#7C45D0] hover:bg-[#6B3BC0]">
                    {editingSchedule ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C45D0]"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-500">
            Nenhum horário configurado
          </div>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{schedule.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {isCurrentlyOpen(schedule) ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aberto
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Fechado
                      </Badge>
                    )}
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) => toggleActive(schedule.id, checked)}
                      disabled={!hasPermission('schedules.edit')}
                    />
                  </div>
                </div>
                {schedule.description && (
                  <p className="text-sm text-gray-600">{schedule.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {WEEKDAYS.map((day) => (
                    <div key={day.key} className="flex justify-between">
                      <span className="font-medium">{day.label}:</span>
                      <span className="text-gray-600">
                        {formatTimeSlots(schedule[day.key as keyof Schedule] as TimeSlot[])}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Prioridade: {schedule.priority}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasPermission('schedules.edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('schedules.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules; 