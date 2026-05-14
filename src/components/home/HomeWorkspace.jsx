import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, TrendingUp, Activity, Target, Bell,
  Download, FileText, Lock, Receipt, Snowflake, Settings as SettingsIcon,
  CalendarDays, LogOut, Sparkles, Trophy, FileSpreadsheet, BarChart3, Clock,
  ChevronRight, Zap, BarChart2, ArrowUpRight, ArrowDownRight, Minus,
  Brain, Sun, Moon, Coffee, Send, Cpu, TrendingDown, Plus } from
'lucide-react';
import { STORES } from '@/components/StoreSelector';
import StoreSelector from '@/components/StoreSelector';
import PremiumSparkline from './PremiumSparkline';
import ExecutiveAnalyticsPanel from './ExecutiveAnalyticsPanel';
import DailyMetricsPanel from './DailyMetricsPanel';
import PremiumMainChart from './PremiumMainChart';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69283c2afdca20b432943911/6a749247d_Capturadepantalla2025-11-251251441.png";
const MASCOT_IMG = "https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png";

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
{ icon: Snowflake, label: 'Mapa Nevera', path: 'FreezerMap', color: '#374151', roles: ['lider', 'embajador', 'gerente'] }];


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
      className="relative rounded-2xl p-4 cursor-default group"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
      }}>
      
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
      <p className="text-[22px] font-black text-slate-800 leading-none tracking-tight mb-0.5 tabular-nums">{value}</p>
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
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors"
      style={isActive ? {
        background: 'rgba(194,24,117,0.07)',
        border: '1px solid rgba(194,24,117,0.12)'
      } : { background: 'transparent', border: '1px solid transparent' }}>
      
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
      style={isActive ?
      { background: 'rgba(194,24,117,0.1)' } :
      { background: 'rgba(0,0,0,0.03)' }}>
        <Icon style={{ color: isActive ? '#C21875' : '#9ca3af', width: 13, height: 13 }} />
      </div>
      <span className="text-xs font-medium flex-1 truncate"
      style={{ color: isActive ? '#C21875' : '#6b7280' }}>
        {item.label}
      </span>
      {isActive &&
      <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: '#C21875' }} />
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
      <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 mt-0.5 ring-1 ring-black/5">
          <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
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
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const conversationRef = useRef(null);

  const storeName = selectedStoreName || STORES.find((s) => s.code === selectedStore)?.name || 'Tu Tienda';
  const isGerente = selectedRole === 'gerente';

  const { data: todaySales = [] } = useQuery({
    queryKey: ['home-today-sales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
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
    <motion.div className="min-h-screen flex"
    animate={{
      backgroundPosition: ['0% 0%', '50% 50%', '0% 0%']
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    style={{
      background: 'linear-gradient(155deg, #FAFBFF 0%, #FFFFFF 45%, #F8F8FC 100%, #FFFBFE 100%)',
      backgroundSize: '300% 300%'
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="hidden lg:flex flex-col w-52 min-h-screen flex-shrink-0 sticky top-0 z-20"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(32px)',
          borderRight: '1px solid rgba(0,0,0,0.05)'
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
          <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.14em] px-3 mb-2">Navegación</p>
          {filteredNav.map((item) => {
            const handleClick = () => {
              if (!item.path) {
                if (item.onClick === 'onShowPYGModal') onShowPYGModal?.();
                return;
              }
              setActiveNav(item.path);
              window.location.href = `/${item.path}`;
            };
            return (
              <NavItem key={item.label} item={item} isActive={activeNav === item.path} onClick={handleClick} />);

          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-black/5">
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-2"
          style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img src={MASCOT_IMG} alt="Nova" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] font-semibold text-slate-600">Nova AI</p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
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
        <div className="flex-1 min-w-0 overflow-y-auto p-2 sm:p-4 lg:p-7">

          {/* TOP BAR */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 lg:mb-7">
            
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 lg:mb-5 flex-wrap">
              <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <GreetIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: greeting.color, opacity: 0.7 }} />
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-700 tracking-tight truncate">
                    {greeting.text}, {LEADERS[selectedStore] || 'Tienda'}
                  </h1>
                </div>
                <p className="text-[11px] sm:text-[12px] text-slate-400 font-medium leading-snug max-w-sm">
                  {getDynamicPhrase()}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none sm:max-w-xs">
                  <StoreSelector selectedStore={selectedStore} onStoreChange={onStoreChange} />
                </div>
                {!isGerente &&
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onShowStoreSales}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex-shrink-0 transition-all"
                  style={{
                    background: 'rgba(244,63,94,0.07)',
                    border: '1px solid rgba(244,63,94,0.15)'
                  }}>
                    <Plus style={{ width: 12, height: 12 }} />
                    <span className="hidden sm:inline">Venta</span>
                  </motion.button>
                }
              </div>
              {isGerente &&
              <div className="hidden sm:flex items-center gap-1.5 ml-auto">
                  {[
                { label: 'PPT', icon: FileSpreadsheet, onClick: onShowBudgetImporter },
                { label: 'KPIs', icon: BarChart3, onClick: onShowKpisUploader },
                { label: 'P&G', icon: TrendingUp, onClick: onShowPYGUploader }].
                map(({ label, icon: I, onClick }) =>
                <button key={label} onClick={onClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-black/[0.04] transition-all"
                style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                      <I style={{ width: 11, height: 11 }} />{label}
                    </button>
                )}
                </div>
              }
            </div>
          </motion.div>

          {/* ── HERO SECTION: Premium KPI Cards + Nova AI Strip ── */}
          {!isGerente &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 space-y-3">

            {/* Nova AI Strip — Premium Enterprise SaaS Copilot */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.88) 100%)',
                backdropFilter: 'blur(48px) saturate(120%)',
                border: '1px solid rgba(194, 24, 117, 0.08)',
                boxShadow: '0 8px 32px rgba(194, 24, 117, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.5)'
              }}>
              
              <div className="flex items-center h-16 px-6 gap-4">
                
                {/* Avatar Nova Mascota */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(194, 24, 117, 0.14) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(194, 24, 117, 0.08) 100%)',
                    border: '1.5px solid rgba(194, 24, 117, 0.18)',
                    boxShadow: '0 0 20px rgba(194, 24, 117, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
                  }}>
                  
                  {/* Glow pulsante */}
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      background: 'radial-gradient(circle, rgba(194, 24, 117, 0.25), transparent 70%)',
                      filter: 'blur(10px)',
                      zIndex: 1
                    }} />
                  
                  {/* Imagen mascota Nova */}
                  <img 
                    src="https://media.base44.com/images/public/69283c2afdca20b432943911/6c55eb1bb_generated_image.png" 
                    alt="Nova" 
                    className="w-full h-full object-contain scale-[1.4] relative z-10"
                  />
                </motion.div>

                {/* Separador elegante */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-250 to-transparent opacity-25" />

                {/* Insight Premium Horizontal */}
                <div className="flex-1 min-w-0 flex items-center">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-[12.5px] leading-relaxed font-medium text-slate-700"
                    style={{ letterSpacing: '0.3px' }}>
                    {latest?.total_sales > 0 
                      ? (() => {
                          const salesM = (latest.total_sales / 1000000).toFixed(1);
                          const projection = ((latest.total_sales / new Date().getHours()) * 24 / 1000000).toFixed(1);
                          return (
                            <>
                              <span className="text-slate-600">Ritmo excelente · </span>
                              <span className="text-slate-700">ventas </span>
                              <span style={{ 
                                color: '#C21875', 
                                fontWeight: 800,
                                fontSize: '13px',
                                letterSpacing: '-0.3px'
                              }}>${salesM}M</span>
                              <span className="text-slate-600"> → proyección </span>
                              <span style={{ 
                                color: '#C21875', 
                                fontWeight: 800,
                                fontSize: '13px',
                                letterSpacing: '-0.3px'
                              }}>${projection}M</span>
                            </>
                          );
                        })()
                      : <span className="text-slate-500">Registra ventas para ver insights personalizados</span>}
                  </motion.p>
                </div>

                {/* Botón Premium SaaS */}
                <motion.button
                  whileHover={{ scale: 1.04, y: -0.5 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 backdrop-blur-md transition-all duration-300 relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(194, 24, 117, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
                    border: '1.5px solid rgba(194, 24, 117, 0.15)',
                    color: '#C21875',
                    boxShadow: '0 4px 12px rgba(194, 24, 117, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
                  }}>
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-lg"
                    style={{ 
                      background: 'radial-gradient(circle at center, rgba(194, 24, 117, 0.08), transparent)',
                      zIndex: -1
                    }} />
                  Ver análisis
                </motion.button>

              </div>
            </motion.div>

            {/* Premium KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* Sales */}
              <div className="rounded-2xl p-4" style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
              }}>
                <p className="text-[10px] font-bold text-rose-500 tracking-widest uppercase mb-3">Venta del día</p>
                <p className="text-[28px] font-black text-slate-800 leading-none mb-2">
                  {latest?.total_sales ? `$${(latest.total_sales / 1000).toFixed(1)}K` : '—'}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[11px] font-semibold text-emerald-500">↑ 12.5%</span>
                  <span className="text-[10px] text-slate-400">vs ayer</span>
                </div>
                <PremiumSparkline data={sparkSales} color="#ef4444" width={100} height="24" />
              </div>

              {/* Cumplimiento */}
              <div className="rounded-2xl p-4" style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
              }}>
                <p className="text-[10px] font-bold text-violet-500 tracking-widest uppercase mb-3">Cumplimiento</p>
                <p className="text-[28px] font-black text-slate-800 leading-none mb-2">
                  {dailyBudgets?.find(d => new Date(d.date).toDateString() === new Date().toDateString())?.sales_budget && latest?.total_sales
                    ? `${((latest.total_sales / dailyBudgets.find(d => new Date(d.date).toDateString() === new Date().toDateString()).sales_budget) * 100).toFixed(1)}%`
                    : '—'}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[11px] font-semibold text-emerald-500">↑ 5.2%</span>
                  <span className="text-[10px] text-slate-400">vs ayer</span>
                </div>
                <PremiumSparkline data={sparkSales} color="#8b5cf6" width={100} height="24" />
              </div>

              {/* Proyección del mes */}
              <div className="rounded-2xl p-4" style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
              }}>
                <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase mb-3">Proyección del mes</p>
                <p className="text-[28px] font-black text-slate-800 leading-none mb-2">
                  {latest?.total_sales ? `$${((latest.total_sales / new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() / 1000000).toFixed(2)}M` : '—'}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[10px] text-slate-500">90% de la meta</span>
                </div>
                <PremiumSparkline data={sparkSales} color="#3b82f6" width={100} height="24" />
              </div>

              {/* Transacciones */}
              <div className="rounded-2xl p-4" style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
              }}>
                <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-3">Transacciones</p>
                <p className="text-[28px] font-black text-slate-800 leading-none mb-2">
                  {latest?.total_transactions ? `${latest.total_transactions.toLocaleString()}` : '—'}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[11px] font-semibold text-emerald-500">↑ 8.7%</span>
                  <span className="text-[10px] text-slate-400">vs ayer</span>
                </div>
                <PremiumSparkline data={sparkTxn} color="#10b981" width={100} height="24" />
              </div>

            </div>
          </motion.div>
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
            products={salesReports} />

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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 lg:mb-7 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">

            {/* Card 1 — Temperatura del día + tendencia 7 días (barras) */}
            {(() => {
              const tempData = weatherLast7.map((d) => d.temperature_mean || d.temperature_max || 0);
              const maxTemp = Math.max(...tempData, 1);
              const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max;
              const tempMax = latestWeather?.temperature_max;
              const tempMin = latestWeather?.temperature_min;
              const isHot = temp > 26;
              const accentColor = isHot ? '#f97316' : '#38bdf8';
              return (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Temperatura · 7 días</p>
                    <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: accentColor }}>{isHot ? '☀️ Calor' : '🌤 Fresco'}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-lg sm:text-[22px] font-black text-slate-800 leading-none">{temp != null ? `${Math.round(temp)}°` : '—'}</p>
                    {tempMax != null && tempMin != null &&
                    <p className="text-[10px] text-slate-400 font-medium">↑{Math.round(tempMax)}° ↓{Math.round(tempMin)}°</p>
                    }
                  </div>
                  <div className="flex items-end gap-1 h-11 mt-2">
                    {(tempData.length > 0 ? tempData : [20, 22, 21, 24, 23, 25, 24]).map((v, i, arr) => {
                      const pct = Math.max(v / Math.max(...arr, 1) * 100, 8);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex-1 rounded-t-md"
                        style={{ height: `${pct}%`, background: isLast ? accentColor : `${accentColor}28` }} />);

                    })}
                  </div>
                  <p className="text-[9px] text-slate-300 mt-1.5 font-medium">Últimos 7 días · °C</p>
                </div>);

            })()}

            {/* Card 2 — Precipitación (barras) últimos 7 días */}
            {(() => {
              const rainData = weatherLast7.map((d) => d.precipitation || 0);
              const totalRain = rainData.reduce((s, v) => s + v, 0);
              const maxRain = Math.max(...rainData, 1);
              const todayRain = latestWeather?.precipitation ?? 0;
              const rainLevel = totalRain > 20 ? 'Alta' : totalRain > 5 ? 'Moderada' : 'Baja';
              const rainColor = totalRain > 20 ? '#6366f1' : totalRain > 5 ? '#38bdf8' : '#94a3b8';
              return (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Lluvia · 7 días</p>
                    <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: rainColor }}>🌧 {rainLevel}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-lg sm:text-[22px] font-black text-slate-800 leading-none">{todayRain > 0 ? `${todayRain.toFixed(1)}` : '0'}<span className="text-[10px] sm:text-[12px] font-semibold text-slate-400">mm</span></p>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">hoy</p>
                  </div>
                  <div className="flex items-end gap-1 h-11 mt-2">
                    {(rainData.length > 0 ? rainData : [0, 2, 1, 5, 3, 8, 4]).map((v, i, arr) => {
                      const pct = Math.max(v / Math.max(...arr, 0.1) * 100, 4);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex-1 rounded-t-md"
                        style={{ height: `${pct}%`, background: isLast ? rainColor : `${rainColor}30` }} />);

                    })}
                  </div>
                  <p className="text-[9px] text-slate-300 mt-1.5 font-medium">Total semana: {totalRain.toFixed(1)} mm</p>
                </div>);

            })()}

            {/* Card 3 — Donut condición climática + humedad */}
            {(() => {
              const humidity = latestWeather?.humidity ?? 0;
              const precip = latestWeather?.precipitation ?? 0;
              const temp = latestWeather?.temperature_mean ?? latestWeather?.temperature_max ?? 0;
              // Classify days of last 7 as sunny/cloudy/rainy
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
              return (
                <div className="rounded-2xl p-4 flex flex-col" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Condición · semana</p>
                  </div>
                  <p className="text-base sm:text-[18px] font-black text-slate-800 leading-none mb-2">{humidity > 0 ? `${Math.round(humidity)}% 💧` : '—'}</p>
                  <div className="flex items-center gap-3 flex-1">
                    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
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
                    <div className="flex flex-col gap-1">
                      {segments.map(({ label, color, val }) =>
                      <div key={label} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[9px] text-slate-400 font-medium">{label}</span>
                          <span className="text-[9px] font-bold text-slate-600 ml-auto pl-1">{val}d</span>
                        </div>
                      )}
                      {temp > 0 &&
                      <p className="text-[9px] text-slate-300 mt-0.5">Temp prom: {Math.round(temp)}°C</p>
                      }
                    </div>
                  </div>
                </div>);

            })()}

          </motion.div>

          <p className="text-center text-[9px] font-medium tracking-widest uppercase mt-6 mb-2 text-slate-200">
            Popsy AI Workspace
          </p>
        </div>

        {/* ── RIGHT AI PANEL ── */}
        











































































































        
        </main>
        </motion.div>);

}