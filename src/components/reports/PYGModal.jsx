import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, ChevronDown, Activity,
  Target, DollarSign, Users, Package, ChevronRight, Flame
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  Legend, ComposedChart, RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MAGENTA = '#f0147c';
const NEON_BLUE = '#38bdf8';
const NEON_PURPLE = '#a78bfa';
const NEON_AMBER = '#fbbf24';
const NEON_GREEN = '#34d399';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pctNum = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;
const fmt = (v) => v != null ? `${pctNum(v).toFixed(1)}%` : '—';

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

// ─── Dark Tooltip ─────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(148,163,184,0.15)', backdropFilter: 'blur(20px)' }}
      className="rounded-2xl px-4 py-3 shadow-2xl min-w-[160px]">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-black text-white text-sm">{typeof p.value === 'number' ? `${p.value?.toFixed(1)}%` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Gauge Chart ──────────────────────────────────────────────────────────────
function GaugeKPI({ value, max = 50, label, color, sublabel, status }) {
  const safeVal = value ?? 0;
  const pct = Math.min(safeVal / max, 1);
  const statusColors = { good: '#34d399', warn: '#fbbf24', bad: '#f87171' };
  const statusColor = statusColors[status] || color;

  // Arc math: starts at -220deg, sweeps 260deg
  const startAngleDeg = -220;
  const sweepDeg = 260;
  const toRad = (d) => (d * Math.PI) / 180;
  const cx = 80, cy = 80, r = 58;

  const arcPath = (startDeg, sweepD) => {
    const s = toRad(startDeg);
    const e = toRad(startDeg + sweepD);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = sweepD > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const fillSweep = pct * sweepDeg;
  const needleAngle = startAngleDeg + fillSweep;
  const needleRad = toRad(needleAngle);
  const needleLen = 42;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const gradId = `gauge_grad_${label.replace(/\s/g, '_')}`;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative" style={{ width: 160, height: 110 }}>
        <svg viewBox="0 0 160 110" width="160" height="110">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={statusColor} stopOpacity="1" />
            </linearGradient>
            {/* Glow filter */}
            <filter id={`glow_${label.replace(/\s/g, '_')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const a = toRad(startAngleDeg + t * sweepDeg);
            const innerR = r - 10;
            const outerR = r - 4;
            return (
              <line key={i}
                x1={cx + innerR * Math.cos(a)} y1={cy + innerR * Math.sin(a)}
                x2={cx + outerR * Math.cos(a)} y2={cy + outerR * Math.sin(a)}
                stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinecap="round" />
            );
          })}

          {/* Track */}
          <path d={arcPath(startAngleDeg, sweepDeg)}
            fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="10" strokeLinecap="round" />

          {/* Fill arc */}
          {fillSweep > 2 && (
            <path d={arcPath(startAngleDeg, fillSweep)}
              fill="none" stroke={`url(#${gradId})`} strokeWidth="10" strokeLinecap="round"
              filter={`url(#glow_${label.replace(/\s/g, '_')})`} />
          )}

          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny}
            stroke={statusColor} strokeWidth="2.5" strokeLinecap="round"
            filter={`url(#glow_${label.replace(/\s/g, '_')})`} />
          {/* Needle pivot */}
          <circle cx={cx} cy={cy} r="5" fill={statusColor} />
          <circle cx={cx} cy={cy} r="2.5" fill="#060d1b" />
        </svg>

        {/* Value centered below pivot */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-2xl font-black leading-none tracking-tight"
            style={{ color: statusColor, textShadow: `0 0 12px ${statusColor}60` }}>
            {value != null ? `${value.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest mt-1">{label}</p>
      {sublabel && <p className="text-[10px] font-medium mt-0.5" style={{ color: statusColor + 'aa' }}>{sublabel}</p>}

      {/* Status pill */}
      <div className="mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
        style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
        {status === 'good' ? '● Óptimo' : status === 'warn' ? '● Revisar' : '● Crítico'}
      </div>
    </div>
  );
}

// ─── Waterfall Bar ────────────────────────────────────────────────────────────
function WaterfallChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(248,113,113,0.05)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Area Trend ───────────────────────────────────────────────────────────────
function AreaTrend({ data, dataKey, color, height = 200, name }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`ag_${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2' }} />
        <Area type="monotone" dataKey={dataKey} name={name || dataKey} stroke={color} strokeWidth={2.5}
          fill={`url(#ag_${dataKey})`} dot={{ fill: color, r: 4, strokeWidth: 2, stroke: '#0f172a' }}
          activeDot={{ r: 6, fill: color, stroke: '#0f172a', strokeWidth: 2 }} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Multi-Line Trend ─────────────────────────────────────────────────────────
function MultiLineTrend({ data, lines, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<DarkTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12, color: '#94a3b8' }} />
        {lines.map(l => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2}
            dot={{ fill: l.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: l.color, stroke: '#0f172a', strokeWidth: 2 }}
            animationDuration={900} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Donut Breakdown ──────────────────────────────────────────────────────────
function DonutBreakdown({ ebitda, costReal, personal, gastos }) {
  const remainder = Math.max(0, 100 - (ebitda || 0) - (costReal || 0) - (personal || 0) - (gastos || 0));
  const donutData = [
    { name: 'EBITDA', value: ebitda || 0, color: MAGENTA },
    { name: 'Costo Producto', value: costReal || 0, color: NEON_BLUE },
    { name: 'Personal', value: personal || 0, color: NEON_PURPLE },
    { name: 'Gastos', value: gastos || 0, color: NEON_AMBER },
    { name: 'Otros', value: remainder, color: '#334155' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3}
            dataKey="value" animationDuration={800}>
            {donutData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {donutData.map((d, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            {d.name}: <span className="font-black text-slate-200">{d.value.toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Insight Cards ────────────────────────────────────────────────────────────
function QuantInsights({ primaryRecord, prevRecord, trendData }) {
  if (!primaryRecord) return null;
  const ebitda = pctNum(primaryRecord.margen_ebitda);
  const prevEbitda = prevRecord ? pctNum(prevRecord.margen_ebitda) : null;
  const costReal = pctNum(primaryRecord.cost_real);
  const costTeo = pctNum(primaryRecord.cost_teorico);
  const personal = pctNum(primaryRecord.costo_personal);
  const prevPersonal = prevRecord ? pctNum(prevRecord.costo_personal) : null;
  const gastos = pctNum(primaryRecord.gastos_pct_venta);
  const arriendos = pctNum(primaryRecord.arriendos) || 0;

  const items = [];

  if (prevEbitda !== null && ebitda !== null) {
    const diff = ebitda - prevEbitda;
    items.push({
      type: diff >= 0 ? 'good' : 'bad',
      icon: diff >= 0 ? '📈' : '📉',
      title: `EBITDA ${diff >= 0 ? 'mejoró' : 'cayó'} ${Math.abs(diff).toFixed(2)}pp vs mes anterior`,
      detail: `De ${prevEbitda.toFixed(1)}% → ${ebitda.toFixed(1)}%. ${diff < 0 ? `Para recuperar: reducir gastos o aumentar ventas ~${(Math.abs(diff) / (arriendos || 10) * 100).toFixed(0)}%.` : `Mantén la eficiencia actual.`}`,
    });
  }

  if (costReal != null && costTeo != null) {
    const brecha = costReal - costTeo;
    items.push({
      type: brecha > 0 ? 'bad' : 'good',
      icon: brecha > 0 ? '⚠️' : '✅',
      title: `Costo real ${brecha > 0 ? 'EXCEDE' : 'está bajo'} el teórico en ${Math.abs(brecha).toFixed(2)}pp`,
      detail: `Real ${costReal.toFixed(1)}% vs Teórico ${costTeo.toFixed(1)}%. ${brecha > 0 ? `Cada punto de exceso = -1pp EBITDA directo.` : `Ahorro de ${Math.abs(brecha).toFixed(2)}pp sobre presupuesto.`}`,
    });
  }

  if (personal != null && personal > 22) {
    items.push({
      type: 'warn',
      icon: '👥',
      title: `Personal en ${personal.toFixed(1)}% — por encima del óptimo (20-22%)`,
      detail: `Reducir ${(personal - 22).toFixed(1)}pp de nómina sobre venta = +${(personal - 22).toFixed(1)}pp EBITDA. ${prevPersonal !== null ? `Variación: ${(personal - prevPersonal) > 0 ? '+' : ''}${(personal - prevPersonal).toFixed(2)}pp.` : ''}`,
    });
  } else if (personal != null) {
    items.push({
      type: 'good', icon: '✅',
      title: `Personal eficiente al ${personal.toFixed(1)}% — dentro del rango óptimo`,
      detail: `Rango recomendado: 20-22%. Tienes ${(22 - personal).toFixed(1)}pp de margen.`,
    });
  }

  if (trendData.length >= 3) {
    const last3 = trendData.slice(-3);
    const improving = last3[2].EBITDA > last3[0].EBITDA;
    items.push({
      type: improving ? 'good' : 'warn', icon: improving ? '📈' : '📉',
      title: `Tendencia ${improving ? 'alcista' : 'bajista'} en EBITDA (últimos 3 meses)`,
      detail: `${last3.map(d => `${d.mes}: ${d.EBITDA?.toFixed(1)}%`).join(' → ')}`,
    });
  }

  const colorMap = {
    good:  { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  text: '#34d399', dot: '#34d399' },
    bad:   { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#f87171', dot: '#f87171' },
    warn:  { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  text: '#fbbf24', dot: '#fbbf24' },
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const c = colorMap[item.type];
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-3.5 border flex gap-3 items-start"
            style={{ background: c.bg, borderColor: c.border }}>
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <div>
              <p className="font-black text-sm leading-tight mb-0.5" style={{ color: c.text }}>{item.title}</p>
              <p className="text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── KPI Detail Modal ──────────────────────────────────────────────────────────
function KPIDetailModal({ kpiId, onClose, primaryRecord, prevRecord, trendData, selectedMonth }) {
  if (!kpiId || !primaryRecord) return null;

  const configs = {
    ebitda: {
      title: 'Margen EBITDA', metric: 'EBITDA', dataKey: 'margen_ebitda', color: MAGENTA,
      description: 'Ganancia operativa por cada peso de venta. Meta: ≥25%',
      benchmarks: [{ label: 'Crítico', range: '< 15%', color: '#f87171' }, { label: 'Normal', range: '15–24%', color: '#fbbf24' }, { label: 'Óptimo', range: '≥ 25%', color: '#34d399' }],
      insight: (r, p) => {
        const v = pctNum(r.margen_ebitda);
        if (v == null) return 'Sin datos suficientes.';
        const pv = p ? pctNum(p.margen_ebitda) : null;
        const gap25 = (25 - v).toFixed(1);
        return v >= 25
          ? `✅ EBITDA en zona óptima (${v.toFixed(1)}%). ${pv != null ? `Variación vs anterior: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''} Mantén la estructura de costos.`
          : `⚠️ EBITDA de ${v.toFixed(1)}%. Para llegar al 25% necesitas mejorar ${gap25}pp — reducir gastos variables en ${gap25}pp o aumentar ventas ~${(parseFloat(gap25) * 3).toFixed(0)}%.`;
      },
    },
    personal: {
      title: 'Costo Personal', metric: 'Personal', dataKey: 'costo_personal', color: NEON_PURPLE,
      description: '% de nómina sobre ventas. Meta: ≤22%.',
      benchmarks: [{ label: 'Óptimo', range: '≤ 20%', color: '#34d399' }, { label: 'Normal', range: '20–25%', color: '#fbbf24' }, { label: 'Alto', range: '> 25%', color: '#f87171' }],
      insight: (r, p) => {
        const v = pctNum(r.costo_personal);
        if (v == null) return 'Sin datos suficientes.';
        const pv = p ? pctNum(p.costo_personal) : null;
        const reducir = Math.max(0, v - 22).toFixed(1);
        return v > 22
          ? `⚠️ Personal en ${v.toFixed(1)}% — ${reducir}pp sobre el límite. Reducirlo impacta +${reducir}pp en EBITDA. ${pv != null ? `Tendencia: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`
          : `✅ Personal eficiente en ${v.toFixed(1)}%. Tienes ${(22 - v).toFixed(1)}pp de margen. ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`;
      },
    },
    costo: {
      title: 'Costo Real vs Teórico', metric: 'C.Real', dataKey: 'cost_real', color: NEON_BLUE,
      description: 'Desviación del costo real sobre el presupuesto teórico.',
      benchmarks: [{ label: 'Bajo presupuesto', range: 'Real < Teórico', color: '#34d399' }, { label: 'En presupuesto', range: '±1%', color: '#fbbf24' }, { label: 'Exceso', range: 'Real > Teórico', color: '#f87171' }],
      insight: (r, p) => {
        const v = pctNum(r.cost_real);
        const teo = pctNum(r.cost_teorico);
        if (v == null || teo == null) return 'Sin datos suficientes.';
        const brecha = (v - teo).toFixed(2);
        const pv = p ? pctNum(p.cost_real) : null;
        return v > teo
          ? `⚠️ Costo real ${v.toFixed(1)}% excede el teórico ${teo.toFixed(1)}% en +${brecha}pp. Cada punto = -1pp EBITDA. ${pv != null ? `Vs anterior: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`
          : `✅ Costo real ${v.toFixed(1)}% bajo el teórico ${teo.toFixed(1)}%. Ahorro de ${Math.abs(parseFloat(brecha)).toFixed(2)}pp. ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`;
      },
    },
    gastos: {
      title: 'Gastos % Venta', metric: 'Gastos', dataKey: 'gastos_pct_venta', color: NEON_AMBER,
      description: 'Arriendos + servicios + admin como % de ventas. Meta: ≤40%.',
      benchmarks: [{ label: 'Óptimo', range: '≤ 35%', color: '#34d399' }, { label: 'Normal', range: '35–45%', color: '#fbbf24' }, { label: 'Elevado', range: '> 45%', color: '#f87171' }],
      insight: (r, p) => {
        const v = pctNum(r.gastos_pct_venta);
        if (v == null) return 'Sin datos suficientes.';
        const arr = pctNum(r.arriendos) || 0;
        const adm = pctNum(r.administracion) || 0;
        const serv = pctNum(r.servicios_publicos) || 0;
        const pv = p ? pctNum(p.gastos_pct_venta) : null;
        return `Gastos en ${v.toFixed(1)}% — Arriendos ${arr.toFixed(1)}%, Admin ${adm.toFixed(1)}%, Servicios ${serv.toFixed(1)}%. ${v > 40 ? `⚠️ Sobre umbral. Para bajar 1pp aumenta ventas ~${(1 / v * 100).toFixed(0)}%.` : `✅ Dentro del rango aceptable.`} ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`;
      },
    },
  };

  const cfg = configs[kpiId];
  if (!cfg) return null;
  const currentVal = pctNum(primaryRecord[cfg.dataKey]);
  const prevVal = prevRecord ? pctNum(prevRecord[cfg.dataKey]) : null;
  const delta = prevVal != null && currentVal != null ? currentVal - prevVal : null;
  const isGood = cfg.dataKey !== 'margen_ebitda' ? (delta != null && delta <= 0) : (delta != null && delta >= 0);

  const chartData = trendData.map(d => ({ ...d, isSelected: d.month === selectedMonth }));
  const avg = trendData.length > 0 ? trendData.reduce((s, d) => s + (d[cfg.metric] || 0), 0) / trendData.length : 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: '#0f172a', border: `1px solid ${cfg.color}30` }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-5 flex items-start justify-between"
            style={{ background: `linear-gradient(135deg, ${cfg.color}18 0%, transparent 100%)`, borderBottom: `1px solid ${cfg.color}20` }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>{cfg.title}</p>
              <p className="text-4xl font-black text-white leading-none">{currentVal != null ? `${currentVal.toFixed(1)}%` : '—'}</p>
              {delta != null && (
                <span className={`inline-flex items-center gap-1 text-xs font-black mt-2 px-2 py-1 rounded-full ${isGood ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta > 0 ? '+' : ''}{delta.toFixed(2)}pp vs anterior
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(148,163,184,0.1)' }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Benchmarks */}
            <div>
              <p className="text-xs text-slate-500 mb-3">{cfg.description}</p>
              <div className="flex gap-2 flex-wrap">
                {cfg.benchmarks.map(b => (
                  <span key={b.label} className="px-2.5 py-1 rounded-full text-[10px] font-black"
                    style={{ background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}30` }}>
                    {b.label}: {b.range}
                  </span>
                ))}
              </div>
            </div>

            {/* Gráfica histórica */}
            {chartData.length >= 1 && (
              <div>
                <p className="text-xs font-black text-slate-300 uppercase tracking-wide mb-3">Evolución Histórica</p>
                <div style={{ background: 'rgba(148,163,184,0.04)', borderRadius: 14, padding: '12px 8px 4px' }}>
                  <AreaTrend data={chartData} dataKey={cfg.metric} color={cfg.color} height={180} name={cfg.title} />
                </div>
              </div>
            )}

            {/* Insight */}
            <div className="rounded-xl p-4" style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}25` }}>
              <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: cfg.color }}>Análisis & Acción</p>
              <p className="text-sm leading-relaxed text-slate-300">{cfg.insight(primaryRecord, prevRecord)}</p>
            </div>

            {/* Comparativo */}
            {prevRecord && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Actual', val: currentVal, color: cfg.color },
                  { label: 'Anterior', val: prevVal, color: '#64748b' },
                  { label: 'Variación', val: delta, isGood, isDelta: true },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
                    <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                    <p className="font-black text-xl" style={{ color: item.isDelta ? (item.isGood ? '#34d399' : '#f87171') : (item.color || '#f1f5f9') }}>
                      {item.isDelta ? (item.val != null ? `${item.val > 0 ? '+' : ''}${item.val.toFixed(2)}pp` : '—') : (item.val != null ? `${item.val.toFixed(1)}%` : '—')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── EBITDA Simulator ─────────────────────────────────────────────────────────
function EBITDASimulator({ primaryRecord, trendData }) {
  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const gastosFijosEstimados = (pctNum(primaryRecord?.arriendos) || 0) + (pctNum(primaryRecord?.administracion) || 0) + (pctNum(primaryRecord?.servicios_publicos) || 0);

  const targets = [20, 25, 30].map(t => {
    const gap = ebitda != null ? t - ebitda : null;
    const inc = gap != null && gastosFijosEstimados > 0 ? (gap / gastosFijosEstimados * 100).toFixed(1) : null;
    return { target: t, gap: gap?.toFixed(1), inc };
  });

  const best = trendData.length > 0 ? Math.max(...trendData.map(d => d.EBITDA || 0)) : null;
  const avg = trendData.length > 0 ? (trendData.reduce((s, d) => s + (d.EBITDA || 0), 0) / trendData.length).toFixed(1) : null;

  return (
    <div className="space-y-5">
      {/* Estado actual */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'EBITDA Actual', val: ebitda != null ? `${ebitda.toFixed(1)}%` : '—', color: MAGENTA },
          { label: 'Promedio Histórico', val: avg ? `${avg}%` : '—', color: NEON_BLUE },
          { label: 'Mejor Mes', val: best ? `${best.toFixed(1)}%` : '—', color: NEON_GREEN },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(148,163,184,0.06)', border: `1px solid ${item.color}25` }}>
            <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">{item.label}</p>
            <p className="font-black text-2xl" style={{ color: item.color }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Targets */}
      <div>
        <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Para llegar a…</p>
        <div className="space-y-2">
          {targets.filter(t => t.gap > 0).map(t => (
            <div key={t.target} className="flex items-center gap-3 rounded-xl p-3.5"
              style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: t.target >= 30 ? NEON_GREEN : t.target >= 25 ? NEON_AMBER : MAGENTA }}>
                {t.target}%
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-200">EBITDA objetivo {t.target}%</p>
                <p className="text-[10px] text-slate-500">Mejorar {t.gap}pp · {t.inc ? `Incrementar venta ~${t.inc}%` : `Reducir gastos ${t.gap}pp`}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
          ))}
          {targets.every(t => t.gap <= 0) && (
            <div className="rounded-xl p-4 text-center text-sm font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: NEON_GREEN, border: '1px solid rgba(52,211,153,0.2)' }}>
              ✅ EBITDA por encima de todos los targets
            </div>
          )}
        </div>
      </div>

      {/* Palancas */}
      <div>
        <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Palancas de Mejora</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Reducir Personal 1pp', impact: '+1pp EBITDA', icon: Users, color: NEON_PURPLE },
            { label: 'Reducir Gastos 1pp', impact: '+1pp EBITDA', icon: Package, color: NEON_AMBER },
            { label: 'Bajar Costo Producto 1pp', impact: '+1pp EBITDA', icon: DollarSign, color: NEON_BLUE },
            { label: 'Aumentar ventas 5%', impact: `+${((gastosFijosEstimados * 0.05)).toFixed(1)}pp est.`, icon: TrendingUp, color: NEON_GREEN },
          ].map((p, i) => (
            <div key={i} className="rounded-xl p-3 flex items-start gap-2.5"
              style={{ background: `${p.color}08`, border: `1px solid ${p.color}20` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${p.color}20` }}>
                <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-300">{p.label}</p>
                <p className="text-[10px] font-black" style={{ color: p.color }}>{p.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cost Table ────────────────────────────────────────────────────────────────
function CostTable({ primaryRecord, prevRecord }) {
  const rows = [
    { label: 'Costo de Producto', key: 'cost_real', teo: 'cost_teorico', inverse: true },
    { label: 'Costo Personal', key: 'costo_personal', inverse: true },
    { label: 'Arriendos', key: 'arriendos', inverse: true },
    { label: 'Servicios Públicos', key: 'servicios_publicos', inverse: true },
    { label: 'Administración', key: 'administracion', inverse: true },
    { label: 'Impuestos', key: 'impuestos', inverse: true },
    { label: 'Gastos % Venta', key: 'gastos_pct_venta', inverse: true },
    { label: 'Margen EBITDA', key: 'margen_ebitda', inverse: false, highlight: true },
  ].filter(r => primaryRecord?.[r.key] != null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(240,20,124,0.08)' }}>
            <th className="text-left py-3 px-4 text-xs font-black rounded-l-xl text-slate-300 uppercase tracking-wide">Partida</th>
            <th className="text-right py-3 px-4 text-xs font-black text-slate-300">Actual</th>
            {prevRecord && <th className="text-right py-3 px-4 text-xs font-black text-slate-300">Anterior</th>}
            {prevRecord && <th className="text-right py-3 px-4 text-xs font-black text-slate-300 rounded-r-xl">Δ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const curr = pctNum(primaryRecord?.[row.key]);
            const prev = prevRecord ? pctNum(prevRecord?.[row.key]) : null;
            const delta = prev != null && curr != null ? curr - prev : null;
            const isGood = delta == null ? null : (row.inverse ? delta < 0 : delta > 0);
            return (
              <tr key={i} className="border-b hover:bg-white/5 transition-colors"
                style={{ borderColor: 'rgba(148,163,184,0.08)', fontWeight: row.highlight ? 900 : 400 }}>
                <td className="py-3 px-4 text-slate-300">
                  {row.highlight && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: MAGENTA }} />}
                  {row.label}
                  {row.teo && primaryRecord?.[row.teo] && (
                    <span className="ml-2 text-[10px] text-slate-600">(teo: {fmt(primaryRecord[row.teo])})</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-black" style={{ color: row.highlight ? MAGENTA : '#f1f5f9' }}>
                  {curr != null ? `${curr.toFixed(1)}%` : '—'}
                </td>
                {prevRecord && <td className="py-3 px-4 text-right text-slate-500 text-xs">{prev != null ? `${prev.toFixed(1)}%` : '—'}</td>}
                {prevRecord && (
                  <td className="py-3 px-4 text-right text-xs font-black">
                    {delta != null ? (
                      <span style={{ color: isGood ? '#34d399' : '#f87171' }}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(2)}pp
                      </span>
                    ) : '—'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PYGModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-modal', storeCode, currentYear],
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
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeKPI, setActiveKPI] = useState(null);

  useEffect(() => {
    if (lastMonthWithData && !selectedMonth) setSelectedMonth(lastMonthWithData);
  }, [lastMonthWithData]);

  const primaryRecord = allRecords.find(r => r.month === selectedMonth) || null;
  const prevMonth = selectedMonth > 1 ? selectedMonth - 1 : null;
  const prevRecord = prevMonth ? allRecords.find(r => r.month === prevMonth) : null;

  const trendData = useMemo(() =>
    MONTHS_SHORT.map((mes, i) => {
      const rec = allRecords.find(r => r.month === i + 1);
      if (!rec) return null;
      return {
        mes, month: i + 1,
        EBITDA: pctNum(rec.margen_ebitda),
        'C.Real': pctNum(rec.cost_real),
        'C.Teo': pctNum(rec.cost_teorico),
        Personal: pctNum(rec.costo_personal),
        Gastos: pctNum(rec.gastos_pct_venta),
      };
    }).filter(Boolean),
    [allRecords]
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Tendencias' },
    { id: 'simulator', label: 'Simulador' },
    { id: 'breakdown', label: 'Desglose' },
  ];

  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const ebitdaStatus = ebitda == null ? 'warn' : ebitda >= 25 ? 'good' : ebitda >= 15 ? 'warn' : 'bad';
  const personal = pctNum(primaryRecord?.costo_personal);
  const personalStatus = personal == null ? 'warn' : personal <= 22 ? 'good' : personal <= 25 ? 'warn' : 'bad';
  const costReal = pctNum(primaryRecord?.cost_real);
  const costTeo = pctNum(primaryRecord?.cost_teorico);
  const costoStatus = costReal == null || costTeo == null ? 'warn' : costReal <= costTeo ? 'good' : 'bad';
  const gastos = pctNum(primaryRecord?.gastos_pct_venta);
  const gastosStatus = gastos == null ? 'warn' : gastos <= 40 ? 'good' : gastos <= 45 ? 'warn' : 'bad';

  // Waterfall data for overview
  const waterfallData = primaryRecord ? [
    { label: 'Venta', value: 100, color: '#34d399' },
    { label: 'C. Prod.', value: -(costReal || 0), color: '#f87171' },
    { label: 'Personal', value: -(personal || 0), color: '#a78bfa' },
    { label: 'Gastos', value: -(gastos || 0), color: '#fbbf24' },
    { label: 'EBITDA', value: ebitda || 0, color: MAGENTA },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: '#060d1b' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: MAGENTA, filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: NEON_BLUE, filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(6,13,27,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${MAGENTA} 0%, #9d174d 100%)` }}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl text-white leading-tight tracking-tight">P&G Intelligence</h1>
                <p className="text-slate-500 text-xs">{storeCode} · {currentYear} · {primaryRecord ? MONTHS_FULL[(selectedMonth || 1) - 1] : 'Sin datos'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.12)' }}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month selector */}
            <div className="relative">
              <button onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-slate-300 transition-all"
                style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)' }}>
                📅 {selectedMonth ? MONTHS_SHORT[selectedMonth - 1] : 'Mes'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 rounded-2xl shadow-2xl z-20 p-3 grid grid-cols-4 gap-1.5"
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
                  {MONTHS_SHORT.map((m, i) => {
                    const hasData = allRecords.some(r => r.month === i + 1);
                    return (
                      <button key={i} disabled={!hasData}
                        onClick={() => { setSelectedMonth(i + 1); setMonthDropdownOpen(false); }}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: selectedMonth === i + 1 ? MAGENTA : hasData ? 'rgba(148,163,184,0.08)' : 'transparent',
                          color: selectedMonth === i + 1 ? 'white' : hasData ? '#cbd5e1' : '#334155',
                          cursor: hasData ? 'pointer' : 'not-allowed',
                        }}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                  style={{
                    background: activeTab === tab.id ? MAGENTA : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#94a3b8',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-6 space-y-5 relative z-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: MAGENTA }} />
            <p className="text-slate-500 font-medium">Cargando datos financieros…</p>
          </div>
        ) : !primaryRecord ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-600">
            <BarChart3 className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-slate-400 text-xl">Sin datos para {MONTHS_FULL[(selectedMonth || 1) - 1]}</p>
            <p className="text-sm mt-2 text-slate-600">Disponibles: {allRecords.map(r => MONTHS_SHORT[r.month - 1]).join(', ')}</p>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Gauges */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">KPIs Clave — {MONTHS_FULL[(selectedMonth || 1) - 1]}</p>
                    <p className="text-[10px] text-slate-600">Toca para análisis →</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                    {[
                      { kpi: 'ebitda', value: ebitda, max: 50, label: 'EBITDA', color: MAGENTA, sublabel: 'Meta: ≥25%', status: ebitdaStatus },
                      { kpi: 'personal', value: personal, max: 40, label: 'Personal', color: NEON_PURPLE, sublabel: 'Meta: ≤22%', status: personalStatus },
                      { kpi: 'costo', value: costReal, max: 60, label: 'Costo Real', color: NEON_BLUE, sublabel: `Teo: ${costTeo != null ? costTeo.toFixed(1) + '%' : '—'}`, status: costoStatus },
                      { kpi: 'gastos', value: gastos, max: 60, label: 'Gastos', color: NEON_AMBER, sublabel: 'Meta: ≤40%', status: gastosStatus },
                    ].map(({ kpi, ...props }) => (
                      <motion.button key={kpi} onClick={() => setActiveKPI(kpi)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        className="w-full flex flex-col items-center cursor-pointer outline-none">
                        <GaugeKPI {...props} />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Donut + Waterfall */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Distribución del Peso</p>
                    <p className="text-[10px] text-slate-600 mb-4">Estructura de uso de cada peso de venta</p>
                    <DonutBreakdown ebitda={ebitda} costReal={costReal} personal={personal} gastos={gastos} />
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Waterfall Financiero</p>
                    <p className="text-[10px] text-slate-600 mb-2">Cómo se llega al EBITDA desde el 100% de venta</p>
                    <WaterfallChart data={waterfallData} />
                  </div>
                </div>

                {/* Mini EBITDA trend */}
                {trendData.length >= 2 && (
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Evolución EBITDA {currentYear}</p>
                        <p className="text-[10px] text-slate-600">{trendData.length} meses cargados</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Flame className="w-3 h-3" style={{ color: MAGENTA }} />
                        Mejor: {Math.max(...trendData.map(d => d.EBITDA || 0)).toFixed(1)}%
                      </div>
                    </div>
                    <AreaTrend data={trendData} dataKey="EBITDA" color={MAGENTA} height={200} name="EBITDA" />
                  </div>
                )}

                {/* Insights */}
                <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${MAGENTA}20` }}>
                      <Zap className="w-3.5 h-3.5" style={{ color: MAGENTA }} />
                    </div>
                    <p className="font-black text-slate-200 text-sm">Análisis Cuantitativo & Alertas</p>
                  </div>
                  <QuantInsights primaryRecord={primaryRecord} prevRecord={prevRecord} trendData={trendData} />
                </div>
              </motion.div>
            )}

            {/* ── TENDENCIAS ────────────────────────────────────────────── */}
            {activeTab === 'trends' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {trendData.length >= 2 ? (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">EBITDA vs Costo Personal</p>
                      <p className="text-[10px] text-slate-600 mb-4">Relación inversa clave: personal ↑ → EBITDA ↓</p>
                      <MultiLineTrend data={trendData} height={260} lines={[
                        { key: 'EBITDA', name: 'EBITDA', color: MAGENTA },
                        { key: 'Personal', name: 'Personal', color: NEON_PURPLE },
                      ]} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Costo Real</p>
                        <p className="text-[10px] text-slate-600 mb-4">Evolución del costo de producto</p>
                        <AreaTrend data={trendData} dataKey="C.Real" color={NEON_BLUE} height={180} name="Costo Real" />
                      </div>
                      <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Gastos</p>
                        <p className="text-[10px] text-slate-600 mb-4">Estructura de gastos fijos</p>
                        <AreaTrend data={trendData} dataKey="Gastos" color={NEON_AMBER} height={180} name="Gastos" />
                      </div>
                    </div>

                    <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Panorama Completo</p>
                      <MultiLineTrend data={trendData} height={300} lines={[
                        { key: 'EBITDA', name: 'EBITDA', color: MAGENTA },
                        { key: 'C.Real', name: 'Costo Real', color: NEON_BLUE },
                        { key: 'Personal', name: 'Personal', color: NEON_PURPLE },
                        { key: 'Gastos', name: 'Gastos', color: NEON_AMBER },
                      ]} />
                    </div>

                    {/* Tabla histórica */}
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Tabla Histórica Completa</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[500px]">
                          <thead>
                            <tr style={{ background: `${MAGENTA}10` }}>
                              <th className="text-left py-3 px-3 font-black text-slate-400 rounded-l-xl">Métrica</th>
                              {trendData.map(d => (
                                <th key={d.mes} className="text-right py-3 px-3 font-black"
                                  style={{ color: d.month === selectedMonth ? MAGENTA : '#64748b' }}>
                                  {d.mes}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { key: 'EBITDA', label: 'EBITDA', color: MAGENTA },
                              { key: 'C.Real', label: 'Costo Real', color: NEON_BLUE },
                              { key: 'C.Teo', label: 'Costo Teórico', color: '#64748b' },
                              { key: 'Personal', label: 'Personal', color: NEON_PURPLE },
                              { key: 'Gastos', label: 'Gastos', color: NEON_AMBER },
                            ].map(row => (
                              <tr key={row.key} className="border-b hover:bg-white/5 transition-colors"
                                style={{ borderColor: 'rgba(148,163,184,0.06)' }}>
                                <td className="py-2.5 px-3 font-black text-slate-400">{row.label}</td>
                                {trendData.map(d => (
                                  <td key={d.mes} className="py-2.5 px-3 text-right font-black"
                                    style={{ color: d.month === selectedMonth ? row.color : '#475569' }}>
                                    {d[row.key] != null ? `${d[row.key].toFixed(1)}%` : '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-slate-600">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Necesitas al menos 2 meses de datos</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SIMULADOR ─────────────────────────────────────────────── */}
            {activeTab === 'simulator' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-2xl p-6" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${MAGENTA}20` }}>
                      <Target className="w-4 h-4" style={{ color: MAGENTA }} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-200 text-sm">Simulador EBITDA</h3>
                      <p className="text-[10px] text-slate-500">¿Cuánto necesito para mejorar?</p>
                    </div>
                  </div>
                  <EBITDASimulator primaryRecord={primaryRecord} trendData={trendData} />
                </div>

                {trendData.length >= 2 && (() => {
                  const bestMonth = trendData.reduce((b, d) => (d.EBITDA || 0) > (b.EBITDA || 0) ? d : b, trendData[0]);
                  const curr = trendData.find(d => d.month === selectedMonth);
                  if (!curr || bestMonth.month === selectedMonth) return null;
                  return (
                    <div className="rounded-2xl p-6" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <h3 className="font-black text-slate-200 mb-1 text-sm">¿Qué pasó diferente en {bestMonth.mes}?</h3>
                      <p className="text-[10px] text-slate-500 mb-4">Mejor mes vs seleccionado</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['EBITDA', 'C.Real', 'Personal', 'Gastos'].map(k => {
                          const cv = curr[k], bv = bestMonth[k];
                          const diff = cv != null && bv != null ? cv - bv : null;
                          const better = k === 'EBITDA' ? (diff ?? 0) >= 0 : (diff ?? 0) <= 0;
                          return (
                            <div key={k} className="rounded-xl p-4" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{k === 'C.Real' ? 'Costo Real' : k}</p>
                              <div className="flex items-end gap-2">
                                <span className="font-black text-xl text-slate-200">{cv?.toFixed(1)}%</span>
                                <span className="text-sm text-slate-600 mb-0.5">vs {bv?.toFixed(1)}%</span>
                              </div>
                              {diff != null && (
                                <p className="text-xs font-black mt-1" style={{ color: better ? '#34d399' : '#f87171' }}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp {better ? '↑ mejor' : '↓ peor'} que {bestMonth.mes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ── DESGLOSE ──────────────────────────────────────────────── */}
            {activeTab === 'breakdown' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-2xl p-6" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">
                    Desglose Completo — {MONTHS_FULL[(selectedMonth || 1) - 1]}
                  </p>
                  <CostTable primaryRecord={primaryRecord} prevRecord={prevRecord} />
                </div>

                {primaryRecord?.otros_gastos && (() => {
                  let others = [];
                  try { others = Object.entries(JSON.parse(primaryRecord.otros_gastos)).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]); } catch {}
                  if (!others.length) return null;
                  return (
                    <div className="rounded-2xl p-6" style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Otros Gastos Detallados</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {others.map(([k, v]) => (
                          <div key={k} className="rounded-xl p-4" style={{ background: `${MAGENTA}08`, border: `1px solid ${MAGENTA}15` }}>
                            <p className="text-[10px] text-slate-500 font-medium truncate mb-1">{k}</p>
                            <p className="font-black text-lg" style={{ color: MAGENTA }}>{(v * 100).toFixed(2)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </>
        )}
      </div>

      {activeKPI && (
        <KPIDetailModal kpiId={activeKPI} onClose={() => setActiveKPI(null)}
          primaryRecord={primaryRecord} prevRecord={prevRecord}
          trendData={trendData} selectedMonth={selectedMonth} />
      )}
    </motion.div>
  );
}