import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, TrendingUp, Activity, Award, Target, Bell,
  Download, FileText, Lock, Receipt, Snowflake, Settings as SettingsIcon,
  CalendarDays, LogOut, Sparkles, Trophy, FileSpreadsheet, BarChart3, Clock,
  ChevronRight, Zap, IceCream, ShieldCheck, BarChart2, Star, AlertCircle,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, MessageSquare, Brain,
  Sun, Moon, Coffee
} from 'lucide-react';
import { STORES } from '@/components/StoreSelector';
import StoreSelector from '@/components/StoreSelector';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: '¡Buenos días', icon: Sun, color: '#f59e0b' };
  if (h < 18) return { text: '¡Buenas tardes', icon: Coffee, color: '#E91E63' };
  return { text: '¡Buenas noches', icon: Moon, color: '#A855F7' };
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tienda',        path: 'Dashboard',         color: '#E91E63', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Users,           label: 'Cajeros',        path: 'CashiersDashboard', color: '#A855F7', roles: ['lider', 'embajador', 'gerente'] },
  { icon: TrendingUp,      label: 'Ventas',         path: 'Sales',             color: '#C21875', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Target,          label: 'Presupuesto',    path: 'Budget',            color: '#10b981', roles: ['lider', 'gerente'] },
  { icon: Snowflake,       label: 'Nevera',         path: 'FreezerMap',        color: '#06b6d4', roles: ['lider', 'embajador', 'gerente'] },
  { icon: BarChart3,       label: 'Rankings',       path: 'Rankings',          color: '#f59e0b', roles: ['lider', 'embajador', 'gerente'] },
  { icon: Clock,           label: 'Horarios',       path: 'PopsyPlanner',      color: '#8b5cf6', roles: ['lider', 'gerente'] },
  { icon: ShieldCheck,     label: 'Calidad',        path: 'Quality',           color: '#14b8a6', roles: ['lider', 'gerente'] },
  { icon: Activity,        label: 'CMD Center',     path: 'GenesisCommandCenter', color: '#64748b', roles: ['gerente'] },
  { icon: TrendingUp,      label: 'P&G',            path: 'PYGDashboard',      color: '#059669', roles: ['gerente'] },
  { icon: Trophy,          label: 'Ruleta',         path: 'RoulettePopsy',     color: '#d97706', roles: ['gerente'] },
  { icon: SettingsIcon,    label: 'Config',         path: 'Settings',          color: '#6b7280', roles: ['gerente'] },
];

const AI_INSIGHTS = [
  { icon: '🍦', text: 'Los combos están impulsando el ticket promedio esta semana', action: 'Ver análisis' },
  { icon: '📊', text: 'La conversión bajó 8% vs. semana anterior. Revisa Caja 2', action: 'Ver cajeros' },
  { icon: '✨', text: 'Tu tienda está en el top 3 de la zona este mes', action: 'Ver ranking' },
  { icon: '⚠️', text: 'Stock crítico detectado en 2 sabores de la nevera', action: 'Ver nevera' },
];

function KPICard({ label, value, change, icon: Icon, color, delay = 0 }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8)`,
      }}
    >
      {/* Accent glow */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 blur-xl"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
          isNeutral ? 'bg-slate-100 text-slate-500' :
          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {isNeutral ? <Minus className="w-3 h-3" /> :
           isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </motion.div>
  );
}

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
      style={isActive ? {
        background: `${item.color}15`,
        border: `1px solid ${item.color}30`,
      } : {
        background: 'transparent',
        border: '1px solid transparent',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={isActive ? { background: item.color, boxShadow: `0 4px 12px ${item.color}40` } :
        { background: 'rgba(0,0,0,0.04)' }}>
        <Icon className="w-4 h-4" style={{ color: isActive ? 'white' : '#94a3b8', width: 16, height: 16 }} />
      </div>
      <span className="text-sm font-semibold flex-1 truncate"
        style={{ color: isActive ? item.color : '#64748b' }}>
        {item.label}
      </span>
      {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />}
    </motion.button>
  );
}

function AIInsightCard({ insight, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer group transition-all hover:bg-white/60"
      style={{ border: '1px solid rgba(194,24,117,0.08)' }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 leading-snug">{insight.text}</p>
        <p className="text-[10px] font-bold mt-1 group-hover:underline" style={{ color: '#C21875' }}>
          {insight.action} →
        </p>
      </div>
    </motion.div>
  );
}

function QuickModule({ icon: Icon, label, sublabel, color, path, onClick, delay = 0 }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${color}20`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.9)`,
      }}
    >
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-8 blur-lg"
        style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
        style={{ background: `${color}18` }}>
        <Icon style={{ color, width: 20, height: 20 }} />
      </div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
    </motion.div>
  );

  if (onClick) return <div onClick={onClick}>{content}</div>;
  return <Link to={`/${path}`}>{content}</Link>;
}

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
  const [insightIdx, setInsightIdx] = useState(0);

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

  // Compute KPIs
  const latest = todaySales.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const prev = todaySales[1];
  const salesVal = latest?.total_sales ? `$${(latest.total_sales / 1000000).toFixed(1)}M` : '—';
  const txnVal = latest?.total_transactions || '—';
  const ticketVal = latest?.total_sales && latest?.total_transactions
    ? `$${Math.round(latest.total_sales / latest.total_transactions / 1000)}K` : '—';

  const salesChange = latest && prev
    ? Math.round(((latest.total_sales - prev.total_sales) / prev.total_sales) * 100) : 0;

  useEffect(() => {
    const t = setInterval(() => setInsightIdx(i => (i + 1) % AI_INSIGHTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const filteredNav = NAV_ITEMS.filter(n => n.roles.includes(selectedRole));

  const QUICK_MODULES = [
    { icon: LayoutDashboard, label: 'Dashboard', sublabel: 'Ventas y métricas', color: '#E91E63', path: 'Dashboard' },
    { icon: Users, label: 'Cajeros', sublabel: 'Rendimiento del equipo', color: '#A855F7', path: 'CashiersDashboard' },
    { icon: Target, label: 'Presupuesto', sublabel: 'Metas del mes', color: '#10b981', path: 'Budget' },
    { icon: Snowflake, label: 'Nevera', sublabel: 'Estado del inventario', color: '#06b6d4', path: 'FreezerMap' },
    { icon: Clock, label: 'Txn / Hora', sublabel: 'Flujo por horario', color: '#8b5cf6', path: 'HourlyTransactions' },
    { icon: BarChart3, label: 'Rankings', sublabel: 'Top performers', color: '#f59e0b', path: 'Rankings' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(145deg, #FFF7FB 0%, #FFFFFF 40%, #F8F4FF 100%)' }}>

      {/* ── LEFT SIDEBAR ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden lg:flex flex-col w-60 min-h-screen flex-shrink-0 sticky top-0"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(194,24,117,0.08)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <img src={LOGO_URL} alt="Popsy" className="h-10 object-contain" />
          {!isGerente && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tienda activa</p>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #FFF7FB, #F8D7E8)', border: '1px solid rgba(194,24,117,0.15)' }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                <span className="text-xs font-bold text-slate-700 truncate">{storeName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Módulos</p>
          {filteredNav.map(item => (
            <NavItem
              key={item.path}
              item={item}
              isActive={activeNav === item.path}
              onClick={() => {
                setActiveNav(item.path);
                window.location.href = `/${item.path}`;
              }}
            />
          ))}
        </div>

        {/* Profile section */}
        <div className="p-3 mt-auto">
          <div className="rounded-2xl p-3 mb-2"
            style={{ background: 'linear-gradient(135deg, #FFF7FB, #F8D7E8)', border: '1px solid rgba(194,24,117,0.12)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '2px solid rgba(194,24,117,0.3)' }}>
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800">Nova AI</p>
                <p className="text-[9px] text-slate-500">Copiloto activo ✨</p>
              </div>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto">

        {/* ── TOP BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <GreetIcon className="w-5 h-5" style={{ color: greeting.color }} />
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 truncate">
                {greeting.text}! 👋
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {isGerente ? 'Visión ejecutiva · Todas las tiendas' : `${storeName} · Resumen operacional de hoy`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGerente && (
              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { label: 'PPT Excel', icon: FileSpreadsheet, onClick: onShowBudgetImporter, color: '#10b981' },
                  { label: 'KPIs', icon: BarChart3, onClick: onShowKpisUploader, color: '#6366f1' },
                  { label: 'P&G', icon: TrendingUp, onClick: onShowPYGUploader, color: '#059669' },
                ].map(({ label, icon: I, onClick, color }) => (
                  <button key={label} onClick={onClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
                    <I style={{ width: 13, height: 13 }} /> {label}
                  </button>
                ))}
              </div>
            )}
            {!isGerente && (
              <div className="w-40 lg:w-48">
                <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} />
              </div>
            )}
          </div>
        </motion.div>

        {/* ── KPI STRIP ── */}
        {!isGerente && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard label="Ventas Hoy" value={salesVal} change={salesChange} icon={TrendingUp} color="#C21875" delay={0} />
            <KPICard label="Transacciones" value={txnVal} change={0} icon={Receipt} color="#A855F7" delay={0.05} />
            <KPICard label="Ticket Promedio" value={ticketVal} change={0} icon={BarChart2} color="#E91E63" delay={0.1} />
            <KPICard label="Cajeros Activos" value={cashiers.length || '—'} change={0} icon={Users} color="#10b981" delay={0.15} />
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* AI INSIGHT HERO — spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, #C21875 0%, #E91E63 55%, #A855F7 100%)',
              boxShadow: '0 8px 48px rgba(194,24,117,0.3), 0 2px 16px rgba(168,85,247,0.2)',
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15"
              style={{ background: 'rgba(255,255,255,0.6)' }} />
            <div className="absolute -bottom-8 left-16 w-24 h-24 rounded-full opacity-10"
              style={{ background: 'rgba(255,255,255,0.5)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 right-20 w-32 h-32 rounded-full opacity-10"
              style={{ background: 'rgba(255,255,255,0.4)' }} />

            <div className="relative flex items-start gap-4">
              {/* Mascot */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl"
                style={{ border: '2.5px solid rgba(255,255,255,0.5)' }}
              >
                <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Nova AI · Insight</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-300"
                    style={{ boxShadow: '0 0 8px rgba(163,230,53,0.9)' }} />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={insightIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-white text-base lg:text-lg font-bold leading-snug mb-3"
                  >
                    {AI_INSIGHTS[insightIdx].icon} {AI_INSIGHTS[insightIdx].text}
                  </motion.p>
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <Zap className="w-4 h-4" />
                    {AI_INSIGHTS[insightIdx].action}
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <MessageSquare className="w-4 h-4" />
                    Preguntarle a Nova
                  </button>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-4 right-6 flex gap-1.5">
              {AI_INSIGHTS.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{
                    width: i === insightIdx ? 16 : 6,
                    height: 6,
                    background: i === insightIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                  }} />
              ))}
            </div>
          </motion.div>

          {/* AI INSIGHTS LIST */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl p-4"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(194,24,117,0.1)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" style={{ color: '#C21875' }} />
              <p className="text-sm font-black text-slate-800">Alertas del día</p>
            </div>
            <div className="space-y-1">
              {AI_INSIGHTS.map((ins, i) => (
                <AIInsightCard key={i} insight={ins} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── QUICK MODULES GRID ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-700">Acceso rápido</h2>
            <span className="text-xs text-slate-400">Todos los módulos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_MODULES.map((m, i) => (
              <QuickModule key={m.label} {...m} delay={i * 0.04} />
            ))}
          </div>
        </div>

        {/* ── GERENTE EXTRA MODULES ── */}
        {isGerente && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-black text-slate-700">Panel ejecutivo</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: Activity, label: 'Command Center', sublabel: 'Monitoreo global', color: '#64748b', path: 'GenesisCommandCenter' },
                { icon: TrendingUp, label: 'P&G Tiendas', sublabel: 'Rentabilidad', color: '#059669', path: 'PYGDashboard' },
                { icon: Trophy, label: 'Ruleta Popsy', sublabel: 'Premios del mes', color: '#d97706', path: 'RoulettePopsy' },
                { icon: BarChart3, label: 'Participación', sublabel: 'Mix de negocio', color: '#6366f1', path: 'SalesReportView' },
                { icon: SettingsIcon, label: 'Configuración', sublabel: 'Tiendas y ajustes', color: '#6b7280', path: 'Settings' },
              ].map((m, i) => (
                <QuickModule key={m.label} {...m} delay={i * 0.05} />
              ))}
            </div>
          </div>
        )}

        {/* ── ACTION STRIP (Gerente tools) ── */}
        {isGerente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {[
              { label: 'Importar PPT Excel', icon: FileSpreadsheet, onClick: onShowBudgetImporter, color: '#10b981' },
              { label: 'Subir KPIs', icon: BarChart3, onClick: onShowKpisUploader, color: '#6366f1' },
              { label: 'Subir Agregadores', icon: FileSpreadsheet, onClick: onShowAggregatorsUploader, color: '#f59e0b' },
              { label: 'Subir P&G', icon: TrendingUp, onClick: onShowPYGUploader, color: '#059669' },
              { label: 'Ver P&G Tienda', icon: TrendingUp, onClick: onShowPYGModal, color: '#C21875' },
              { label: 'Backup Drive', icon: Download, onClick: onBackup, color: '#64748b' },
            ].map(({ label, icon: I, onClick, color }) => (
              <button key={label} onClick={onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                <I style={{ width: 13, height: 13 }} /> {label}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── LIDER TOOLS ── */}
        {!isGerente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {[
              { label: 'Registrar Ventas', icon: TrendingUp, onClick: onShowStoreSales, color: '#C21875' },
              { label: 'Presupuesto Mensual', icon: Target, onClick: onShowBudgetDashboard, color: '#10b981' },
              { label: 'Informe Gerencial', icon: FileText, onClick: onShowReport, color: '#6366f1' },
            ].map(({ label, icon: I, onClick, color }) => (
              <button key={label} onClick={onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                <I style={{ width: 13, height: 13 }} /> {label}
              </button>
            ))}
          </motion.div>
        )}

        <p className="text-center text-[9px] font-bold tracking-widest uppercase mt-8 mb-2"
          style={{ color: 'rgba(194,24,117,0.25)' }}>
          Popsy AI Workspace · Todos los derechos reservados
        </p>
      </main>
    </div>
  );
}