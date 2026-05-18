import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, DollarSign, Receipt, Zap, Gift, Loader2, Calendar, Sparkles, History, Edit2, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Explosión de confetti de colores Popsy
const PopsyConfetti = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999]">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-full"
        style={{
          left: `${50 + (Math.random() - 0.5) * 20}%`,
          top: '50%',
          background: ['#ec4899', '#f472b6', '#fbbf24', '#a855f7', '#f59e0b', '#fb923c'][i % 6],
          boxShadow: '0 0 10px currentColor'
        }}
        initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [1, 1, 0],
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 600,
          rotate: Math.random() * 720
        }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
          delay: i * 0.02
        }}
      />
    ))}
  </div>
);

export default function DailySalesForm({ storeId, onSuccess }) {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('ventas');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_sales: '',
    total_tickets: '',
    total_transactions: '',
    total_suggested: '',
    total_takeaway: ''
  });

  // Cargar historial de ventas
  const { data: salesHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['dailySalesHistory', storeId],
    queryFn: () => base44.entities.DailySales.filter({ store_id: storeId }, '-date', 30),
    enabled: !!storeId && showHistory,
    staleTime: 60000
  });

  // Calcular ticket promedio automáticamente
  const averageTicket = React.useMemo(() => {
    const sales = parseFloat(formData.total_sales) || 0;
    const transactions = parseInt(formData.total_transactions) || 0;
    if (transactions > 0 && sales > 0) {
      return Math.round(sales / transactions);
    }
    return '';
  }, [formData.total_sales, formData.total_transactions]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const salesValue = parseFloat(data.total_sales) || 0;
      const ticketsValue = parseInt(data.total_tickets) || 0;
      const transactionsValue = parseInt(data.total_transactions) || 0;
      const suggestedValue = parseInt(data.total_suggested) || 0;
      
      const recordData = {
        store_id: storeId,
        date: data.date,
        total_sales: salesValue,
        total_tickets: ticketsValue,
        total_transactions: transactionsValue,
        total_suggested: suggestedValue,
        total_takeaway: parseFloat(data.total_takeaway) || 0
      };
      
      let record;
      let action = 'create';
      if (editingRecord) {
        // Actualizar registro existente
        record = await base44.entities.DailySales.update(editingRecord.id, recordData);
        action = 'update';
      } else {
        // Verificar si ya existe registro para esa fecha
        const existing = await base44.entities.DailySales.filter({ 
          store_id: storeId, 
          date: data.date 
        });
        
        if (existing.length > 0) {
          record = await base44.entities.DailySales.update(existing[0].id, recordData);
          action = 'update';
        } else {
          record = await base44.entities.DailySales.create(recordData);
        }
      }
      
      // Crear log sin requerir autenticación
      try {
        const user = await base44.auth.me();
        await base44.entities.SalesLog.create({
          store_id: storeId,
          record_type: 'daily_sales',
          record_id: record.id,
          action,
          user_email: user.email,
          sales_amount: salesValue,
          action_date: data.date,
          details: JSON.stringify({ total_transactions: transactionsValue })
        });
      } catch (logError) {
        console.warn('No se pudo crear el log:', logError);
      }
      
      return record;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries que usan ventas diarias en toda la app
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
      queryClient.invalidateQueries({ queryKey: ['dailySalesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allDailySales'] });
      queryClient.invalidateQueries({ queryKey: ['genesis_sales'] });
      queryClient.invalidateQueries({ queryKey: ['salesLogs'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dailyBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['gerenteHomeSales'] });
      
      toast.success(editingRecord ? '¡Venta actualizada!' : '¡Venta registrada!');
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setEditingRecord(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          total_sales: '',
          total_tickets: '',
          total_transactions: '',
          total_suggested: '',
          total_takeaway: ''
        });
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error) => {
      toast.error('Error al guardar: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailySales.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySales'] });
      queryClient.invalidateQueries({ queryKey: ['dailySalesHistory'] });
      toast.success('Venta eliminada');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeTab === 'ventas' && !formData.total_sales) {
      toast.error('Ingresa las ventas');
      return;
    }
    
    if (!storeId) {
      toast.error('No se ha seleccionado tienda');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      total_sales: record.total_sales?.toString() || '',
      total_tickets: record.total_tickets?.toString() || '',
      total_transactions: record.total_transactions?.toString() || '',
      total_suggested: record.total_suggested?.toString() || '',
      total_takeaway: record.total_takeaway?.toString() || ''
    });
    setShowHistory(false);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar este registro de ventas?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSuccess && (
          <>
            <PopsyConfetti />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-amber-500/20 backdrop-blur-sm z-[9998]"
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                    y: [0, -30, -20, -25, -15, -10, -5, 0],
                    scale: [1, 1.2, 1.1, 1.15, 1.05, 1.1, 1, 1]
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <motion.svg viewBox="0 0 80 120" className="w-32 h-40 drop-shadow-2xl">
                    {/* Cono animado */}
                    <motion.polygon 
                      points="20,45 40,110 60,45" 
                      fill="url(#dailySalesPopsyCone)"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'center top' }}
                    />
                    {/* Patrón del cono */}
                    <motion.path d="M 25 55 L 55 55 M 27 65 L 53 65 M 29 75 L 51 75 M 31 85 L 49 85 M 33 95 L 47 95" 
                      stroke="#d97706" strokeWidth="1.5" opacity="0.3"
                      initial={{ pathLength: 0 }} 
                      animate={{ pathLength: 1 }} 
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />

                    {/* Helado rosa vibrante */}
                    <motion.circle 
                      cx="40" cy="28" r="24" 
                      fill="url(#dailySalesPopsyIce)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                    />

                    {/* Chispitas de colores */}
                    {[...Array(12)].map((_, i) => (
                      <motion.circle
                        key={i}
                        cx={30 + Math.cos(i * 30 * Math.PI / 180) * 15}
                        cy={25 + Math.sin(i * 30 * Math.PI / 180) * 15}
                        r="2"
                        fill={['#fbbf24', '#ec4899', '#a855f7', '#f472b6'][i % 4]}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
                        transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
                      />
                    ))}

                    {/* Brillo mágico */}
                    <motion.ellipse 
                      cx="32" cy="20" rx="10" ry="6" 
                      fill="white" opacity="0.6"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />

                    <defs>
                      <linearGradient id="dailySalesPopsyIce" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                      <linearGradient id="dailySalesPopsyCone" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.5 }}
                  className="mt-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xl font-black">¡Súper guardado!</span>
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Tabs */}
        <div className="flex gap-1 p-3 pb-0">
          {[
            { id: 'ventas', label: 'Ventas', color: '#10b981' },
            { id: 'llevar', label: '🛍 Llevar', color: '#8b5cf6' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                color: activeTab === tab.id ? tab.color : '#9ca3af',
                border: `1.5px solid ${activeTab === tab.id ? `${tab.color}30` : 'transparent'}`
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Fecha */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[20px] p-5 shadow-md border border-amber-100 hover:shadow-lg transition-all"
          >
            <Label className="text-amber-700 flex items-center gap-3 mb-3 text-base font-bold">
              <div className="w-10 h-10 bg-amber-200/60 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              Fecha
            </Label>
            <Input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="border-2 border-amber-200 focus:border-amber-400 bg-white rounded-xl text-base font-semibold h-12 focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </motion.div>

          {/* Grid de métricas — solo en pestaña ventas */}
          {activeTab === 'llevar' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[20px] p-5 shadow-md border border-violet-100"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-violet-700">
                <div className="w-10 h-10 bg-violet-200/60 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-violet-600" />
                </div>
                Venta Producto para Llevar
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.total_takeaway}
                onChange={(e) => setFormData({...formData, total_takeaway: e.target.value})}
                className="border-2 border-violet-200 focus:border-violet-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-violet-200 transition-all"
              />
              <p className="text-xs text-violet-400 font-medium mt-2">
                Ingresa el total vendido en producto para llevar del día
              </p>
            </motion.div>
          )}

          {activeTab === 'ventas' && <div className="grid grid-cols-2 gap-5">
            {/* Ventas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-[20px] p-5 shadow-md border border-emerald-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-emerald-700">
                <div className="w-10 h-10 bg-emerald-200/60 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                Ventas
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_sales}
                onChange={(e) => setFormData({...formData, total_sales: e.target.value})}
                className="border-2 border-emerald-200 focus:border-emerald-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </motion.div>

            {/* Tickets */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-[20px] p-5 shadow-md border border-sky-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-sky-700">
                <div className="w-10 h-10 bg-sky-200/60 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-sky-600" />
                </div>
                Ticket Promedio
              </Label>
              <div className="relative">
                <Input 
                  type="text"
                  placeholder="Calculado automáticamente"
                  value={averageTicket ? `$${averageTicket.toLocaleString('es-CO')}` : ''}
                  readOnly
                  className="border-2 border-sky-200 bg-sky-50/50 rounded-xl text-lg font-bold h-12 text-sky-700 cursor-default"
                />
                {averageTicket && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Transacciones */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-[20px] p-5 shadow-md border border-violet-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-violet-700">
                <div className="w-10 h-10 bg-violet-200/60 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-violet-600" />
                </div>
                Transacciones
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_transactions}
                onChange={(e) => setFormData({...formData, total_transactions: e.target.value})}
                className="border-2 border-violet-200 focus:border-violet-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-violet-200 transition-all"
              />
            </motion.div>

            {/* Sugeridos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[20px] p-5 shadow-md border border-pink-100 hover:shadow-lg transition-all"
            >
              <Label className="flex items-center gap-3 mb-3 text-base font-bold text-pink-700">
                <div className="w-10 h-10 bg-pink-200/60 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-pink-600" />
                </div>
                Sugeridos
              </Label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.total_suggested}
                onChange={(e) => setFormData({...formData, total_suggested: e.target.value})}
                className="border-2 border-pink-200 focus:border-pink-400 bg-white rounded-xl text-lg font-bold h-12 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </motion.div>
          </div>}

          {/* Botones */}
          <div className="flex gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:via-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl py-7 text-lg font-bold rounded-[20px] transition-all"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center justify-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-6 h-6" />
                    </motion.div>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Save className="w-6 h-6" />
                    {editingRecord ? 'Actualizar' : 'Guardar'}
                  </span>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl py-7 px-6 text-lg font-bold rounded-[20px] transition-all"
              >
                <History className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>

          {editingRecord && (
            <Button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  total_sales: '',
                  total_tickets: '',
                  total_transactions: '',
                  total_suggested: '',
                  total_takeaway: ''
                });
              }}
              variant="outline"
              className="w-full"
            >
              Cancelar edición
            </Button>
          )}
        </form>

        {/* Historial */}
        {showHistory && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Historial de Ventas
            </h3>
            {loadingHistory ? (
              <p className="text-gray-400 text-center py-4">Cargando...</p>
            ) : salesHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No hay registros</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {salesHistory.map((record) => (
                  <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex-1">
                      <p className="font-bold text-gray-700">{format(new Date(record.date), 'dd MMM yyyy', { locale: es })}</p>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>💰 ${record.total_sales?.toLocaleString('es-CO')}</span>
                        <span>🎫 {record.total_transactions}</span>
                        <span>✨ {record.total_suggested}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}