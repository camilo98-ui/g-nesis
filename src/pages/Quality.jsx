import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, ClipboardCheck, 
  CheckCircle, AlertTriangle, BarChart3, Calendar,
  Save, Plus, Trash2, Edit3, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const DEFAULT_MORNING_TASKS = [
  { id: 'm1', label: 'Limpieza de vitrinas', category: 'limpieza' },
  { id: 'm2', label: 'Barra de servicio desinfectada', category: 'limpieza' },
  { id: 'm3', label: 'Cubetas limpias y organizadas', category: 'equipos' },
  { id: 'm4', label: 'Lavamanos funcionando y limpio', category: 'higiene' },
  { id: 'm5', label: 'Implementos de aseo disponibles', category: 'insumos' },
  { id: 'm6', label: 'Uniforme completo y limpio', category: 'presentacion' },
  { id: 'm7', label: 'Nevera en buen estado', category: 'equipos' },
  { id: 'm8', label: 'Insumos de servicio limpios', category: 'insumos' },
];

const DEFAULT_CLOSING_TASKS = [
  { id: 'c1', label: 'Lavado de utensilios', category: 'limpieza' },
  { id: 'c2', label: 'Superficies desinfectadas', category: 'limpieza' },
  { id: 'c3', label: 'Residuos retirados', category: 'limpieza' },
  { id: 'c4', label: 'Bolsas de basura reemplazadas', category: 'limpieza' },
  { id: 'c5', label: 'Paredes y piso limpios', category: 'limpieza' },
  { id: 'c6', label: 'Inventario revisado', category: 'inventario' },
  { id: 'c7', label: 'Equipos apagados', category: 'equipos' },
  { id: 'c8', label: 'Caja cuadrada', category: 'caja' },
];

const DEFAULT_DEEP_TASKS = [
  { id: 'd1', label: 'Lavado pared a pared', category: 'profundo' },
  { id: 'd2', label: 'Filtros de máquinas limpiados', category: 'equipos' },
  { id: 'd3', label: 'Revisión de equipos', category: 'equipos' },
  { id: 'd4', label: 'Nevera completa desinfectada', category: 'profundo' },
  { id: 'd5', label: 'Cristales sin manchas', category: 'limpieza' },
  { id: 'd6', label: 'Desagües limpios', category: 'profundo' },
];

const QUALITY_MESSAGES = [
  "🧹 ¡Un espacio limpio = clientes felices!",
  "✨ La limpieza es nuestra mejor carta",
  "🍦 Helados perfectos en ambiente impecable",
];

const TABS = [
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
  { id: 'calendar', label: 'Historial', icon: Calendar },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'visits', label: 'Visitas', icon: Star },
  { id: 'config', label: 'Config', icon: Edit3 },
];

export default function Quality() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState('');
  const [activeTab, setActiveTab] = useState('checklist');
  const [checklistType, setChecklistType] = useState('morning');
  const [tasks, setTasks] = useState({});
  const [cashierName, setCashierName] = useState('');
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [randomMessage, setRandomMessage] = useState('');
  
  const [morningTasks, setMorningTasks] = useState(DEFAULT_MORNING_TASKS);
  const [closingTasks, setClosingTasks] = useState(DEFAULT_CLOSING_TASKS);
  const [deepTasks, setDeepTasks] = useState(DEFAULT_DEEP_TASKS);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [editingType, setEditingType] = useState('morning');

  const [visitScore, setVisitScore] = useState(0);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitDate, setVisitDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
    base44.auth.me().then(u => {
      setCurrentUser(u);
      setCashierName(u?.full_name || '');
    }).catch(() => {});
    setRandomMessage(QUALITY_MESSAGES[Math.floor(Math.random() * QUALITY_MESSAGES.length)]);
    
    const savedMorning = localStorage.getItem('quality_morning_tasks');
    const savedClosing = localStorage.getItem('quality_closing_tasks');
    const savedDeep = localStorage.getItem('quality_deep_tasks');
    if (savedMorning) setMorningTasks(JSON.parse(savedMorning));
    if (savedClosing) setClosingTasks(JSON.parse(savedClosing));
    if (savedDeep) setDeepTasks(JSON.parse(savedDeep));
  }, []);

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selectedStore],
    queryFn: () => base44.entities.CleaningChecklist.filter({ store_id: selectedStore }, '-created_date', 100),
    enabled: !!selectedStore
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', selectedStore],
    queryFn: () => base44.entities.QualityIncident.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.CleaningChecklist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists']);
      toast.success('✅ Checklist guardado');
      setTasks({});
      setNotes('');
      setSignature('');
    }
  });

  const saveVisitMutation = useMutation({
    mutationFn: (data) => base44.entities.QualityIncident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents']);
      toast.success('✅ Visita registrada');
      setVisitScore(0);
      setVisitNotes('');
    }
  });

  const getCurrentTasks = () => {
    if (checklistType === 'morning') return morningTasks;
    if (checklistType === 'closing') return closingTasks;
    return deepTasks;
  };

  const handleTaskChange = (taskId, status) => {
    setTasks({ ...tasks, [taskId]: status });
  };

  const getCompletionPercentage = () => {
    const currentTasks = getCurrentTasks();
    const completed = currentTasks.filter(t => tasks[t.id] === 'done' || tasks[t.id] === 'na').length;
    return Math.round((completed / currentTasks.length) * 100);
  };

  const saveChecklist = () => {
    if (!cashierName.trim()) { toast.error('Ingresa tu nombre'); return; }
    if (!signature.trim()) { toast.error('Ingresa tu firma'); return; }

    const type = checklistType === 'morning' ? 'morning' : checklistType === 'closing' ? 'closing' : 'deep_weekly';
    
    saveMutation.mutate({
      store_id: selectedStore,
      cashier_id: currentUser?.id || '',
      cashier_name: cashierName,
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      tasks: JSON.stringify(tasks),
      cashier_signature: signature,
      completion_percentage: getCompletionPercentage(),
      notes,
      status: getCompletionPercentage() === 100 ? 'completed' : 'in_progress'
    });
  };

  const saveVisit = () => {
    if (visitScore === 0) { toast.error('Selecciona una calificación'); return; }
    
    saveVisitMutation.mutate({
      store_id: selectedStore,
      reported_by: currentUser?.full_name || cashierName,
      type: 'quality_visit',
      severity: visitScore >= 80 ? 'low' : visitScore >= 60 ? 'medium' : 'high',
      description: `Visita de calidad - Calificación: ${visitScore}/100. ${visitNotes}`,
      status: 'resolved',
      resolved_date: visitDate
    });
  };

  const addTask = (type) => {
    if (!newTaskLabel.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newTask = { id: newId, label: newTaskLabel, category: 'custom' };
    
    if (type === 'morning') {
      const updated = [...morningTasks, newTask];
      setMorningTasks(updated);
      localStorage.setItem('quality_morning_tasks', JSON.stringify(updated));
    } else if (type === 'closing') {
      const updated = [...closingTasks, newTask];
      setClosingTasks(updated);
      localStorage.setItem('quality_closing_tasks', JSON.stringify(updated));
    } else {
      const updated = [...deepTasks, newTask];
      setDeepTasks(updated);
      localStorage.setItem('quality_deep_tasks', JSON.stringify(updated));
    }
    setNewTaskLabel('');
    toast.success('Tarea agregada');
  };

  const removeTask = (type, taskId) => {
    if (type === 'morning') {
      const updated = morningTasks.filter(t => t.id !== taskId);
      setMorningTasks(updated);
      localStorage.setItem('quality_morning_tasks', JSON.stringify(updated));
    } else if (type === 'closing') {
      const updated = closingTasks.filter(t => t.id !== taskId);
      setClosingTasks(updated);
      localStorage.setItem('quality_closing_tasks', JSON.stringify(updated));
    } else {
      const updated = deepTasks.filter(t => t.id !== taskId);
      setDeepTasks(updated);
      localStorage.setItem('quality_deep_tasks', JSON.stringify(updated));
    }
    toast.success('Tarea eliminada');
  };

  const filteredChecklists = useMemo(() => {
    return checklists.filter(c => {
      const d = new Date(c.date);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [checklists, dateRange]);

  const calendarData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayChecklists = checklists.filter(c => c.date === dayStr);
      return {
        date: day,
        dateStr: dayStr,
        checklists: dayChecklists,
        hasMorning: dayChecklists.some(c => c.type === 'morning'),
        hasClosing: dayChecklists.some(c => c.type === 'closing'),
        avgCompletion: dayChecklists.length > 0 
          ? Math.round(dayChecklists.reduce((a, c) => a + (c.completion_percentage || 0), 0) / dayChecklists.length)
          : 0
      };
    });
  }, [checklists, dateRange]);

  const visitsTrend = useMemo(() => {
    const visits = incidents.filter(i => i.type === 'quality_visit');
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      const monthVisits = visits.filter(v => v.resolved_date?.startsWith(monthStr));
      const avgScore = monthVisits.length > 0
        ? Math.round(monthVisits.reduce((a, v) => {
            const match = v.description?.match(/Calificación: (\d+)/);
            return a + (match ? parseInt(match[1]) : 0);
          }, 0) / monthVisits.length)
        : 0;
      months.push({
        month: format(date, 'MMM', { locale: es }),
        fullMonth: format(date, 'MMMM yyyy', { locale: es }),
        visitas: monthVisits.length,
        calificacion: avgScore
      });
    }
    return months;
  }, [incidents]);

  const stats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = checklists.filter(c => c.date === todayStr);
    const week = filteredChecklists;
    const avgCompletion = week.length > 0 
      ? Math.round(week.reduce((a, c) => a + (c.completion_percentage || 0), 0) / week.length) 
      : 0;
    const openIncidents = incidents.filter(i => i.status === 'open').length;
    
    return { today: today.length, week: week.length, avgCompletion, openIncidents };
  }, [checklists, filteredChecklists, incidents]);

  const alerts = useMemo(() => {
    const list = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayChecklists = checklists.filter(c => c.date === todayStr);
    
    if (!todayChecklists.some(c => c.type === 'morning')) {
      list.push({ type: 'warning', message: '☀️ Aseo de mañana pendiente' });
    }
    if (!todayChecklists.some(c => c.type === 'closing')) {
      list.push({ type: 'info', message: '🌙 Aseo de cierre pendiente' });
    }
    return list;
  }, [checklists]);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-500" />
                Calidad & Aseo
              </h1>
              <p className="text-xs text-gray-500">{selectedStore} - {selectedStoreName}</p>
            </div>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {/* Mensaje motivacional sutil */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-teal-100/60 to-cyan-100/60 text-teal-700 rounded-xl p-2.5 mb-4 text-center text-sm"
        >
          {randomMessage}
        </motion.div>

        {selectedStore ? (
          <>
            {/* Tabs más espaciados */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 h-auto py-2 ${
                      activeTab === tab.id ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white border-0' : 'bg-white/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{tab.label}</span>
                  </Button>
                );
              })}
            </div>

            {(activeTab === 'calendar' || activeTab === 'stats') && (
              <div className="mb-4">
                <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Checklist Tab */}
              {activeTab === 'checklist' && (
                <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Tipo de checklist */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'morning', label: '☀️ Mañana', color: 'from-amber-200 to-orange-200' },
                      { id: 'closing', label: '🌙 Cierre', color: 'from-indigo-200 to-purple-200' },
                      { id: 'deep', label: '✨ Profunda', color: 'from-pink-200 to-rose-200' },
                    ].map((type) => (
                      <Button
                        key={type.id}
                        variant={checklistType === type.id ? 'default' : 'outline'}
                        onClick={() => { setChecklistType(type.id); setTasks({}); }}
                        className={`h-12 ${checklistType === type.id ? `bg-gradient-to-r ${type.color} text-gray-700 border-0` : 'bg-white/80'}`}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>

                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-700">
                        {checklistType === 'morning' && '☀️ Checklist de Mañana'}
                        {checklistType === 'closing' && '🌙 Checklist de Cierre'}
                        {checklistType === 'deep' && '✨ Limpieza Profunda'}
                      </h2>
                      <span className="text-sm font-bold text-teal-600">{getCompletionPercentage()}%</span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getCompletionPercentage()}%` }}
                        className={`h-full rounded-full ${
                          getCompletionPercentage() === 100 ? 'bg-gradient-to-r from-green-300 to-emerald-400' 
                            : 'bg-gradient-to-r from-teal-300 to-cyan-400'
                        }`}
                      />
                    </div>

                    <div className="mb-3">
                      <Input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="Tu nombre" className="bg-gray-50/80 h-10" />
                    </div>

                    {/* Tasks - más compacto */}
                    <div className="space-y-1.5 mb-4 max-h-52 overflow-y-auto">
                      {getCurrentTasks().map((task) => (
                        <div 
                          key={task.id}
                          className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                            tasks[task.id] === 'done' ? 'bg-green-50/80 border border-green-200' :
                            tasks[task.id] === 'pending' ? 'bg-amber-50/80 border border-amber-200' :
                            tasks[task.id] === 'na' ? 'bg-gray-50/80 border border-gray-200' :
                            'bg-white border border-gray-100'
                          }`}
                        >
                          <span className="text-sm text-gray-700">{task.label}</span>
                          <div className="flex gap-1">
                            {['done', 'pending', 'na'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleTaskChange(task.id, status)}
                                className={`text-xs px-2 py-1 rounded transition-all ${
                                  tasks[task.id] === status
                                    ? status === 'done' ? 'bg-green-400 text-white' 
                                      : status === 'pending' ? 'bg-amber-400 text-white' 
                                      : 'bg-gray-400 text-white'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {status === 'done' ? '✓' : status === 'pending' ? '⏳' : 'N/A'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas..." className="bg-gray-50/80 h-16 text-sm" />
                      <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Tu firma..." className="bg-gray-50/80 italic h-16" />
                    </div>

                    <Button onClick={saveChecklist} className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white h-11">
                      <Save className="w-4 h-4 mr-2" /> Guardar Checklist
                    </Button>
                  </Card>

                  {alerts.length > 0 && (
                    <div className="space-y-2">
                      {alerts.map((alert, i) => (
                        <div key={i} className={`p-2.5 rounded-lg flex items-center gap-2 text-sm ${
                          alert.type === 'warning' ? 'bg-amber-50/80 text-amber-700' : 'bg-blue-50/80 text-blue-700'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      Historial
                    </h3>
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400">
                      {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarData.map((day, i) => (
                        <div
                          key={i}
                          className={`p-1.5 rounded-lg text-center text-xs ${
                            day.checklists.length > 0 
                              ? day.avgCompletion === 100 
                                ? 'bg-green-100/80 border border-green-200' 
                                : 'bg-amber-100/80 border border-amber-200'
                              : 'bg-gray-50/80 border border-gray-100'
                          }`}
                        >
                          <p className="font-medium">{format(day.date, 'd')}</p>
                          <div className="flex justify-center gap-0.5">
                            {day.hasMorning && <span className="text-[8px]">☀️</span>}
                            {day.hasClosing && <span className="text-[8px]">🌙</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
                      {filteredChecklists.slice(0, 10).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg text-sm">
                          <div>
                            <p className="font-medium text-gray-700">{c.cashier_name}</p>
                            <p className="text-xs text-gray-400">
                              {c.type === 'morning' ? '☀️' : c.type === 'closing' ? '🌙' : '✨'} {c.date}
                            </p>
                          </div>
                          <span className={`font-bold ${c.completion_percentage === 100 ? 'text-green-500' : 'text-amber-500'}`}>
                            {c.completion_percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Cumplimiento', value: `${stats.avgCompletion}%`, color: 'from-green-200 to-emerald-300', icon: '📊' },
                      { label: 'Semana', value: stats.week, color: 'from-blue-200 to-cyan-300', icon: '📋' },
                      { label: 'Hoy', value: stats.today, color: 'from-amber-200 to-orange-300', icon: '📅' },
                      { label: 'Pendientes', value: stats.openIncidents, color: 'from-red-200 to-rose-300', icon: '⚠️' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-center`}
                      >
                        <p className="text-lg mb-1">{stat.icon}</p>
                        <p className="text-xl font-bold text-gray-700">{stat.value}</p>
                        <p className="text-[10px] text-gray-600">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-3">📈 Tendencia</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={calendarData.filter(d => d.checklists.length > 0).slice(-14)}>
                          <defs>
                            <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey={d => format(d.date, 'dd')} tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} />
                          <Area type="monotone" dataKey="avgCompletion" stroke="#14b8a6" fill="url(#completionGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Visits Tab */}
              {activeTab === 'visits' && (
                <motion.div key="visits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400" />
                      Registrar Visita
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                        <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Calificación</label>
                        <div className="flex gap-1">
                          {[60, 70, 80, 90, 100].map((score) => (
                            <Button
                              key={score}
                              size="sm"
                              variant={visitScore === score ? 'default' : 'outline'}
                              onClick={() => setVisitScore(score)}
                              className={`flex-1 text-xs h-9 ${visitScore === score ? 'bg-amber-400 text-white' : ''}`}
                            >
                              {score}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Observaciones..." className="h-16 mb-3" />
                    <Button onClick={saveVisit} className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white h-10">
                      <Save className="w-4 h-4 mr-2" /> Guardar Visita
                    </Button>
                  </Card>

                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-3">📈 Tendencia de Visitas</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visitsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line yAxisId="left" type="monotone" dataKey="calificacion" stroke="#f59e0b" strokeWidth={2} name="Calif." />
                          <Line yAxisId="right" type="monotone" dataKey="visitas" stroke="#14b8a6" strokeWidth={2} name="Visitas" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Config Tab */}
              {activeTab === 'config' && (
                <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-purple-400" />
                      Configurar Plantillas
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { id: 'morning', label: '☀️ Mañana' },
                        { id: 'closing', label: '🌙 Cierre' },
                        { id: 'deep', label: '✨ Profunda' },
                      ].map((type) => (
                        <Button
                          key={type.id}
                          size="sm"
                          variant={editingType === type.id ? 'default' : 'outline'}
                          onClick={() => setEditingType(type.id)}
                          className={editingType === type.id ? 'bg-purple-400 text-white' : ''}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
                      {(editingType === 'morning' ? morningTasks : editingType === 'closing' ? closingTasks : deepTasks).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50/80 rounded-lg">
                          <span className="text-sm">{task.label}</span>
                          <Button size="sm" variant="ghost" onClick={() => removeTask(editingType, task.id)} className="text-red-400 hover:bg-red-50 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input value={newTaskLabel} onChange={(e) => setNewTaskLabel(e.target.value)} placeholder="Nueva tarea..." className="flex-1" />
                      <Button onClick={() => addTask(editingType)} className="bg-purple-400 text-white">
                        <Plus className="w-4 h-4 mr-1" /> Agregar
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center py-16">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ClipboardCheck className="w-16 h-16 text-teal-200 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para acceder al módulo de Calidad</p>
          </div>
        )}
      </div>
    </div>
  );
}