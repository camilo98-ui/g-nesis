import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, Brain, ChevronDown, TrendingUp, Users, Package, DollarSign,
  BarChart3
} from 'lucide-react';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MAGENTA = '#C21875';
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

// ─── MINI CHART ────────────────────────────────────────────
function MiniChart({ data, height = 120 }) {
  const [hovIdx, setHovIdx] = useState(null);
  const lines = [
    { key: 'EBITDA', color: MAGENTA },
    { key: 'Personal', color: LAVENDER },
    { key: 'C.Real', color: SOFT_BLUE },
  ];

  const allVals = lines.flatMap(l => data.map(d => d[l.key]).filter(v => v != null));
  if (!allVals.length || data.length < 2) return null;

  const W = 280, H = height;
  const padL = 30, padR = 15, padT = 12, padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minV = Math.max(0, Math.min(...allVals) - 2);
  const maxV = Math.max(...allVals) + 5;
  
  const toX = (i) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {lines.map(l => (
          <linearGradient key={l.key} id={`mini_${l.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={l.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>

      {/* Lines */}
      {lines.map(l => {
        const pts = data.map((d, i) => ({ x: toX(i), y: d[l.key] != null ? toY(d[l.key]) : null, val: d[l.key] })).filter(p => p.val != null);
        if (pts.length < 2) return null;
        const linePath = buildSmoothPath(pts);
        const areaPath = linePath + ` L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;
        return (
          <g key={l.key}>
            <path d={areaPath} fill={`url(#mini_${l.key})`} />
            <path d={linePath} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
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
      <motion.div className="w-full h-screen flex items-center justify-center" style={{ background: '#f8f5fc' }}>
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
      <motion.div className="w-full h-screen flex items-center justify-center p-6" style={{ background: '#f8f5fc' }}>
        <div className="text-center">
          <BarChart3 className="w-20 h-20 mb-6 opacity-10 mx-auto" style={{ color: MAGENTA }} />
          <p className="font-black text-2xl mb-2" style={{ color: '#1a0d28' }}>Sin datos</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full h-screen overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #f8f5fc 0%, #faf8fc 50%, #f5f2fa 100%)' }}>

      {/* ── FIXED HEADER ── */}
      <div className="flex-shrink-0 z-30 backdrop-blur-xl px-6 py-3" style={{ background: 'rgba(248,245,252,0.85)', borderBottom: '1px solid rgba(194,24,117,0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ boxShadow: [`0 0 0 0 ${MAGENTA}40`, `0 0 0 8px ${MAGENTA}00`] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${MAGENTA}, #9d174d)` }}>
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h1 className="font-black text-sm" style={{ color: '#1a0d28' }}>P&G Intelligence</h1>
              <p className="text-[10px]" style={{ color: 'rgba(80,60,100,0.5)' }}>{storeCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setMonthOpen(!monthOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black"
                style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.15)', color: '#374151' }}>
                📅 {selectedMonth ? MONTHS_SHORT[selectedMonth - 1] : 'Mes'}
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {monthOpen && (
                  <motion.div initial={{ opacity: 0, y: 2, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute top-full right-0 mt-1 rounded-xl z-40 p-2"
                    style={{ background: '#fff', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                    <div className="grid grid-cols-3 gap-1">
                      {MONTHS_SHORT.map((m, i) => {
                        const hasData = allRecords.some(r => r.month === i + 1);
                        const isSelected = selectedMonth === i + 1;
                        return (
                          <button key={i} disabled={!hasData}
                            onClick={() => { setSelectedMonth(i + 1); setMonthOpen(false); }}
                            className="rounded-lg py-1 px-1.5 text-xs font-black transition-all"
                            style={{
                              background: isSelected ? MAGENTA : hasData ? 'rgba(194,24,117,0.06)' : 'transparent',
                              color: isSelected ? 'white' : hasData ? '#374151' : '#c4b5c4',
                              cursor: hasData ? 'pointer' : 'not-allowed',
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

            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.12)' }}>
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="flex-1 overflow-hidden relative z-10 px-6 py-3 flex flex-col gap-2">
        
        {/* Row 1: Chart + KPIs */}
        <div className="flex gap-2 h-[45%]">
          {/* Main Chart */}
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,240,247,0.88) 100%)', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(80,60,100,0.45)' }}>Evolución</p>
            <div style={{ height: 'calc(100% - 24px)' }}>
              <MiniChart data={trendData} height={150} />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="w-48 flex flex-col gap-2">
            {[
              { label: 'EBITDA', value: ebitda, color: MAGENTA, icon: TrendingUp, status: ebitdaStatus },
              { label: 'Personal', value: personal, color: LAVENDER, icon: Users, status: personalStatus },
              { label: 'Costo', value: costReal, color: SOFT_BLUE, icon: Package, status: costoStatus },
              { label: 'Gastos', value: gastos, color: CORAL, icon: DollarSign, status: gastosStatus },
            ].map((kpi) => (
              <div key={kpi.label} className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${kpi.color}15`, boxShadow: `0 4px 16px rgba(0,0,0,0.05)` }}>
                <p className="text-[8px] font-black uppercase mb-0.5" style={{ color: 'rgba(80,60,100,0.5)' }}>{kpi.label}</p>
                <p className="text-lg font-black" style={{ color: kpi.color }}>{kpi.value != null ? `${kpi.value.toFixed(1)}%` : '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Detail Panels */}
        <div className="flex gap-2 h-[50%] overflow-hidden">
          {/* EBITDA Panel */}
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(252,245,250,0.88) 100%)', border: `1px solid ${MAGENTA}12`, boxShadow: '0 16px 48px rgba(0,0,0,0.06)' }}>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(80,60,100,0.45)' }}>Margen EBITDA</p>
            <div className="grid grid-cols-2 gap-2 h-[calc(100%-20px)]">
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,117,0.1)' }}>
                <p className="text-[8px] font-black mb-1" style={{ color: 'rgba(80,60,100,0.5)' }}>Valor</p>
                <p className="text-2xl font-black" style={{ color: MAGENTA }}>{ebitda?.toFixed(1)}%</p>
                <p className="text-[8px] mt-0.5" style={{ color: 'rgba(80,60,100,0.4)' }}>Meta ≥25%</p>
              </div>
              <div className="flex flex-col justify-between">
                <div className="rounded-xl p-2" style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,817,0.1)' }}>
                  <p className="text-[8px] font-black" style={{ color: 'rgba(80,60,100,0.5)' }}>Estado</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: ebitdaStatus === 'good' ? MINT : ebitdaStatus === 'warn' ? '#f59e0b' : '#ef4444' }}>
                    {ebitdaStatus === 'good' ? '✓ Óptimo' : ebitdaStatus === 'warn' ? '! Revisar' : '✕ Crítico'}
                  </p>
                </div>
                <div className="rounded-xl p-2" style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,117,0.1)' }}>
                  <p className="text-[8px] font-black" style={{ color: 'rgba(80,60,100,0.5)' }}>Mes</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: '#1a0d28' }}>{selectedMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Panel */}
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,244,251,0.88) 100%)', border: `1px solid ${LAVENDER}12`, boxShadow: '0 16px 48px rgba(0,0,0,0.06)' }}>
            <p className="text-[10px] font-black uppercase mb-2" style={{ color: 'rgba(80,60,100,0.45)' }}>Presión Laboral</p>
            <div className="grid grid-cols-2 gap-2 h-[calc(100%-20px)]">
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                <p className="text-[8px] font-black mb-1" style={{ color: 'rgba(80,60,100,0.5)' }}>Costo</p>
                <p className="text-2xl font-black" style={{ color: LAVENDER }}>{personal?.toFixed(1)}%</p>
                <p className="text-[8px] mt-0.5" style={{ color: 'rgba(80,60,100,0.4)' }}>Meta ≤22%</p>
              </div>
              <div className="flex flex-col justify-between">
                <div className="rounded-xl p-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <p className="text-[8px] font-black" style={{ color: 'rgba(80,60,100,0.5)' }}>Estado</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: personalStatus === 'good' ? MINT : personalStatus === 'warn' ? '#f59e0b' : '#ef4444' }}>
                    {personalStatus === 'good' ? '✓ Óptimo' : personalStatus === 'warn' ? '! Revisar' : '✕ Crítico'}
                  </p>
                </div>
                <div className="rounded-xl p-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <p className="text-[8px] font-black" style={{ color: 'rgba(80,60,100,0.5)' }}>Año</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: '#1a0d28' }}>{currentYear}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost + Gastos Panel */}
          <div className="w-40 flex flex-col gap-2">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(241,249,255,0.88) 100%)', border: `1px solid ${SOFT_BLUE}12`, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <p className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(80,60,100,0.45)' }}>Costo Real</p>
              <p className="text-lg font-black" style={{ color: SOFT_BLUE }}>{costReal?.toFixed(1)}%</p>
              <p className="text-[7px] mt-0.5" style={{ color: 'rgba(80,60,100,0.4)' }}>Meta ≤28%</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,247,241,0.88) 100%)', border: `1px solid ${CORAL}12`, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <p className="text-[8px] font-black uppercase mb-1" style={{ color: 'rgba(80,60,100,0.45)' }}>Gastos</p>
              <p className="text-lg font-black" style={{ color: CORAL }}>{gastos?.toFixed(1)}%</p>
              <p className="text-[7px] mt-0.5" style={{ color: 'rgba(80,60,100,0.4)' }}>Meta ≤40%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}