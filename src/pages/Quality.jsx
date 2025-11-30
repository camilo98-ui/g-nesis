import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Sun, Moon, Sparkles, ClipboardCheck, Camera, 
  CheckCircle, AlertTriangle, BarChart3, Bell, Calendar,
  Upload, Pen, Save, X, ChevronRight, Clock, User, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MORNING_TASKS = [
  { id: 'm1', label: 'Limpieza de vitrinas', category: 'limpieza' },
  { id: 'm2', label: 'Barra de servicio desinfectada', category: 'limpieza' },
  { id: 'm3', label: 'Cubetas limpias y organizadas', category: 'equipos' },
  { id: 'm4', label: 'Lavamanos funcionando y limpio', category: 'higiene' },
  { id: 'm5', label: 'Implementos de aseo disponibles', category: 'insumos' },
  { id: 'm6', label: 'Uniforme completo y limpio', category: 'presentacion' },
  { id: 'm7', label: 'Nevera en buen estado', category: 'equipos' },
  { id: 'm8', label: 'Insumos de servicio limpios', category: 'insumos' },
  { id: 'm9', label: 'Señalización visible', category: 'presentacion' },
  { id: 'm10', label: 'Área externa barrida', category: 'limpieza' },
];

const CLOSING_TASKS = [
  { id: 'c1', label: 'Lavado de utensilios', category: 'limpieza' },
  { id: 'c2', label: 'Superficies desinfectadas', category: 'limpieza' },
  { id: 'c3', label: 'Residuos retirados', category: 'limpieza' },
  { id: 'c4', label: 'Bolsas de basura reemplazadas', category: 'limpieza' },
  { id: 'c5', label: 'Paredes y piso limpios', category: 'limpieza' },
  { id: 'c6', label: 'Inventario revisado', category: 'inventario' },
  { id: 'c7', label: 'Punto de venta seguro', category: 'seguridad' },
  { id: 'c8', label: 'Equipos apagados', category: 'equipos' },
  { id: 'c9', label: 'Nevera cerrada correctamente', category: 'equipos' },
  { id: 'c10', label: 'Caja cuadrada', category: 'caja' },
];

const DEEP_TASKS = [
  { id: 'd1', label: 'Lavado pared a pared', category: 'profundo' },
  { id: 'd2', label: 'Filtros de máquinas limpiados', category: 'equipos' },
  { id: 'd3', label: 'Revisión de equipos', category: 'equipos' },
  { id: 'd4', label: 'Nevera completa desinfectada', category: 'profundo' },
  { id: 'd5', label: 'Cristales sin manchas', category: 'limpieza' },
  { id: 'd6', label: 'Señalización revisada', category: 'presentacion' },
  { id: 'd7', label: 'Revisión de plagas', category: 'seguridad' },
  { id: 'd8', label: 'Desagües limpios', category: 'profundo' },
];

const TABS = [
  { id: 'morning', label: 'Aseo Mañana', icon: Sun, color: 'text-amber-500' },
  { id: 'closing', label: 'Aseo Cierre', icon: Moon, color: 'text-indigo-500' },
  { id: 'deep', label: 'Limpieza Profunda', icon: Sparkles, color: 'text-purple-500' },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3, color: 'text-green-500' },
  { id: 'alerts', label: 'Alertas', icon: Bell, color: 'text-red-500' },
];

export default function Quality() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState('');
  const [activeTab, setActiveTab] = useState('morning');
  const [tasks, setTasks] = useState({});
  const [cashierName, setCashierName] = useState('');
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
    base44.auth.me().then(u => {
      setCurrentUser(u);
      setCashierName(u?.full_name || '');
    }).catch(() => {});
  }, []);

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selectedStore],
    queryFn: () => base44.entities.CleaningChecklist.filter({ store_id: selectedStore }, '-created_date', 50),
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
      toast.success('✅ Checklist guardado correctamente');
      setTasks({});
      setNotes('');
      setSignature('');
    }
  });

  const getCurrentTasks = () => {
    if (activeTab === 'morning') return MORNING_TASKS;
    if (activeTab === 'closing') return CLOSING_TASKS;
    if (activeTab === 'deep') return DEEP_TASKS;
    return [];
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
    if (!cashierName.trim()) {
      toast.error('Ingresa tu nombre');
      return;
    }
    if (!signature.trim()) {
      toast.error('Ingresa tu firma');
      return;
    }

    const type = activeTab === 'morning' ? 'morning' : activeTab === 'closing' ? 'closing' : 'deep_weekly';
    
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

  // Stats calculations
  const todayChecklists = checklists.filter(c => c.date === format(new Date(), 'yyyy-MM-dd'));
  const weekChecklists = checklists.filter(c => {
    const d = new Date(c.date);
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    return d >= weekAgo;
  });
  const avgCompletion = weekChecklists.length > 0 
    ? Math.round(weekChecklists.reduce((a, c) => a + (c.completion_percentage || 0), 0) / weekChecklists.length) 
    : 0;
  const openIncidents = incidents.filter(i => i.status === 'open').length;

  // Alerts
  const alerts = [];
  if (todayChecklists.filter(c => c.type === 'morning').length === 0) {
    alerts.push({ type: 'warning', message: 'No se ha completado el aseo de mañana hoy' });
  }
  if (openIncidents > 0) {
    alerts.push({ type: 'error', message: `Hay ${openIncidents} incidencias de calidad sin resolver` });
  }
  const unsignedChecklists = checklists.filter(c => !c.supervisor_signature && c.status === 'completed').length;
  if (unsignedChecklists > 0) {
    alerts.push({ type: 'warning', message: `${unsignedChecklists} checklists sin firma del supervisor` });
  }

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-teal-600" />
              Calidad & Aseo
            </h1>
            <p className="text-sm text-gray-500">{selectedStore} - {selectedStoreName}</p>
          </div>
          <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
        </div>

        {selectedStore ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-teal-600 text-white' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {(activeTab === 'morning' || activeTab === 'closing' || activeTab === 'deep') && (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800">
                        {activeTab === 'morning' && '☀️ Checklist de Mañana'}
                        {activeTab === 'closing' && '🌙 Checklist de Cierre'}
                        {activeTab === 'deep' && '✨ Limpieza Profunda'}
                      </h2>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{format(new Date(), "d 'de' MMMM", { locale: es })}</p>
                        <p className="text-xs text-teal-600 font-medium">{getCompletionPercentage()}% completado</p>
                      </div>
                    </div>

                    <Progress value={getCompletionPercentage()} className="mb-6 h-2" />

                    {/* Cashier Name */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del Cajero</label>
                      <Input 
                        value={cashierName} 
                        onChange={(e) => setCashierName(e.target.value)} 
                        placeholder="Tu nombre completo"
                        className="bg-gray-50"
                      />
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3 mb-6">
                      {getCurrentTasks().map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{task.label}</span>
                          <div className="flex gap-2">
                            {['done', 'pending', 'na'].map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={tasks[task.id] === status ? 'default' : 'outline'}
                                onClick={() => handleTaskChange(task.id, status)}
                                className={`text-xs px-2 py-1 h-7 ${
                                  tasks[task.id] === status
                                    ? status === 'done' ? 'bg-green-500' : status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                                    : ''
                                }`}
                              >
                                {status === 'done' ? '✓ Hecho' : status === 'pending' ? '⏳ Pendiente' : 'N/A'}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Notas adicionales</label>
                      <Textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Observaciones..."
                        className="bg-gray-50"
                      />
                    </div>

                    {/* Signature */}
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Firma Digital (escribe tu nombre)</label>
                      <Input 
                        value={signature} 
                        onChange={(e) => setSignature(e.target.value)} 
                        placeholder="Tu firma..."
                        className="bg-gray-50 font-cursive italic"
                      />
                    </div>

                    <Button onClick={saveChecklist} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Checklist
                    </Button>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-100">
                      <p className="text-3xl font-bold text-green-700">{avgCompletion}%</p>
                      <p className="text-xs text-green-600">Cumplimiento Semanal</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100">
                      <p className="text-3xl font-bold text-blue-700">{weekChecklists.length}</p>
                      <p className="text-xs text-blue-600">Checklists esta semana</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-yellow-100">
                      <p className="text-3xl font-bold text-amber-700">{todayChecklists.length}</p>
                      <p className="text-xs text-amber-600">Checklists hoy</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-100">
                      <p className="text-3xl font-bold text-red-700">{openIncidents}</p>
                      <p className="text-xs text-red-600">Incidencias abiertas</p>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h3 className="font-bold mb-4">Historial de Checklists</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {checklists.slice(0, 20).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{c.cashier_name}</p>
                            <p className="text-xs text-gray-500">
                              {c.type === 'morning' ? '☀️ Mañana' : c.type === 'closing' ? '🌙 Cierre' : '✨ Profunda'}
                              {' • '}{c.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${c.completion_percentage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                              {c.completion_percentage}%
                            </p>
                            {c.supervisor_signature && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div key="alerts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-red-500" />
                      Alertas Activas
                    </h2>
                    
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                        <p>¡Todo en orden! No hay alertas pendientes.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert, i) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-lg flex items-center gap-3 ${
                              alert.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                            }`}
                          >
                            <AlertTriangle className={`w-5 h-5 ${alert.type === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                            <p className={`text-sm ${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                              {alert.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center py-16">
            <ClipboardCheck className="w-16 h-16 text-teal-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-400">Para acceder al módulo de Calidad & Aseo</p>
          </div>
        )}
      </div>
    </div>
  );
}