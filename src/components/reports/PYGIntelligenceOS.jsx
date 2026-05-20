import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, ChevronDown, Activity,
  Target, DollarSign, Users, Package, ChevronRight, Flame,
  Sparkles, Brain, Eye, AlertTriangle, Radio
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MAGENTA = '#C21875';
const VIOLET = '#7c3aed';
const LAVENDER = '#a78bfa';
const CORAL = '#f97316';
const MINT = '#10b981';
const SOFT_BLUE = '#60a5fa';

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

// ─── Smooth path builder ──────────────────────────────────────────────────────
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

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '%', decimals = 1 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  if (value == null) return <span>—</span>;
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

// ─── Cinematic Chart ──────────────────────────────────────────────────────────
function CinematicChart({ data, height = 220 }) {
  const [hovIdx, setHovIdx] = useState(null);
  const lines = [
    { key: 'EBITDA', color: MAGENTA, label: 'EBITDA' },
    { key: 'Personal', color: LAVENDER, label: 'Personal' },
    { key: 'C.Real', color: SOFT_BLUE, label: 'Costo' },
  ];

  const allVals = lines.flatMap(l => data.map(d => d[l.key]).filter(v => v != null));
  if (!allVals.length || data.length < 2) return null;

  const W = 580, H = height;
  const padL = 36, padR = 20, padT = 20, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minV = Math.max(0, Math.min(...allVals) - 4);
  const maxV = Math.max(...allVals) + 8;
  const toX = (i) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          {lines.map(l => (
            <React.Fragment key={l.key}>
              <linearGradient id={`cca_fill_${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0" />
              </linearGradient>
              <filter id={`cca_glow_${l.key}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </React.Fragment>
          ))}
        </defs>

        {/* Subtle grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const v = minV + (maxV - minV) * t;
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="rgba(194,24,117,0.06)" strokeWidth="1" strokeDasharray="3 8" />
              <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize="8.5" fill="rgba(100,80,120,0.4)" fontWeight="600">
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
          return <path key={`${l.key}_fill`} d={areaPath} fill={`url(#cca_fill_${l.key})`} />;
        })}

        {/* Lines */}
        {lines.map(l => {
          const pts = data.map((d, i) => ({ x: toX(i), y: d[l.key] != null ? toY(d[l.key]) : null, val: d[l.key] })).filter(p => p.val != null);
          if (pts.length < 2) return null;
          const linePath = buildSmoothPath(pts);
          return (
            <g key={l.key}>
              <path d={linePath} fill="none" stroke={l.color} strokeWidth="6" strokeOpacity="0.1" strokeLinecap="round" />
              <path d={linePath} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                filter={`url(#cca_glow_${l.key})`} />
            </g>
          );
        })}

        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - padB + 14} textAnchor="middle" fontSize="9" fontWeight="700"
            fill={hovIdx === i ? MAGENTA : 'rgba(120,100,140,0.5)'}>
            {d.mes}
          </text>
        ))}

        {/* Hover dots */}
        {lines.map(l => data.map((d, i) => {
          if (d[l.key] == null) return null;
          const x = toX(i), y = toY(d[l.key]);
          const isHov = hovIdx === i;
          return (
            <circle key={`${l.key}_dot_${i}`} cx={x} cy={y} r={isHov ? 5 : 3}
              fill={isHov ? l.color : 'white'} stroke={l.color} strokeWidth={isHov ? 2 : 1.5}
              style={{ transition: 'all 0.15s' }} />
          );
        }))}

        {/* Hover vertical + tooltip */}
        {hovIdx != null && (() => {
          const x = toX(hovIdx);
          return (
            <g>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH}
                stroke={MAGENTA} strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.3" />
              {lines.map((l, li) => {
                const v = data[hovIdx]?.[l.key];
                if (v == null) return null;
                return (
                  <g key={l.key}>
                    <rect x={x + 8} y={padT + li * 16 + 2} width={64} height={14} rx="4"
                      fill="rgba(250,248,255,0.95)" stroke={`${l.color}40`} strokeWidth="0.5" />
                    <text x={x + 12} y={padT + li * 16 + 12} fontSize="9" fontWeight="800" fill={l.color}>
                      {l.label}: {v.toFixed(1)}%
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect key={i} x={toX(i) - chartW / data.length / 2} y={padT} width={chartW / data.length} height={chartH + padB}
            fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)} />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-1 px-2">
        {lines.map(l => (
          <div key={l.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
            <span className="text-[10px] font-bold" style={{ color: 'rgba(80,60,100,0.6)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vital Signal Card ────────────────────────────────────────────────────────
function VitalSignal({ label, value, prevValue, color, sublabel, status, icon: Icon, onClick, sparkData }) {
  const delta = value != null && prevValue != null ? value - prevValue : null;
  const statusInfo = {
    good: { dot: MINT, label: 'Óptimo' },
    warn: { dot: '#f59e0b', label: 'Revisar' },
    bad: { dot: '#ef4444', label: 'Crítico' },
  }[status] || { dot: '#94a3b8', label: '—' };

  // Mini sparkline
  const sparkWidth = 80, sparkHeight = 28;
  const sparkVals = (sparkData || []).map(d => d[label === 'EBITDA' ? 'EBITDA' : label === 'Personal' ? 'Personal' : label === 'Costo Real' ? 'C.Real' : 'Gastos']).filter(v => v != null);
  const sparkMin = sparkVals.length ? Math.min(...sparkVals) - 2 : 0;
  const sparkMax = sparkVals.length ? Math.max(...sparkVals) + 2 : 40;
  const sparkPoints = sparkVals.map((v, i) => ({
    x: sparkVals.length > 1 ? (i / (sparkVals.length - 1)) * sparkWidth : sparkWidth / 2,
    y: sparkHeight - ((v - sparkMin) / (sparkMax - sparkMin)) * sparkHeight
  }));
  const sparkPath = buildSmoothPath(sparkPoints);
  const sparkArea = sparkPoints.length > 1
    ? sparkPath + ` L ${sparkPoints[sparkPoints.length - 1].x} ${sparkHeight} L ${sparkPoints[0].x} ${sparkHeight} Z`
    : '';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col p-5 rounded-2xl text-left w-full overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.82)',
        border: `1px solid ${color}20`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.04), 0 1px 4px ${color}10`,
        backdropFilter: 'blur(20px)',
        transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
      }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 40%, ${color}08, transparent 65%)` }} />

      {/* Status dot */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: `${color}10` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(80,60,100,0.5)' }}>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.div className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusInfo.dot }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }} />
          <span className="text-[9px] font-black" style={{ color: statusInfo.dot }}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Value */}
      <div className="mb-1">
        <p className="text-3xl font-black leading-none tracking-tight" style={{ color: color === MAGENTA ? '#1a0d28' : '#1a0d28' }}>
          {value != null ? <AnimatedNumber value={value} /> : '—'}
        </p>
        {delta != null && (
          <div className="flex items-center gap-1 mt-1.5">
            {delta >= 0
              ? <ArrowUpRight className="w-3 h-3" style={{ color: label === 'EBITDA' ? MINT : '#ef4444' }} />
              : <ArrowDownRight className="w-3 h-3" style={{ color: label === 'EBITDA' ? '#ef4444' : MINT }} />}
            <span className="text-[11px] font-black" style={{
              color: (label === 'EBITDA' ? delta >= 0 : delta <= 0) ? MINT : '#ef4444'
            }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}pp
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(100,80,120,0.4)' }}>vs anterior</span>
          </div>
        )}
      </div>

      <p className="text-[10px] mb-3" style={{ color: 'rgba(100,80,120,0.5)' }}>{sublabel}</p>

      {/* Sparkline */}
      {sparkVals.length >= 2 && (
        <div className="w-full mt-auto">
          <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} width="100%" height={sparkHeight} style={{ display: 'block' }}>
            <defs>
              <linearGradient id={`spark_fill_${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {sparkArea && <path d={sparkArea} fill={`url(#spark_fill_${label})`} />}
            {sparkPath && <path d={sparkPath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />}
            {sparkVals.map((v, i) => (
              <circle key={i} cx={sparkPoints[i]?.x} cy={sparkPoints[i]?.y} r="1.5"
                fill={i === sparkVals.length - 1 ? color : 'transparent'}
                stroke={i === sparkVals.length - 1 ? color : 'transparent'} />
            ))}
          </svg>
        </div>
      )}
    </motion.button>
  );
}

// ─── Nova Insight Block ───────────────────────────────────────────────────────
function NovaInsight({ primaryRecord, prevRecord, trendData, storeCode }) {
  const [insightIndex, setInsightIndex] = useState(0);

  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const prevEbitda = prevRecord ? pctNum(prevRecord.margen_ebitda) : null;
  const personal = pctNum(primaryRecord?.costo_personal);
  const costReal = pctNum(primaryRecord?.cost_real);
  const costTeo = pctNum(primaryRecord?.cost_teorico);
  const gastos = pctNum(primaryRecord?.gastos_pct_venta);

  const insights = useMemo(() => {
    const list = [];
    if (ebitda != null && prevEbitda != null) {
      const diff = ebitda - prevEbitda;
      if (diff < -1.5) list.push({
        headline: "La rentabilidad empieza a fatigarse.",
        body: `El EBITDA cedió ${Math.abs(diff).toFixed(1)}pp respecto al mes anterior. Estoy detectando presión estructural debajo de una superficie comercial estable.`,
        signal: 'tension',
      });
      else if (diff > 1.5) list.push({
        headline: "El negocio recupera tracción.",
        body: `EBITDA avanzó ${diff.toFixed(1)}pp. La eficiencia operativa responde positivamente. El momentum es real y medible.`,
        signal: 'growth',
      });
    }
    if (personal != null && personal > 22) {
      list.push({
        headline: "El costo laboral absorbe el crecimiento.",
        body: `Personal consume ${personal.toFixed(1)}% de la venta — ${(personal - 22).toFixed(1)}pp por encima del umbral óptimo. Cada punto excesivo es EBITDA que no llega.`,
        signal: 'warn',
      });
    }
    if (costReal != null && costTeo != null && costReal > costTeo + 0.5) {
      list.push({
        headline: "El costo real se desacopla del teórico.",
        body: `Hay una brecha de ${(costReal - costTeo).toFixed(2)}pp entre lo ejecutado y lo presupuestado. La desviación ya consolida tendencia.`,
        signal: 'tension',
      });
    }
    if (trendData.length >= 3) {
      const last3 = trendData.slice(-3);
      const trend = last3[2].EBITDA - last3[0].EBITDA;
      if (trend < -2) list.push({
        headline: "La desaceleración empieza a consolidarse.",
        body: `En tres meses, el EBITDA pasó de ${last3[0].EBITDA?.toFixed(1)}% a ${last3[2].EBITDA?.toFixed(1)}%. La venta sigue sólida. La eficiencia operativa, ya no.`,
        signal: 'tension',
      });
      else if (trend > 2) list.push({
        headline: "EBITDA mantiene fortaleza estructural.",
        body: `Tres meses consecutivos de mejora: ${last3.map(d => `${d.mes} ${d.EBITDA?.toFixed(1)}%`).join(' → ')}. Los costos operativos empiezan a desacoplarse del crecimiento.`,
        signal: 'growth',
      });
    }
    if (list.length === 0) list.push({
      headline: "El negocio opera dentro de parámetros normales.",
      body: ebitda != null ? `EBITDA en ${ebitda.toFixed(1)}%. Estoy monitoreando las señales vitales del negocio para detectar cambios en la estructura de costos.` : 'Cargando inteligencia financiera…',
      signal: 'neutral',
    });
    return list;
  }, [ebitda, prevEbitda, personal, costReal, costTeo, trendData]);

  const signalColors = {
    growth: MINT,
    tension: CORAL,
    warn: '#f59e0b',
    neutral: LAVENDER,
  };
  const current = insights[insightIndex % insights.length];
  const color = signalColors[current.signal];

  return (
    <motion.div
      key={insightIndex}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl p-7 cursor-pointer"
      onClick={() => setInsightIndex(i => (i + 1) % insights.length)}
      style={{
        background: 'rgba(255,255,255,0.78)',
        border: `1px solid ${color}20`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.05), 0 0 0 1px ${color}08`,
        backdropFilter: 'blur(32px)',
      }}>

      {/* Background orb */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, filter: 'blur(30px)' }} />

      <div className="relative z-10">
        {/* Nova label */}
        <div className="flex items-center gap-2 mb-5">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(80,60,100,0.5)' }}>
            Nova Intelligence · {storeCode}
          </span>
          {insights.length > 1 && (
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(100,80,120,0.35)' }}>
              {insightIndex % insights.length + 1}/{insights.length} · toca para siguiente
            </span>
          )}
        </div>

        {/* Headline */}
        <p className="text-xl font-black leading-tight mb-3 tracking-tight" style={{ color: '#1a0d28' }}>
          {current.headline}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(80,60,100,0.65)', fontWeight: 400 }}>
          {current.body}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Narrative Timeline ───────────────────────────────────────────────────────
function NarrativeTimeline({ trendData, selectedMonth }) {
  if (trendData.length < 2) return null;
  const narratives = trendData.map((d, i) => {
    const prev = trendData[i - 1];
    if (!prev) return null;
    const diff = (d.EBITDA || 0) - (prev.EBITDA || 0);
    const label = diff > 1 ? 'recuperación' : diff < -1 ? 'presión' : 'estabilidad';
    const text = diff > 1
      ? `la rentabilidad se recuperó ${diff.toFixed(1)}pp.`
      : diff < -1
      ? `el EBITDA cedió ${Math.abs(diff).toFixed(1)}pp bajo presión.`
      : `el negocio mantuvo estabilidad operativa.`;
    const color = diff > 1 ? MINT : diff < -1 ? CORAL : LAVENDER;
    return { mes: d.mes, month: d.month, label, text, color, ebitda: d.EBITDA, diff };
  }).filter(Boolean);

  return (
    <div className="space-y-0">
      {narratives.map((n, i) => (
        <motion.div key={n.month}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.5 }}
          className={`relative flex gap-5 pl-2 pb-5 ${n.month === selectedMonth ? 'opacity-100' : 'opacity-60'}`}>
          {/* Timeline line */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1"
              style={{ background: n.color, borderColor: n.color, boxShadow: `0 0 8px ${n.color}50` }} />
            {i < narratives.length - 1 && (
              <div className="w-px flex-1 mt-1" style={{ background: `linear-gradient(to bottom, ${n.color}30, transparent)`, minHeight: 20 }} />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-black" style={{ color: n.color }}>{n.mes}:</span>
              <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'rgba(100,80,120,0.4)' }}>{n.label}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(60,40,80,0.6)', fontWeight: 400 }}>
              {text => text}{n.text}
            </p>
            {n.ebitda != null && (
              <span className="text-[10px] font-black mt-0.5 inline-block" style={{ color: n.color }}>
                EBITDA {n.ebitda.toFixed(1)}%
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Pressure Map ─────────────────────────────────────────────────────────────
function PressureMap({ ebitda, personal, costReal, costTeo, gastos }) {
  const zones = [
    {
      label: 'Margen EBITDA',
      value: ebitda,
      threshold: 25,
      inverse: false,
      description: 'Zona de rentabilidad estructural',
      color: MAGENTA,
    },
    {
      label: 'Tensión Laboral',
      value: personal,
      threshold: 22,
      inverse: true,
      description: 'Presión del costo personal',
      color: LAVENDER,
    },
    {
      label: 'Desviación Costo',
      value: costReal != null && costTeo != null ? costReal - costTeo : null,
      threshold: 0,
      inverse: true,
      description: 'Real vs presupuestado',
      color: SOFT_BLUE,
    },
    {
      label: 'Peso Gastos',
      value: gastos,
      threshold: 40,
      inverse: true,
      description: 'Arriendos + servicios + admin',
      color: CORAL,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {zones.map((z, i) => {
        if (z.value == null) return null;
        const pressure = z.inverse ? Math.max(0, z.value - z.threshold) : Math.max(0, z.threshold - z.value);
        const pressurePct = Math.min(pressure / (z.threshold * 0.5 || 10), 1);
        const intensity = pressurePct;
        const isOk = intensity < 0.15;
        const statusColor = isOk ? MINT : intensity < 0.5 ? '#f59e0b' : CORAL;

        return (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: `1px solid ${z.color}15`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>

            {/* Pressure blob */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
              className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${statusColor}60, transparent 70%)`, filter: 'blur(12px)' }} />

            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(80,60,100,0.45)' }}>
                {z.label}
              </p>
              <p className="text-2xl font-black leading-none mb-1" style={{ color: '#1a0d28' }}>
                {z.value.toFixed(1)}%
              </p>
              <p className="text-[10px] mb-3" style={{ color: 'rgba(100,80,120,0.45)' }}>{z.description}</p>

              {/* Pressure bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.abs(z.inverse ? z.value / (z.threshold * 1.5 || 30) : z.value / (z.threshold * 1.2)) * 100, 100)}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1 }}
                  style={{ background: `linear-gradient(90deg, ${z.color}60, ${statusColor})` }} />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-bold" style={{ color: 'rgba(100,80,120,0.4)' }}>
                  Umbral: {z.threshold}{z.inverse ? '%' : '%'}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: `${statusColor}15`, color: statusColor }}>
                  {isOk ? '✓ OK' : intensity < 0.5 ? '⚡ Revisar' : '⚠ Crítico'}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Discoveries ──────────────────────────────────────────────────────────────
function NovaDiscoveries({ primaryRecord, prevRecord, trendData }) {
  const discoveries = useMemo(() => {
    const list = [];
    const ebitda = pctNum(primaryRecord?.margen_ebitda);
    const prevEbitda = prevRecord ? pctNum(prevRecord.margen_ebitda) : null;
    const personal = pctNum(primaryRecord?.costo_personal);
    const prevPersonal = prevRecord ? pctNum(prevRecord.costo_personal) : null;
    const costReal = pctNum(primaryRecord?.cost_real);
    const costTeo = pctNum(primaryRecord?.cost_teorico);
    const gastos = pctNum(primaryRecord?.gastos_pct_venta);

    if (prevPersonal != null && personal != null) {
      const personalChange = personal - prevPersonal;
      const ebitdaChange = ebitda != null && prevEbitda != null ? ebitda - prevEbitda : null;
      if (ebitdaChange != null && personalChange > 0.5 && ebitdaChange < 0) {
        list.push({
          icon: '🔬',
          title: 'Correlación laboral detectada',
          detail: `El aumento de ${personalChange.toFixed(1)}pp en personal está correlacionado directamente con la caída de ${Math.abs(ebitdaChange).toFixed(1)}pp en EBITDA.`,
          severity: 'critical',
        });
      }
    }

    if (costReal != null && costTeo != null) {
      const brecha = costReal - costTeo;
      if (brecha > 1) list.push({
        icon: '📡',
        title: 'Anomalía en costo de producto',
        detail: `Costo real excede el presupuesto en ${brecha.toFixed(2)}pp. Patrón inusual para este mes. Puede indicar mermas, descuentos no registrados o cambio de mezcla.`,
        severity: 'warn',
      });
    }

    if (trendData.length >= 4) {
      const last4 = trendData.slice(-4);
      const consecutiveDown = last4.every((d, i) => i === 0 || d.EBITDA < last4[i - 1].EBITDA);
      if (consecutiveDown) list.push({
        icon: '⚡',
        title: 'Patrón de deterioro continuo',
        detail: `${last4.length} meses consecutivos de contracción en EBITDA. Desde ${last4[0].EBITDA?.toFixed(1)}% hasta ${last4[last4.length - 1].EBITDA?.toFixed(1)}%. La tendencia ya no es coyuntural.`,
        severity: 'critical',
      });
    }

    if (gastos != null && gastos > 45) list.push({
      icon: '🔥',
      title: 'Gastos fijos superan umbral crítico',
      detail: `Con ${gastos.toFixed(1)}% de la venta destinado a gastos fijos, la estructura de costos se vuelve rígida. El negocio pierde elasticidad.`,
      severity: 'warn',
    });

    if (list.length === 0 && ebitda != null && ebitda >= 25) list.push({
      icon: '✨',
      title: 'Estructura financiera saludable',
      detail: `EBITDA en zona óptima. No detecto anomalías estructurales en este período. Los KPIs operativos están alineados con los objetivos.`,
      severity: 'good',
    });

    return list;
  }, [primaryRecord, prevRecord, trendData]);

  const sevColors = {
    critical: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.15)', dot: '#ef4444' },
    warn: { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.15)', dot: '#f59e0b' },
    good: { bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.15)', dot: MINT },
  };

  return (
    <div className="space-y-3">
      {discoveries.map((d, i) => {
        const c = sevColors[d.severity] || sevColors.good;
        return (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-4 flex gap-4"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <span className="text-2xl flex-shrink-0 mt-0.5">{d.icon}</span>
            <div>
              <p className="text-sm font-black mb-1" style={{ color: '#1a0d28' }}>{d.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(80,60,100,0.65)' }}>{d.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Waterfall ────────────────────────────────────────────────────────────────
function CinematicWaterfall({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.length) return null;

  const W = 520, H = 260, padL = 40, padR = 16, padT = 20, padB = 40;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const minV = -60, maxV = 110, range = maxV - minV;
  const toY = (v) => padT + chartH * (1 - (v - minV) / range);
  const barW = Math.min(48, chartW / data.length - 12);
  const slotW = chartW / data.length;

  let running = 0;
  const bars = data.map((d, i) => {
    const isFirst = i === 0, isLast = i === data.length - 1;
    const startVal = isFirst || isLast ? 0 : running;
    const endVal = isFirst ? d.value : isLast ? d.value : running + d.value;
    if (!isLast) running = endVal;
    const x = padL + slotW * i + (slotW - barW) / 2;
    const top = toY(Math.max(startVal, endVal));
    const bot = toY(Math.min(startVal, endVal));
    const h = Math.max(bot - top, 3);
    return { ...d, x, top, h, startVal, endVal };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {bars.map((b, i) => (
          <linearGradient key={i} id={`cwf_g_${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.5" />
          </linearGradient>
        ))}
      </defs>

      {[0, 25, 50, 75, 100].map(t => (
        <g key={t}>
          <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)}
            stroke={t === 0 ? 'rgba(194,24,117,0.12)' : 'rgba(194,24,117,0.05)'}
            strokeWidth={t === 0 ? 1.5 : 1} strokeDasharray={t === 0 ? '' : '3 7'} />
          <text x={padL - 4} y={toY(t) + 3.5} textAnchor="end" fontSize="8.5" fill="rgba(100,80,120,0.35)" fontWeight="600">{t}%</text>
        </g>
      ))}

      {bars.map((b, i) => {
        if (i < bars.length - 1) {
          const next = bars[i + 1];
          return <line key={`conn_${i}`} x1={b.x + barW} y1={toY(b.endVal)} x2={next.x} y2={toY(b.endVal)}
            stroke="rgba(194,24,117,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />;
        }
        return null;
      })}

      {bars.map((b, i) => {
        const isHov = hovered === i;
        return (
          <g key={i} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {isHov && <rect x={b.x - 3} y={b.top - 3} width={barW + 6} height={b.h + 6} rx="10"
              fill={b.color} opacity="0.1" />}
            <rect x={b.x} y={b.top} width={barW} height={b.h} rx="7"
              fill={`url(#cwf_g_${i})`} opacity={hovered != null && !isHov ? 0.3 : 1}
              style={{ transition: 'opacity 0.2s' }} />
            <rect x={b.x + 4} y={b.top + 2} width={barW - 8} height={3} rx="2"
              fill="white" opacity={isHov ? 0.3 : 0.12} />
            <text x={b.x + barW / 2} y={b.top - 8} textAnchor="middle" fontSize="10" fontWeight="900"
              fill={isHov ? b.color : 'rgba(60,40,80,0.7)'}>
              {b.value > 0 ? '+' : ''}{b.value.toFixed(1)}%
            </text>
            <text x={b.x + barW / 2} y={H - padB + 14} textAnchor="middle" fontSize="9.5" fontWeight="800"
              fill={isHov ? b.color : 'rgba(100,80,120,0.55)'}>
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── EBITDA Live Simulator ────────────────────────────────────────────────────
function LiveSimulator({ primaryRecord, trendData }) {
  const base = pctNum(primaryRecord?.margen_ebitda) || 0;
  const [personalAdj, setPersonalAdj] = useState(0);
  const [costoAdj, setCostoAdj] = useState(0);
  const [gastosAdj, setGastosAdj] = useState(0);
  const projected = base - personalAdj - costoAdj - gastosAdj;
  const delta = projected - base;
  const deltaColor = delta >= 0 ? MINT : CORAL;

  const best = trendData.length ? Math.max(...trendData.map(d => d.EBITDA || 0)) : null;
  const avg = trendData.length ? (trendData.reduce((s, d) => s + (d.EBITDA || 0), 0) / trendData.length) : null;

  const levers = [
    { label: 'Ajuste Personal', key: 'personal', value: personalAdj, setter: setPersonalAdj, color: LAVENDER, help: 'pp de personal' },
    { label: 'Ajuste Costo Real', key: 'costo', value: costoAdj, setter: setCostoAdj, color: SOFT_BLUE, help: 'pp de costo producto' },
    { label: 'Ajuste Gastos', key: 'gastos', value: gastosAdj, setter: setGastosAdj, color: CORAL, help: 'pp de gastos fijos' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Actual', val: base.toFixed(1) + '%', color: MAGENTA },
          { label: 'Histórico Avg', val: avg ? avg.toFixed(1) + '%' : '—', color: LAVENDER },
          { label: 'Mejor Mes', val: best ? best.toFixed(1) + '%' : '—', color: MINT },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${s.color}20`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(80,60,100,0.4)' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Projected EBITDA */}
      <motion.div className="rounded-2xl p-5 text-center"
        style={{ background: `linear-gradient(135deg, ${deltaColor}06, rgba(255,255,255,0.7))`, border: `1px solid ${deltaColor}20` }}
        animate={{ borderColor: delta >= 0 ? `${MINT}30` : `${CORAL}30` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(80,60,100,0.4)' }}>EBITDA Proyectado</p>
        <motion.p className="text-5xl font-black leading-none tracking-tight mb-1"
          key={projected}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ color: projected >= 25 ? MINT : projected >= 15 ? '#f59e0b' : CORAL }}>
          {projected.toFixed(1)}%
        </motion.p>
        {delta !== 0 && (
          <p className="text-sm font-black" style={{ color: deltaColor }}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}pp vs actual
          </p>
        )}
      </motion.div>

      {/* Levers */}
      <div className="space-y-4">
        {levers.map(l => (
          <div key={l.key}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black" style={{ color: '#1a0d28' }}>{l.label}</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                style={{ background: `${l.color}10`, color: l.color }}>
                {l.value > 0 ? '-' : l.value < 0 ? '+' : '±'}{Math.abs(l.value).toFixed(1)}pp
              </span>
            </div>
            <input
              type="range" min={-5} max={5} step={0.1} value={l.value}
              onChange={(e) => l.setter(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full outline-none appearance-none cursor-pointer"
              style={{ accentColor: l.color, background: `linear-gradient(to right, ${l.color} ${((l.value + 5) / 10) * 100}%, rgba(194,24,117,0.1) ${((l.value + 5) / 10) * 100}%)` }} />
            <p className="text-[10px] mt-1" style={{ color: 'rgba(100,80,120,0.4)' }}>
              {l.value < 0 ? `Reducir ${Math.abs(l.value).toFixed(1)}pp` : l.value > 0 ? `Aumentar ${l.value.toFixed(1)}pp` : 'Sin cambio'} en {l.help}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cost Table ────────────────────────────────────────────────────────────────
function CostBreakdown({ primaryRecord, prevRecord }) {
  const rows = [
    { label: 'Costo de Producto', key: 'cost_real', teo: 'cost_teorico' },
    { label: 'Personal', key: 'costo_personal' },
    { label: 'Arriendos', key: 'arriendos' },
    { label: 'Servicios Públicos', key: 'servicios_publicos' },
    { label: 'Administración', key: 'administracion' },
    { label: 'Impuestos', key: 'impuestos' },
    { label: 'Gastos Total', key: 'gastos_pct_venta' },
    { label: 'EBITDA', key: 'margen_ebitda', highlight: true },
  ].filter(r => primaryRecord?.[r.key] != null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-l-xl"
              style={{ color: 'rgba(80,60,100,0.5)', background: 'rgba(194,24,117,0.04)' }}>Partida</th>
            <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'rgba(80,60,100,0.5)', background: 'rgba(194,24,117,0.04)' }}>Actual</th>
            {prevRecord && <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-r-xl"
              style={{ color: 'rgba(80,60,100,0.5)', background: 'rgba(194,24,117,0.04)' }}>Δ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const curr = pctNum(primaryRecord?.[row.key]);
            const prev = prevRecord ? pctNum(prevRecord?.[row.key]) : null;
            const delta = prev != null && curr != null ? curr - prev : null;
            const isHigher = delta != null && delta > 0;
            const isGood = row.highlight ? (delta != null && delta > 0) : (delta != null && delta < 0);
            return (
              <tr key={i} className="border-b transition-colors hover:bg-pink-50/30"
                style={{ borderColor: 'rgba(194,24,117,0.06)', fontWeight: row.highlight ? 900 : 400 }}>
                <td className="py-3 px-4" style={{ color: row.highlight ? '#1a0d28' : 'rgba(60,40,80,0.7)' }}>
                  {row.highlight && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: MAGENTA }} />}
                  {row.label}
                  {row.teo && primaryRecord?.[row.teo] && (
                    <span className="ml-2 text-[10px]" style={{ color: 'rgba(100,80,120,0.35)' }}>teo: {fmt(primaryRecord[row.teo])}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-black"
                  style={{ color: row.highlight ? MAGENTA : '#1a0d28' }}>
                  {curr != null ? `${curr.toFixed(1)}%` : '—'}
                </td>
                {prevRecord && (
                  <td className="py-3 px-4 text-right text-xs font-black">
                    {delta != null ? (
                      <span style={{ color: isGood ? MINT : '#ef4444' }}>
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

// ─── KPI Detail Panel ─────────────────────────────────────────────────────────
function KPIDetailPanel({ kpiId, onClose, primaryRecord, prevRecord, trendData, selectedMonth }) {
  if (!kpiId || !primaryRecord) return null;
  const configs = {
    ebitda: { title: 'Margen EBITDA', dataKey: 'margen_ebitda', trendKey: 'EBITDA', color: MAGENTA, meta: '≥25%', desc: 'Ganancia operativa por cada peso de venta.' },
    personal: { title: 'Costo Personal', dataKey: 'costo_personal', trendKey: 'Personal', color: LAVENDER, meta: '≤22%', desc: '% de nómina sobre ventas.' },
    costo: { title: 'Costo Real', dataKey: 'cost_real', trendKey: 'C.Real', color: SOFT_BLUE, meta: '≤ teórico', desc: 'Costo de producto real ejecutado.' },
    gastos: { title: 'Gastos', dataKey: 'gastos_pct_venta', trendKey: 'Gastos', color: CORAL, meta: '≤40%', desc: 'Arriendos + servicios + administración.' },
  };
  const cfg = configs[kpiId]; if (!cfg) return null;
  const val = pctNum(primaryRecord[cfg.dataKey]);
  const prevVal = prevRecord ? pctNum(prevRecord[cfg.dataKey]) : null;
  const delta = val != null && prevVal != null ? val - prevVal : null;

  const sparkData = trendData.map(d => ({ mes: d.mes, val: d[cfg.trendKey] })).filter(d => d.val != null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,5,20,0.5)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.95)', border: `1px solid ${cfg.color}25`, boxShadow: `0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px ${cfg.color}10`, backdropFilter: 'blur(40px)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex items-start justify-between"
          style={{ borderBottom: `1px solid ${cfg.color}10` }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>{cfg.title}</p>
            <p className="text-4xl font-black leading-none tracking-tight" style={{ color: '#1a0d28' }}>
              {val != null ? `${val.toFixed(1)}%` : '—'}
            </p>
            {delta != null && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: delta >= 0 ? `${MINT}15` : `${CORAL}15`, color: delta >= 0 ? MINT : CORAL }}>
                  {delta > 0 ? '▲ +' : '▼ '}{Math.abs(delta).toFixed(2)}pp vs anterior
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(194,24,117,0.06)' }}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs" style={{ color: 'rgba(80,60,100,0.55)' }}>{cfg.desc} Meta: {cfg.meta}</p>

          {/* Mini chart */}
          {sparkData.length >= 2 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(80,60,100,0.4)' }}>Evolución Histórica</p>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${cfg.color}12` }}>
                {(() => {
                  const W = 400, H = 120, padL = 30, padR = 16, padT = 16, padB = 28;
                  const chartW = W - padL - padR, chartH = H - padT - padB;
                  const vals = sparkData.map(d => d.val);
                  const minV = Math.max(0, Math.min(...vals) - 3);
                  const maxV = Math.max(...vals) + 4;
                  const toX = (i) => padL + (i / (sparkData.length - 1)) * chartW;
                  const toY = (v) => padT + chartH * (1 - (v - minV) / (maxV - minV));
                  const points = sparkData.map((d, i) => ({ x: toX(i), y: toY(d.val) }));
                  const linePath = buildSmoothPath(points);
                  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padT + chartH} L ${points[0].x} ${padT + chartH} Z`;
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
                      <defs>
                        <linearGradient id="kd_fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={cfg.color} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#kd_fill)" />
                      <path d={linePath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />
                      {sparkData.map((d, i) => (
                        <g key={i}>
                          <circle cx={points[i].x} cy={points[i].y} r="3" fill={i === sparkData.length - 1 ? cfg.color : 'white'} stroke={cfg.color} strokeWidth="1.5" />
                          <text x={points[i].x} y={H - padB + 14} textAnchor="middle" fontSize="8.5" fontWeight="700"
                            fill="rgba(100,80,120,0.5)">{d.mes}</text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>
          )}

          {prevRecord && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Actual', val: val, color: cfg.color },
                { label: 'Anterior', val: prevVal, color: 'rgba(80,60,100,0.4)' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${cfg.color}12` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(80,60,100,0.35)' }}>{s.label}</p>
                  <p className="font-black text-2xl" style={{ color: s.color }}>
                    {s.val != null ? `${s.val.toFixed(1)}%` : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PYGIntelligenceOS({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-intelligence', storeCode, currentYear],
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
  const [activeTab, setActiveTab] = useState('intelligence');
  const [activeKPI, setActiveKPI] = useState(null);

  useEffect(() => {
    if (lastMonthWithData && !selectedMonth) setSelectedMonth(lastMonthWithData);
  }, [lastMonthWithData]);

  const primaryRecord = allRecords.find(r => r.month === selectedMonth) || null;
  const prevRecord = selectedMonth > 1 ? allRecords.find(r => r.month === selectedMonth - 1) : null;

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
  const costTeo = pctNum(primaryRecord?.cost_teorico);
  const gastos = pctNum(primaryRecord?.gastos_pct_venta);

  const ebitdaStatus = ebitda == null ? 'warn' : ebitda >= 25 ? 'good' : ebitda >= 15 ? 'warn' : 'bad';
  const personalStatus = personal == null ? 'warn' : personal <= 22 ? 'good' : personal <= 25 ? 'warn' : 'bad';
  const costoStatus = costReal == null || costTeo == null ? 'warn' : costReal <= costTeo ? 'good' : 'bad';
  const gastosStatus = gastos == null ? 'warn' : gastos <= 40 ? 'good' : gastos <= 45 ? 'warn' : 'bad';

  const waterfallData = primaryRecord ? [
    { label: 'Venta', value: 100, color: MINT },
    { label: 'C. Prod.', value: -(costReal || 0), color: '#f87171' },
    { label: 'Personal', value: -(personal || 0), color: LAVENDER },
    { label: 'Gastos', value: -(gastos || 0), color: CORAL },
    { label: 'EBITDA', value: ebitda || 0, color: MAGENTA },
  ] : [];

  const tabs = [
    { id: 'intelligence', label: 'Inteligencia', icon: Brain },
    { id: 'vitals', label: 'Señales Vitales', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Radio },
    { id: 'simulator', label: 'Simulador', icon: Zap },
    { id: 'breakdown', label: 'Desglose', icon: BarChart3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: '#f8f5fc' }}>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 65%)', filter: 'blur(50px)' }} />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }}>
          <defs>
            <pattern id="pyg_dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="#C21875" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pyg_dots)" />
        </svg>
      </div>

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(248,245,252,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(194,24,117,0.08)', boxShadow: '0 1px 20px rgba(0,0,0,0.04)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ boxShadow: [`0 0 0 0 ${MAGENTA}40`, `0 0 0 8px ${MAGENTA}00`] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${MAGENTA}, #9d174d)` }}>
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="font-black text-lg leading-none tracking-tight" style={{ color: '#1a0d28' }}>
                  P&G Intelligence
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(80,60,100,0.5)' }}>
                  {storeCode} · {currentYear} · {primaryRecord ? MONTHS_FULL[(selectedMonth || 1) - 1] : 'Sin datos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Month selector */}
              <div className="relative">
                <button onClick={() => setMonthOpen(!monthOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all"
                  style={{ background: 'rgba(194,24,117,0.06)', border: '1px solid rgba(194,24,117,0.15)', color: '#374151' }}>
                  📅 {selectedMonth ? MONTHS_SHORT[selectedMonth - 1] : 'Mes'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {monthOpen && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl z-30 p-4"
                      style={{ background: '#fff', border: '1px solid rgba(194,24,117,0.12)', minWidth: 260, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Seleccionar mes</p>
                      <div className="grid grid-cols-3 gap-2">
                        {MONTHS_SHORT.map((m, i) => {
                          const hasData = allRecords.some(r => r.month === i + 1);
                          const isSelected = selectedMonth === i + 1;
                          return (
                            <button key={i} disabled={!hasData}
                              onClick={() => { setSelectedMonth(i + 1); setMonthOpen(false); }}
                              className="rounded-xl py-2.5 px-2 text-center transition-all text-xs font-black"
                              style={{
                                background: isSelected ? MAGENTA : hasData ? 'rgba(194,24,117,0.05)' : 'transparent',
                                color: isSelected ? 'white' : hasData ? '#374151' : '#c4b5c4',
                                cursor: hasData ? 'pointer' : 'not-allowed',
                                border: isSelected ? `1px solid ${MAGENTA}` : '1px solid rgba(194,24,117,0.1)',
                                boxShadow: isSelected ? `0 0 12px ${MAGENTA}30` : 'none',
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

              <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(194,24,117,0.06)', border: '1px solid rgba(194,24,117,0.12)' }}>
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === tab.id ? MAGENTA : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'rgba(80,60,100,0.5)',
                    boxShadow: activeTab === tab.id ? `0 4px 14px ${MAGENTA}30` : 'none',
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-6xl mx-auto px-5 py-6 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-t-transparent"
              style={{ borderColor: `${MAGENTA}30`, borderTopColor: MAGENTA }} />
            <div className="text-center">
              <p className="font-black text-lg" style={{ color: '#1a0d28' }}>Activando Inteligencia Financiera</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(80,60,100,0.45)' }}>Procesando datos de {storeCode}…</p>
            </div>
          </div>
        ) : !primaryRecord ? (
          <div className="flex flex-col items-center justify-center py-48 text-center">
            <BarChart3 className="w-16 h-16 mb-4 opacity-10" style={{ color: MAGENTA }} />
            <p className="font-black text-xl mb-2" style={{ color: '#1a0d28' }}>Sin datos para {MONTHS_FULL[(selectedMonth || 1) - 1]}</p>
            <p className="text-sm" style={{ color: 'rgba(80,60,100,0.45)' }}>
              Disponibles: {allRecords.map(r => MONTHS_SHORT[r.month - 1]).join(', ') || 'ninguno'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── INTELLIGENCE ── */}
            {activeTab === 'intelligence' && (
              <motion.div key="intel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }} className="space-y-5">

                {/* Nova insight hero */}
                <NovaInsight primaryRecord={primaryRecord} prevRecord={prevRecord} trendData={trendData} storeCode={storeCode} />

                {/* Main chart */}
                {trendData.length >= 2 && (
                  <motion.div className="rounded-3xl p-6"
                    style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(80,60,100,0.45)' }}>Evolución {currentYear}</p>
                        <p className="font-black text-sm mt-0.5" style={{ color: '#1a0d28' }}>EBITDA · Costo · Personal</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                        style={{ background: 'rgba(194,24,117,0.05)', border: '1px solid rgba(194,24,117,0.1)' }}>
                        <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: MINT }}
                          animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <span className="text-[10px] font-black" style={{ color: 'rgba(80,60,100,0.5)' }}>{trendData.length} meses</span>
                      </div>
                    </div>
                    <CinematicChart data={trendData} height={200} />
                  </motion.div>
                )}

                {/* Nova Discoveries */}
                <motion.div className="rounded-3xl p-6"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)' }}>
                      <Eye className="w-3.5 h-3.5" style={{ color: MAGENTA }} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: '#1a0d28' }}>Nova Descubrió</p>
                      <p className="text-[10px]" style={{ color: 'rgba(80,60,100,0.4)' }}>Anomalías y patrones detectados</p>
                    </div>
                  </div>
                  <NovaDiscoveries primaryRecord={primaryRecord} prevRecord={prevRecord} trendData={trendData} />
                </motion.div>
              </motion.div>
            )}

            {/* ── VITAL SIGNALS ── */}
            {activeTab === 'vitals' && (
              <motion.div key="vitals" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }} className="space-y-5">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'EBITDA', value: ebitda, prevValue: prevRecord ? pctNum(prevRecord.margen_ebitda) : null, color: MAGENTA, sublabel: 'Meta ≥25%', status: ebitdaStatus, icon: TrendingUp, kpi: 'ebitda' },
                    { label: 'Personal', value: personal, prevValue: prevRecord ? pctNum(prevRecord.costo_personal) : null, color: LAVENDER, sublabel: 'Meta ≤22%', status: personalStatus, icon: Users, kpi: 'personal' },
                    { label: 'Costo Real', value: costReal, prevValue: prevRecord ? pctNum(prevRecord.cost_real) : null, color: SOFT_BLUE, sublabel: `Teo: ${costTeo != null ? costTeo.toFixed(1) + '%' : '—'}`, status: costoStatus, icon: Package, kpi: 'costo' },
                    { label: 'Gastos', value: gastos, prevValue: prevRecord ? pctNum(prevRecord.gastos_pct_venta) : null, color: CORAL, sublabel: 'Meta ≤40%', status: gastosStatus, icon: DollarSign, kpi: 'gastos' },
                  ].map((s, i) => (
                    <VitalSignal key={s.label} {...s} sparkData={trendData} onClick={() => setActiveKPI(s.kpi)} />
                  ))}
                </div>

                {/* Pressure Map */}
                <div className="rounded-3xl p-6"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)' }}>
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: MAGENTA }} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: '#1a0d28' }}>Mapa de Presión Operativa</p>
                      <p className="text-[10px]" style={{ color: 'rgba(80,60,100,0.4)' }}>Zonas de tensión por indicador</p>
                    </div>
                  </div>
                  <PressureMap ebitda={ebitda} personal={personal} costReal={costReal} costTeo={costTeo} gastos={gastos} />
                </div>

                {/* Waterfall */}
                <div className="rounded-3xl p-6"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(80,60,100,0.45)' }}>Desglose Visual</p>
                  <p className="font-black text-sm mb-5" style={{ color: '#1a0d28' }}>Cómo se llega al EBITDA desde el 100%</p>
                  <CinematicWaterfall data={waterfallData} />
                </div>
              </motion.div>
            )}

            {/* ── TIMELINE ── */}
            {activeTab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}>
                <div className="rounded-3xl p-8"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)' }}>
                      <Radio className="w-3.5 h-3.5" style={{ color: MAGENTA }} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: '#1a0d28' }}>Narrativa Financiera</p>
                      <p className="text-[10px]" style={{ color: 'rgba(80,60,100,0.4)' }}>La historia del negocio, mes a mes</p>
                    </div>
                  </div>
                  {trendData.length >= 2 ? (
                    <NarrativeTimeline trendData={trendData} selectedMonth={selectedMonth} />
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: 'rgba(80,60,100,0.4)' }}>Se necesitan al menos 2 meses para construir la narrativa.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SIMULATOR ── */}
            {activeTab === 'simulator' && (
              <motion.div key="simulator" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}>
                <div className="rounded-3xl p-6"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)' }}>
                      <Zap className="w-3.5 h-3.5" style={{ color: MAGENTA }} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: '#1a0d28' }}>Simulador de EBITDA</p>
                      <p className="text-[10px]" style={{ color: 'rgba(80,60,100,0.4)' }}>Mueve los controles y observa el impacto en tiempo real</p>
                    </div>
                  </div>
                  <LiveSimulator primaryRecord={primaryRecord} trendData={trendData} />
                </div>
              </motion.div>
            )}

            {/* ── BREAKDOWN ── */}
            {activeTab === 'breakdown' && (
              <motion.div key="breakdown" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }} className="space-y-5">
                <div className="rounded-3xl p-6"
                  style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                  <p className="font-black text-sm mb-5" style={{ color: '#1a0d28' }}>
                    Desglose Completo — {MONTHS_FULL[(selectedMonth || 1) - 1]}
                  </p>
                  <CostBreakdown primaryRecord={primaryRecord} prevRecord={prevRecord} />
                </div>

                {primaryRecord?.otros_gastos && (() => {
                  let others = [];
                  try { others = Object.entries(JSON.parse(primaryRecord.otros_gastos)).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]); } catch {}
                  if (!others.length) return null;
                  return (
                    <div className="rounded-3xl p-6"
                      style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(194,24,117,0.1)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', backdropFilter: 'blur(24px)' }}>
                      <p className="font-black text-sm mb-5" style={{ color: '#1a0d28' }}>Otros Gastos Detallados</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {others.map(([k, v]) => (
                          <div key={k} className="rounded-2xl p-4" style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,117,0.1)' }}>
                            <p className="text-[10px] mb-1 font-medium truncate" style={{ color: 'rgba(80,60,100,0.5)' }}>{k}</p>
                            <p className="font-black text-lg" style={{ color: MAGENTA }}>{(v * 100).toFixed(2)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* KPI Detail Panel */}
      <AnimatePresence>
        {activeKPI && (
          <KPIDetailPanel kpiId={activeKPI} onClose={() => setActiveKPI(null)}
            primaryRecord={primaryRecord} prevRecord={prevRecord}
            trendData={trendData} selectedMonth={selectedMonth} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}