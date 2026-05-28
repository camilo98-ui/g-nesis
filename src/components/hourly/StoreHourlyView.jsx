import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3,
  ChevronUp, ChevronDown, Minus, GitCompare, Zap, Target,
  ArrowUpRight, ArrowDownRight, X, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell, AreaChart, Area, ComposedChart
} from 'recharts';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const HOUR_LABELS = HOURS.map(h => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);

const MAGENTA = '#e91e8c';
const MAGENTA_DARK = '#c0156f';
const MAGENTA_LIGHT = '#f472b6';
const MAGENTA_PALE = '#fce7f3';

const CARD_PALETTES = [
  { bg: '#fce7f3', border: '#f9a8d4', icon: MAGENTA, text: '#9d174d', sub: '#be185d' },
  { bg: '#fdf4ff', border: '#e879f9', icon: '#a21caf', text: '#701a75', sub: '#86198f' },
  { bg: '#fef3c7', border: '#fcd34d', icon: '#b45309', text: '#92400e', sub: '#d97706' },
  { bg: '#ecfdf5', border: '#6ee7b7', icon: '#059669', text: '#065f46', sub: '#047857' },
  { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb', text: '#1e3a8a', sub: '#1d4ed8' },
  { bg: '#fdf2f8', border: '#f0abfc', icon: '#c026d3', text: '#701a75', sub: '#a21caf' },
];

function getHourValues(rec) {
  return HOURS.map(h => Math.max(0, rec?.[`hour_${h}`] || 0));
}

function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
}

function getBarColor(val, mean, sd) {
  if (val >= mean + sd) return MAGENTA;
  if (val >= mean) return '#f9a8d4';
  return '#f1f5f9';
}

function getLabel(val, mean, sd) {
  if (val >= mean + sd) return 'Alto';
  if (val >= mean) return 'Normal';
  return 'Bajo';
}

const BarTip = ({ active, payload, label, mean, total }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value || 0;
  const pctAvg = mean > 0 ? ((val - mean) / mean * 100) : 0;
  const pctDay = total > 0 ? (val / total * 100) : 0;
  return (
    <div className="bg-white border border-pink-100 shadow-xl px-4 py-3 rounded-2xl text-xs min-w-[160px]">
      <p className="font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900">{val.toLocaleString('es-CO')}</p>
      <p className="text-slate-400 mt-0.5">transacciones</p>
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">vs promedio</span>
          <span className={`font-bold ${pctAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pctAvg >= 0 ? '+' : ''}{pctAvg.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">del día</span>
          <span className="font-bold text-slate-700">{pctDay.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const LineTip = ({ active, payload, label, prevName }) => {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.dataKey === 'current')?.value;
  const prev = payload.find(p => p.dataKey === 'previous')?.value;
  const diff = (curr != null && prev != null && prev > 0) ? ((curr - prev) / prev * 100) : null;
  return (
    <div className="bg-white border border-pink-100 shadow-xl px-4 py-3 rounded-2xl text-xs min-w-[190px]">
      <p className="font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
      {curr != null && <div className="flex justify-between mb-1"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: MAGENTA }} />Actual</span><span className="font-black text-slate-900">{curr.toLocaleString('es-CO')}</span></div>}
      {prev != null && <div className="flex justify-between mb-1"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />{prevName || 'Anterior'}</span><span className="font-black text-slate-500">{prev.toLocaleString('es-CO')}</span></div>}
      {diff != null && <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between"><span className="text-slate-400">Variación</span><span className={`font-black ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}%</span></div>}
    </div>
  );
};

const TrendTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload.find(p => p.dataKey === 'total')?.value || 0;
  return (
    <div className="bg-white border border-pink-100 shadow-xl px-4 py-3 rounded-2xl text-xs min-w-[150px]">
      <p className="font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-slate-900">{val.toLocaleString('es-CO')}</p>
      <p className="text-slate-400">transacciones</p>
    </div>
  );
};

function KPIModal({ card, onClose, hourValues, prevValues, trendData, mean, sd, total, prevTotal, totalGrowth, prevName, lineData }) {
  const palette = card.palette;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="px-6 pt-6 pb-4 flex items-start justify-between" style={{ background: palette.bg, borderBottom: `1px solid ${palette.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: palette.border + '60' }}>
                <card.icon className="w-5 h-5" style={{ color: palette.icon }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: palette.sub }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: palette.text }}>{card.value}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-all">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {card.delta != null && (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: card.delta >= 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${card.delta >= 0 ? '#6ee7b7' : '#fca5a5'}` }}>
                {card.delta >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <ArrowDownRight className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div>
                  <p className={`font-black text-lg ${card.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {card.delta >= 0 ? '+' : ''}{card.delta.toFixed(1)}% vs {prevName}
                  </p>
                  <p className={`text-xs ${card.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {card.deltaAbs && `${card.delta >= 0 ? '+' : ''}${card.deltaAbs.toLocaleString('es-CO')} transacciones`}
                  </p>
                </div>
              </div>
            )}
            {card.chartType === 'hourly' && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Distribución Horaria</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={HOURS.map((h, i) => ({ hour: HOUR_LABELS[i], val: hourValues[i], color: getBarColor(hourValues[i], mean, sd) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={mean} stroke={MAGENTA_LIGHT} strokeDasharray="5 3" />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={36}>{HOURS.map((h, i) => <Cell key={i} fill={getBarColor(hourValues[i], mean, sd)} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {card.chartType === 'compare' && lineData && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Comparativo hora a hora</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MAGENTA} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={MAGENTA} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={(p) => <LineTip {...p} prevName={prevName} />} />
                    <Area type="monotone" dataKey="current" fill="url(#modalGrad)" stroke="none" />
                    <Line type="monotone" dataKey="current" name="Actual" stroke={MAGENTA} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="previous" name={prevName} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            {card.chartType === 'trend' && trendData && trendData.length >= 2 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Evolución mensual</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.icon} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={palette.icon} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TrendTip />} />
                    <Area type="monotone" dataKey="total" stroke={palette.icon} strokeWidth={2.5} fill="url(#modalTrend)" dot={{ r: 3, fill: palette.icon, stroke: '#fff', strokeWidth: 1.5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {card.chartType === 'cv' && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dispersión por hora</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={HOURS.map((h, i) => ({ hour: HOUR_LABELS[i], val: hourValues[i] }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={mean} stroke={MAGENTA} strokeDasharray="5 3" label={{ value: 'μ', position: 'right', fontSize: 10, fill: MAGENTA }} />
                    <Bar dataKey="val" fill={palette.border} radius={[3, 3, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-500 mt-2">Línea = promedio ({mean.toFixed(0)} txn/h). CV = {(sd/mean*100).toFixed(1)}%</p>
              </div>
            )}
            {card.insight && (
              <div className="rounded-xl p-4" style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
                <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: palette.sub }}>Interpretación</p>
                <p className="text-sm leading-relaxed" style={{ color: palette.text }} dangerouslySetInnerHTML={{ __html: card.insight }} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function StoreHourlyView({ storeCode, storeName, allRecords, onBack }) {
  const availableMonths = useMemo(() => {
    return [...new Set(allRecords.map(r => `${Math.round(r.year)}-${Math.round(r.month)}`))]
      .map(key => { const [y, m] = key.split('-'); return { year: parseInt(y), month: parseInt(m) }; })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [allRecords]);

  const [selectedPeriod, setSelectedPeriod] = useState(availableMonths[0] || null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod, setComparePeriod] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [sortKey, setSortKey] = useState('transactions');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedPeriod) setSelectedPeriod(availableMonths[0]);
  }, [availableMonths]);

  useEffect(() => {
    if (availableMonths.length > 1 && !comparePeriod) setComparePeriod(availableMonths[1]);
  }, [availableMonths]);

  const currentRecord = useMemo(() =>
    !selectedPeriod ? null :
    allRecords.find(r => Math.round(r.month) === selectedPeriod.month && Math.round(r.year) === selectedPeriod.year) || null,
    [allRecords, selectedPeriod]);

  const autoPrevRecord = useMemo(() => {
    if (!selectedPeriod) return null;
    let pm = selectedPeriod.month - 1; let py = selectedPeriod.year;
    if (pm < 1) { pm = 12; py -= 1; }
    return allRecords.find(r => Math.round(r.month) === pm && Math.round(r.year) === py) || null;
  }, [allRecords, selectedPeriod]);

  const compareRecord = useMemo(() =>
    !comparePeriod ? null :
    allRecords.find(r => Math.round(r.month) === comparePeriod.month && Math.round(r.year) === comparePeriod.year) || null,
    [allRecords, comparePeriod]);

  const prevRecord = compareMode ? compareRecord : autoPrevRecord;
  const prevName = prevRecord ? `${MONTHS_SHORT[(prevRecord.month || 1) - 1]} ${prevRecord.year}` : 'Mes ant.';

  const hourValues = useMemo(() => getHourValues(currentRecord), [currentRecord]);
  const prevValues = useMemo(() => getHourValues(prevRecord), [prevRecord]);
  const activeHours = useMemo(() => hourValues.filter(v => v > 0), [hourValues]);
  const mean = useMemo(() => activeHours.length ? activeHours.reduce((s, v) => s + v, 0) / activeHours.length : 0, [activeHours]);
  const sd = useMemo(() => stdDev(activeHours), [activeHours]);
  const total = useMemo(() => hourValues.reduce((s, v) => s + v, 0), [hourValues]);
  const prevTotal = useMemo(() => prevValues.reduce((s, v) => s + v, 0), [prevValues]);
  const totalGrowth = useMemo(() => prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100) : null, [total, prevTotal]);

  const peakHour = useMemo(() => {
    const max = Math.max(...hourValues);
    const idx = hourValues.indexOf(max);
    return { value: max, label: HOUR_LABELS[idx] };
  }, [hourValues]);

  const valleyHour = useMemo(() => {
    const active = hourValues.map((v, i) => ({ v, i })).filter(x => x.v > 0);
    if (!active.length) return { value: 0, label: '—' };
    const min = Math.min(...active.map(x => x.v));
    const idx = active.find(x => x.v === min).i;
    return { value: min, label: HOUR_LABELS[idx] };
  }, [hourValues]);

  const cv = useMemo(() => mean > 0 ? (sd / mean * 100) : 0, [sd, mean]);
  const peakConcentration = useMemo(() => total > 0 ? (peakHour.value / total * 100) : 0, [peakHour, total]);

  const peakBlock = useMemo(() => {
    let maxSum = 0; let maxStart = 0;
    for (let s = 0; s <= HOURS.length - 3; s++) {
      const sum = hourValues[s] + hourValues[s + 1] + hourValues[s + 2];
      if (sum > maxSum) { maxSum = sum; maxStart = s; }
    }
    return { sum: maxSum, label1: HOUR_LABELS[maxStart], label2: HOUR_LABELS[maxStart + 2], pct: total > 0 ? (maxSum / total * 100) : 0 };
  }, [hourValues, total]);

  const prevMean = useMemo(() => {
    const ph = prevValues.filter(v => v > 0);
    return ph.length ? ph.reduce((s, v) => s + v, 0) / ph.length : 0;
  }, [prevValues]);

  const trendData = useMemo(() =>
    [...availableMonths]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(p => {
        const rec = allRecords.find(r => Math.round(r.month) === p.month && Math.round(r.year) === p.year);
        return { label: `${MONTHS_SHORT[p.month - 1]} ${p.year}`, total: rec ? HOURS.reduce((s, h) => s + Math.max(0, rec[`hour_${h}`] || 0), 0) : 0, month: p.month, year: p.year };
      }),
    [availableMonths, allRecords]);

  const lineData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    current: hourValues[i] || null,
    previous: prevValues[i] || null,
    diff: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
  }));

  const barData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    transactions: hourValues[i],
    color: getBarColor(hourValues[i], mean, sd),
  }));

  const rankingData = useMemo(() => HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    transactions: hourValues[i],
    pctTotal: total > 0 ? (hourValues[i] / total * 100) : 0,
    vsPrev: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
    label: getLabel(hourValues[i], mean, sd),
  })), [hourValues, prevValues, total, mean, sd]);

  const sortedRanking = useMemo(() => [...rankingData].sort((a, b) => {
    const va = sortKey === 'vsPrev' ? (a.vsPrev ?? -Infinity) : a[sortKey];
    const vb = sortKey === 'vsPrev' ? (b.vsPrev ?? -Infinity) : b[sortKey];
    return sortDir === 'desc' ? vb - va : va - vb;
  }), [rankingData, sortKey, sortDir]);

  const kpiCards = useMemo(() => {
    if (!currentRecord) return [];
    return [
      {
        id: 'total',
        label: 'Transacciones del Mes',
        value: total.toLocaleString('es-CO'),
        sub: `${prevRecord ? (totalGrowth >= 0 ? '▲' : '▼') + ' ' + Math.abs(totalGrowth).toFixed(1) + '% vs ' + prevName : 'Sin comparativo'}`,
        icon: Activity,
        palette: CARD_PALETTES[0],
        delta: totalGrowth,
        deltaAbs: prevRecord ? total - prevTotal : null,
        chartType: 'hourly',
        insight: `La tienda procesó <strong>${total.toLocaleString('es-CO')} transacciones</strong> en el período.${totalGrowth !== null ? ` Vs ${prevName}: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}%.` : ''}`,
      },
      {
        id: 'peak',
        label: 'Hora Pico · Valle',
        value: `${peakHour.label} / ${valleyHour.label}`,
        sub: `Pico: ${peakHour.value.toLocaleString('es-CO')} txn (${peakConcentration.toFixed(1)}%)`,
        icon: TrendingUp,
        palette: CARD_PALETTES[1],
        delta: prevRecord ? (() => { const pi = hourValues.indexOf(peakHour.value); const pv = prevValues[pi]; return pv > 0 ? (peakHour.value - pv) / pv * 100 : null; })() : null,
        chartType: 'compare',
        insight: `Pico en <strong>${peakHour.label}</strong> con <strong>${peakHour.value.toLocaleString('es-CO')} txn</strong> (${peakConcentration.toFixed(1)}% del día). Bloque <strong>${peakBlock.label1}–${peakBlock.label2}</strong> = ${peakBlock.pct.toFixed(1)}% del tráfico.`,
      },
      {
        id: 'avg',
        label: 'Promedio / Hora',
        value: `${mean.toFixed(0)} txn/h`,
        sub: `${prevRecord && prevMean > 0 ? (mean >= prevMean ? '▲' : '▼') + ' ' + Math.abs(((mean - prevMean) / prevMean) * 100).toFixed(1) + '% vs ' + prevName : 'Sin comparativo'}`,
        icon: BarChart3,
        palette: CARD_PALETTES[4],
        delta: prevRecord && prevMean > 0 ? (mean - prevMean) / prevMean * 100 : null,
        chartType: 'cv',
        insight: `Promedio <strong>${mean.toFixed(1)} txn/hora activa</strong>. CV <strong>${cv.toFixed(1)}%</strong> — ${cv > 45 ? 'muy concentrado' : cv > 28 ? 'moderado' : 'uniforme'}.`,
      },
      {
        id: 'trend',
        label: 'Tendencia Histórica',
        value: trendData.length >= 2 ? (() => { const f = trendData[0].total; const l = trendData[trendData.length - 1].total; return f > 0 ? `${((l - f) / f * 100) >= 0 ? '+' : ''}${((l - f) / f * 100).toFixed(1)}%` : '—'; })() : '—',
        sub: `${trendData.length} meses disponibles`,
        icon: TrendingUp,
        palette: CARD_PALETTES[3],
        delta: trendData.length >= 2 ? (() => { const f = trendData[0].total; const l = trendData[trendData.length - 1].total; return f > 0 ? (l - f) / f * 100 : null; })() : null,
        chartType: 'trend',
        insight: trendData.length < 2 ? 'Insuficientes datos.' : `${trendData.length} meses. Variación acumulada: <strong>${trendData[0].total > 0 ? ((trendData[trendData.length-1].total - trendData[0].total)/trendData[0].total*100).toFixed(1) : '—'}%</strong>.`,
      },
    ];
  }, [currentRecord, total, prevTotal, totalGrowth, peakHour, valleyHour, mean, prevMean, cv, sd, peakBlock, peakConcentration, hourValues, prevValues, trendData, prevRecord, prevName]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (!currentRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <BarChart3 className="w-16 h-16 text-slate-200 mb-4" />
        <p className="text-slate-500 font-semibold">Sin datos para esta tienda</p>
        <button onClick={onBack} className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: MAGENTA }}>Volver</button>
      </div>
    );
  }

  const activeCardData = activeCard ? kpiCards.find(c => c.id === activeCard) : null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm flex-shrink-0">
        <div className="max-w-full px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="font-black text-slate-900">{storeCode}</h1>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{storeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ''}
              onChange={e => { const [y, m] = e.target.value.split('-'); setSelectedPeriod({ year: parseInt(y), month: parseInt(m) }); }}
              className="border-2 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none bg-white text-slate-900"
              style={{ borderColor: MAGENTA + '55' }}
            >
              {availableMonths.map(p => (
                <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                  {MONTHS[p.month - 1]} {p.year}
                </option>
              ))}
            </select>

            <button
              onClick={() => setCompareMode(m => !m)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2"
              style={compareMode
                ? { background: MAGENTA, color: '#fff', borderColor: MAGENTA }
                : { borderColor: MAGENTA + '44', color: MAGENTA, background: MAGENTA_PALE }}
            >
              <GitCompare className="w-3.5 h-3.5" />
              {compareMode ? 'Comparando' : 'Comparar'}
            </button>

            {compareMode && availableMonths.length > 1 && (
              <select
                value={comparePeriod ? `${comparePeriod.year}-${comparePeriod.month}` : ''}
                onChange={e => { const [y, m] = e.target.value.split('-'); setComparePeriod({ year: parseInt(y), month: parseInt(m) }); }}
                className="border-2 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none bg-white"
                style={{ borderColor: MAGENTA, color: MAGENTA_DARK }}
              >
                {availableMonths.filter(p => !(p.year === selectedPeriod?.year && p.month === selectedPeriod?.month)).map(p => (
                  <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>{MONTHS[p.month - 1]} {p.year}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY: left sidebar + right charts ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT SIDEBAR ── */}
        <div className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-r border-slate-100 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Tienda</p>
            <p className="font-black text-slate-900">{storeCode}</p>
            {selectedPeriod && (
              <p className="text-xs text-slate-400 mt-0.5">{MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}</p>
            )}
          </div>
          <div className="p-3 space-y-2 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 px-1 mb-1">KPIs del Período</p>
            {kpiCards.map((card, i) => {
              const p = card.palette;
              return (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setActiveCard(card.id)}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full text-left rounded-2xl p-3 cursor-pointer"
                  style={{ background: p.bg, border: `1.5px solid ${p.border}55` }}
                >
                  <div className="h-1 w-full rounded-full mb-2.5" style={{ background: p.icon }} />
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: p.icon + '18' }}>
                      <card.icon className="w-3 h-3" style={{ color: p.icon }} />
                    </div>
                    {card.delta != null && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                        card.delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {card.delta >= 0 ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                        {Math.abs(card.delta).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: p.sub + '99' }}>{card.label}</p>
                  <p className="text-sm font-black leading-tight" style={{ color: p.text }}>{card.value}</p>
                  <p className="text-[9px] mt-0.5 leading-snug" style={{ color: p.sub + 'aa' }}>{card.sub}</p>
                </motion.button>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MAGENTA }} />
              <span className="text-[9px] text-slate-400 font-medium">Hora alta</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-pink-200" />
              <span className="text-[9px] text-slate-400 font-medium">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
              <span className="text-[9px] text-slate-400 font-medium">Bajo</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: scrollable charts ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

            {/* KPI Cards mobile */}
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {kpiCards.map((card, i) => {
                const p = card.palette;
                return (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setActiveCard(card.id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    className="text-left rounded-2xl overflow-hidden cursor-pointer shadow-sm"
                    style={{ background: p.bg, border: `1.5px solid ${p.border}55` }}
                  >
                    <div className="h-1.5 w-full" style={{ background: p.icon }} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: p.icon + '18' }}>
                          <card.icon className="w-3.5 h-3.5" style={{ color: p.icon }} />
                        </div>
                        {card.delta != null && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${card.delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {card.delta >= 0 ? '+' : ''}{Math.abs(card.delta).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: p.sub + 'aa' }}>{card.label}</p>
                      <p className="text-sm font-black" style={{ color: p.text }}>{card.value}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Gráfica principal: barras horarias */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-black text-slate-900">Distribución Horaria de Transacciones</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {MONTHS[(currentRecord.month||1)-1]} {currentRecord.year}
                    {' · '}<strong>{total.toLocaleString('es-CO')} txn</strong>
                    {' · '}Promedio <strong>{mean.toFixed(0)}/h</strong>
                    {totalGrowth !== null && (
                      <span className={`ml-2 font-black ${totalGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}% vs {prevName}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: MAGENTA }} /> Alto</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-pink-200" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-200" /> Bajo</span>
                </div>
              </div>
              {(() => {
                const altoHours = barData.filter(d => getLabel(d.transactions, mean, sd) === 'Alto');
                const bajoHours = barData.filter(d => getLabel(d.transactions, mean, sd) === 'Bajo' && d.transactions > 0);
                const peakBar = barData.reduce((b, d) => d.transactions > b.transactions ? d : b, barData[0]);
                return (
                  <div className="rounded-2xl px-4 py-3 mb-5 border flex flex-wrap gap-x-6 gap-y-1 text-sm"
                    style={{ background: MAGENTA_PALE, borderColor: MAGENTA + '30' }}>
                    <span className="text-slate-700">
                      🕐 La hora con más clientes fue <strong style={{ color: MAGENTA }}>{peakBar?.hour}</strong> con <strong style={{ color: MAGENTA }}>{peakBar?.transactions.toLocaleString('es-CO')} transacciones</strong>.
                      Promedio: <strong>{mean.toFixed(0)} txn/h</strong>.
                    </span>
                    {bajoHours.length > 0 && (
                      <span className="text-slate-500 text-xs self-end">
                        Horas bajas: {bajoHours.map(h => h.hour).join(', ')}
                      </span>
                    )}
                  </div>
                );
              })()}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTip mean={mean} total={total} />} cursor={{ fill: '#fdf2f8' }} />
                  <ReferenceLine y={mean} stroke={MAGENTA_LIGHT} strokeDasharray="6 3"
                    label={{ value: `${mean.toFixed(0)}`, position: 'insideTopRight', fontSize: 10, fill: MAGENTA }} />
                  <Bar dataKey="transactions" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700}>
                    {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Crecimiento Hora a Hora */}
            {(() => {
              const rows = HOURS.map((h, i) => {
                const curr = hourValues[i] || 0;
                const prevTxn = i > 0 ? (hourValues[i - 1] || 0) : null;
                const absChange = prevTxn != null ? curr - prevTxn : null;
                return { hour: HOUR_LABELS[i], txn: curr, prevTxn, absChange };
              }).filter(d => d.txn > 0);

              const growthRows = rows.filter(d => d.absChange != null);
              const avgGrowth = growthRows.length > 0 ? growthRows.reduce((s, d) => s + d.absChange, 0) / growthRows.length : 0;
              const horasSubiendo = growthRows.filter(d => d.absChange > 0).length;
              const horasBajando = growthRows.filter(d => d.absChange < 0).length;
              const mejorCrecimiento = growthRows.reduce((best, d) => d.absChange > (best?.absChange ?? -Infinity) ? d : best, null);
              const mayorCaida = growthRows.reduce((worst, d) => d.absChange < (worst?.absChange ?? Infinity) ? d : worst, null);
              const chartData = rows.map(d => ({ ...d, change: d.absChange }));

              const GrowthTip = ({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white border border-pink-100 shadow-xl px-4 py-3 rounded-2xl text-xs min-w-[170px]">
                    <p className="font-black text-slate-700 mb-2">{label}</p>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Transacciones</span>
                      <span className="font-black text-slate-900">{d.txn.toLocaleString('es-CO')}</span>
                    </div>
                    {d.absChange != null && (
                      <div className="flex justify-between mt-1 pt-1 border-t border-slate-100">
                        <span className="text-slate-400">vs hora anterior</span>
                        <span className={`font-black ${d.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {d.absChange >= 0 ? '+' : ''}{d.absChange.toLocaleString('es-CO')} txn
                        </span>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h2 className="font-black text-slate-900 mb-1">Transacciones por Hora + Crecimiento</h2>
                  <p className="text-xs text-slate-400 mb-4">Barras = volumen · Línea = cambio vs hora anterior</p>
                  <div className="rounded-2xl px-4 py-3 mb-5 border flex flex-wrap gap-x-6 gap-y-1 text-sm"
                    style={{ background: MAGENTA_PALE, borderColor: MAGENTA + '30' }}>
                    <span className="text-slate-700">
                      📈 Promedio:{' '}
                      <strong style={{ color: avgGrowth >= 0 ? '#059669' : '#dc2626' }}>
                        {avgGrowth >= 0 ? '+' : ''}{Math.abs(avgGrowth).toFixed(0)} txn/hora
                      </strong>
                    </span>
                    <span className="text-slate-500 text-xs self-end">
                      {horasSubiendo}↑ · {horasBajando}↓
                      {mejorCrecimiento && ` · Mejor: ${mejorCrecimiento.hour} (+${mejorCrecimiento.absChange.toLocaleString('es-CO')})`}
                      {mayorCaida && mayorCaida.absChange < 0 && ` · Peor: ${mayorCaida.hour} (${mayorCaida.absChange.toLocaleString('es-CO')})`}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="txnBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MAGENTA} stopOpacity={0.85} />
                          <stop offset="100%" stopColor={MAGENTA_LIGHT} stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="txn" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                      <YAxis yAxisId="change" orientation="right" tick={{ fontSize: 11, fill: '#10b981' }} axisLine={false} tickLine={false} width={44}
                        tickFormatter={v => v >= 0 ? `+${v}` : `${v}`} />
                      <ReferenceLine yAxisId="change" y={0} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4 4" />
                      <Tooltip content={<GrowthTip />} cursor={{ fill: '#fdf2f8' }} />
                      <Bar yAxisId="txn" dataKey="txn" name="Transacciones" radius={[7, 7, 0, 0]} maxBarSize={46} animationDuration={700} fill="url(#txnBarGrad)" />
                      <Line yAxisId="change" type="monotone" dataKey="change" name="Cambio vs hora ant."
                        stroke="#10b981" strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          if (payload.change == null) return null;
                          const color = payload.change >= 0 ? '#10b981' : '#ef4444';
                          return <circle key={cx} cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
                        }}
                        activeDot={{ r: 7 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: MAGENTA }} />Transacciones</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 inline-block rounded-full bg-emerald-400" />Cambio vs anterior</span>
                  </div>
                </div>
              );
            })()}

            {/* Comparativo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="mb-4">
                <h2 className="font-black text-slate-900">Comparativo vs {prevName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="font-bold" style={{ color: MAGENTA }}>{MONTHS[(currentRecord.month||1)-1]} {currentRecord.year}</span>
                  {' vs '}
                  <span className="font-bold text-slate-500">{prevName}</span>
                  {totalGrowth !== null && (
                    <span className={`ml-2 font-black text-sm ${totalGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}% · {(totalGrowth >= 0 ? '+' : '') + (total - prevTotal).toLocaleString('es-CO')} txn
                    </span>
                  )}
                </p>
              </div>
              {!prevRecord ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <GitCompare className="w-10 h-10 text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">Activa "Comparar" para seleccionar otro período</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const horasMejoraron = lineData.filter(d => d.diff !== null && d.diff > 0).length;
                    const horasCayeron = lineData.filter(d => d.diff !== null && d.diff < 0).length;
                    const mejorHora = lineData.filter(d => d.diff !== null).reduce((b, d) => d.diff > (b?.diff ?? -Infinity) ? d : b, null);
                    const peorHora = lineData.filter(d => d.diff !== null).reduce((b, d) => d.diff < (b?.diff ?? Infinity) ? d : b, null);
                    const absTotal = total - prevTotal;
                    return (
                      <div className="rounded-2xl px-4 py-3 mb-5 border flex flex-wrap gap-x-6 gap-y-1 text-sm"
                        style={{ background: MAGENTA_PALE, borderColor: MAGENTA + '30' }}>
                        <span className="text-slate-700">
                          {totalGrowth >= 0 ? '📈' : '📉'} <strong style={{ color: totalGrowth >= 0 ? '#059669' : '#dc2626' }}>
                            {absTotal >= 0 ? '+' : ''}{absTotal.toLocaleString('es-CO')} txn
                          </strong> vs {prevName}. {horasMejoraron > 0 && `${horasMejoraron} horas mejoraron`}{horasCayeron > 0 && `, ${horasCayeron} cayeron`}.
                        </span>
                        <span className="text-slate-500 text-xs self-end">
                          {mejorHora && `Mejor: ${mejorHora.hour} (+${mejorHora.diff?.toFixed(0)}%)`}
                          {peorHora && peorHora.diff < 0 && ` · Peor: ${peorHora.hour} (${peorHora.diff?.toFixed(0)}%)`}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex gap-2 flex-wrap mb-5">
                    {lineData.map((d, i) => {
                      if (d.diff === null) return null;
                      const absChange = d.current != null && d.previous != null ? d.current - d.previous : null;
                      const isPos = d.diff >= 0;
                      const colorCls = d.diff >= 5
                        ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', sub: 'text-emerald-500' }
                        : d.diff >= 0
                        ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', sub: 'text-green-500' }
                        : d.diff >= -10
                        ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', sub: 'text-amber-500' }
                        : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', sub: 'text-red-400' };
                      return (
                        <div key={i} className={`flex items-center gap-2 ${colorCls.bg} border ${colorCls.border} rounded-2xl px-3 py-2`}>
                          <span className={`text-[11px] font-black ${colorCls.text}`}>{d.hour}</span>
                          <div className="flex flex-col items-center leading-none">
                            <span className={`text-[11px] font-black ${colorCls.text} flex items-center gap-0.5`}>
                              {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {isPos ? '+' : ''}{d.diff.toFixed(0)}%
                            </span>
                            {absChange !== null && (
                              <span className={`text-[9px] font-semibold ${colorCls.sub} mt-0.5`}>
                                {absChange >= 0 ? '+' : ''}{absChange.toLocaleString('es-CO')} txn
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={MAGENTA} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={MAGENTA} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={(p) => <LineTip {...p} prevName={prevName} />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                        formatter={(v) => <span style={{ color: v === 'Actual' ? MAGENTA : '#94a3b8' }}>{v}</span>} />
                      <Area type="monotone" dataKey="current" fill="url(#compGrad)" stroke="none" />
                      <Line type="monotone" dataKey="current" name="Actual" stroke={MAGENTA} strokeWidth={3}
                        dot={{ r: 5, fill: MAGENTA, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="previous" name={prevName} stroke="#cbd5e1" strokeWidth={2}
                        strokeDasharray="6 3" dot={{ r: 3, fill: '#cbd5e1' }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Tendencia histórica */}
            {trendData.length >= 2 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-black text-slate-900">Tendencia Histórica</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {trendData.length} meses · promedio {Math.round(trendData.map(d => d.total).filter(v => v > 0).reduce((s, v) => s + v, 0) / trendData.filter(d => d.total > 0).length).toLocaleString('es-CO')} txn/mes
                      {trendData.length >= 2 && trendData[0].total > 0 && (
                        <span className={`ml-2 font-black ${trendData[trendData.length-1].total >= trendData[0].total ? 'text-emerald-600' : 'text-red-500'}`}>
                          {((trendData[trendData.length-1].total - trendData[0].total) / trendData[0].total * 100) >= 0 ? '+' : ''}
                          {((trendData[trendData.length-1].total - trendData[0].total) / trendData[0].total * 100).toFixed(1)}% acumulado
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {(() => {
                  const vals = trendData.map(d => d.total).filter(v => v > 0);
                  if (vals.length < 2) return null;
                  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
                  const last = vals[vals.length - 1];
                  const first = vals[0];
                  const best = trendData.reduce((b, d) => d.total > (b?.total ?? 0) ? d : b, null);
                  const worst = trendData.filter(d => d.total > 0).reduce((b, d) => d.total < (b?.total ?? Infinity) ? d : b, null);
                  const trend = last >= first ? 'subiendo' : 'bajando';
                  const growthAcc = ((last - first) / first * 100);
                  return (
                    <div className="rounded-2xl px-4 py-3 mb-5 border flex flex-wrap gap-x-6 gap-y-1 text-sm"
                      style={{ background: MAGENTA_PALE, borderColor: MAGENTA + '30' }}>
                      <span className="text-slate-700">
                        {last >= avg ? '📈' : '📉'} <strong>{vals.length} meses</strong> · promedio <strong>{Math.round(avg).toLocaleString('es-CO')} txn/mes</strong>.
                        Tendencia: <strong style={{ color: trend === 'subiendo' ? '#059669' : '#dc2626' }}>{trend}</strong> ({growthAcc >= 0 ? '+' : ''}{growthAcc.toFixed(1)}%)
                      </span>
                      <span className="text-slate-500 text-xs self-end">
                        Mejor: <strong>{best?.label}</strong> ({best?.total.toLocaleString('es-CO')} txn)
                        {worst && ` · Menor: ${worst?.label} (${worst?.total.toLocaleString('es-CO')} txn)`}
                      </span>
                    </div>
                  );
                })()}
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MAGENTA} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={MAGENTA} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TrendTip />} />
                    <Area type="monotone" dataKey="total" stroke={MAGENTA} strokeWidth={3} fill="url(#trendGrad)"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const isSel = payload.month === selectedPeriod?.month && payload.year === selectedPeriod?.year;
                        return <circle key={`d${cx}${cy}`} cx={cx} cy={cy} r={isSel ? 7 : 4}
                          fill={isSel ? MAGENTA : '#fff'} stroke={MAGENTA} strokeWidth={2} />;
                      }}
                      activeDot={{ r: 7, fill: MAGENTA, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {(() => {
                  const vals = trendData.map(d => d.total).filter(v => v > 0);
                  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
                  const last = vals[vals.length - 1];
                  const isUp = last >= avg;
                  return (
                    <div className={`mt-3 rounded-xl px-4 py-2.5 text-xs border flex items-center gap-2 ${isUp ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                      {isUp ? <TrendingUp className="w-4 h-4 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 flex-shrink-0" />}
                      <span>
                        <strong>{isUp ? 'Mes actual sobre el promedio histórico' : 'Mes actual por debajo del promedio histórico'}</strong>
                        {' · '}Histórico: <strong>{Math.round(avg).toLocaleString('es-CO')} txn/mes</strong>
                        {' · '}<strong>{last.toLocaleString('es-CO')} txn</strong> este mes
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Ranking */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-x-auto">
              <h2 className="font-black text-slate-900 mb-2">Ranking de Franjas Horarias</h2>
              {(() => {
                const sorted = [...sortedRanking];
                const top = sorted[0];
                const highHours = rankingData.filter(r => r.label === 'Alto');
                const lowHours = rankingData.filter(r => r.label === 'Bajo' && r.transactions > 0);
                const topVsPrev = rankingData.filter(r => r.vsPrev !== null).sort((a, b) => b.vsPrev - a.vsPrev)[0];
                return (
                  <div className="rounded-2xl px-4 py-3 mb-4 border flex flex-wrap gap-x-6 gap-y-1 text-sm"
                    style={{ background: MAGENTA_PALE, borderColor: MAGENTA + '30' }}>
                    <span className="text-slate-700">
                      🏆 <strong style={{ color: MAGENTA }}>{top?.hour}</strong> — <strong style={{ color: MAGENTA }}>{top?.transactions.toLocaleString('es-CO')} txn</strong> ({top?.pctTotal.toFixed(1)}%)
                      {highHours.length > 0 && `. ${highHours.length} hora${highHours.length > 1 ? 's' : ''} alta${highHours.length > 1 ? 's' : ''}: ${highHours.map(h => h.hour).join(', ')}.`}
                    </span>
                    {lowHours.length > 0 && (
                      <span className="text-slate-500 text-xs self-end">
                        Bajas: {lowHours.map(h => h.hour).join(', ')}
                        {topVsPrev && topVsPrev.vsPrev > 0 && ` · Mayor mejora vs ${prevName}: ${topVsPrev.hour} (+${topVsPrev.vsPrev.toFixed(0)}%)`}
                      </span>
                    )}
                  </div>
                );
              })()}
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ background: MAGENTA_PALE }}>
                    <th className="text-left py-3 px-4 font-bold text-xs rounded-l-xl" style={{ color: MAGENTA_DARK }}>Hora</th>
                    {[
                      { key: 'transactions', label: 'Transacciones' },
                      { key: 'pctTotal', label: '% Día' },
                      { key: 'vsPrev', label: `vs ${prevName}` },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        className="text-right py-3 px-4 font-bold text-xs cursor-pointer hover:opacity-70 select-none"
                        style={{ color: MAGENTA_DARK }}>
                        <span className="flex items-center justify-end gap-1">{col.label}
                          {sortKey === col.key
                            ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" style={{ color: MAGENTA }} /> : <ChevronUp className="w-3 h-3" style={{ color: MAGENTA }} />)
                            : <Minus className="w-3 h-3 text-slate-300" />}
                        </span>
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-bold text-xs rounded-r-xl" style={{ color: MAGENTA_DARK }}>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRanking.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-pink-50/30 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{row.hour}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{row.transactions.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{row.pctTotal.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right">
                        {row.vsPrev !== null ? (
                          <span className={`font-bold inline-flex items-center gap-0.5 ${row.vsPrev >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {row.vsPrev >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {row.vsPrev >= 0 ? '+' : ''}{row.vsPrev.toFixed(1)}%
                          </span>
                        ) : <span className="text-slate-200">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={row.label === 'Alto'
                            ? { background: MAGENTA, color: '#fff' }
                            : row.label === 'Normal'
                            ? { background: MAGENTA_PALE, color: MAGENTA_DARK }
                            : { background: '#f1f5f9', color: '#94a3b8' }}>
                          {row.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* Modal */}
      {activeCardData && (
        <KPIModal
          card={activeCardData}
          onClose={() => setActiveCard(null)}
          hourValues={hourValues}
          prevValues={prevValues}
          trendData={trendData}
          mean={mean}
          sd={sd}
          total={total}
          prevTotal={prevTotal}
          totalGrowth={totalGrowth}
          prevName={prevName}
          lineData={lineData}
        />
      )}
    </div>
  );
}