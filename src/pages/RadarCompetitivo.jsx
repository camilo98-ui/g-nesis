import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { Plus, X, TrendingUp, TrendingDown, Minus, Zap, Target, Activity, ChevronRight, AlertTriangle } from 'lucide-react';
import { format, parseISO, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const COMPETITIONS = ['McDonald\'s', 'KFC', 'Mimos', 'GoYurt', 'Popsy', 'Otra'];

const BRAND_COLORS = {
  "McDonald's": '#FFBC0D',
  'KFC': '#F40027',
  'Mimos': '#6C3483',
  'GoYurt': '#00B4D8',
  'Popsy': '#C21875',
  'Otra': '#94a3b8'
};

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span className={className}>{prefix}{display.toLocaleString('es-CO')}{suffix}</span>;
}

function ActivityGauge({ level }) {
  const levels = ['Baja', 'Media', 'Alta', 'Crítica'];
  const idx = levels.indexOf(level);
  const pct = ((idx + 1) / 4) * 100;
  const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
  const color = colors[idx] || colors[0];
  const angle = -135 + (pct / 100) * 270;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="90" viewBox="0 0 140 90">
        <path d="M15,85 A60,60 0 0,1 125,85" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"/>
        <path d="M15,85 A60,60 0 0,1 125,85" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 188} 188`} style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
        <g transform={`translate(70,85) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-48" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="4" fill="white"/>
        </g>
      </svg>
      <div className="flex gap-2 mt-1">
        {levels.map((l, i) => (
          <span key={l} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: i === idx ? `${colors[i]}22` : 'rgba(255,255,255,0.05)', color: i === idx ? colors[i] : 'rgba(255,255,255,0.3)', border: `1px solid ${i === idx ? colors[i] + '44' : 'transparent'}` }}>
            {l}{l === 'Crítica' ? ' 🔥' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function NuevaTomaModa({ open, onClose, onSave }) {
  const [form, setForm] = useState({ competition: '', point_of_sale: '', date: format(new Date(), 'yyyy-MM-dd'), week: '', serial_initial: '', serial_final: '', observations: '' });
  const txns = form.serial_final && form.serial_initial ? Math.max(0, Number(form.serial_final) - Number(form.serial_initial)) : null;

  useEffect(() => {
    if (form.date) {
      const d = parseISO(form.date);
      setForm(f => ({ ...f, week: `${d.getFullYear()}-S${String(getWeek(d, { locale: es })).padStart(2,'0')}` }));
    }
  }, [form.date]);

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.competition || !form.date || !form.serial_initial || !form.serial_final) return;
    onSave({ ...form, serial_initial: Number(form.serial_initial), serial_final: Number(form.serial_final), transactions: txns || 0 });
    setForm({ competition: '', point_of_sale: '', date: format(new Date(), 'yyyy-MM-dd'), week: '', serial_initial: '', serial_final: '', observations: '' });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
          <motion.div className="relative z-10 w-full max-w-md rounded-2xl p-6"
            style={{ background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(194,24,117,0.25)', boxShadow: '0 0 60px rgba(194,24,117,0.15)' }}
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-pink-400 uppercase mb-0.5">Radar Competitivo</p>
                <h2 className="text-white text-lg font-bold">Nueva Toma</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Competencia *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {COMPETITIONS.map(c => (
                    <button key={c} onClick={() => handle('competition', c)}
                      className="py-1.5 px-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: form.competition === c ? `${BRAND_COLORS[c]}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${form.competition === c ? BRAND_COLORS[c] + '66' : 'rgba(255,255,255,0.08)'}`, color: form.competition === c ? BRAND_COLORS[c] : 'rgba(255,255,255,0.5)' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Punto de Venta</label>
                  <input value={form.point_of_sale} onChange={e => handle('point_of_sale', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="Ej: CC Andino"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha *</label>
                  <input type="date" value={form.date} onChange={e => handle('date', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Serial Inicial *</label>
                  <input type="number" value={form.serial_initial} onChange={e => handle('serial_initial', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="000001"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Serial Final *</label>
                  <input type="number" value={form.serial_final} onChange={e => handle('serial_final', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="006428"/>
                </div>
              </div>
              {txns !== null && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: 'rgba(194,24,117,0.1)', border: '1px solid rgba(194,24,117,0.3)' }}>
                  <span className="text-xs text-pink-300 font-semibold">Transacciones estimadas</span>
                  <span className="text-2xl font-black text-pink-400">{txns.toLocaleString('es-CO')}</span>
                </motion.div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observaciones</label>
                <textarea value={form.observations} onChange={e => handle('observations', e.target.value)} rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="Contexto adicional..."/>
              </div>
              <button onClick={submit}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, #C21875, #9333ea)', boxShadow: '0 4px 20px rgba(194,24,117,0.35)' }}>
                Registrar Toma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: records = [] } = useQuery({
    queryKey: ['competitiveRecords'],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 200)
  });

  const create = useMutation({
    mutationFn: (data) => base44.entities.CompetitiveRecord.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); }
  });

  // Derived analytics
  const totalTxns = records.reduce((s, r) => s + (r.transactions || 0), 0);

  const byBrand = COMPETITIONS.slice(0, -1).map(brand => {
    const recs = records.filter(r => r.competition === brand);
    const total = recs.reduce((s, r) => s + (r.transactions || 0), 0);
    const recent = recs.slice(0, 3).reduce((s, r) => s + (r.transactions || 0), 0);
    const old = recs.slice(3, 6).reduce((s, r) => s + (r.transactions || 0), 0);
    const growth = old > 0 ? Math.round(((recent - old) / old) * 100) : 0;
    return { brand, total, growth, color: BRAND_COLORS[brand], count: recs.length };
  }).filter(b => b.total > 0).sort((a, b) => b.total - a.total);

  // Trend by week
  const weekMap = {};
  records.forEach(r => {
    const w = r.week || 'Sin semana';
    if (!weekMap[w]) weekMap[w] = {};
    weekMap[w][r.competition] = (weekMap[w][r.competition] || 0) + (r.transactions || 0);
  });
  const trendData = Object.entries(weekMap).slice(-8).map(([week, vals]) => ({ week, ...vals }));

  const topGrower = byBrand.sort((a, b) => b.growth - a.growth)[0];
  const sortedByTotal = [...byBrand].sort((a, b) => b.total - a.total);

  const totalAll = sortedByTotal.reduce((s, b) => s + b.total, 0);

  const activityLevel = totalTxns === 0 ? 'Baja' : totalTxns < 5000 ? 'Media' : totalTxns < 15000 ? 'Alta' : 'Crítica';

  const radarData = byBrand.map(b => ({
    subject: b.brand,
    value: totalAll > 0 ? Math.round((b.total / totalAll) * 100) : 0
  }));

  const insights = [
    topGrower && topGrower.growth > 0 && `${topGrower.brand} incrementó su actividad ${topGrower.growth}% recientemente`,
    sortedByTotal[0] && `${sortedByTotal[0].brand} lidera con ${sortedByTotal[0].total.toLocaleString('es-CO')} transacciones`,
    activityLevel === 'Alta' || activityLevel === 'Crítica' ? 'Alta presión competitiva detectada en el mercado' : 'Mercado con actividad moderada actualmente',
    byBrand.some(b => b.growth < -10) && `${byBrand.find(b => b.growth < -10)?.brand} presenta desaceleración comercial`
  ].filter(Boolean);

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(145deg, #080812 0%, #0f0f23 40%, #12091a 100%)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C21875 0%, transparent 70%)', filter: 'blur(80px)' }}/>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }}/>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#C21875' }}>POPSY • INTELIGENCIA COMERCIAL</p>
            <h1 className="text-3xl font-black tracking-tight">Radar <span style={{ color: '#C21875' }}>Competitivo</span></h1>
            <p className="text-slate-400 text-sm mt-1">Centro de monitoreo de mercado en tiempo real</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-[10px] font-bold text-green-400 tracking-wider">MONITOREO ACTIVO</span>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C21875, #9333ea)', boxShadow: '0 4px 20px rgba(194,24,117,0.4)' }}>
              <Plus className="w-4 h-4"/>
              Nueva Toma
            </button>
          </div>
        </motion.div>

        {/* Nova AI Alert */}
        {insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(194,24,117,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(194,24,117,0.2)', border: '1px solid rgba(194,24,117,0.3)' }}>
              <Zap className="w-5 h-5" style={{ color: '#C21875' }}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#C21875' }}>NOVA AI</span>
                <span className="text-[9px] font-bold text-slate-500 tracking-wider">• ANALIZANDO MERCADO</span>
              </div>
              <p className="text-white text-sm font-medium truncate">{insights[0]}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0"/>
          </motion.div>
        )}

        {records.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(194,24,117,0.1)', border: '1px solid rgba(194,24,117,0.2)' }}>
              <Target className="w-10 h-10" style={{ color: '#C21875' }}/>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin datos de inteligencia</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6">Registra la primera toma de transacciones competitivas para activar el radar de mercado.</p>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C21875, #9333ea)', boxShadow: '0 4px 20px rgba(194,24,117,0.3)' }}>
              <Plus className="w-4 h-4"/> Registrar Primera Toma
            </button>
          </motion.div>
        ) : (
          <>
            {/* Hero KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="md:col-span-2 rounded-2xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12) 0%, rgba(124,58,237,0.08) 100%)', border: '1px solid rgba(194,24,117,0.2)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C21875 0%, transparent 70%)', filter: 'blur(30px)' }}/>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1">ACTIVIDAD COMPETITIVA DETECTADA</p>
                <div className="flex items-end gap-3 mb-1">
                  <AnimatedNumber value={totalTxns} className="text-5xl font-black tracking-tight" style={{ color: 'white' }}/>
                  <span className="text-slate-400 text-lg font-semibold mb-1">transacciones estimadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <TrendingUp className="w-3 h-3"/>
                    {records.length} tomas registradas
                  </div>
                  <span className="text-slate-500 text-xs">{byBrand.length} competidores monitoreados</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl p-5 flex flex-col items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-3">NIVEL DE ACTIVIDAD</p>
                <ActivityGauge level={activityLevel}/>
              </motion.div>
            </div>

            {/* Ranking + Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4">RANKING COMPETITIVO</p>
                <div className="space-y-2.5">
                  {sortedByTotal.map((b, i) => (
                    <div key={b.brand} className="flex items-center gap-3">
                      <span className="text-xs font-black w-4" style={{ color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }}/>
                      <span className="text-sm font-semibold flex-1 text-white">{b.brand}</span>
                      <div className="flex items-center gap-1">
                        {b.growth > 5 ? <TrendingUp className="w-3 h-3" style={{ color: '#4ade80' }}/> : b.growth < -5 ? <TrendingDown className="w-3 h-3 text-red-400"/> : <Minus className="w-3 h-3 text-slate-500"/>}
                        <span className="text-xs font-bold" style={{ color: b.growth > 5 ? '#4ade80' : b.growth < -5 ? '#f87171' : '#94a3b8' }}>
                          {b.growth > 0 ? '+' : ''}{b.growth}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="md:col-span-2 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4">PRESIÓN COMPETITIVA — PARTICIPACIÓN</p>
                <div className="space-y-2.5">
                  {sortedByTotal.map(b => {
                    const pct = totalAll > 0 ? Math.round((b.total / totalAll) * 100) : 0;
                    return (
                      <div key={b.brand} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-20 flex-shrink-0">{b.brand}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.4 }}
                            className="h-full rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}44` }}/>
                        </div>
                        <span className="text-xs font-bold text-white w-8 text-right">{pct}%</span>
                        <span className="text-xs text-slate-500 w-20 text-right">{b.total.toLocaleString('es-CO')}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Trend Chart + Radar */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="md:col-span-3 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4">TENDENCIA SEMANAL</p>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{ background: 'rgba(10,10,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}/>
                      {byBrand.map(b => (
                        <Line key={b.brand} type="monotone" dataKey={b.brand} stroke={b.color} strokeWidth={2}
                          dot={{ fill: b.color, r: 3 }} activeDot={{ r: 5 }}/>
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-600 text-sm">Registra más tomas para ver la tendencia</div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="md:col-span-2 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2">MAPA DE INTENSIDAD</p>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }}/>
                      <PolarRadiusAxis tick={{ fill: '#334155', fontSize: 8 }} angle={90}/>
                      <Radar name="Participación" dataKey="value" stroke="#C21875" fill="#C21875" fillOpacity={0.12} strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-600 text-sm">Sin datos suficientes</div>
                )}
              </motion.div>
            </div>

            {/* AI Insights */}
            {insights.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-4">INSIGHTS AUTOMÁTICOS — NOVA AI</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(194,24,117,0.06)', border: '1px solid rgba(194,24,117,0.12)' }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(194,24,117,0.15)' }}>
                        <Activity className="w-3 h-3" style={{ color: '#C21875' }}/>
                      </div>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <NuevaTomaModa open={modalOpen} onClose={() => setModalOpen(false)} onSave={(data) => create.mutate(data)}/>
    </div>
  );
}