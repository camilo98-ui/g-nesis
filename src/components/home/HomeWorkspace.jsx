import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';
import {
  LayoutDashboard, Users, TrendingUp, Activity, Target, Bell,
  Download, FileText, Lock, Receipt, Snowflake, Settings as SettingsIcon,
  CalendarDays, LogOut, Sparkles, Trophy, FileSpreadsheet, BarChart3, Clock,
  ChevronRight, Zap, BarChart2, ArrowUpRight, ArrowDownRight, Minus,
  Brain, Sun, Moon, Coffee, Send, Cpu, TrendingDown, Plus, X } from
'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { STORES } from '@/components/StoreSelector';
import StoreSelector from '@/components/StoreSelector';
import PremiumSparkline from './PremiumSparkline';
import ExecutiveAnalyticsPanel from './ExecutiveAnalyticsPanel';
import DailyMetricsPanel from './DailyMetricsPanel';
import PremiumMainChart from './PremiumMainChart';
import { calculateBudgetData } from '@/lib/budgetCalculations';
import AIExecutiveReport from './AIExecutiveReport';
import { useNova } from '@/components/NovaContext';
import ProductTicketAnalysis from '@/components/reports/ProductTicketAnalysis';
import WeeklyComparison from './WeeklyComparison';
import TakeawayCard from './TakeawayCard';
import NovaInsightStrip from './NovaInsightStrip';
import GerenteDashboard from './GerenteDashboard';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

// Renders mascot on canvas with white background removed
function MascotCanvas({ width = 48, height = 48, style = {} }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i],g = d[i + 1],b = d[i + 2];
        if (r > 220 && g > 220 && b > 220) {
          d[i + 3] = 0;
        } else if (r > 180 && g > 180 && b > 180) {
          const brightness = (r + g + b) / 3;
          d[i + 3] = Math.round(255 * (1 - (brightness - 180) / 75));
        }
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = MASCOT_IMG;
  }, []);
  return <canvas ref={canvasRef} style={{ width, height, display: 'block', objectFit: 'contain', ...style }} />;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Buenos días', icon: Sun, color: '#92400e' };
  if (h < 18) return { text: 'Buenas tardes', icon: Coffee, color: '#C21875' };
  return { text: 'Buenas noches', icon: Moon, color: '#6b7280' };
}

const NAV_ITEMS = [
{ icon: LayoutDashboard, label: 'Tienda', path: 'Dashboard', color: '#C21875', roles: ['lider', 'embajador', 'gerente'] },
{ icon: TrendingUp, label: 'P&G', path: 'PYGDashboard', color: '#374151', roles: ['gerente'] },
{ icon: TrendingUp, label: 'P&G Tienda', path: null, color: '#374151', onClick: 'onShowPYGModal', roles: ['lider', 'embajador'] },
{ icon: FileText, label: 'Informe', path: 'SalesReportView', color: '#374151', roles: ['lider', 'embajador', 'gerente'] },
{ icon: Clock, label: 'Txn por hora', path: 'HourlyTransactions', color: '#374151', roles: ['lider', 'embajador', 'gerente'] },
{ icon: BarChart3, label: 'Participación', path: 'SalesReportView', color: '#374151', roles: ['lider', 'embajador', 'gerente'] },
{ icon: Snowflake, label: 'Mapa Nevera', path: 'FreezerMap', color: '#374151', roles: ['lider', 'embajador', 'gerente'] },

{ icon: Activity, label: 'Radar Competitivo', path: 'RadarCompetitivo', color: '#7c3aed', roles: ['lider', 'gerente'], isSpecial: true }];


// ── PREMIUM KPI CARD ─────────────────────────────────────────────────────────
function KPICard({ label, value, change, icon: Icon, color, chartData, delay = 0 }) {
  const isPos = change > 0;
  const isNeutral = change === 0;
  const sparkColor = isPos ? '#10b981' : isNeutral ? '#94a3b8' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="relative rounded-2xl p-4 cursor-default group glass-card hover-lift card-accent-top">
      
      
      {/* Top row: icon + delta */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${color}0f` }}>
          <Icon style={{ color, width: 15, height: 15, opacity: 0.85 }} />
        </div>
        <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
        isNeutral ? 'text-slate-400' : isPos ? 'text-emerald-500' : 'text-rose-400'}`
        }>
          {isNeutral ? <Minus className="w-2.5 h-2.5" /> :
          isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {Math.abs(change)}%
        </span>
      </div>

      {/* Value */}
      <p className="text-[28px] font-black text-slate-800 leading-none tracking-tight mb-0.5 tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-slate-400 mb-3 tracking-wide">{label}</p>

      {/* Sparkline */}
      <div className="opacity-90">
        <PremiumSparkline data={chartData || [3, 4, 4, 5, 4, 6, 5, 7]} color={sparkColor} width={80} height={24} />
      </div>

      {/* Subtle bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
      style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />
    </motion.div>);

}

// ── SIDEBAR NAV ITEM ─────────────────────────────────────────────────────────
function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
      style={isActive ? {
        background: 'linear-gradient(135deg, rgba(194,24,117,0.10), rgba(194,24,117,0.05))',
        border: '1px solid rgba(194,24,117,0.22)',
        boxShadow: '0 3px 12px rgba(194,24,117,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)'
      } : {
        background: 'transparent',
        border: '1px solid transparent',
        transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)'
      }}>
      
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={isActive ?
      { background: 'rgba(194,24,117,0.14)', boxShadow: '0 2px 6px rgba(194,24,117,0.15)' } :
      { background: 'rgba(0,0,0,0.03)' }}>
        <Icon style={{ color: isActive ? '#C21875' : '#9ca3af', width: 14, height: 14 }} />
      </div>
      <span className="text-[12px] font-semibold flex-1 truncate"
      style={{ color: isActive ? '#C21875' : '#6b7280' }}>
        {item.label}
      </span>
      {isActive &&
      <div className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #C21875, #e11d7a)' }} />
      }
    </motion.button>);

}

// ── CHAT MESSAGE ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, index }) {
  const isNova = msg.role === 'nova';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className={`flex gap-2 ${isNova ? '' : 'flex-row-reverse'}`}>
      
      {isNova &&
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 mt-0.5 ring-1 ring-black/5 flex items-center justify-center">
          <MascotCanvas width={20} height={20} />
        </div>
      }
      <div className={`max-w-[84%] px-3 py-2 rounded-2xl text-[11.5px] leading-relaxed font-medium ${
      isNova ? 'rounded-tl-sm text-slate-600' : 'rounded-tr-sm text-white'}`
      }
      style={isNova ?
      { background: 'rgba(248,248,250,0.96)', border: '1px solid rgba(0,0,0,0.06)' } :
      { background: 'linear-gradient(135deg, #be185d, #9333ea)', boxShadow: '0 4px 14px rgba(190,24,93,0.2)' }
      }>
        {msg.text}
      </div>
    </motion.div>);

}

// ── AI CHIP ──────────────────────────────────────────────────────────────────
function AIChip({ label, icon: Icon, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-medium text-slate-500 transition-colors hover:text-slate-700"
      style={{
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.07)'
      }}>
      
      {Icon && <Icon style={{ width: 10, height: 10 }} />}
      {label}
    </motion.button>);

}

// ── INTEL ROW ────────────────────────────────────────────────────────────────
function IntelRow({ emoji, text, type, delay }) {
  const accent = type === 'warn' ? '#d97706' : type === 'good' ? '#059669' : type === 'action' ? '#C21875' : '#64748b';
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 py-2.5 px-0"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      
      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px]"
      style={{ background: `${accent}0d` }}>
        {emoji}
      </div>
      <p className="text-[11.5px] font-medium text-slate-500 leading-snug flex-1">{text}</p>
      <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: accent, opacity: 0.5 }} />
    </motion.div>);

}

// ── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCard({ m, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.14 } }}
      whileTap={{ scale: 0.97 }}>
      
      <Link to={`/${m.path}`}>
        <div className="relative rounded-2xl p-3 text-center cursor-pointer group"
        style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
          style={{ background: 'rgba(0,0,0,0.03)' }}>
            <m.icon style={{ color: '#64748b', width: 15, height: 15 }} className="group-hover:text-slate-800 transition-colors" />
          </div>
          <p className="text-[10.5px] font-semibold text-slate-600 leading-tight">{m.label}</p>
          <p className="text-[9px] text-slate-300 mt-0.5 hidden sm:block font-medium">{m.sublabel}</p>
          {/* Hover accent */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-8 transition-all duration-300 rounded-full"
          style={{ background: '#C21875' }} />
        </div>
      </Link>
    </motion.div>);

}

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
{ role: 'nova', text: 'Nova · inteligencia comercial activa. Consulta ventas, KPIs, cajeros o proyecciones.' }];


const QUICK_ACTIONS = [
{ label: 'Proyección cierre', icon: TrendingUp, prompt: 'Proyecta el cierre del mes con el ritmo actual de ventas y dime si hay riesgo de incumplimiento del PPT' },
{ label: 'Anomalías', icon: Activity, prompt: 'Detecta anomalías en ventas o transacciones de los últimos 7 días' },
{ label: 'Top cajeros', icon: Users, prompt: 'Muéstrame el ranking de cajeros por ventas y transacciones con números reales' },
{ label: 'Riesgo PPT', icon: Target, prompt: 'Analiza el riesgo de no cumplir el presupuesto del mes con datos reales' },
{ label: 'Tendencia', icon: BarChart2, prompt: 'Analiza la tendencia de ventas de los últimos 14 días con comparación histórica' },
{ label: 'Alertas ops', icon: Bell, prompt: 'Lista todas las alertas operacionales críticas: stock, cumplimiento, incidentes' }];


const AI_RESPONSES = {
  'Muéstrame el resumen de ventas de hoy': '📊 Hoy llevan **$4.2M** en ventas, con 87 transacciones y ticket promedio de **$48K**. Estás un **+12%** sobre ayer. ¡Buen ritmo!',
  'Cuáles son los cajeros con mejor rendimiento?': '🏆 Top 3 hoy:\n1. **María García** — $1.1M · 23 txn\n2. **Juan Pérez** — $980K · 21 txn\n3. **Ana López** — $890K · 19 txn',
  'Compara las ventas de hoy vs ayer': '📈 Hoy: **$4.2M** | Ayer: **$3.75M**\nDiferencia: **+$450K (+12%)**\nLas horas pico fueron 12pm–2pm.',
  'Qué productos tienen stock crítico en la nevera?': '⚠️ **2 sabores en crítico:**\n• Arequipe Doble — Solo 8% restante\n• Fresa con Crema — 15% restante',
  'Dame los insights más importantes de esta semana': '✨ **Top insights:**\n• Combos aumentaron ticket promedio +18%\n• Horario pico extendido 30min vs sem. anterior\n• Cajero Caja 3 con 94% satisfacción',
  'Hay alguna alerta operacional que deba saber?': '🔔 **3 alertas activas:**\n• Stock crítico en 2 sabores\n• Caja 2: conversión -8% esta semana\n• Turno tarde con 1 cajero menos'
};

// ── LÍDERES POR TIENDA ───────────────────────────────────────────────────────────
const LEADERS = {
  'TUNJA 1': 'Andrea',
  'BTA 21': 'Nai',
  'BTA 71': 'Mafe',
  'BTA 66': 'Nidia',
  'BTA 52': 'Zai',
  'BTA 62': 'Angie',
  'BTA 18': 'Ruth',
  'BTA 78': 'Brandon',
  'TUNJA 2': 'Isa',
  'BTA 85': 'Edna',
  'BTA 56': 'Cris',
  'BTA 27': 'Andre'
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HomeWorkspace({
  selectedStore, selectedRole, selectedStoreName,
  onLogout, onStoreChange,
  onShowReport, onShowStoreSales, onShowBudgetDashboard,
  onShowBudgetImporter, onShowKpisUploader, onShowAggregatorsUploader,
  onShowPYGUploader, onShowPYGModal, onShowExperiencia, onShowCustomerExperience,
  backupLoading, onBackup
}) {
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;
  const { setPageData } = useNova() || {};
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [kpiModal, setKpiModal] = useState(null); // 'ppt' | 'gap' | 'proj'
  const [showAIReport, setShowAIReport] = useState(false);
  const [takeawayBudgetOverride, setTakeawayBudgetOverride] = useState(null);
  const chatEndRef = useRef(null);
  const conversationRef = useRef(null);

  const storeName = selectedStoreName || STORES.find((s) => s.code === selectedStore)?.name || 'Tu Tienda';
  const isGerente = selectedRole === 'gerente';

  const { data: todaySales = [] } = useQuery({
    queryKey: ['home-today-sales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }, '-date', 60),
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000
  });
  const { data: budget = [] } = useQuery({
    queryKey: ['home-budget', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000
  });
  const { data: dailyBudgets = [] } = useQuery({
    queryKey: ['home-daily-budgets', selectedStore],
    queryFn: () => base44.entities.DailyBudget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 5 * 60 * 1000
  });
  const { data: cashiers = [] } = useQuery({
    queryKey: ['home-cashiers', selectedStore],
    queryFn: () => base44.entities.Cashier.filter({ store_id: selectedStore, is_active: true }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });

  // selectedStore is the store code (e.g. "BTA 11")
  const { data: pygReports = [] } = useQuery({
    queryKey: ['home-pyg', selectedStore],
    queryFn: () => base44.entities.PYGReport.filter({ store_code: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });

  // Fetch products for the store
  const { data: salesReports = [] } = useQuery({
    queryKey: ['home-sales-reports', selectedStore],
    queryFn: () => base44.entities.SalesReport.filter({ store_code: selectedStore }),
    enabled: !!selectedStore,
    staleTime: 10 * 60 * 1000
  });

  // For ShiftRecord we need store_id — find from Store entity
  const { data: storeEntities = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list(),
    staleTime: 60 * 60 * 1000
  });
  const storeEntityId = storeEntities.find((s) => s.code === selectedStore)?.id || selectedStore;

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['home-shifts', storeEntityId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeEntityId }),
    enabled: !!storeEntityId,
    staleTime: 10 * 60 * 1000
  });

  const sorted = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const prev = sorted[1];
  const salesVal = latest?.total_sales ? `$${(latest.total_sales / 1000000).toFixed(1)}M` : '—';
  const txnVal = latest?.total_transactions ? String(latest.total_transactions) : '—';
  const ticketVal = latest?.total_sales && latest?.total_transactions ?
  `$${Math.round(latest.total_sales / latest.total_transactions / 1000)}K` : '—';
  const salesChange = latest && prev ?
  Math.round((latest.total_sales - prev.total_sales) / prev.total_sales * 100) : 0;

  const sparkSales = sorted.slice(0, 8).reverse().map((d) => d.total_sales || 0);
  const sparkTxn = sorted.slice(0, 8).reverse().map((d) => d.total_transactions || 0);

  // Cálculo exacto de RetailWeekBudgetCard
  const activeBudget = budget.length > 0 ? budget.find((b) => {
    const now = new Date();
    return Number(b.month) === now.getMonth() + 1 && Number(b.year) === now.getFullYear();
  }) : null;

  useEffect(() => {setTakeawayBudgetOverride(null);}, [activeBudget?.id]);

  const budgetData = useMemo(() => {
    if (!activeBudget?.sales_budget) return null;
    return calculateBudgetData(activeBudget, todaySales, dailyBudgets, selectedStore);
  }, [activeBudget, todaySales, dailyBudgets, selectedStore]);

  const { data: weatherData } = useQuery({
    queryKey: ['home-weather-real'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getWeatherDataForBogota', {});
      return res.data;
    },
    staleTime: 60 * 60 * 1000
  });

  const weatherHistory = weatherData?.history || {};
  const wTimes = weatherHistory.time || [];
  const wTemps = weatherHistory.temperature_2m_mean || [];
  const wTempsMax = weatherHistory.temperature_2m_max || [];
  const wTempsMin = weatherHistory.temperature_2m_min || [];
  const wRain = weatherHistory.precipitation_sum || [];
  const wCodes = weatherHistory.weathercode || [];

  // Últimos 7 días
  const last7Start = Math.max(0, wTimes.length - 7);
  const weatherLast7 = wTimes.slice(last7Start).map((date, i) => ({
    date,
    temperature_mean: wTemps[last7Start + i],
    temperature_max: wTempsMax[last7Start + i],
    temperature_min: wTempsMin[last7Start + i],
    precipitation: wRain[last7Start + i],
    weather_code: wCodes[last7Start + i]
  }));
  const latestWeather = weatherLast7[weatherLast7.length - 1] || null;

  const filteredNav = NAV_ITEMS.filter((n) => n.roles.includes(selectedRole));

  // Generar frase dinámica según contexto operativo
  const getDynamicPhrase = () => {
    if (!todaySales.length) return "Comienza el día. Aún sin datos operativos.";

    const sorted = [...todaySales].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];
    const prev = sorted[1];

    if (!latest) return "Aún sin datos operativos hoy.";

    const salesChange = prev ? Math.round((latest.total_sales - prev.total_sales) / prev.total_sales * 100) : 0;
    const currentSales = latest.total_sales || 0;
    const currentTxn = latest.total_transactions || 0;
    const avgTicket = currentTxn > 0 ? currentSales / currentTxn : 0;

    // Array de frases dinámicas basadas en condiciones
    const phrases = [
    ...(salesChange > 15 ? ["El ritmo de venta está acelerado hoy."] : []),
    ...(salesChange < -10 ? ["Las ventas van más lento que ayer."] : []),
    ...(salesChange > 0 && salesChange <= 15 ? ["Ritmo estable vs. ayer."] : []),
    ...(avgTicket > 50000 ? ["El ticket promedio sostiene la operación."] : []),
    ...(currentTxn > 80 ? ["Buen volumen de transacciones registrado."] : []),
    ...(latestWeather?.precipitation > 5 ? ["La lluvia impacta el tráfico hoy."] : []),
    ...(latestWeather?.temperature_mean > 26 ? ["Clima caluroso — buen día para helados."] : []),
    ...(budget.length > 0 ? ["Proyección de cierre al alcance."] : []),
    ...(cashiers.length > 3 ? ["Equipo completo para el turno."] : []),
    "El negocio mantiene su ritmo normal."];


    return phrases.length > 0 ? phrases[Math.floor(Math.random() * phrases.length)] : "La operación sigue su marcha.";
  };

  // Inyectar datos reales en el contexto de Nova
  useEffect(() => {
    if (!setPageData || !selectedStore) return;
    const fmt = (n) => n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(n)) : '$0';

    // Datos de hoy
    const todaySalesValue = latest?.total_sales || 0;
    const todayTransactions = latest?.total_transactions || 0;
    const todayTicket = todayTransactions > 0 ? todaySalesValue / todayTransactions : 0;
    const pptHoy = budgetData?.excelBudgetForToday || (budgetData?.monthlyBudget ? budgetData.monthlyBudget / 30 : 0);

    // Análisis histórico de últimos 7 días
    const last7Sales = todaySales.slice(-7).sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalSales7d = last7Sales.reduce((sum, d) => sum + (d.total_sales || 0), 0);
    const avgDaily7d = last7Sales.length > 0 ? totalSales7d / last7Sales.length : 0;
    const totalTxn7d = last7Sales.reduce((sum, d) => sum + (d.total_transactions || 0), 0);
    const maxDay7d = Math.max(...last7Sales.map((d) => d.total_sales || 0), 0);
    const minDay7d = Math.min(...last7Sales.filter((d) => d.total_sales).map((d) => d.total_sales), todaySalesValue || 1);

    // Análisis de últimos 30 días si existen
    const last30Sales = todaySales.slice(-30).sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalSales30d = last30Sales.reduce((sum, d) => sum + (d.total_sales || 0), 0);
    const avgDaily30d = last30Sales.length > 0 ? totalSales30d / last30Sales.length : 0;

    // Presupuesto y brecha
    const gap = (budgetData?.salesUntilYesterday || 0) - (budgetData?.budgetUntilYesterday || 0);
    const isPos = gap >= 0;
    const projPct = budgetData?.monthProjectionCompliance ?? 0;
    const dailyBudget = budgetData?.monthlyBudget ? budgetData.monthlyBudget / 30 : 0;
    const budgetCompliance = dailyBudget > 0 ? todaySalesValue / dailyBudget * 100 : 0;

    // Tendencias
    const trend7d = last7Sales.length >= 2 ?
    ((last7Sales[0].total_sales || 0) - (last7Sales[last7Sales.length - 1].total_sales || 0)) / (last7Sales[last7Sales.length - 1].total_sales || 1) * 100 :
    0;

    // Análisis de productos más vendidos con descripción
    const topProducts = salesReports.length > 0 ?
    salesReports.sort((a, b) => (b.sales_amount || b.quantity || 0) - (a.sales_amount || a.quantity || 0)).slice(0, 15) :
    [];

    // Mapeo de descripciones de productos (galletería, bebidas, etc.)
    const productDescriptions = {
      'cookie': 'galleta/cookie',
      'jar': 'frasco/recipiente',
      'cookie jaar': 'galleta en frasco (Cookie Jaar)',
      'bebida': 'bebida',
      'helado': 'helado',
      'chocolate': 'chocolate',
      'wafer': 'galleta wafer',
      'cracker': 'galleta salada',
      'galleta': 'producto de galletería',
      'café': 'bebida café',
      'té': 'bebida té',
      'jugo': 'bebida jugo'
    };

    const getProductType = (name) => {
      if (!name) return '';
      const lower = name.toLowerCase();
      for (let [key, desc] of Object.entries(productDescriptions)) {
        if (lower.includes(key)) return desc;
      }
      return 'producto';
    };

    const topProductsList = topProducts.length > 0 ?
    topProducts.map((p, i) => {
      const type = getProductType(p.product_name);
      return `${i + 1}. ${p.product_name || 'Producto'} (${type}) - ${fmt(p.sales_amount || 0)}${p.quantity ? ` (${p.quantity} unidades)` : ''}`;
    }).join(' | ') :
    'Sin datos de productos';

    // Análisis por categoría/departamento (galletería, bebidas, etc.)
    const departments = [...new Set(salesReports.map((p) => p.department).filter(Boolean))];
    const departmentSummary = departments.map((dept) => {
      const deptProducts = salesReports.filter((p) => p.department === dept);
      const deptSales = deptProducts.reduce((sum, p) => sum + (p.sales_amount || 0), 0);
      const deptPercentage = todaySalesValue > 0 ? deptSales / todaySalesValue * 100 : 0;
      return {
        name: dept,
        sales: fmt(deptSales),
        percentage: deptPercentage.toFixed(1),
        productCount: deptProducts.length,
        topProduct: deptProducts.sort((a, b) => (b.sales_amount || 0) - (a.sales_amount || 0))[0]
      };
    }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    // Participación de top 5 productos en ventas totales
    const top5ProductsSales = topProducts.slice(0, 5).reduce((sum, p) => sum + (p.sales_amount || 0), 0);
    const top5Participation = todaySalesValue > 0 ? top5ProductsSales / todaySalesValue * 100 : 0;

    // Productos con datos adicionales
    const productsDetail = topProducts.slice(0, 5).map((p) => ({
      name: p.product_name || 'Producto sin nombre',
      sales: fmt(p.sales_amount || 0),
      quantity: p.quantity || 0,
      percentage: todaySalesValue > 0 ? ((p.sales_amount || 0) / todaySalesValue * 100).toFixed(1) : 0
    }));

    // Datos P&G (EBITDA, costos, personal) si están disponibles
    const latestPyg = pygReports.length > 0 ? pygReports[pygReports.length - 1] : null;
    const ebitdaMargin = latestPyg?.margen_ebitda ? (latestPyg.margen_ebitda * 100).toFixed(1) : null;
    const costReal = latestPyg?.cost_real ? (latestPyg.cost_real * 100).toFixed(1) : null;
    const costTeorico = latestPyg?.cost_teorico ? (latestPyg.cost_teorico * 100).toFixed(1) : null;
    const costPersonal = latestPyg?.costo_personal ? (latestPyg.costo_personal * 100).toFixed(1) : null;
    const gastosVenta = latestPyg?.gastos_pct_venta ? (latestPyg.gastos_pct_venta * 100).toFixed(1) : null;
    const arriendos = latestPyg?.arriendos ? (latestPyg.arriendos * 100).toFixed(1) : null;
    const servicios = latestPyg?.servicios_publicos ? (latestPyg.servicios_publicos * 100).toFixed(1) : null;
    const administracion = latestPyg?.administracion ? (latestPyg.administracion * 100).toFixed(1) : null;
    const impuestos = latestPyg?.impuestos ? (latestPyg.impuestos * 100).toFixed(1) : null;

    setPageData({
      page: 'Home',
      store: storeName,
      storeCode: selectedStore,

      // Venta de hoy
      venta_hoy: todaySalesValue,
      venta_hoy_fmt: fmt(todaySalesValue),
      transacciones_hoy: todayTransactions,
      ticket_promedio_hoy: todayTicket,
      variacion_vs_ayer: salesChange,
      cumplimiento_diario: budgetCompliance.toFixed(1),

      // Presupuesto
      ppt_dia: pptHoy,
      presupuesto_mes: budgetData?.monthlyBudget || activeBudget?.sales_budget || 0,
      ventas_acumuladas: budgetData?.salesUntilYesterday || 0,
      brecha_mes: gap,
      proyeccion_cierre: budgetData?.monthProjection || 0,
      cumplimiento_proyeccion: budgetData?.monthProjectionCompliance || 0,
      venta_diaria_requerida: budgetData?.dailyRequiredSales || 0,
      dias_restantes: budgetData?.remainingDays || 0,

      // Análisis últimos 7 días
      sales_7d_total: totalSales7d,
      sales_7d_avg: avgDaily7d,
      sales_7d_max: maxDay7d,
      sales_7d_min: minDay7d,
      txn_7d_total: totalTxn7d,
      trend_7d: trend7d.toFixed(1),

      // Análisis últimos 30 días
      sales_30d_total: totalSales30d,
      sales_30d_avg: avgDaily30d,
      days_with_data: last30Sales.length,

      // Equipo
      cajeros_activos: cashiers.length,

      // Productos más vendidos (con detalles y descripción de qué son)
      top_products: topProductsList,
      top_products_count: topProducts.length,
      top_5_products_list: productsDetail.map((p) => {
        const type = getProductType(p.name);
        return `${p.name} (${type}): ${p.sales} (${p.quantity} unidades, ${p.percentage}% de ventas)`;
      }).join(' | '),
      top_5_products_participation: top5Participation.toFixed(1),

      // Categorías/Departamentos (Galletería, Bebidas, etc.) con productos top identificados
      categories_summary: departmentSummary.map((d) => {
        const topType = getProductType(d.topProduct?.product_name || '');
        return `${d.name}: ${d.sales} (${d.percentage}% de ventas, ${d.productCount} productos) - top: ${d.topProduct?.product_name || 'N/A'} (${topType})`;
      }).join(' | '),
      top_categories: departmentSummary.slice(0, 5).map((d) => `${d.name} - ${d.percentage}% (top: ${d.topProduct?.product_name} que es ${getProductType(d.topProduct?.product_name)})`).join(' | '),

      // Datos P&G - EBITDA y Márgenes
      pyg_ebitda_margin: ebitdaMargin,
      pyg_cost_real: costReal,
      pyg_cost_teorico: costTeorico,
      pyg_cost_personal: costPersonal,
      pyg_gastos_venta: gastosVenta,
      pyg_arriendos: arriendos,
      pyg_servicios: servicios,
      pyg_administracion: administracion,
      pyg_impuestos: impuestos,

      // KPI Card data
      kpi_ppt: fmt(pptHoy),
      kpi_ppt_meta: `Meta: ${fmt(pptHoy)}`,
      kpi_ppt_sub: budgetData?.gapRecoveryIncrement > 0 && budgetData?.excelBudgetForToday > 0 ? `+${budgetData.incrementPct}% recuperación` : 'meta diaria',
      kpi_brecha: fmt(gap),
      kpi_brecha_meta: budgetData?.monthlyBudget > 0 ? `${isPos ? 'Sobre' : 'Bajo'} meta` : '',
      kpi_brecha_sub: `${Math.abs(gap / (budgetData?.monthlyBudget || 1) * 100).toFixed(0)}%`,
      kpi_proyeccion: `${projPct.toFixed(0)}%`,
      kpi_proyeccion_meta: `${fmt(budgetData?.monthProjection || 0)} / ${fmt(budgetData?.monthlyBudget || 0)}`,
      kpi_proyeccion_sub: `Cumplimiento: ${projPct.toFixed(1)}%`
    });
  }, [latest, budgetData, selectedStore, cashiers, salesChange, setPageData, storeName, activeBudget, todaySales, salesReports]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInputVal('');
    setIsTyping(true);

    try {
      // Crear conversación si no existe
      if (!conversationRef.current) {
        const storeEntity = storeEntities.find((s) => s.code === selectedStore);
        const conv = await base44.agents.createConversation({
          agent_name: 'nova',
          metadata: { store: selectedStore, role: selectedRole }
        });
        conversationRef.current = conv;

        // Inyectar contexto de tienda como primer mensaje de sistema
        const storeContext = `CONTEXTO DE SESIÓN: El usuario es un ${selectedRole} de la tienda "${storeName}" (código: ${selectedStore}, ID: ${storeEntityId}). Cuando consultes entidades, filtra siempre por store_id="${storeEntityId}" o store_code="${selectedStore}". Fecha actual: ${new Date().toISOString().split('T')[0]}.`;

        await base44.agents.addMessage(conv, {
          role: 'user',
          content: storeContext
        });

        // Suscribirse a updates en tiempo real
        base44.agents.subscribeToConversation(conv.id, (data) => {
          const allMsgs = data.messages || [];
          // Filtrar: saltar el primer mensaje de contexto (índice 0 user) y su respuesta (índice 1 assistant)
          const visibleMsgs = allMsgs.slice(2).filter((m) => m.role === 'assistant' || m.role === 'user');
          const mapped = visibleMsgs.map((m) => ({ role: m.role === 'assistant' ? 'nova' : 'user', text: m.content }));
          if (mapped.length > 0) {
            setMessages([INITIAL_MESSAGES[0], ...mapped]);
          }
          const lastMsg = allMsgs[allMsgs.length - 1];
          if (lastMsg?.role === 'assistant') {
            setIsTyping(false);
          }
        });

        // Esperar respuesta al contexto antes de enviar el mensaje real
        await new Promise((r) => setTimeout(r, 1500));
      }

      await base44.agents.addMessage(conversationRef.current, {
        role: 'user',
        content: userMsg
      });
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'nova', text: 'Error de conexión. Intenta de nuevo.' }]);
    }
  }

  const QUICK_MODULES = [
  { icon: LayoutDashboard, label: 'Dashboard', sublabel: 'Ventas diarias', color: '#C21875', path: 'Dashboard' },
  { icon: Users, label: 'Cajeros', sublabel: 'Equipo', color: '#64748b', path: 'CashiersDashboard' },
  { icon: Target, label: 'Presupuesto', sublabel: 'Metas', color: '#64748b', path: 'Budget' },
  { icon: Snowflake, label: 'Nevera', sublabel: 'Inventario', color: '#64748b', path: 'FreezerMap' },
  { icon: Clock, label: 'Horarios', sublabel: 'Txn / hora', color: '#64748b', path: 'HourlyTransactions' },
  { icon: BarChart3, label: 'Rankings', sublabel: 'Top performers', color: '#64748b', path: 'Rankings' }];


  const intelItems = [
  { emoji: '↑', text: salesVal !== '—' ? `Ventas hoy: ${salesVal}${salesChange > 0 ? ` · +${salesChange}% vs ayer` : salesChange < 0 ? ` · ${salesChange}% vs ayer` : ''}` : 'Sin datos de ventas aún hoy', type: salesChange >= 0 ? 'good' : 'warn' },
  { emoji: '≡', text: txnVal !== '—' ? `${txnVal} transacciones registradas hoy` : 'Sin transacciones registradas hoy', type: 'info' },
  { emoji: '◎', text: `${cashiers.length} cajeros activos en tienda`, type: 'info' },
  { emoji: '◈', text: ticketVal !== '—' ? `Ticket promedio: ${ticketVal} por transacción` : 'Ingresa ventas para calcular el ticket promedio', type: 'good' },
  { emoji: '!', text: 'Verifica el nivel de stock en la nevera', type: 'warn' },
  { emoji: '+', text: 'Registra las ventas del turno actual', type: 'action' }];


  return (
    <motion.div
      className="min-h-screen flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ background: 'transparent', position: 'relative', zIndex: 1 }}>
      

      {/* ── LEFT SIDEBAR ── */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="hidden lg:flex flex-col w-52 min-h-screen flex-shrink-0 sticky top-0 z-20"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(48px) saturate(160%)',
          borderRight: '1px solid rgba(0,0,0,0.045)',
          boxShadow: '2px 0 24px rgba(0,0,0,0.03)'
        }}>
        
        
        {/* Logo */}
        <div className="px-4 pt-5 pb-4">
          <img src={LOGO_URL} alt="Popsy" className="h-12 object-contain mb-5" />
          {!isGerente && selectedStore &&
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
          style={{ background: 'rgba(194,24,117,0.05)', border: '1px solid rgba(194,24,117,0.09)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
            style={{ boxShadow: '0 0 5px rgba(52,211,153,0.7)' }} />
              <span className="text-[10.5px] font-semibold text-slate-500 truncate">{storeName}</span>
            </div>
          }
        </div>

        {/* Nav */}
        <div className="flex-1 px-2.5 space-y-px overflow-y-auto pb-2">
          {isGerente ? (
            <>
              <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em] px-3 mb-2">Cargar Datos</p>
              {[
                { label: 'PPT Excel', icon: FileSpreadsheet, onClick: onShowBudgetImporter, color: '#059669' },
                { label: 'KPIs Participación', icon: BarChart3, onClick: onShowKpisUploader, color: '#6366f1' },
                { label: 'Agregadores', icon: FileText, onClick: onShowAggregatorsUploader, color: '#f97316' },
                { label: 'P&G Upload', icon: TrendingUp, onClick: onShowPYGUploader, color: '#0ea5e9' },
              ].map(({ label, icon: Icon, onClick, color }) => (
                <motion.button
                  key={label}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
                  style={{ background: 'transparent', border: '1px solid transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon style={{ color, width: 14, height: 14 }} />
                  </div>
                  <span className="text-[12px] font-semibold flex-1 truncate" style={{ color: '#6b7280' }}>{label}</span>
                </motion.button>
              ))}
            </>
          ) : (
            <>
              <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em] px-3 mb-2">Navegación</p>
              {filteredNav.map((item) => {
                const handleClick = () => {
                  if (!item.path) {
                    if (item.onClick === 'onShowPYGModal') onShowPYGModal?.();
                    return;
                  }
                  if (item.label === 'Informe') {
                    setShowAIReport(true);
                    return;
                  }
                  setActiveNav(item.path);
                  window.location.href = `/${item.path}`;
                };
                return (
                  <NavItem key={item.label} item={item} isActive={activeNav === item.path} onClick={handleClick} />);
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-black/5">
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-2"
          style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
              <MascotCanvas width={24} height={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-semibold text-slate-600">Nova AI</p>
              <div className="flex items-center gap-1">
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <p className="text-[9px] text-slate-400">En línea</p>
              </div>
            </div>
          </div>
          <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10.5px] font-medium text-slate-400 hover:text-slate-600 hover:bg-black/[0.03] transition-all">
            <LogOut className="w-3 h-3" />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex overflow-hidden" style={{ height: '100vh' }}>

        {/* CENTER — scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 lg:p-8">

          {/* TOP BAR */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 lg:mb-8">
            
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 lg:mb-6 flex-wrap">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.06))', border: '1px solid rgba(194,24,117,0.12)' }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    
                    <GreetIcon className="w-4 h-4" style={{ color: '#C21875' }} />
                  </motion.div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                      {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-black leading-none"
                    style={{ letterSpacing: '-0.04em', color: '#64748b' }}>
                      {greeting.text}, <span style={{ color: '#C21875', textShadow: '0 0 30px rgba(194,24,117,0.18)' }}>{isGerente ? 'Camilo' : (LEADERS[selectedStore] || 'Tienda')}</span>
                    </h1>
                  </div>
                </div>
                

                
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none sm:max-w-xs">
                  <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} />
                </div>
                {!isGerente &&
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => window.location.href = '/FreezerMap'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-cyan-500 hover:text-cyan-600 transition-all"
                    style={{
                      background: 'rgba(6,182,212,0.07)',
                      border: '1px solid rgba(6,182,212,0.15)'
                    }}>
                    <Snowflake style={{ width: 12, height: 12 }} />
                    <span className="hidden sm:inline">Nevera</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => window.location.href = '/HourlyTransactions'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-violet-500 hover:text-violet-600 transition-all"
                    style={{
                      background: 'rgba(139,92,246,0.07)',
                      border: '1px solid rgba(139,92,246,0.15)'
                    }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    <span className="hidden sm:inline">Txn / Hora</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onShowStoreSales}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-all"
                    style={{
                      background: 'rgba(244,63,94,0.07)',
                      border: '1px solid rgba(244,63,94,0.15)'
                    }}>
                    <Plus style={{ width: 12, height: 12 }} />
                    <span className="hidden sm:inline">Venta</span>
                  </motion.button>
                </div>
                }
              </div>
            </div>
          </motion.div>

          {/* ── GERENTE DASHBOARD ── */}
          {isGerente && <GerenteDashboard />}

          {/* ── HERO SECTION: Premium KPI Cards + Nova AI Strip ── */}
          {!isGerente &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 space-y-3">

            {/* Nova AI Copilot Card — HERO PREMIUM */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative"
              style={{
                borderRadius: 28,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(48px) saturate(160%)',
                WebkitBackdropFilter: 'blur(48px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 2px 10px rgba(194,24,117,0.06), inset 0 1px 0 rgba(255,255,255,1)',
              }}>

              {/* Ambient top glow */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 80,
                pointerEvents: 'none', zIndex: 0, borderRadius: '28px 28px 0 0',
                background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(251,207,232,0.25) 0%, transparent 70%)',
              }} />

              <div className="relative z-10 flex items-center px-6 py-5 gap-4">
                <NovaInsightStrip dailySales={todaySales} budget={budgetData} latestWeather={latestWeather} />
              </div>
            </motion.div>

            {/* Budget Mini Cards — PPT del Día, Brecha del Mes, Proyección */}
            {budgetData && (() => {
              const fmt = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));
              const pptVal = budgetData.excelBudgetForToday > 0 ? budgetData.excelBudgetForToday : budgetData.monthlyBudget ? budgetData.monthlyBudget / 30 : 0;
              const gap = (budgetData.salesUntilYesterday || 0) - (budgetData.budgetUntilYesterday || 0);
              const isPos = gap >= 0;
              const projPct = budgetData.monthProjectionCompliance ?? 0;

              // Sparkline ultra delgada y elegante — sin relleno exagerado
              const Spark = ({ points, color }) => {
                if (!points || points.length < 2) return null;
                const W = 200,H = 40;
                const padX = 2,padY = 6;
                const vals = points.filter((v) => v != null && !isNaN(v));
                if (vals.length < 2) return null;
                const max = Math.max(...vals);
                const min = Math.min(...vals);
                const range = max - min || 1;
                const toX = (i) => padX + i / (vals.length - 1) * (W - padX * 2);
                const toY = (v) => H - padY - (v - min) / range * (H - padY * 2);
                const coords = vals.map((v, i) => [toX(i), toY(v)]);
                // Catmull-Rom → cubic bezier
                let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
                for (let i = 0; i < coords.length - 1; i++) {
                  const p0 = coords[Math.max(i - 1, 0)];
                  const p1 = coords[i];
                  const p2 = coords[i + 1];
                  const p3 = coords[Math.min(i + 2, coords.length - 1)];
                  const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
                  const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
                  const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
                  const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
                  d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
                }
                const [lx, ly] = coords[coords.length - 1];
                const gradId = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
                const areaD = `${d} L${lx.toFixed(1)},${H} L${coords[0][0].toFixed(1)},${H} Z`;
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.08" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill={`url(#${gradId})`} />
                    <path d={d} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={lx} cy={ly} r="2.2" fill={color} />
                    <circle cx={lx} cy={ly} r="4.5" fill={color} opacity="0.12" />
                  </svg>);

              };

              // Tendencias ÚNICAS por card
              const sorted14 = [...todaySales].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);

              // PPT: cumplimiento diario (% de ventas vs meta diaria)
              const dailyBudgetForSpark = budgetData.monthlyBudget > 0 ? budgetData.monthlyBudget / 30 : 1;
              const sparkPPT = sorted14.map((d) => dailyBudgetForSpark > 0 ? (d.total_sales || 0) / dailyBudgetForSpark * 100 : 0);

              // Brecha: diferencia diaria acumulada ventas - presupuesto (acumulado día a día)
              const sparkGap = sorted14.map((d, i, arr) => {
                const accSales = arr.slice(0, i + 1).reduce((s, x) => s + (x.total_sales || 0), 0);
                const dailyBudgetBase = budgetData.monthlyBudget > 0 ? budgetData.monthlyBudget / 30 : 0;
                const accBudget = dailyBudgetBase * (i + 1);
                return accSales - accBudget;
              });

              // Proyección: compliance acumulado día a día (% ventas acumuladas / presupuesto esperado)
              const sparkProj = sorted14.map((d, i, arr) => {
                const accSales = arr.slice(0, i + 1).reduce((s, x) => s + (x.total_sales || 0), 0);
                const dailyBudgetBase = budgetData.monthlyBudget > 0 ? budgetData.monthlyBudget / 30 : 1;
                const accBudget = dailyBudgetBase * (i + 1);
                return accBudget > 0 ? accSales / accBudget * 100 : 0;
              });

              const cards = [
              {
                label: 'PPT del Día',
                value: fmt(pptVal),
                sub: budgetData.gapRecoveryIncrement > 0 && budgetData.excelBudgetForToday > 0 ?
                `+${budgetData.incrementPct}% recuperación` :
                'meta diaria',
                accent: '#C21875',
                spark: sparkPPT,
                delay: 0.05,
                key: 'ppt',
                detail: [
                { label: 'PPT hoy', value: fmt(pptVal) },
                { label: 'PPT mensual', value: fmt(budgetData.monthlyBudget || 0) },
                { label: 'Incremento recuperación', value: budgetData.incrementPct ? `+${budgetData.incrementPct}%` : '—' },
                { label: 'Días restantes', value: budgetData.remainingDays ?? '—' }]

              },
              {
                label: 'Brecha del Mes',
                value: fmt(gap),
                sub: budgetData.monthlyBudget > 0 ?
                `${isPos ? 'Sobre' : 'Bajo'} meta · ${Math.abs(gap / budgetData.monthlyBudget * 100).toFixed(0)}%` :
                '',
                accent: isPos ? '#059669' : '#e11d48',
                spark: sparkGap,
                delay: 0.1,
                prefix: isPos ? '▲' : '▼',
                key: 'gap',
                detail: [
                { label: 'Ventas acumuladas', value: fmt(budgetData.salesUntilYesterday || 0) },
                { label: 'PPT acumulado', value: fmt(budgetData.budgetUntilYesterday || 0) },
                { label: 'Brecha', value: fmt(gap) },
                { label: 'Brecha %', value: `${Math.abs(gap / (budgetData.monthlyBudget || 1) * 100).toFixed(1)}%` }]

              },
              {
                label: 'Proyección Cierre',
                value: `${projPct.toFixed(0)}%`,
                sub: `${fmt(budgetData.monthProjection)} / ${fmt(budgetData.monthlyBudget)}`,
                accent: '#7c3aed',
                spark: sparkProj,
                delay: 0.15,
                key: 'proj',
                detail: [
                { label: 'Proyección cierre', value: fmt(budgetData.monthProjection || 0) },
                { label: 'PPT mensual', value: fmt(budgetData.monthlyBudget || 0) },
                { label: 'Cumplimiento', value: `${projPct.toFixed(1)}%` },
                { label: 'Ritmo diario req.', value: fmt(budgetData.dailyRequiredSales || 0) }]

              }];


              // Build rich chart data for each modal
              const dailyBudgetBase = budgetData.monthlyBudget > 0 ? budgetData.monthlyBudget / 30 : 0;
              const chartSales14 = sorted14.map((d, i) => ({
                day: format(parseISO(d.date), 'd/M'),
                ventas: Math.round(d.total_sales || 0),
                ppt: Math.round(dailyBudgetBase),
                brecha: Math.round((d.total_sales || 0) - dailyBudgetBase),
                cumplimiento: dailyBudgetBase > 0 ? Math.round((d.total_sales || 0) / dailyBudgetBase * 100) : 0,
                acumVentas: Math.round(sorted14.slice(0, i + 1).reduce((s, x) => s + (x.total_sales || 0), 0)),
                acumPPT: Math.round(dailyBudgetBase * (i + 1))
              }));

              const modalCharts = {
                ppt: {
                  title: 'PPT del Día — Ventas vs Meta Diaria',
                  subtitle: 'Últimos 14 días · COP',
                  color: '#C21875',
                  stats: [
                  { label: 'Meta hoy', value: fmt(pptVal), color: '#C21875' },
                  { label: 'PPT mensual', value: fmt(budgetData.monthlyBudget || 0), color: '#94a3b8' },
                  { label: 'Días restantes', value: `${budgetData.remainingDays ?? '—'} días`, color: '#f59e0b' },
                  { label: 'Incremento recup.', value: budgetData.incrementPct ? `+${budgetData.incrementPct}%` : 'Sin brecha', color: '#10b981' }],

                  chart:
                  <ResponsiveContainer width="100%" height={160}>
                     <LineChart data={chartSales14}>
                       <defs>
                         <linearGradient id="gradPPT" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#C21875" stopOpacity={0.15} />
                           <stop offset="100%" stopColor="#C21875" stopOpacity={0} />
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                       <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                       <YAxis domain={[0, 140]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />
                       <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                       <ReferenceLine y={100} stroke="#C21875" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: '100%', position: 'right', fontSize: 9, fill: '#C21875' }} />
                       <Line type="monotone" dataKey="cumplimiento" stroke="#C21875" strokeWidth={2.5} dot={{ r: 3, fill: '#C21875' }} activeDot={{ r: 5 }} />
                     </LineChart>
                   </ResponsiveContainer>

                },
                gap: {
                  title: 'Brecha Acumulada del Mes',
                  subtitle: 'Diferencia ventas - presupuesto acumulado',
                  color: isPos ? '#059669' : '#e11d48',
                  stats: [
                  { label: 'Ventas acumuladas', value: fmt(budgetData.salesUntilYesterday || 0), color: '#059669' },
                  { label: 'PPT acumulado', value: fmt(budgetData.budgetUntilYesterday || 0), color: '#94a3b8' },
                  { label: 'Brecha total', value: fmt(gap), color: isPos ? '#059669' : '#e11d48' },
                  { label: 'Brecha %', value: `${Math.abs(gap / (budgetData.monthlyBudget || 1) * 100).toFixed(1)}%`, color: '#7c3aed' }],

                  chart:
                  <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartSales14}>
                        <defs>
                          <linearGradient id="gradGap" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isPos ? '#059669' : '#e11d48'} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={isPos ? '#059669' : '#e11d48'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`} width={38} />
                        <Tooltip formatter={(v, n) => [fmt(v), n === 'acumVentas' ? 'Ventas acum.' : 'PPT acum.']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                        <ReferenceLine y={0} stroke="#e2e8f0" />
                        <Area type="monotone" dataKey="acumVentas" stroke={isPos ? '#059669' : '#e11d48'} strokeWidth={2} fill="url(#gradGap)" />
                        <Line type="monotone" dataKey="acumPPT" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>

                },
                proj: {
                  title: 'Proyección de Cierre del Mes',
                  subtitle: 'Cumplimiento diario acumulado · %',
                  color: '#7c3aed',
                  stats: [
                  { label: 'Proyección cierre', value: fmt(budgetData.monthProjection || 0), color: '#7c3aed' },
                  { label: 'PPT mensual', value: fmt(budgetData.monthlyBudget || 0), color: '#94a3b8' },
                  { label: 'Cumplimiento', value: `${projPct.toFixed(1)}%`, color: projPct >= 100 ? '#059669' : projPct >= 80 ? '#f59e0b' : '#e11d48' },
                  { label: 'Ritmo diario req.', value: fmt(budgetData.dailyRequiredSales || 0), color: '#f59e0b' }],

                  chart:
                  <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartSales14}>
                        <defs>
                          <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 140]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                        <ReferenceLine y={100} stroke="#7c3aed" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: '100%', position: 'right', fontSize: 9, fill: '#7c3aed' }} />
                        <Line type="monotone" dataKey="cumplimiento" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>

                }
              };

              const activeModal = kpiModal ? modalCharts[kpiModal] : null;
              const activeCard = cards.find((c) => c.key === kpiModal);

              return (
                <>
                {/* KPI Detail Modal */}
                <AnimatePresence>
                  {activeModal && activeCard &&
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setKpiModal(null)}
                      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(8px)' }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 24 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.96)',
                          backdropFilter: 'blur(48px)',
                          boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5)'
                        }}>
                        
                        {/* Colored header band */}
                        <div className="relative p-5 pb-4" style={{ background: `linear-gradient(135deg, ${activeModal.color}10, ${activeModal.color}04)`, borderBottom: `1px solid ${activeModal.color}15` }}>
                          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${activeModal.color}, ${activeModal.color}40)` }} />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">{activeModal.title}</p>
                              <p className="text-[28px] font-black tracking-tight leading-none" style={{ color: activeModal.color }}>
                                {activeCard.prefix && <span className="mr-1 text-xl">{activeCard.prefix}</span>}
                                {activeCard.value}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">{activeModal.subtitle}</p>
                            </div>
                            <button onClick={() => setKpiModal(null)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/[0.06] transition-colors mt-0.5">
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                          {/* Stat pills */}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {activeModal.stats.map(({ label, value, color }) =>
                            <div key={label} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <p className="text-[9px] text-slate-400 font-medium mb-0.5">{label}</p>
                                <p className="text-[13px] font-bold tabular-nums leading-none" style={{ color }}>{value}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chart area */}
                        <div className="p-5 pt-4">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-300 mb-3">Tendencia · últimos 14 días</p>
                          {chartSales14.length >= 2 ? activeModal.chart :
                          <div className="h-40 flex items-center justify-center text-[11px] text-slate-300">Sin suficientes datos históricos</div>
                          }
                        </div>

                        {/* CTA */}
                        <div className="px-5 pb-5">
                          <button
                            onClick={() => {setKpiModal(null);onShowBudgetDashboard?.();}}
                            className="w-full py-2.5 rounded-xl text-[11.5px] font-semibold transition-all active:scale-98"
                            style={{ background: `linear-gradient(135deg, ${activeModal.color}18, ${activeModal.color}08)`, color: activeModal.color, border: `1px solid ${activeModal.color}25` }}>
                            Ver presupuesto completo →
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                    }
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {cards.map((c) =>
                    <motion.div
                      key={c.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: c.delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      onClick={() => setKpiModal(c.key)}
                      className="relative rounded-2xl p-3 sm:p-4 flex flex-col gap-1 overflow-hidden cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(40px)',
                        border: `1px solid ${c.accent}18`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04), 0 0 0 0.5px ${c.accent}10, inset 0 1px 0 rgba(255,255,255,1)`,
                        transition: 'box-shadow 0.25s, transform 0.22s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 0 24px ${c.accent}18, 0 0 0 1px ${c.accent}20, inset 0 1px 0 rgba(255,255,255,1)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04), 0 0 0 0.5px ${c.accent}10, inset 0 1px 0 rgba(255,255,255,1)`;
                      }}>
                      
                      {/* Top accent bar — fully opaque */}
                      
                      {/* Bottom ambient bleed */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 rounded-b-2xl pointer-events-none" style={{ background: `linear-gradient(0deg, ${c.accent}06, transparent)` }} />

                      {/* Label */}
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: `${c.accent}99` }}>{c.label}</p>

                      {/* Value + Sparkline */}
                      <div className="flex items-end gap-0 w-full" style={{ minHeight: 48 }}>
                        <div className="flex-shrink-0 flex flex-col justify-end">
                          <p className="text-[15px] sm:text-[18px] font-black leading-none tabular-nums" style={{ color: c.accent, letterSpacing: '-0.03em' }}>
                            {c.prefix && <span className="mr-0.5 text-[12px] sm:text-[14px] font-bold">{c.prefix}</span>}
                            {c.value}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-semibold mt-1.5 tracking-wide" style={{ color: `${c.accent}70` }}>{c.sub}</p>
                        </div>
                        <div className="flex-1 min-w-0" style={{ height: 48 }}>
                          <Spark points={c.spark} color={c.accent} />
                        </div>
                      </div>
                    </motion.div>
                    )}
                </div>
                </>);

            })()}

            {/* ── TAKEAWAY CARD ── */}
            {!isGerente &&
            <TakeawayCard
              dailySales={todaySales}
              budget={takeawayBudgetOverride ?? activeBudget?.takeaway_budget ?? 0}
              storeBudget={activeBudget?.sales_budget ?? 0}
              onBudgetChange={async (val) => {
                setTakeawayBudgetOverride(val);
                if (activeBudget?.id) {
                  await base44.entities.Budget.update(activeBudget.id, { takeaway_budget: val });
                }
              }} />

            }

            {/* ── PRODUCT × TICKET ANALYSIS ── */}
            {salesReports && salesReports.length > 0 && selectedStore &&
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}>
              
                <ProductTicketAnalysis storeId={selectedStore} budget={budget} />
              </motion.div>
            }


































































































            
          </motion.div>
          }

          {/* ── WEEKLY COMPARISON ── */}
          {!isGerente &&
          <WeeklyComparison dailySales={todaySales} />
          }

          {/* ── PREMIUM MAIN CHART ── */}
           {!isGerente &&
          <PremiumMainChart
            dailySales={todaySales}
            activeBudget={budget.length > 0 ? budget.find((b) => {
              const now = new Date();
              return Number(b.month) === now.getMonth() + 1 && Number(b.year) === now.getFullYear();
            }) : null}
            dailyBudgets={dailyBudgets} />

          }

          {/* ── DAILY METRICS ── */}
           {!isGerente &&
          <DailyMetricsPanel todaySales={todaySales} budget={budget} />
          }

          {/* ── EXECUTIVE ANALYTICS ── */}
          {!isGerente &&
          <ExecutiveAnalyticsPanel
            todaySales={todaySales}
            budget={budget}
            cashiers={cashiers}
            pygReports={pygReports}
            shiftRecords={shiftRecords}
            products={salesReports}
            storeCode={selectedStore} />

          }

          {/* ── QUICK ACTIONS ── */}
          {!isGerente &&
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 lg:mb-7">
            
              {[
            { label: 'Registrar Ventas', icon: TrendingUp, onClick: onShowStoreSales },
            { label: 'Presupuesto Mensual', icon: Target, onClick: onShowBudgetDashboard },
            { label: 'Informe Gerencial', icon: FileText, onClick: onShowReport }].
            map(({ label, icon: I, onClick }) =>
            <button key={label} onClick={onClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-black/[0.03] transition-all group hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.7)' }}>
                  <I style={{ width: 12, height: 12, color: '#9ca3af' }} />
                  {label}
                  <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-slate-400 transition-colors" />
                </button>
            )}
            </motion.div>
          }

          {/* ── CLIMA BANNER ── */}
          {!isGerente && <motion.div
            id="climate-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 lg:mb-7 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">

            {/* Card 1 — Temperatura del día + impacto en ventas */}
            {(() => {
              const tempData = weatherLast7.map((d) => d.temperature_mean || d.temperature_max || 0);
              const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
              const tempMax = latestWeather?.temperature_max;
              const tempMin = latestWeather?.temperature_min;
              const isHot = temp > 26;
              const isCold = temp < 18;
              const accentColor = isHot ? '#f97316' : isCold ? '#6366f1' : '#38bdf8';
              const impactLabel = isHot ? '🔥 +15–25% ventas est.' : isCold ? '❄️ −10–15% ventas est.' : '✅ Condición ideal';
              const impactColor = isHot ? '#f97316' : isCold ? '#6366f1' : '#10b981';
              const avgTemp7 = tempData.length > 0 ? tempData.reduce((a, b) => a + b, 0) / tempData.length : 0;
              const tempTrend = temp != null && avgTemp7 > 0 ? temp - avgTemp7 : 0;
              return (
                <div className="rounded-2xl p-4 hover-lift flex flex-col gap-0"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                 <div className="flex items-center justify-between mb-0.5">
                   <p className="label-premium">Temperatura · 7 días</p>
                    <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: accentColor }}>{isHot ? '☀️ Calor' : isCold ? '❄️ Frío' : '🌤 Fresco'}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-lg sm:text-[22px] font-black text-slate-800 leading-none">{temp != null ? `${Math.round(temp)}°` : '—'}</p>
                    {tempMax != null && tempMin != null &&
                    <p className="text-[10px] text-slate-400 font-medium">↑{Math.round(tempMax)}° ↓{Math.round(tempMin)}°</p>
                    }
                    {tempTrend !== 0 && <span className="text-[9px] font-bold ml-1" style={{ color: tempTrend > 0 ? '#f97316' : '#38bdf8' }}>{tempTrend > 0 ? '▲' : '▼'}{Math.abs(tempTrend).toFixed(1)}°</span>}
                  </div>
                  <div className="flex items-end gap-1 h-10 mt-1 mb-2">
                    {(tempData.length > 0 ? tempData : [20, 22, 21, 24, 23, 25, 24]).map((v, i, arr) => {
                      const pct = Math.max(v / Math.max(...arr, 1) * 100, 8);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex-1 rounded-t-md"
                        style={{ height: `${pct}%`, background: isLast ? accentColor : `${accentColor}28` }} />);
                    })}
                  </div>
                  <div className="rounded-lg px-2 py-1.5 flex items-center gap-1.5" style={{ background: `${impactColor}10`, border: `1px solid ${impactColor}20` }}>
                    <span className="text-[8.5px] font-bold flex-1" style={{ color: impactColor }}>{impactLabel}</span>
                  </div>
                  <p className="text-[8px] text-slate-300 mt-1.5 font-medium">vs prom. semana: {avgTemp7 > 0 ? `${Math.round(avgTemp7)}°C` : '—'}</p>
                </div>);
            })()}

            {/* Card 2 — Lluvia */}
            {(() => {
              const rainData = weatherLast7.map((d) => d.precipitation || 0);
              const totalRain = rainData.reduce((s, v) => s + v, 0);
              const todayRain = latestWeather?.precipitation ?? 0;
              const rainLevel = totalRain > 20 ? 'Alta' : totalRain > 5 ? 'Moderada' : 'Baja';
              const rainColor = totalRain > 20 ? '#6366f1' : totalRain > 5 ? '#38bdf8' : '#94a3b8';
              const rainyDays = rainData.filter((v) => v >= 3).length;
              const dryDays = rainData.length - rainyDays;
              const trafficAlert = todayRain >= 5 ? { msg: '⚠️ Flujo peatonal reducido', color: '#ef4444' } :
              todayRain >= 2 ? { msg: '🌂 Tráfico moderado', color: '#f59e0b' } :
              { msg: '🚶 Buen tráfico esperado', color: '#10b981' };
              return (
                <div className="rounded-2xl p-4 hover-lift flex flex-col gap-0"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                 <div className="flex items-center justify-between mb-0.5">
                   <p className="label-premium">Lluvia · 7 días</p>
                    <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: rainColor }}>🌧 {rainLevel}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-lg sm:text-[22px] font-black text-slate-800 leading-none">{todayRain > 0 ? `${todayRain.toFixed(1)}` : '0'}<span className="text-[10px] sm:text-[12px] font-semibold text-slate-400">mm</span></p>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">hoy</p>
                  </div>
                  <div className="flex items-end gap-1 h-10 mt-1 mb-2">
                    {(rainData.length > 0 ? rainData : [0, 2, 1, 5, 3, 8, 4]).map((v, i, arr) => {
                      const pct = Math.max(v / Math.max(...arr, 0.1) * 100, 4);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex-1 rounded-t-md"
                        style={{ height: `${pct}%`, background: isLast ? rainColor : `${rainColor}30` }} />);
                    })}
                  </div>
                  <div className="rounded-lg px-2 py-1.5 flex items-center gap-1.5" style={{ background: `${trafficAlert.color}10`, border: `1px solid ${trafficAlert.color}20` }}>
                    <span className="text-[8.5px] font-bold flex-1" style={{ color: trafficAlert.color }}>{trafficAlert.msg}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[8px] text-slate-300 font-medium">Total: {totalRain.toFixed(1)} mm</p>
                    <p className="text-[8px] text-slate-300 font-medium">{rainyDays}d lluvia · {dryDays}d seco</p>
                  </div>
                </div>);
            })()}

            {/* Card 3 — Condición climática */}
            {(() => {
              const humidity = latestWeather?.humidity ?? 0;
              const precip = latestWeather?.precipitation ?? 0;
              const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max ?? 0;
              const sunny = weatherLast7.filter((d) => (d.precipitation || 0) < 1).length;
              const rainy = weatherLast7.filter((d) => (d.precipitation || 0) >= 5).length;
              const cloudy = weatherLast7.length - sunny - rainy;
              const total = Math.max(weatherLast7.length, 1);
              const segments = [
              { label: 'Soleado', color: '#f97316', val: sunny },
              { label: 'Nublado', color: '#94a3b8', val: cloudy },
              { label: 'Lluvioso', color: '#6366f1', val: rainy }];
              const circ = 2 * Math.PI * 16;
              let cumulative = 0;
              const salesScore = Math.max(0, Math.min(100, Math.round(
                (temp > 0 ? Math.min((temp - 10) / 20 * 60, 60) : 0) + (
                precip < 1 ? 30 : precip < 3 ? 15 : 0) + (
                humidity > 0 && humidity < 70 ? 10 : 0)
              )));
              const scoreColor = salesScore >= 70 ? '#10b981' : salesScore >= 45 ? '#f59e0b' : '#ef4444';
              const scoreLabel = salesScore >= 70 ? 'Ideal para vender' : salesScore >= 45 ? 'Condición regular' : 'Día difícil';
              return (
                <div className="rounded-2xl p-4 flex flex-col hover-lift"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                 <div className="flex items-center justify-between mb-0.5">
                   <p className="label-premium">Condición · semana</p>
                   <span className="text-[8px] font-semibold" style={{ color: scoreColor }}>💧 {humidity > 0 ? `${Math.round(humidity)}%` : '—'} hum.</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 mb-2">
                    <svg width="44" height="44" viewBox="0 0 48 48" className="flex-shrink-0">
                      <circle cx="24" cy="24" r="16" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                      {segments.map(({ color, val }) => {
                        const pct = val / total;
                        const dash = pct * circ;
                        const offset = -cumulative * circ;
                        cumulative += pct;
                        return (
                          <circle key={color} cx="24" cy="24" r="16" fill="none"
                          stroke={color} strokeWidth="6"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeDashoffset={offset}
                          strokeLinecap="butt"
                          transform="rotate(-90 24 24)" />);
                      })}
                    </svg>
                    <div className="flex flex-col gap-0.5">
                      {segments.map(({ label, color, val }) =>
                      <div key={label} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[8.5px] text-slate-400 font-medium">{label}</span>
                          <span className="text-[8.5px] font-bold text-slate-600 ml-auto pl-1">{val}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg px-2 py-1.5" style={{ background: `${scoreColor}10`, border: `1px solid ${scoreColor}20` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8.5px] font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                      <span className="text-[9px] font-black" style={{ color: scoreColor }}>{salesScore}/100</span>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ background: `${scoreColor}20` }}>
                      <div className="h-1 rounded-full transition-all" style={{ width: `${salesScore}%`, background: scoreColor }} />
                    </div>
                  </div>
                </div>);
            })()}

          </motion.div>}

          <div className="flex items-center justify-center gap-2 mt-8 mb-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(194,24,117,0.12))' }} />
            <p className="text-[8px] font-semibold tracking-[0.22em] uppercase" style={{ color: 'rgba(194,24,117,0.35)' }}>Popsy AI Workspace</p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(194,24,117,0.12), transparent)' }} />
          </div>
        </div>

        {/* ── RIGHT AI PANEL ── */}
        











































































































        
        </main>

      {/* ── AI EXECUTIVE REPORT MODAL ── */}
      <AIExecutiveReport
        isOpen={showAIReport}
        onClose={() => setShowAIReport(false)}
        storeName={storeName}
        storeCode={selectedStore}
        todaySales={todaySales}
        budget={budget}
        cashiers={cashiers}
        shiftRecords={shiftRecords} />
      
      </motion.div>);


}