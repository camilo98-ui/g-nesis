import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, Brain, ChevronDown, TrendingUp, Users, Package, DollarSign,
  Eye, AlertTriangle, Zap, BarChart3, Radio, Activity, Sparkles
} from 'lucide-react';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MAGENTA = '#C21875';
const VIOLET = '#7c3aed';
const LAVENDER = '#a78bfa';
const CORAL = '#f97316';
const MINT = '#10b981';
const SOFT_BLUE = '#60a5fa';

const pctNum = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;

function normalizeStoreCode(code) {
  if (!code) return '';
  return String(code).toUpperCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const clean = String(storeId).replace(/\s*\([^)]*\)/g, '').trim();
  const norm = normalizeStoreCode(clean);
  const bta = norm.match(/^BTA\s*(\d+)/); if (bta) return `BTA ${bta[1]}`;
  const tunja = norm.match(/^TUNJA\s*(\d+)/); if (tunja) return `TUNJA ${tunja[1]}`;
  const bog = norm.match(/^BOGOTA\s*(\d+)/); if (bog) return `BTA ${bog[1]}`;
  return norm;
}

// ─── GIANT CINEMATIC CHART ────────────────────────────────────────────
function GiantCinematicChart({ data, height = 400 }) {
  const [hovIdx, setHovIdx] = useState(null);
  const lines = [
    { key: 'EBITDA', color: MAGENTA, label: 'EBITDA', width: 5 },
    { key: 'Personal', color: LAVENDER, label: 'Personal', width: 4 },
    { key: 'C.Real', color: SOFT_BLUE, label: 'Costo', width: 4 },
  ];

  const allVals = lines.flatMap(l => data.map(d => d[l.key]).filter(v => v != null));
  if (!allVals.length || data.length < 2) return null;

  const W = 800, H = height;
  const padL = 60, padR = 40, padT = 40, padB = 60;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minV = Math.max(0, Math.min(...allVals) - 5);
  const maxV = Math.max(...allVals) + 10;
  
  const toX = (i) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          {lines.map(l => (
            <React.Fragment key={l.key}>
              <linearGradient id={`giant_fill_${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0.02" />
              </linearGradient>
              <filter id={`giant_glow_${l.key}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </React.Fragment>
          ))}
          {/* Mesh gradient background */}
          <linearGradient id="chart_mesh_bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(194,24,117,0.04)" />
            <stop offset="50%" stopColor="rgba(124,58,237,0.02)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0.04)" />
          </linearGradient>
        </defs>

        {/* Ambient background */}
        <rect width="100%" height="100%" fill="url(#chart_mesh_bg)" />

        {/* Soft horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const v = minV + (maxV - minV) * t;
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke={i === 0 ? 'rgba(194,24,117,0.15)' : 'rgba(194,24,117,0.06)'} 
                strokeWidth={i === 0 ? 2 : 1} strokeDasharray={i === 0 ? '' : '4 6'} opacity={0.6} />
              <text x={padL - 12} y={y + 4} textAnchor="end" fontSize="13" fontWeight="700" fill="rgba(80,60,100,0.35)">
                {Math.round(v)}%
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        {lines.map(l => {
          const pts = data.map((d, i) => ({ x: toX(i), y: d[l.key] != null ? toY(d[l.key]) : null, val: d[l.key] })).filter(p => p.val != null);
          if (pts.length < 2) return null;
          const linePath = buildSmoothPath(pts);
          const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
          return <path key={`${l.key}_fill`} d={areaPath} fill={`url(#giant_fill_${l.key})`} />;
        })}

        {/* Glowing lines */}
        {lines.map(l => {
          const pts = data.map((d, i) => ({ x: toX(i), y: d[l.key] != null ? toY(d[l.key]) : null, val: d[l.key] })).filter(p => p.val != null);
          if (pts.length < 2) return null;
          const linePath = buildSmoothPath(pts);
          return (
            <g key={l.key}>
              <path d={linePath} fill="none" stroke={l.color} strokeWidth={l.width + 6} strokeOpacity="0.12" strokeLinecap="round" />
              <path d={linePath} fill="none" stroke={l.color} strokeWidth={l.width} strokeLinecap="round" strokeLinejoin="round"
                filter={`url(#giant_glow_${l.key})`} opacity={hovIdx != null && hovIdx !== data.findIndex(d => d[l.key] != null) ? 0.4 : 1} />
            </g>
          );
        })}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - padB + 22} textAnchor="middle" fontSize="12" fontWeight="800"
            fill={hovIdx === i ? MAGENTA : 'rgba(100,80,120,0.45)'}>
            {d.mes}
          </text>
        ))}

        {/* Interactive dots */}
        {lines.map(l => data.map((d, i) => {
          if (d[l.key] == null) return null;
          const x = toX(i), y = toY(d[l.key]);
          return (
            <circle key={`${l.key}_dot_${i}`} cx={x} cy={y} r={hovIdx === i ? 7 : 5}
              fill={hovIdx === i ? l.color : 'white'} stroke={l.color} strokeWidth={hovIdx === i ? 3 : 2}
              style={{ transition: 'all 0.2s' }} opacity={hovIdx != null && hovIdx !== i ? 0.4 : 1} />
          );
        }))}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect key={i} x={toX(i) - chartW / data.length / 2} y={padT - 20} width={chartW / data.length} height={chartH + 60}
            fill="transparent" style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)} />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 mt-4 px-4 justify-center">
        {lines.map(l => (
          <div key={l.key} className="flex items-center gap-2.5">
            <motion.div className="w-3 h-3 rounded-full" style={{ background: l.color, boxShadow: `0 0 12px ${l.color}` }} />
            <span className="text-sm font-bold" style={{ color: 'rgba(80,60,100,0.6)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Path builder
function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

// ─── HERO NOVA INSIGHT ────────────────────────────────────────────────
function HeroNovaInsight({ primaryRecord, trendData, storeCode }) {
  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const personal = pctNum(primaryRecord?.costo_personal);
  
  let insight = "Sistema operativo activado";
  let detail = "Analizando señales financieras en tiempo real...";
  let color = MAGENTA;

  if (ebitda && ebitda >= 25) {
    insight = "Estructura rentable detectada";
    detail = `EBITDA en ${ebitda.toFixed(1)}%. El margen operativo mantiene solidez estructural.`;
    color = MINT;
  } else if (personal && personal > 22) {
    insight = "Presión laboral identificada";
    detail = `Personal consume ${personal.toFixed(1)}% de la venta. La nómina limita la rentabilidad.`;
    color = CORAL;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative rounded-3xl overflow-hidden p-8 lg:p-10"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,240,247,0.85) 100%)',
        border: `1px solid ${color}20`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px ${color}15, inset 0 1px 0 rgba(255,255,255,0.8)`
      }}>
      
      {/* Animated glow background */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)`, filter: 'blur(40px)' }} />

      <div className="relative z-10 flex flex-col">
        <motion.div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-3 h-3 rounded-full" style={{ background: color }} />
          <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(80,60,100,0.5)' }}>
            NOVA · {storeCode}
          </span>
        </motion.div>

        <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-3 tracking-tight" style={{ color: '#1a0d28' }}>
          {insight}
        </h2>
        
        <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(80,60,100,0.65)', fontWeight: 400 }}>
          {detail}
        </p>
      </div>
    </motion.div>
  );
}

// ─── KPI SIGNAL CARDS ─────────────────────────────────────────────────
function KPISignal({ label, value, color, icon: Icon, status }) {
  const statusDot = {
    good: MINT,
    warn: '#f59e0b',
    bad: '#ef4444',
  }[status] || '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: `0 20px 50px rgba(0,0,0,0.12)` }}
      className="group relative rounded-2xl p-6 cursor-pointer overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(252,245,250,0.8) 100%)',
        border: `1.5px solid ${color}20`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
      
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 40%, ${color}15, transparent 65%)` }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <motion.div className="w-2 h-2 rounded-full" style={{ background: statusDot }}
            animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>

        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(80,60,100,0.5)' }}>
          {label}
        </p>
        
        <p className="text-3xl font-black leading-none mb-1" style={{ color: color }}>
          {value != null ? `${value.toFixed(1)}%` : '—'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function PYGIntelligenceOSv2({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-intelligence-v2', storeCode, currentYear],
    queryFn: async () => {
      if (!storeCode) return [];
      const all = await base44.entities.PYGReport.filter({ year: currentYear });
      const ns = normalizeStoreCode(storeCode);
      return all.filter(r => normalizeStoreCode(r.store_code) === ns);
    },
    enabled: !!storeCode,
  });

  const lastMonthWithData = useMemo(() => {
    if (!allRecords.length) return null;
    return Math.max(...allRecords.map(r => r.month));
  }, [allRecords]);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOpen, setMonthOpen] = useState(false);

  useEffect(() => {
    if (lastMonthWithData && !selectedMonth) setSelectedMonth(lastMonthWithData);
  }, [lastMonthWithData]);

  const primaryRecord = allRecords.find(r => r.month === selectedMonth) || null;

  const trendData = useMemo(() =>
    MONTHS_SHORT.map((mes, i) => {
      const rec = allRecords.find(r => r.month === i + 1);
      if (!rec) return null;
      return {
        mes, month: i + 1,
        EBITDA: pctNum(rec.margen_ebitda),
        'C.Real': pctNum(rec.cost_real),
        Personal: pctNum(rec.costo_personal),
        Gastos: pctNum(rec.gastos_pct_venta),
      };
    }).filter(Boolean),
    [allRecords]
  );

  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const personal = pctNum(primaryRecord?.costo_personal);
  const costReal = pctNum(primaryRecord?.cost_real);
  const gastos = pctNum(primaryRecord?.gastos_pct_venta);

  const ebitdaStatus = ebitda == null ? 'warn' : ebitda >= 25 ? 'good' : ebitda >= 15 ? 'warn' : 'bad';
  const personalStatus = personal == null ? 'warn' : personal <= 22 ? 'good' : personal <= 25 ? 'warn' : 'bad';
  const costoStatus = costReal == null ? 'warn' : costReal <= 28 ? 'good' : 'warn';
  const gastosStatus = gastos == null ? 'warn' : gastos <= 40 ? 'good' : gastos <= 45 ? 'warn' : 'bad';

  if (isLoading) {
    return (
      <motion.div className="w-full min-h-screen flex items-center justify-center" style={{ background: '#f8f5fc' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${MAGENTA}20`, borderTopColor: MAGENTA }} />
      </motion.div>
    );
  }

  if (!primaryRecord) {
    return (
      <motion.div className="w-full min-h-screen flex items-center justify-center p-6" style={{ background: '#f8f5fc' }}>
        <div className="text-center">
          <BarChart3 className="w-20 h-20 mb-6 opacity-10 mx-auto" style={{ color: MAGENTA }} />
          <p className="font-black text-2xl mb-2" style={{ color: '#1a0d28' }}>Sin datos disponibles</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full overflow-y-auto"
      style={{ background: 'linear-gradient(to bottom, #f8f5fc 0%, #faf8fc 50%, #f5f2fa 100%)' }}>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-64 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', filter: 'blur(70px)' }} />
      </div>

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(248,245,252,0.85)', borderBottom: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 2px 20px rgba(0,0,0,0.03)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ boxShadow: [`0 0 0 0 ${MAGENTA}40`, `0 0 0 10px ${MAGENTA}00`] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${MAGENTA}, #9d174d)` }}>
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="font-black text-lg" style={{ color: '#1a0d28' }}>P&G Intelligence</h1>
              <p className="text-xs" style={{ color: 'rgba(80,60,100,0.5)' }}>{storeCode} · {MONTHS_FULL[(selectedMonth || 1) - 1]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setMonthOpen(!monthOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black"
                style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.15)', color: '#374151' }}>
                📅 {selectedMonth ? MONTHS_SHORT[selectedMonth - 1] : 'Mes'}
                <ChevronDown className={`w-3 h-3 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {monthOpen && (
                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute top-full right-0 mt-2 rounded-2xl z-40 p-3"
                    style={{ background: '#fff', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                    <div className="grid grid-cols-3 gap-2 w-52">
                      {MONTHS_SHORT.map((m, i) => {
                        const hasData = allRecords.some(r => r.month === i + 1);
                        const isSelected = selectedMonth === i + 1;
                        return (
                          <button key={i} disabled={!hasData}
                            onClick={() => { setSelectedMonth(i + 1); setMonthOpen(false); }}
                            className="rounded-lg py-2 text-xs font-black transition-all"
                            style={{
                              background: isSelected ? MAGENTA : hasData ? 'rgba(194,24,117,0.06)' : 'transparent',
                              color: isSelected ? 'white' : hasData ? '#374151' : '#c4b5c4',
                              cursor: hasData ? 'pointer' : 'not-allowed',
                              border: isSelected ? `1px solid ${MAGENTA}` : '1px solid rgba(194,24,117,0.1)',
                            }}>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.12)' }}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* ─── HERO SECTION ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-5 gap-8 items-start">
          
          {/* LEFT: Nova Insight + Context */}
          <div className="lg:col-span-2 space-y-5">
            <HeroNovaInsight primaryRecord={primaryRecord} trendData={trendData} storeCode={storeCode} />
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(194,24,117,0.08)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(80,60,100,0.5)' }}>Mes</p>
                <p className="text-2xl font-black" style={{ color: '#1a0d28' }}>{selectedMonth}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(194,24,117,0.08)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(80,60,100,0.5)' }}>Año</p>
                <p className="text-2xl font-black" style={{ color: '#1a0d28' }}>{currentYear}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Giant Chart */}
          <div className="lg:col-span-3 rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,240,247,0.88) 100%)', border: '1px solid rgba(194,24,817,0.12)', boxShadow: '0 30px 80px rgba(0,0,0,0.09)' }}>
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(80,60,100,0.45)' }}>Evolución {currentYear}</p>
              <p className="font-black text-lg mt-1" style={{ color: '#1a0d28' }}>Tendencia Financiera</p>
            </div>
            <GiantCinematicChart data={trendData} height={300} />
          </div>
        </motion.div>

        {/* ─── KPI SIGNALS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(80,60,100,0.45)' }}>Indicadores Clave</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPISignal label="EBITDA" value={ebitda} color={MAGENTA} icon={TrendingUp} status={ebitdaStatus} />
            <KPISignal label="Personal" value={personal} color={LAVENDER} icon={Users} status={personalStatus} />
            <KPISignal label="Costo Real" value={costReal} color={SOFT_BLUE} icon={Package} status={costoStatus} />
            <KPISignal label="Gastos" value={gastos} color={CORAL} icon={DollarSign} status={gastosStatus} />
          </div>
        </motion.div>

        {/* ─── DETAILED SECTIONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6">

          {/* Intelligence Panel */}
          <div className="rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,247,255,0.88) 100%)', border: '1px solid rgba(124,58,237,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                <Sparkles className="w-5 h-5" style={{ color: VIOLET }} />
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: '#1a0d28' }}>Inteligencia Operativa</p>
                <p className="text-sm" style={{ color: 'rgba(80,60,100,0.5)' }}>Análisis estratégico de la estructura de costos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,817,0.1)' }}>
                  <p className="text-xs font-black mb-2" style={{ color: 'rgba(80,60,100,0.5)' }}>MARGEN EBITDA</p>
                  <p className="text-3xl font-black" style={{ color: MAGENTA }}>{ebitda?.toFixed(1)}%</p>
                  <p className="text-xs mt-2" style={{ color: 'rgba(80,60,100,0.45)' }}>Meta: ≥25%</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                  <p className="text-xs font-black mb-2" style={{ color: 'rgba(80,60,100,0.5)' }}>PRESIÓN LABORAL</p>
                  <p className="text-3xl font-black" style={{ color: LAVENDER }}>{personal?.toFixed(1)}%</p>
                  <p className="text-xs mt-2" style={{ color: 'rgba(80,60,100,0.45)' }}>Meta: ≤22%</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-20" />
      </div>
    </motion.div>
  );
}