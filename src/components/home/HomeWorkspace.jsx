import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, TrendingUp, Activity, Award, Target, Bell,
  Download, FileText, Lock, Receipt, Snowflake, Settings as SettingsIcon,
  CalendarDays, LogOut, Sparkles, Trophy, FileSpreadsheet, BarChart3, Clock,
  ChevronRight, Zap, ShieldCheck, BarChart2, Star, AlertCircle,
  ArrowUpRight, ArrowDownRight, Minus, MessageSquare, Brain,
  Sun, Moon, Coffee, Send, Cpu, TrendingDown
} from 'lucide-react';
import { STORES } from '@/components/StoreSelector';
import StoreSelector from '@/components/StoreSelector';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', icon: Sun, color: '#f59e0b' };
  if (h < 18) return { text: 'Buenas tardes', icon: Coffee, color: '#C21875' };
  return { text: 'Buenas noches', icon: Moon, color: '#A855F7' };
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tienda',        path: 'Dashboard',          color: '#E91E63', roles: ['lider','embajador','gerente'] },
  { icon: TrendingUp,      label: 'P&G',           path: 'PYGDashboard',       color: '#059669', roles: ['gerente'] },
  { icon: TrendingUp,      label: 'P&G Tienda',    path: null,                 color: '#059669', onClick: 'onShowPYGModal', roles: ['lider','embajador'] },
  { icon: FileText,        label: 'Informe',        path: 'SalesReportView',    color: '#6366f1', roles: ['lider','embajador','gerente'] },
  { icon: Clock,           label: 'Txn por hora',  path: 'HourlyTransactions', color: '#8b5cf6', roles: ['lider','embajador','gerente'] },
  { icon: BarChart3,       label: 'Participación', path: 'SalesReportView',    color: '#f59e0b', roles: ['lider','embajador','gerente'] },
  { icon: Snowflake,       label: 'Mapa Nevera',   path: 'FreezerMap',         color: '#06b6d4', roles: ['lider','embajador','gerente'] },
];

// Mini sparkline path generator
function generateSparkline(points, width = 80, height = 28) {
  if (!points || points.length < 2) return '';
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  return points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * height;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function MiniChart({ data, color, positive }) {
  const path = generateSparkline(data, 72, 26);
  return (
    <svg width="72" height="26" className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + ` V 26 H 0 Z`} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KPICard({ label, value, change, icon: Icon, color, chartData, delay = 0 }) {
  const isPos = change > 0;
  const isNeutral = change === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl p-3 lg:p-4 cursor-default"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: `0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.7), 0 8px 32px ${color}0a`,
      }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: color, opacity: 0.12 }} />

      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon style={{ color, width: 15, height: 15 }} />
        </div>
        <div className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
          isNeutral ? 'bg-slate-100/80 text-slate-400' :
          isPos ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
          {isNeutral ? <Minus className="w-2.5 h-2.5" /> :
           isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {Math.abs(change)}%
        </div>
      </div>

      <p className="text-xs font-medium text-slate-400 mb-0.5 tracking-wide">{label}</p>
      <p className="text-xl font-black text-slate-800 leading-none mb-2">{value}</p>

      {/* Mini chart */}
      <div className="opacity-80">
        <MiniChart data={chartData || [3,5,4,7,6,8,7,9]} color={color} positive={isPos} />
      </div>
    </motion.div>
  );
}

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
      style={isActive ? {
        background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
        border: `1px solid ${item.color}25`,
      } : { background: 'transparent', border: '1px solid transparent' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={isActive
          ? { background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`, boxShadow: `0 3px 10px ${item.color}40` }
          : { background: 'rgba(0,0,0,0.03)' }}>
        <Icon style={{ color: isActive ? 'white' : '#94a3b8', width: 14, height: 14 }} />
      </div>
      <span className="text-xs font-semibold flex-1 truncate"
        style={{ color: isActive ? item.color : '#94a3b8' }}>
        {item.label}
      </span>
      {isActive && <div className="w-1 h-4 rounded-full" style={{ background: item.color }} />}
    </motion.button>
  );
}

// AI Chat message
function ChatMessage({ msg, index }) {
  const isNova = msg.role === 'nova';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`flex gap-2.5 ${isNova ? '' : 'flex-row-reverse'}`}
    >
      {isNova && (
        <div className="w-6 h-6 rounded-xl overflow-hidden flex-shrink-0 mt-0.5"
          style={{ border: '1.5px solid rgba(194,24,117,0.25)', boxShadow: '0 2px 8px rgba(194,24,117,0.15)' }}>
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
        isNova
          ? 'rounded-tl-sm text-slate-700'
          : 'rounded-tr-sm text-white'
      }`}
        style={isNova
          ? { background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }
          : { background: 'linear-gradient(135deg, #C21875, #A855F7)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }
        }>
        {msg.text}
      </div>
    </motion.div>
  );
}

// Quick action chip for AI panel
function AIChip({ label, icon: Icon, onClick, color = '#C21875' }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.8)',
        border: `1px solid ${color}25`,
        color: color,
        boxShadow: `0 2px 8px ${color}12`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </motion.button>
  );
}

const INITIAL_MESSAGES = [
  { role: 'nova', text: '¡Hola! Soy Nova, tu copiloto de operaciones Popsy. ¿En qué te puedo ayudar hoy?' }
];

const QUICK_ACTIONS = [
  { label: 'Ventas hoy',        icon: TrendingUp,   color: '#C21875', prompt: 'Muéstrame el resumen de ventas de hoy' },
  { label: 'Top cajeros',       icon: Users,         color: '#A855F7', prompt: 'Cuáles son los cajeros con mejor rendimiento?' },
  { label: 'Comparar ayer',     icon: BarChart2,     color: '#6366f1', prompt: 'Compara las ventas de hoy vs ayer' },
  { label: 'Stock crítico',     icon: AlertCircle,   color: '#f59e0b', prompt: 'Qué productos tienen stock crítico en la nevera?' },
  { label: 'Insights',          icon: Brain,         color: '#10b981', prompt: 'Dame los insights más importantes de esta semana' },
  { label: 'Alertas',           icon: Bell,          color: '#ef4444', prompt: 'Hay alguna alerta operacional que deba saber?' },
];

const AI_RESPONSES = {
  'Muéstrame el resumen de ventas de hoy': '📊 Hoy llevan **$4.2M** en ventas, con 87 transacciones y ticket promedio de **$48K**. Estás un **+12%** sobre ayer. ¡Buen ritmo!',
  'Cuáles son los cajeros con mejor rendimiento?': '🏆 Top 3 hoy:\n1. **María García** — $1.1M · 23 txn\n2. **Juan Pérez** — $980K · 21 txn\n3. **Ana López** — $890K · 19 txn',
  'Compara las ventas de hoy vs ayer': '📈 Hoy: **$4.2M** | Ayer: **$3.75M**\nDiferencia: **+$450K (+12%)**\nLas horas pico fueron 12pm–2pm con mayor tráfico.',
  'Qué productos tienen stock crítico en la nevera?': '⚠️ **2 sabores en crítico:**\n• Arequipe Doble — Solo 8% restante\n• Fresa con Crema — 15% restante\nSe recomienda reposición hoy.',
  'Dame los insights más importantes de esta semana': '✨ **Top insights:**\n• Combos aumentaron ticket promedio +18%\n• Horario pico se extendió 30min vs sem. anterior\n• Cajero Caja 3 tiene 94% de satisfacción',
  'Hay alguna alerta operacional que deba saber?': '🔔 **3 alertas activas:**\n• Stock crítico en 2 sabores\n• Caja 2: conversión -8% esta semana\n• Turno tarde con 1 cajero menos de lo planificado',
};

export default function HomeWorkspace({
  selectedStore, selectedRole, selectedStoreName,
  onLogout, onStoreChange,
  onShowReport, onShowStoreSales, onShowBudgetDashboard,
  onShowBudgetImporter, onShowKpisUploader, onShowAggregatorsUploader,
  onShowPYGUploader, onShowPYGModal, onShowExperiencia, onShowCustomerExperience,
  backupLoading, onBackup,
}) {
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const storeName = selectedStoreName || STORES.find(s => s.code === selectedStore)?.name || 'Tu Tienda';
  const isGerente = selectedRole === 'gerente';

  const { data: todaySales = [] } = useQuery({
    queryKey: ['home-today-sales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000,
  });
  const { data: budget = [] } = useQuery({
    queryKey: ['home-budget', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000,
  });
  const { data: cashiers = [] } = useQuery({
    queryKey: ['home-cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore, is_active: true }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000,
  });

  const sorted = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const prev = sorted[1];
  const salesVal = latest?.total_sales ? `$${(latest.total_sales / 1000000).toFixed(1)}M` : '—';
  const txnVal = latest?.total_transactions ? String(latest.total_transactions) : '—';
  const ticketVal = latest?.total_sales && latest?.total_transactions
    ? `$${Math.round(latest.total_sales / latest.total_transactions / 1000)}K` : '—';
  const salesChange = latest && prev
    ? Math.round(((latest.total_sales - prev.total_sales) / prev.total_sales) * 100) : 0;

  // Build sparkline data from history
  const sparkSales = sorted.slice(0, 8).reverse().map(d => d.total_sales || 0);
  const sparkTxn   = sorted.slice(0, 8).reverse().map(d => d.total_transactions || 0);

  const filteredNav = NAV_ITEMS.filter(n => n.roles.includes(selectedRole));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    setTimeout(() => {
      const reply = AI_RESPONSES[text.trim()] ||
        `Entendido. Revisando datos de ${storeName || 'tu tienda'} para responder sobre: "${text.trim()}"... Dame un momento. 🔍`;
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'nova', text: reply }]);
    }, 1200 + Math.random() * 600);
  }

  const QUICK_MODULES = [
    { icon: LayoutDashboard, label: 'Dashboard',   sublabel: 'Ventas',       color: '#E91E63', path: 'Dashboard' },
    { icon: Users,           label: 'Cajeros',     sublabel: 'Equipo',       color: '#A855F7', path: 'CashiersDashboard' },
    { icon: Target,          label: 'Presupuesto', sublabel: 'Metas',        color: '#10b981', path: 'Budget' },
    { icon: Snowflake,       label: 'Nevera',      sublabel: 'Inventario',   color: '#06b6d4', path: 'FreezerMap' },
    { icon: Clock,           label: 'Horarios',    sublabel: 'Txn/hora',     color: '#8b5cf6', path: 'HourlyTransactions' },
    { icon: BarChart3,       label: 'Rankings',    sublabel: 'Top performers',color: '#f59e0b', path: 'Rankings' },
  ];

  return (
    <div className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg, #FAFAFE 0%, #FFFFFF 50%, #F9F6FF 100%)' }}>

      {/* ── LEFT SIDEBAR ── */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="hidden lg:flex flex-col w-56 min-h-screen flex-shrink-0 sticky top-0 z-20"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(32px)',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '1px 0 24px rgba(0,0,0,0.03)',
        }}
      >
        <div className="px-4 pt-5 pb-3">
          <img src={LOGO_URL} alt="Popsy" className="h-9 object-contain mb-4" />
          {!isGerente && selectedStore && (
            <div className="px-2.5 py-2 rounded-xl mb-1"
              style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.06), rgba(168,85,247,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                  style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                <span className="text-[11px] font-bold text-slate-600 truncate">{storeName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 px-2.5 space-y-0.5 overflow-y-auto py-1">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] px-3 mb-2">Módulos</p>
          {filteredNav.map(item => {
            const handleClick = () => {
              if (!item.path) {
                // Modal actions
                if (item.onClick === 'onShowPYGModal') onShowPYGModal?.();
                return;
              }
              setActiveNav(item.path);
              window.location.href = `/${item.path}`;
            };
            return (
              <NavItem key={item.label} item={item} isActive={activeNav === item.path}
                onClick={handleClick} />
            );
          })}
        </div>

        <div className="p-3">
          {/* Nova mini card in sidebar */}
          <div className="rounded-2xl p-3 mb-2"
            style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.06), rgba(168,85,247,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: '0 3px 12px rgba(194,24,117,0.25)', border: '1.5px solid rgba(194,24,117,0.2)' }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-700">Nova AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <p className="text-[9px] text-slate-400">Copiloto activo</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-red-50/60 transition-all">
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex overflow-hidden" style={{ height: '100vh' }}>

          {/* CENTER CONTENT — scrollable */}
          <div className="flex-1 min-w-0 overflow-y-auto p-3 lg:p-6">

            {/* TOP BAR */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5"
            >
              {/* Greeting row */}
              <div className="flex items-center gap-2 mb-1">
                <GreetIcon className="w-4 h-4 flex-shrink-0" style={{ color: greeting.color }} />
                <h1 className="text-base lg:text-lg font-black text-slate-800 truncate">
                  {greeting.text}
                </h1>
                {isGerente && (
                  <div className="hidden sm:flex items-center gap-1.5 ml-auto">
                    {[
                      { label: 'PPT', icon: FileSpreadsheet, onClick: onShowBudgetImporter, color: '#10b981' },
                      { label: 'KPIs', icon: BarChart3, onClick: onShowKpisUploader, color: '#6366f1' },
                      { label: 'P&G', icon: TrendingUp, onClick: onShowPYGUploader, color: '#059669' },
                    ].map(({ label, icon: I, onClick, color }) => (
                      <button key={label} onClick={onClick}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105"
                        style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                        <I style={{ width: 11, height: 11 }} />{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isGerente && (
                <div className="flex-shrink-0 max-w-[180px] w-full">
                  <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} />
                </div>
              )}
            </motion.div>

            {/* ── KPI STRIP ── */}
            {!isGerente && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
                <KPICard label="Ventas Hoy"      value={salesVal}               change={salesChange} icon={TrendingUp} color="#C21875" chartData={sparkSales}       delay={0}    />
                <KPICard label="Transacciones"   value={txnVal}                 change={0}           icon={Receipt}   color="#A855F7" chartData={sparkTxn}          delay={0.06} />
                <KPICard label="Ticket Promedio" value={ticketVal}              change={0}           icon={BarChart2} color="#6366f1" chartData={[5,6,5,7,8,7,8,9]} delay={0.12} />
                <KPICard label="Cajeros Activos" value={cashiers.length || '—'} change={0}           icon={Users}     color="#10b981" chartData={[4,4,5,5,5,6,5,6]} delay={0.18} />
              </div>
            )}

            {/* ── LIVE INTELLIGENCE FEED ── */}
            {!isGerente && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5 }}
                className="rounded-2xl p-4 mb-5"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Inteligencia operacional · ahora</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { emoji: '📈', text: salesVal !== '—' ? `Ventas hoy: ${salesVal} ${salesChange > 0 ? `(+${salesChange}% vs ayer)` : salesChange < 0 ? `(${salesChange}% vs ayer)` : ''}` : 'Sin datos de ventas aún hoy', type: salesChange >= 0 ? 'good' : 'warn' },
                    { emoji: '🧾', text: txnVal !== '—' ? `${txnVal} transacciones registradas hoy` : 'Sin transacciones registradas hoy', type: 'info' },
                    { emoji: '👥', text: `${cashiers.length} cajeros activos en tienda`, type: 'info' },
                    { emoji: '🎯', text: ticketVal !== '—' ? `Ticket promedio: ${ticketVal} por transacción` : 'Ingresa ventas para ver el ticket promedio', type: 'good' },
                    { emoji: '⚠️', text: 'Revisa el nivel de stock en la nevera hoy', type: 'warn' },
                    { emoji: '✨', text: 'Registra las ventas del turno para mantener el análisis actualizado', type: 'action' },
                  ].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.28 + i * 0.06 }}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{
                        background: item.type === 'warn' ? 'rgba(245,158,11,0.05)' :
                                    item.type === 'good' ? 'rgba(16,185,129,0.05)' :
                                    item.type === 'action' ? 'rgba(194,24,117,0.05)' : 'rgba(0,0,0,0.02)',
                        border: item.type === 'warn' ? '1px solid rgba(245,158,11,0.15)' :
                                item.type === 'good' ? '1px solid rgba(16,185,129,0.12)' :
                                item.type === 'action' ? '1px solid rgba(194,24,117,0.12)' : '1px solid rgba(0,0,0,0.04)',
                      }}>
                      <span className="text-sm flex-shrink-0 mt-0.5">{item.emoji}</span>
                      <p className="text-[11px] font-medium text-slate-600 leading-snug">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── QUICK ACTIONS (lider) ── */}
            {!isGerente && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-2 mb-5"
              >
                {[
                  { label: 'Registrar Ventas',    icon: TrendingUp, onClick: onShowStoreSales,      color: '#C21875' },
                  { label: 'Presupuesto Mensual', icon: Target,     onClick: onShowBudgetDashboard, color: '#10b981' },
                  { label: 'Informe Gerencial',   icon: FileText,   onClick: onShowReport,          color: '#6366f1' },
                ].map(({ label, icon: I, onClick, color }) => (
                  <button key={label} onClick={onClick}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                    <I style={{ width: 13, height: 13 }} />{label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── MODULE GRID (secondary) ── */}
            <div className="mb-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] mb-3">Módulos</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {QUICK_MODULES.map((m, i) => (
                  <motion.div key={m.label}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease: [0.23,1,0.32,1] }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link to={`/${m.path}`}>
                      <div className="relative overflow-hidden rounded-2xl p-3 cursor-pointer text-center"
                        style={{
                          background: 'rgba(255,255,255,0.78)',
                          backdropFilter: 'blur(16px)',
                          border: `1px solid ${m.color}15`,
                          boxShadow: `0 2px 16px rgba(0,0,0,0.04)`,
                        }}>
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full blur-xl pointer-events-none"
                          style={{ background: m.color, opacity: 0.08 }} />
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                          style={{ background: `${m.color}12` }}>
                          <m.icon style={{ color: m.color, width: 16, height: 16 }} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{m.label}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">{m.sublabel}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── GERENTE PANEL ── */}
            {isGerente && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] mb-3">Panel ejecutivo</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-3">
                  {[
                    { icon: Activity,     label: 'CMD Center',    sublabel: 'Global',       color: '#64748b', path: 'GenesisCommandCenter' },
                    { icon: TrendingUp,   label: 'P&G',           sublabel: 'Rentabilidad', color: '#059669', path: 'PYGDashboard' },
                    { icon: Trophy,       label: 'Ruleta',        sublabel: 'Premios',      color: '#d97706', path: 'RoulettePopsy' },
                    { icon: BarChart3,    label: 'Participación', sublabel: 'Mix negocio',  color: '#6366f1', path: 'SalesReportView' },
                    { icon: SettingsIcon, label: 'Config',        sublabel: 'Ajustes',      color: '#6b7280', path: 'Settings' },
                  ].map((m) => (
                    <motion.div key={m.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
                      <Link to={`/${m.path}`}>
                        <div className="relative overflow-hidden rounded-2xl p-3 cursor-pointer text-center"
                          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', border: `1px solid ${m.color}15`, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${m.color}12` }}>
                            <m.icon style={{ color: m.color, width: 16, height: 16 }} />
                          </div>
                          <p className="text-[11px] font-bold text-slate-700">{m.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">{m.sublabel}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Importar PPT', icon: FileSpreadsheet, onClick: onShowBudgetImporter,       color: '#10b981' },
                    { label: 'Subir KPIs',   icon: BarChart3,       onClick: onShowKpisUploader,         color: '#6366f1' },
                    { label: 'Agregadores',  icon: FileSpreadsheet, onClick: onShowAggregatorsUploader,  color: '#f59e0b' },
                    { label: 'Subir P&G',    icon: TrendingUp,      onClick: onShowPYGUploader,          color: '#059669' },
                    { label: 'Ver P&G',      icon: TrendingUp,      onClick: onShowPYGModal,             color: '#C21875' },
                    { label: 'Backup',       icon: Download,        onClick: onBackup,                   color: '#64748b' },
                  ].map(({ label, icon: I, onClick, color }) => (
                    <button key={label} onClick={onClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                      <I style={{ width: 12, height: 12 }} />{label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <p className="text-center text-[9px] font-bold tracking-widest uppercase mt-6 mb-2"
              style={{ color: 'rgba(194,24,117,0.15)' }}>
              Popsy AI Workspace · Todos los derechos reservados
            </p>
          </div>

          {/* ── RIGHT AI PANEL — fixed height, internal scroll ── */}
          <motion.aside
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="hidden xl:flex flex-col w-80 flex-shrink-0"
            style={{
              height: '100vh',
              position: 'sticky',
              top: 0,
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(40px)',
              borderLeft: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '-1px 0 24px rgba(0,0,0,0.03)',
            }}
          >
            {/* Panel header */}
            <div className="p-4 pb-3"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-3">
                {/* Mascot — premium glassy */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-10 h-10 rounded-2xl overflow-hidden"
                    style={{
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 4px 20px rgba(194,24,117,0.2), 0 1px 4px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.5)',
                    }}>
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
                  </div>
                  {/* Live indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
                    style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }}>
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-emerald-400" />
                  </div>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-slate-800">Nova</p>
                    <div className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide"
                      style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.1), rgba(168,85,247,0.1))', color: '#C21875', border: '1px solid rgba(194,24,117,0.15)' }}>
                      AI
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Copiloto operacional · en línea</p>
                </div>

                <Cpu className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(194,24,117,0.3)' }} />
              </div>
            </div>

            {/* Quick action chips */}
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.12em] mb-2">Acciones rápidas</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map(a => (
                  <AIChip key={a.label} label={a.label} icon={a.icon} color={a.color}
                    onClick={() => sendMessage(a.prompt)} />
                ))}
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} msg={msg} index={i} />
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2.5 items-end"
                >
                  <div className="w-6 h-6 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1.5px solid rgba(194,24,117,0.2)' }}>
                    <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm"
                    style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div className="flex gap-1 items-center h-3">
                      {[0,0.15,0.3].map((d,i) => (
                        <motion.div key={i}
                          animate={{ y: [0,-4,0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#C21875' }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(inputVal)}
                  placeholder="Pregúntale algo a Nova..."
                  className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-300 outline-none font-medium"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(inputVal)}
                  className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: inputVal.trim() ? 'linear-gradient(135deg, #C21875, #A855F7)' : 'rgba(0,0,0,0.06)' }}
                >
                  <Send style={{ width: 11, height: 11, color: inputVal.trim() ? 'white' : '#94a3b8' }} />
                </motion.button>
              </div>
            </div>
          </motion.aside>
      </main>
    </div>
  );
}