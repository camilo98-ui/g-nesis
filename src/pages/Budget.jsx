import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import BudgetForm from '@/components/forms/BudgetForm';
import {
  ArrowLeft, Target, DollarSign, Receipt, Zap, Gift, Calendar,
  Pencil, Trash2, Search, TrendingUp, Sparkles, ChevronRight,
  LayoutGrid, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ACCENT = '#e879f9';
const BLUE   = '#818cf8';
const GREEN  = '#34d399';

/* ── Glassmorphism token ── */
const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

/* ── Budget metric row ── */
function MetricRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2.5 group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      </div>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}

/* ── Budget card ── */
function BudgetCard({ budget, isCurrent, index, onEdit, onDelete, formatCurrency }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 26 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl p-5 cursor-default overflow-hidden"
      style={{
        ...glass,
        boxShadow: hovered
          ? `0 0 0 1px ${isCurrent ? ACCENT + '50' : 'rgba(255,255,255,0.12)'}, 0 16px 40px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.25)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Ambient glow on hover */}
      {isCurrent && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at top left, ${ACCENT}10 0%, transparent 60%)` }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: isCurrent ? `linear-gradient(135deg, ${ACCENT}40, ${BLUE}30)` : 'rgba(255,255,255,0.07)' }}>
            <Calendar className="w-4 h-4" style={{ color: isCurrent ? ACCENT : 'rgba(255,255,255,0.4)' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">
              {MONTHS[budget.month - 1]} {budget.year}
            </p>
            {isCurrent && (
              <span className="text-[10px] font-semibold mt-0.5 inline-block"
                style={{ color: ACCENT }}>● Mes activo</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(budget)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Pencil className="w-3 h-3 text-indigo-400" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(budget)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <Trash2 className="w-3 h-3 text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <MetricRow icon={DollarSign} label="Ventas" value={formatCurrency(budget.sales_budget)} color={GREEN} />
        <MetricRow icon={Receipt} label="Ticket Promedio" value={formatCurrency(budget.tickets_budget)} color={BLUE} />
        <MetricRow icon={Zap} label="Transacciones" value={(budget.transactions_budget || 0).toLocaleString('es-CO')} color={ACCENT} />
        <MetricRow icon={Gift} label="Sugeridos" value={(budget.suggested_budget || 0).toLocaleString('es-CO')} color="#fb923c" />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════
   MAIN PAGE
══════════════════════════════════ */
export default function Budget() {
  const [selectedStore, setSelectedStore] = useState('');
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: async () => {
      let results = await base44.entities.Budget.filter({ store_id: selectedStore });
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.Budget.filter({ store_id: oldCode });
      }
      return results;
    },
    enabled: !!selectedStore
  });

  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['dailyBudgets', selectedStore],
    queryFn: async () => {
      let results = await base44.entities.DailyBudget.filter({ store_id: selectedStore });
      if (results.length === 0 && selectedStore.startsWith('BTA')) {
        const oldCode = selectedStore.replace('BTA', 'BOGOTA');
        results = await base44.entities.DailyBudget.filter({ store_id: oldCode });
      }
      return results;
    },
    enabled: !!selectedStore
  });

  const selectedDailyBudget = dailyBudgets.find(db => {
    const dbDate = db.date?.split('T')[0] || db.date;
    return dbDate === selectedDate;
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleDelete = async (budget) => {
    if (confirm(`¿Eliminar presupuesto de ${MONTHS[budget.month - 1]} ${budget.year}?`)) {
      await base44.entities.Budget.delete(budget.id);
      queryClient.invalidateQueries(['budgets']);
      toast.success('Presupuesto eliminado');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#080810' }}>

      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-4">
            <Link to="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ ...glass, border: '1px solid rgba(255,255,255,0.1)' }}>
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </motion.div>
            </Link>
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Popsy</span>
                <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span className="text-[11px] font-semibold" style={{ color: ACCENT }}>Presupuestos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                Presupuestos
              </h1>
              {selectedStore && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {selectedStore} · {selectedStoreName}
                </p>
              )}
            </div>
          </div>

          {/* Store selector pill */}
          <div className="flex-shrink-0">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedStore ? (
            /* ── Empty state ── */
            <motion.div key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                style={{ background: `linear-gradient(135deg, ${ACCENT}30, ${BLUE}20)`, border: `1px solid ${ACCENT}30`, boxShadow: `0 0 60px ${ACCENT}25` }}>
                🎯
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-bold text-white mb-1">Selecciona una tienda</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Para ver y configurar presupuestos mensuales</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8">

              {/* ── DAILY PPT LOOKUP ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl p-5" style={{ ...glass, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}40, ${BLUE}30)` }}>
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Consultar PPT del día</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Presupuesto diario por fecha</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <AnimatePresence mode="wait">
                      {selectedDailyBudget ? (
                        <motion.div key="found"
                          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                          style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}30` }}>
                          <DollarSign className="w-4 h-4" style={{ color: GREEN }} />
                          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>PPT del día:</span>
                          <span className="text-sm font-black" style={{ color: GREEN }}>
                            {formatCurrency(selectedDailyBudget.budget_amount || 0)}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.p key="notfound"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs italic" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          Sin presupuesto diario para esta fecha
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* ── MAIN GRID: Form + Budgets ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Budget Form */}
                <BudgetForm
                  storeId={selectedStore}
                  editingBudget={editingBudget}
                  onClearEdit={() => setEditingBudget(null)}
                />

                {/* Budgets list */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="rounded-2xl overflow-hidden" style={{ ...glass, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                    {/* Panel header */}
                    <div className="px-5 py-4 flex items-center gap-3"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.3)' }}>
                        <LayoutGrid className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">Presupuestos Configurados</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sortedBudgets.length} períodos</p>
                      </div>
                    </div>

                    <div className="p-4 max-h-[580px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                      {isLoading ? (
                        <div className="flex flex-col gap-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-2xl h-32 animate-pulse"
                              style={{ background: 'rgba(255,255,255,0.04)' }} />
                          ))}
                        </div>
                      ) : sortedBudgets.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {sortedBudgets.map((budget, index) => {
                            const isCurrent = budget.month === currentMonth && budget.year === currentYear;
                            return (
                              <BudgetCard
                                key={budget.id}
                                budget={budget}
                                isCurrent={isCurrent}
                                index={index}
                                onEdit={setEditingBudget}
                                onDelete={handleDelete}
                                formatCurrency={formatCurrency}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Target className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white/40">Sin presupuestos</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Configura el primer presupuesto</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}