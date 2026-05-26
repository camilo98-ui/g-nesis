import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import { Plus, X, TrendingUp, TrendingDown, Minus, Activity, ChevronRight, Zap, ArrowLeft } from 'lucide-react';
import { format, parseISO, getISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const AUTO_COLORS = ['#C21875','#6366f1','#f59e0b','#10b981','#3b82f6','#8b5cf6','#f43f5e','#14b8a6','#f97316','#0ea5e9'];

function getInitial(name) {
  return name ? name.trim()[0].toUpperCase() : '?';
}

function BrandDot({ color, size = 8 }) {
  return <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, background: color }} />;
}

function BrandBadge({ name, color }) {
  return (
    <div className="flex items-center justify-center rounded-xl font-black text-white text-sm w-9 h-9 flex-shrink-0"
      style={{ background: color, fontSize: 15 }}>
      {getInitial(name)}
    </div>
  );
}

function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return <span className="text-xs text-slate-300 font-medium">—</span>;
  const pos = pct > 0;
  const neu = pct === 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold tabular-nums ${neu ? 'text-slate-400' : pos ? 'text-emerald-500' : 'text-rose-500'}`}>
      {neu ? <Minus className="w-3 h-3"/> : pos ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ─── NUEVA TOMA MODAL ────────────────────────────────────────────────────────
function NuevaTomaModa({ open, onClose, onSave, brands, records }) {
  const [competition, setCompetition] = useState('');
  const [serial, setSerial] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [observations, setObservations] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showNewBrand, setShowNewBrand] = useState(false);

  const allBrands = brands.length > 0 ? brands : ['McDonald\'s', 'KFC', 'Mimos', 'GoYurt'];

  // Calculate preview transactions
  const prevRecord = competition && records
    ? [...records]
        .filter(r => r.competition === competition)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const preview = serial && prevRecord
    ? Math.max(0, Number(serial) - (prevRecord.serial || 0))
    : null;

  const addBrand = () => {
    if (newBrandInput.trim()) {
      setCompetition(newBrandInput.trim());
      setShowNewBrand(false);
      setNewBrandInput('');
    }
  };

  const reset = () => {
    setCompetition(''); setSerial(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    setObservations(''); setNewBrandInput(''); setShowNewBrand(false);
  };

  const submit = () => {
    if (!competition || !serial || !date) return;
    const week = `${parseISO(date).getFullYear()}-S${String(getISOWeek(parseISO(date))).padStart(2,'0')}`;
    const colorIdx = allBrands.indexOf(competition);
    const color = AUTO_COLORS[colorIdx >= 0 ? colorIdx % AUTO_COLORS.length : allBrands.length % AUTO_COLORS.length];
    onSave({ competition, serial: Number(serial), date, week, observations, color, transactions: preview || 0 });
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { reset(); onClose(); }}/>
          <motion.div className="relative z-10 w-full max-w-sm rounded-3xl p-6 bg-white"
            style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.1)' }}
            initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.23,1,0.32,1] }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-0.5" style={{ color: '#C21875' }}>Radar Competitivo</p>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Nueva Toma</h2>
              </div>
              <button onClick={() => { reset(); onClose(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-4">
              {/* Competition selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Competencia</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allBrands.map((b, i) => (
                    <button key={b} onClick={() => setCompetition(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: competition === b ? `${AUTO_COLORS[i % AUTO_COLORS.length]}15` : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] + '40' : 'rgba(0,0,0,0.07)'}`,
                        color: competition === b ? AUTO_COLORS[i % AUTO_COLORS.length] : '#64748b'
                      }}>
                      {b}
                    </button>
                  ))}
                  <button onClick={() => setShowNewBrand(!showNewBrand)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px dashed rgba(0,0,0,0.12)' }}>
                    + Nueva
                  </button>
                </div>
                {showNewBrand && (
                  <div className="flex gap-2">
                    <input value={newBrandInput} onChange={e => setNewBrandInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addBrand()}
                      placeholder="Nombre de la marca..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} autoFocus/>
                    <button onClick={addBrand}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#C21875' }}>
                      Agregar
                    </button>
                  </div>
                )}
              </div>

              {/* Serial */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Serial de Factura</label>
                <input type="number" value={serial} onChange={e => setSerial(e.target.value)}
                  placeholder="Ej: 001240"
                  className="w-full px-4 py-3 rounded-2xl text-base font-bold text-slate-800 outline-none transition-all"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', letterSpacing: '0.04em' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(194,24,117,0.35)'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}/>
                {prevRecord && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <span>Última toma:</span>
                    <span className="font-semibold text-slate-600">{prevRecord.serial?.toLocaleString('es-CO')}</span>
                    <span>·</span>
                    <span>{format(parseISO(prevRecord.date), 'd MMM', { locale: es })}</span>
                  </p>
                )}
              </div>

              {/* Auto-calculated preview */}
              <AnimatePresence>
                {preview !== null && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-3.5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.06), rgba(194,24,117,0.03))', border: '1px solid rgba(194,24,117,0.15)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Transacciones estimadas</p>
                      <p className="text-2xl font-black tabular-nums" style={{ color: '#C21875', letterSpacing: '-0.03em' }}>
                        {preview.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.1)' }}>
                      <Activity className="w-5 h-5" style={{ color: '#C21875' }}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}/>
              </div>

              {/* Observations */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Observaciones <span className="font-normal text-slate-300">· opcional</span></label>
                <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={2}
                  placeholder="Contexto adicional..."
                  className="w-full px-4 py-2.5 rounded-2xl text-sm text-slate-700 outline-none resize-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}/>
              </div>

              <button onClick={submit} disabled={!competition || !serial || !date}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }}>
                Registrar Toma
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RadarCompetitivo() {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['competitiveRecords'],
    queryFn: () => base44.entities.CompetitiveRecord.list('-date', 500)
  });

  const create = useMutation({
    mutationFn: (data) => base44.entities.CompetitiveRecord.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitiveRecords'] }); setModalOpen(false); }
  });

  // Derive brands + colors
  const brandMap = useMemo(() => {
    const map = {};
    records.forEach((r, i) => {
      if (!map[r.competition]) {
        map[r.competition] = r.color || AUTO_COLORS[Object.keys(map).length % AUTO_COLORS.length];
      }
    });
    return map;
  }, [records]);
  const brands = Object.keys(brandMap);

  // Per-brand stats: for each brand, get sorted records and compute transactions between consecutive
  const brandStats = useMemo(() => {
    return brands.map(brand => {
      const sorted = [...records]
        .filter(r => r.competition === brand)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const txnSeries = sorted.map((r, i) => {
        if (i === 0) return { ...r, txn: null };
        const prev = sorted[i - 1];
        return { ...r, txn: Math.max(0, r.serial - prev.serial) };
      }).filter(r => r.txn !== null);

      const total = txnSeries.reduce((s, r) => s + r.txn, 0);
      const lastTxn = txnSeries[txnSeries.length - 1]?.txn || 0;
      const prevTxn = txnSeries[txnSeries.length - 2]?.txn || 0;
      const growth = prevTxn > 0 ? ((lastTxn - prevTxn) / prevTxn) * 100 : 0;
      const color = brandMap[brand];
      return { brand, color, total, lastTxn, growth, txnSeries, count: sorted.length, onlyOneReading: sorted.length === 1 };
    }).sort((a, b) => b.total - a.total);
  }, [records, brands, brandMap]);

  const totalTxns = brandStats.reduce((s, b) => s + b.total, 0);
  const totalAll = totalTxns || 1;

  // Weekly trend data
  const weeklyData = useMemo(() => {
    const weeks = {};
    records.forEach(r => {
      const w = r.week;
      if (!w) return;
      if (!weeks[w]) weeks[w] = {};
    });
    brandStats.forEach(b => {
      b.txnSeries.forEach(r => {
        const w = r.week;
        if (!w) return;
        if (!weeks[w]) weeks[w] = {};
        weeks[w][b.brand] = (weeks[w][b.brand] || 0) + r.txn;
      });
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, vals]) => ({ week: week.replace(/^\d{4}-/, ''), ...vals }));
  }, [records, brandStats]);

  const radarData = brandStats.map(b => ({
    subject: b.brand,
    value: totalAll > 0 ? Math.round((b.total / totalAll) * 100) : 0
  }));

  const topBrand = brandStats[0];
  const fastestGrowing = [...brandStats].sort((a, b) => b.growth - a.growth)[0];
  const insights = [
    fastestGrowing && fastestGrowing.growth > 5 && `${fastestGrowing.brand} incrementó su actividad ${fastestGrowing.growth.toFixed(0)}% en la última toma.`,
    topBrand && `${topBrand.brand} lidera con ${topBrand.total.toLocaleString('es-CO')} transacciones estimadas.`,
    brandStats.some(b => b.growth < -10) && `${brandStats.find(b => b.growth < -10)?.brand} presenta desaceleración comercial.`,
    brandStats.length >= 3 && 'Alta presión competitiva detectada en el entorno.'
  ].filter(Boolean);

  const activeInsight = insights[0] || 'Sin datos suficientes para generar análisis.';

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-4 h-4"/>
            </Link>
            <div>
              <p className="text-[9px] font-black tracking-[0.24em] uppercase mb-0.5" style={{ color: '#C21875' }}>POPSY · INTEL COMERCIAL</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Radar <span style={{ color: '#C21875' }}>Competitivo</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px rgba(52,211,153,0.7)' }}/>
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider">ACTIVO</span>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 2px 12px rgba(194,24,117,0.25)' }}>
              <Plus className="w-3.5 h-3.5"/> Nueva Toma
            </button>
          </div>
        </motion.div>

        {/* ── NOVA AI BANNER ── */}
        {insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mb-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.12)' }}>
              <Zap className="w-4 h-4" style={{ color: '#C21875' }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8.5px] font-black tracking-widest uppercase mb-0.5" style={{ color: '#C21875' }}>
                NOVA AI · DETECTANDO ACTIVIDAD
              </p>
              <p className="text-sm font-medium text-slate-600 truncate">{activeInsight}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0"/>
          </motion.div>
        )}

        {records.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(194,24,117,0.07)', border: '1px solid rgba(194,24,117,0.12)' }}>
              <Activity className="w-8 h-8" style={{ color: '#C21875' }}/>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Sin datos de inteligencia</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">
              Registra la primera toma de seriales para activar el radar de mercado.
            </p>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d7a)', boxShadow: '0 4px 16px rgba(194,24,117,0.25)' }}>
              <Plus className="w-4 h-4"/> Registrar Primera Toma
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── HERO + GAUGE ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              {/* Hero total */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="sm:col-span-2 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', backdropFilter: 'blur(32px)' }}>
                <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1">Actividad Competitiva Detectada</p>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums" style={{ color: '#1e293b', letterSpacing: '-0.04em' }}>
                    {totalTxns.toLocaleString('es-CO')}
                  </span>
                  <span className="text-sm text-slate-400 font-semibold">transacciones estimadas</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {topBrand && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${topBrand.color}0f`, color: topBrand.color, border: `1px solid ${topBrand.color}25` }}>
                      <TrendingUp className="w-3 h-3"/>
                      {records.length} tomas · {brands.length} marcas
                    </div>
                  )}
                  {fastestGrowing && fastestGrowing.growth > 0 && (
                    <span className="text-xs text-slate-400">
                      ↑ {fastestGrowing.brand} +{fastestGrowing.growth.toFixed(0)}% reciente
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Ranking lateral */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-3">Ranking</p>
                <div className="space-y-2">
                  {brandStats.slice(0, 5).map((b, i) => (
                    <div key={b.brand} className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black w-4 text-center"
                        style={{ color: i === 0 ? '#f59e0b' : '#cbd5e1' }}>#{i+1}</span>
                      <BrandDot color={b.color} size={7}/>
                      <span className="text-xs font-semibold flex-1 text-slate-600 truncate">{b.brand}</span>
                      {b.onlyOneReading
                        ? <span className="text-[9px] text-slate-300 font-medium">1ª toma</span>
                        : <TrendBadge pct={b.growth}/>}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── PARTICIPATION BARS ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5 mb-4"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-4">Presión Competitiva · Participación</p>
              <div className="space-y-3">
                {brandStats.map(b => {
                  const pct = totalAll > 1 ? Math.round((b.total / totalAll) * 100) : 0;
                  return (
                    <div key={b.brand} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <BrandBadge name={b.brand} color={b.color}/>
                        <span className="text-xs font-semibold text-slate-600 truncate">{b.brand}</span>
                      </div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: b.onlyOneReading ? '2%' : `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: [0.23,1,0.32,1] }}
                          className="h-full rounded-full" style={{ background: b.color }}/>
                      </div>
                      <div className="flex items-center gap-2 w-32 flex-shrink-0 justify-end">
                        {b.onlyOneReading
                          ? <span className="text-[10px] text-slate-300 italic">Necesita 2ª toma</span>
                          : <>
                              <span className="text-xs font-bold text-slate-700 tabular-nums">{pct}%</span>
                              <span className="text-[10px] text-slate-400 tabular-nums hidden sm:block">{b.total.toLocaleString('es-CO')}</span>
                            </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── CHARTS ROW ── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              {/* Tendencia semanal */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="md:col-span-3 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-4">Tendencia Semanal</p>
                {weeklyData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        {brandStats.map(b => (
                          <linearGradient key={b.brand} id={`g_${b.brand.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={b.color} stopOpacity={0.12}/>
                            <stop offset="100%" stopColor={b.color} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.96)', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}/>
                      {brandStats.map(b => (
                        <Area key={b.brand} type="monotone" dataKey={b.brand} stroke={b.color} strokeWidth={2}
                          fill={`url(#g_${b.brand.replace(/[^a-z0-9]/gi,'')})`}
                          dot={{ fill: b.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }}/>
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-sm text-slate-300">
                    Registra más tomas para ver la tendencia
                  </div>
                )}
              </motion.div>

              {/* Mapa de intensidad */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="md:col-span-2 rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-2">Mapa de Intensidad</p>
                {radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#f1f5f9"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }}/>
                      <PolarRadiusAxis tick={{ fill: '#cbd5e1', fontSize: 8 }} angle={90}/>
                      <Radar name="Participación" dataKey="value" stroke="#C21875" fill="#C21875" fillOpacity={0.08} strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-sm text-slate-300">
                    3+ marcas para el radar
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── AI INSIGHTS ── */}
            {insights.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-4">Insights Automáticos · Nova AI</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,117,0.09)' }}>
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(194,24,117,0.08)' }}>
                        <Activity className="w-3 h-3" style={{ color: '#C21875' }}/>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <NuevaTomaModa
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={data => create.mutate(data)}
        brands={brands}
        records={records}
      />
    </div>
  );
}