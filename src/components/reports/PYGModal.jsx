import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, ChevronDown, AlertCircle, Activity,
  Target, DollarSign, Users, Package, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  Legend, ComposedChart, RadialBarChart, RadialBar
} from 'recharts';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MAGENTA = '#e91e8c';
const MAGENTA_DARK = '#c0156f';
const MAGENTA_PALE = '#fce7f3';
const MAGENTA_LIGHT = '#f472b6';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pctNum = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;
const fmt = (v) => v != null ? `${pctNum(v).toFixed(1)}%` : '—';
const fmtM = (v) => v != null ? `$${(v / 1_000_000).toFixed(1)}M` : '—';

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

// ─── Tooltip premium ──────────────────────────────────────────────────────────
const PremiumTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-2xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
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

// ─── KPI Card premium ─────────────────────────────────────────────────────────
function KPICard({ label, value, prev, delta, icon: Icon, accent, inverse = false, onClick, badge }) {
  const isGood = inverse ? (delta != null && delta <= 0) : (delta != null && delta >= 0);
  const showDelta = delta != null;
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left rounded-2xl p-5 w-full relative overflow-hidden group"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Glow accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: accent.iconBg, filter: 'blur(20px)' }} />
      <div className="flex items-start justify-between mb-4 relative">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent.iconBg + '25', border: `1px solid ${accent.iconBg}40` }}>
          <Icon className="w-5 h-5" style={{ color: accent.iconBg }} />
        </div>
        {showDelta && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm ${isGood ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: isGood ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isGood ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta > 0 ? '+' : ''}{delta?.toFixed(1)}pp
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 relative" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <p className="text-2xl font-black leading-tight text-white relative">{value}</p>
      {prev && <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Ant: {prev}</p>}
      {badge && (
        <div className="mt-3 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block relative"
          style={{ background: accent.iconBg + '20', color: accent.iconBg, border: `1px solid ${accent.iconBg}30` }}>
          {badge}
        </div>
      )}
    </motion.button>
  );
}

// ─── Simulador EBITDA ─────────────────────────────────────────────────────────
function EBITDASimulator({ primaryRecord, trendData }) {
  const ebitda = pctNum(primaryRecord?.margen_ebitda);
  const costReal = pctNum(primaryRecord?.cost_real);
  const personal = pctNum(primaryRecord?.costo_personal);
  const gastos = pctNum(primaryRecord?.gastos_pct_venta);
  const arriendos = pctNum(primaryRecord?.arriendos);

  // Estimación de venta mensual implícita basada en % de costos fijos
  // gastos fijos ≈ arriendos + admin + serv. públicos (asumiendo que son fijos)
  const gastosFijosEstimados = (arriendos || 0) + (pctNum(primaryRecord?.administracion) || 0) + (pctNum(primaryRecord?.servicios_publicos) || 0);

  // Target EBITDA scenarios
  const targets = [20, 25, 30].map(targetEbitda => {
    // Si subiéramos el EBITDA al target manteniendo costos fijos,
    // necesitamos reducir el gap. El gap = targetEbitda - ebitda
    const gap = targetEbitda - ebitda;
    // Para mejorar 1pp de EBITDA reduciendo personal: necesitas vender más o reducir nómina
    // Incremento de venta necesario para compensar gap sin tocar costos:
    // Si ventas aumentan X%, personal% baja proporcionalmente (costo fijo)
    const incrementoVentaRequerido = gastosFijosEstimados > 0
      ? (gap / gastosFijosEstimados * 100).toFixed(1)
      : null;
    return { target: targetEbitda, gap: gap.toFixed(1), incrementoVenta: incrementoVentaRequerido };
  });

  const avgEbitda = trendData.length > 0
    ? (trendData.reduce((s, d) => s + (d.EBITDA || 0), 0) / trendData.length).toFixed(1)
    : null;

  const best = trendData.length > 0 ? Math.max(...trendData.map(d => d.EBITDA || 0)) : null;
  const worst = trendData.length > 0 ? Math.min(...trendData.map(d => d.EBITDA || 0)) : null;

  const GLASS = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' };

  return (
    <div className="rounded-2xl p-6 space-y-5" style={GLASS}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${MAGENTA}, #6366f1)`, boxShadow: `0 0 16px ${MAGENTA}40` }}>
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Simulador EBITDA</h3>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>¿Cuánto necesito para mejorar?</p>
        </div>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl p-3" style={{ background: `${MAGENTA}15`, border: `1px solid ${MAGENTA}25` }}>
          <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>EBITDA Actual</p>
          <p className="font-black text-xl" style={{ color: MAGENTA }}>{ebitda?.toFixed(1)}%</p>
        </div>
        {avgEbitda && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Promedio</p>
            <p className="font-black text-xl text-white">{avgEbitda}%</p>
          </div>
        )}
        {best && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Mejor Mes</p>
            <p className="font-black text-xl text-emerald-400">{best.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Brechas */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Para llegar a…</p>
        {targets.filter(t => t.gap > 0).map(t => (
          <div key={t.target} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
              style={{ background: t.target >= 30 ? '#10b981' : t.target >= 25 ? '#f59e0b' : MAGENTA }}>
              {t.target}%
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">EBITDA objetivo {t.target}%</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Mejorar {t.gap}pp · {t.incrementoVenta ? `Incrementar venta ~${t.incrementoVenta}%` : 'Reducir gastos ' + t.gap + 'pp'}</p>
            </div>
          </div>
        ))}
        {targets.every(t => t.gap <= 0) && (
          <div className="rounded-xl p-3 text-emerald-400 text-xs font-bold text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            ✅ EBITDA por encima de todos los targets. ¡Excelente gestión!
          </div>
        )}
      </div>

      {/* Palancas */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Palancas de mejora</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Reducir Personal 1pp', impact: '+1pp EBITDA', icon: Users },
            { label: 'Reducir Gastos 1pp', impact: '+1pp EBITDA', icon: Package },
            { label: 'Reducir Costo Producto 1pp', impact: '+1pp EBITDA', icon: DollarSign },
            { label: 'Aumentar ventas 5%', impact: `+${(gastosFijosEstimados * 0.05).toFixed(1)}pp EBITDA est.`, icon: TrendingUp },
          ].map((p, i) => (
            <div key={i} className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${MAGENTA}20` }}>
                <p.icon className="w-3 h-3" style={{ color: MAGENTA }} />
              </div>
              <div>
                <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.label}</p>
                <p className="text-[10px] font-bold" style={{ color: MAGENTA }}>{p.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Gráfica de barras Premium ────────────────────────────────────────────────
const BAR_COLORS = {
  EBITDA: MAGENTA,
  'C.Real': '#3b82f6',
  'C.Teo': '#94a3b8',
  Personal: '#8b5cf6',
  Gastos: '#f59e0b',
};

function getBarFill(metric, value, data) {
  if (metric !== 'EBITDA') return BAR_COLORS[metric];
  const avg = data.reduce((s, d) => s + (d[metric] || 0), 0) / data.length;
  if (value >= avg + 2) return MAGENTA;
  if (value >= avg) return MAGENTA_LIGHT;
  return '#f1f5f9';
}

function TrendChart({ data, metrics, height = 260 }) {
  const single = metrics.length === 1;
  const avg = single && data.length > 0
    ? data.reduce((s, d) => s + (d[metrics[0]] || 0), 0) / data.length
    : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: -5, bottom: 0 }}>
        <defs>
          {metrics.map(m => (
            <linearGradient key={m} id={`bgrad_${m}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BAR_COLORS[m]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={BAR_COLORS[m]} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} width={42} />
        <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        {avg != null && (
          <ReferenceLine y={avg} stroke={MAGENTA} strokeDasharray="6 3" strokeOpacity={0.5}
            label={{ value: `${avg.toFixed(1)}%`, position: 'insideTopRight', fontSize: 10, fill: MAGENTA }} />
        )}
        {metrics.map(m => (
          <Bar key={m} dataKey={m} name={m === 'C.Real' ? 'Costo Real' : m === 'C.Teo' ? 'Costo Teórico' : m}
            radius={[5, 5, 0, 0]} maxBarSize={single ? 40 : 18} animationDuration={700}
            fill={single ? undefined : `url(#bgrad_${m})`}>
            {single && data.map((entry, i) => (
              <Cell key={i} fill={
                (entry[m] || 0) >= (avg || 0) + 2 ? BAR_COLORS[m] :
                (entry[m] || 0) >= (avg || 0) ? BAR_COLORS[m] + 'aa' :
                'rgba(255,255,255,0.1)'
              } />
            ))}
          </Bar>
        ))}
        {!single && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: 'rgba(255,255,255,0.5)' }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Gráfica de barras Costo Real vs Teórico ─────────────────────────────────
function CostBarsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} width={42} />
        <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="C.Real" name="Costo Real" radius={[5, 5, 0, 0]} maxBarSize={22} animationDuration={700}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry['C.Real'] > entry['C.Teo'] ? MAGENTA : MAGENTA + '70'} />
          ))}
        </Bar>
        <Bar dataKey="C.Teo" name="Costo Teórico" fill="rgba(255,255,255,0.15)" radius={[5, 5, 0, 0]} maxBarSize={22} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Panel de insights cuantitativos ──────────────────────────────────────────
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

  // EBITDA
  if (prevEbitda !== null) {
    const diff = ebitda - prevEbitda;
    items.push({
      type: diff >= 0 ? 'good' : 'bad',
      emoji: diff >= 0 ? '📈' : '📉',
      title: `EBITDA ${diff >= 0 ? 'mejoró' : 'cayó'} ${Math.abs(diff).toFixed(2)}pp vs mes anterior`,
      detail: `De ${prevEbitda.toFixed(1)}% → ${ebitda.toFixed(1)}%. ${diff < 0 ? `Para recuperar estos ${Math.abs(diff).toFixed(2)}pp necesitas reducir gastos o aumentar ventas en ~${(Math.abs(diff) / (arriendos || 10) * 100).toFixed(0)}%.` : `Mantén la eficiencia actual.`}`,
    });
  }

  // Costo vs Teórico
  if (costReal != null && costTeo != null) {
    const brechaCosto = costReal - costTeo;
    items.push({
      type: brechaCosto > 0 ? 'bad' : 'good',
      emoji: brechaCosto > 0 ? '⚠️' : '✅',
      title: `Costo real ${brechaCosto > 0 ? 'EXCEDE' : 'está bajo'} el teórico en ${Math.abs(brechaCosto).toFixed(2)}pp`,
      detail: `Real ${costReal.toFixed(1)}% vs Teórico ${costTeo.toFixed(1)}%. ${brechaCosto > 0 ? `Cada punto que bajas el costo real representa +1pp directo al EBITDA.` : `Ahorro de ${Math.abs(brechaCosto).toFixed(2)}pp respecto al presupuesto de costos.`}`,
    });
  }

  // Personal
  if (personal != null && personal > 22) {
    items.push({
      type: 'warn',
      emoji: '👥',
      title: `Personal en ${personal.toFixed(1)}% — por encima del óptimo (20-22%)`,
      detail: `Cada punto que reduces costo de personal = +1pp EBITDA. Para bajar al 22%: reducir ${(personal - 22).toFixed(1)}pp de nómina sobre venta. ${prevPersonal !== null ? `Vs mes anterior: ${(personal - prevPersonal) > 0 ? '+' : ''}${(personal - prevPersonal).toFixed(2)}pp.` : ''}`,
    });
  } else if (personal != null) {
    items.push({
      type: 'good',
      emoji: '✅',
      title: `Personal eficiente al ${personal.toFixed(1)}% — dentro del rango óptimo`,
      detail: `Rango recomendado: 20-22%. Estás ${(22 - personal).toFixed(1)}pp bajo el límite superior. Capacidad de ajuste si ventas caen.`,
    });
  }

  // Estructura total de costos
  const totalEgreso = (costReal || 0) + (personal || 0) + (gastos || 0);
  items.push({
    type: totalEgreso > 85 ? 'bad' : totalEgreso > 75 ? 'warn' : 'good',
    emoji: totalEgreso > 85 ? '🔴' : '📊',
    title: `Estructura de egresos: ${totalEgreso.toFixed(1)}% de la venta`,
    detail: `Costo ${costReal?.toFixed(1)}% + Personal ${personal?.toFixed(1)}% + Gastos ${gastos?.toFixed(1)}% = ${totalEgreso.toFixed(1)}%. ${100 - totalEgreso > 0 ? `Margen operativo disponible: ${(100 - totalEgreso).toFixed(1)}% de la venta.` : 'Egresos superan el 100% — operación en pérdida operativa.'}`,
  });

  // Tendencia
  if (trendData.length >= 3) {
    const last3 = trendData.slice(-3);
    const isImproving = last3[2].EBITDA > last3[0].EBITDA;
    items.push({
      type: isImproving ? 'good' : 'warn',
      emoji: isImproving ? '📈' : '📉',
      title: `Tendencia ${isImproving ? 'alcista' : 'bajista'} en EBITDA (últimos 3 meses)`,
      detail: `${last3[0].mes}: ${last3[0].EBITDA?.toFixed(1)}% → ${last3[1].mes}: ${last3[1].EBITDA?.toFixed(1)}% → ${last3[2].mes}: ${last3[2].EBITDA?.toFixed(1)}%. ${isImproving ? 'Continúa con la estrategia actual.' : 'Revisión urgente de estructura de costos.'}`,
    });
  }

  const colorMap = {
    good: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#34d399', dot: '#10b981' },
    bad:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  text: '#f87171', dot: '#ef4444' },
    warn: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24', dot: '#f59e0b' },
  };

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const c = colorMap[item.type];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl p-4 flex gap-3"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{item.emoji}</span>
            <div>
              <p className="font-bold text-sm leading-tight mb-1" style={{ color: c.text }}>{item.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.detail}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Tabla de desglose premium ────────────────────────────────────────────────
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
          <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
            <th className="text-left py-3 px-4 font-semibold text-xs rounded-l-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>Partida</th>
            <th className="text-right py-3 px-4 font-semibold text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Actual</th>
            {prevRecord && <th className="text-right py-3 px-4 font-semibold text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Anterior</th>}
            {prevRecord && <th className="text-right py-3 px-4 font-semibold text-xs rounded-r-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>Δ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const curr = pctNum(primaryRecord?.[row.key]);
            const prev = prevRecord ? pctNum(prevRecord?.[row.key]) : null;
            const delta = prev != null ? curr - prev : null;
            const isGood = delta == null ? null : (row.inverse ? delta < 0 : delta > 0);
            return (
              <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="py-3 px-4 font-medium" style={{ color: row.highlight ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {row.highlight && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: MAGENTA }} />}
                  {row.label}
                  {row.teo && primaryRecord?.[row.teo] && (
                    <span className="ml-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>(teo: {fmt(primaryRecord[row.teo])})</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-bold" style={{ color: row.highlight ? MAGENTA : 'rgba(255,255,255,0.85)' }}>
                  {curr != null ? `${curr.toFixed(1)}%` : '—'}
                </td>
                {prevRecord && <td className="py-3 px-4 text-right text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{prev != null ? `${prev.toFixed(1)}%` : '—'}</td>}
                {prevRecord && (
                  <td className="py-3 px-4 text-right text-xs font-bold">
                    {delta != null ? (
                      <span className={isGood ? 'text-emerald-400' : 'text-red-400'}>
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

// ─── Modal de detalle de KPI ──────────────────────────────────────────────────
function KPIDetailModal({ kpiId, onClose, primaryRecord, prevRecord, trendData, selectedMonth }) {
  if (!kpiId || !primaryRecord) return null;

  const configs = {
    ebitda: {
      title: 'Margen EBITDA',
      metric: 'EBITDA',
      dataKey: 'margen_ebitda',
      color: MAGENTA,
      bg: MAGENTA_PALE,
      inverse: false,
      description: 'Ganancia operativa por cada peso de venta. Meta: ≥25%',
      benchmarks: [
        { label: 'Crítico', range: '< 15%', color: '#ef4444' },
        { label: 'Normal', range: '15% – 24%', color: '#f59e0b' },
        { label: 'Óptimo', range: '≥ 25%', color: '#10b981' },
      ],
      insight: (r, p) => {
        const v = pctNum(r.margen_ebitda);
        if (v == null) return 'Sin datos suficientes para analizar EBITDA.';
        const pv = p ? pctNum(p.margen_ebitda) : null;
        const gap25 = (25 - v).toFixed(1);
        const gap30 = (30 - v).toFixed(1);
        return v >= 25
          ? `✅ EBITDA en zona óptima (${v.toFixed(1)}%). ${pv != null ? `Variación vs mes anterior: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''} Mantén la estructura de costos.`
          : `⚠️ EBITDA de ${v.toFixed(1)}%. Para llegar al 25% necesitas mejorar ${gap25}pp — equivale a reducir gastos variables en ${gap25}pp o aumentar ventas ~${(parseFloat(gap25) * 3).toFixed(0)}% manteniendo costos fijos. Para 30%: mejorar ${gap30}pp adicionales.`;
      },
    },
    personal: {
      title: 'Costo Personal',
      metric: 'Personal',
      dataKey: 'costo_personal',
      color: '#a21caf',
      bg: '#fdf4ff',
      inverse: true,
      description: '% de nómina sobre ventas. Meta: ≤22%. Cada 1pp que bajas = +1pp EBITDA directo.',
      benchmarks: [
        { label: 'Óptimo', range: '≤ 20%', color: '#10b981' },
        { label: 'Normal', range: '20% – 25%', color: '#f59e0b' },
        { label: 'Alto', range: '> 25%', color: '#ef4444' },
      ],
      insight: (r, p) => {
        const v = pctNum(r.costo_personal);
        if (v == null) return 'Sin datos suficientes para analizar costo personal.';
        const pv = p ? pctNum(p.costo_personal) : null;
        const reducir = Math.max(0, v - 22).toFixed(1);
        return v > 22
          ? `⚠️ Personal en ${v.toFixed(1)}% — ${reducir}pp sobre el límite recomendado. Reducir ${reducir}pp de nómina/venta impacta directamente +${reducir}pp en EBITDA. ${pv != null ? `Tendencia vs mes anterior: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`
          : `✅ Personal eficiente en ${v.toFixed(1)}%. Tienes ${(22 - v).toFixed(1)}pp de margen antes del límite. ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp vs mes anterior.` : ''}`;
      },
    },
    costo: {
      title: 'Costo Real vs Teórico',
      metric: 'C.Real',
      dataKey: 'cost_real',
      color: '#2563eb',
      bg: '#eff6ff',
      inverse: true,
      description: 'Desviación del costo real sobre el presupuesto teórico. Exceso = pérdida directa de EBITDA.',
      benchmarks: [
        { label: 'Bajo presupuesto', range: 'Real < Teórico', color: '#10b981' },
        { label: 'En presupuesto', range: 'Real = Teórico ±1%', color: '#f59e0b' },
        { label: 'Exceso', range: 'Real > Teórico', color: '#ef4444' },
      ],
      insight: (r, p) => {
        const v = pctNum(r.cost_real);
        const teo = pctNum(r.cost_teorico);
        if (v == null || teo == null) return 'Sin datos suficientes para analizar costo real vs teórico.';
        const brecha = (v - teo).toFixed(2);
        const pv = p ? pctNum(p.cost_real) : null;
        return v > teo
          ? `⚠️ Costo real ${v.toFixed(1)}% excede el teórico ${teo.toFixed(1)}% en +${brecha}pp. Cada punto de exceso = -1pp EBITDA. ${pv != null ? `Vs mes anterior: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''} Revisar mermas, desperdicios y eficiencia operativa.`
          : `✅ Costo real ${v.toFixed(1)}% bajo el teórico ${teo.toFixed(1)}%. Ahorro de ${Math.abs(parseFloat(brecha)).toFixed(2)}pp vs presupuesto. ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`;
      },
    },
    gastos: {
      title: 'Gastos % Venta',
      metric: 'Gastos',
      dataKey: 'gastos_pct_venta',
      color: '#b45309',
      bg: '#fef3c7',
      inverse: true,
      description: 'Arriendos + servicios + admin como % de ventas. Meta: ≤40%. Costos semiFijos.',
      benchmarks: [
        { label: 'Óptimo', range: '≤ 35%', color: '#10b981' },
        { label: 'Normal', range: '35% – 45%', color: '#f59e0b' },
        { label: 'Elevado', range: '> 45%', color: '#ef4444' },
      ],
      insight: (r, p) => {
        const v = pctNum(r.gastos_pct_venta);
        if (v == null) return 'Sin datos suficientes para analizar gastos.';
        const arr = pctNum(r.arriendos) || 0;
        const adm = pctNum(r.administracion) || 0;
        const serv = pctNum(r.servicios_publicos) || 0;
        const pv = p ? pctNum(p.gastos_pct_venta) : null;
        return `Gastos en ${v.toFixed(1)}% — Arriendos ${arr.toFixed(1)}%, Admin ${adm.toFixed(1)}%, Servicios ${serv.toFixed(1)}%. ${v > 40 ? `⚠️ Sobre el umbral recomendado (40%). Para bajar 1pp necesitas aumentar ventas ~${(1 / v * 100).toFixed(0)}% sin tocar gastos fijos.` : `✅ Dentro del rango aceptable.`} ${pv != null ? `Variación: ${(v - pv) > 0 ? '+' : ''}${(v - pv).toFixed(2)}pp.` : ''}`;
      },
    },
  };

  const cfg = configs[kpiId];
  if (!cfg) return null;

  const currentVal = pctNum(primaryRecord[cfg.dataKey]);
  const prevVal = prevRecord ? pctNum(prevRecord[cfg.dataKey]) : null;
  const delta = prevVal != null ? currentVal - prevVal : null;
  const isGood = cfg.inverse ? (delta != null && delta <= 0) : (delta != null && delta >= 0);

  // Datos para la barra del mes actual dentro del histórico
  const chartData = trendData.map(d => ({
    ...d,
    isSelected: d.month === selectedMonth,
  }));
  const avg = trendData.length > 0 ? trendData.reduce((s, d) => s + (d[cfg.metric] || 0), 0) / trendData.length : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: 'rgba(12,12,20,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 flex items-start justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: `linear-gradient(135deg, ${cfg.color}15, transparent)` }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: cfg.color }}>{cfg.title}</p>
              <p className="text-3xl font-black text-white">{currentVal?.toFixed(1)}%</p>
              {delta != null && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1.5 px-2.5 py-1 rounded-full ${isGood ? 'text-emerald-400' : 'text-red-400'}`}
                  style={{ background: isGood ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isGood ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                  {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta > 0 ? '+' : ''}{delta.toFixed(2)}pp vs mes anterior
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Benchmarks */}
            <div>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{cfg.description}</p>
              <div className="flex gap-2 flex-wrap">
                {cfg.benchmarks.map(b => (
                  <span key={b.label} className="px-3 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: b.color + '15', color: b.color, border: `1px solid ${b.color}30` }}>
                    {b.label}: {b.range}
                  </span>
                ))}
              </div>
            </div>

            {/* Histórico */}
            {chartData.length >= 1 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Evolución Histórica</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 8, right: 10, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} width={38} />
                    <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <ReferenceLine y={avg} stroke={cfg.color} strokeDasharray="5 3" strokeOpacity={0.4}
                      label={{ value: `μ ${avg.toFixed(1)}%`, position: 'insideTopRight', fontSize: 9, fill: cfg.color }} />
                    <Bar dataKey={cfg.metric} radius={[5, 5, 0, 0]} maxBarSize={36} animationDuration={600}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.isSelected ? cfg.color : cfg.color + '40'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insight */}
            <div className="rounded-xl p-4" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: cfg.color }}>Análisis & Acción</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{cfg.insight(primaryRecord, prevRecord)}</p>
            </div>

            {/* Comparativo */}
            {prevRecord && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Actual</p>
                  <p className="font-black text-xl" style={{ color: cfg.color }}>{currentVal?.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Anterior</p>
                  <p className="font-black text-xl text-white">{prevVal?.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: isGood ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Variación</p>
                  <p className={`font-black text-xl ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}pp` : '—'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
    { id: 'overview', label: 'Resumen' },
    { id: 'trends', label: 'Tendencias' },
    { id: 'simulator', label: 'Simulador' },
    { id: 'breakdown', label: 'Desglose' },
  ];

  // Colores de los KPI cards — dark theme
  const ACCENTS = {
    ebitda:   { iconBg: MAGENTA,    glow: MAGENTA },
    personal: { iconBg: '#a855f7',  glow: '#a855f7' },
    costo:    { iconBg: '#3b82f6',  glow: '#3b82f6' },
    gastos:   { iconBg: '#f59e0b',  glow: '#f59e0b' },
  };

  const GLASS = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    cardHover: { background: 'rgba(255,255,255,0.07)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 40%, #0a0f1a 100%)' }}
    >
      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-15" style={{ background: MAGENTA, filter: 'blur(120px)' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: '#6366f1', filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full opacity-10" style={{ background: '#0ea5e9', filter: 'blur(100px)' }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${MAGENTA}, #6366f1)`, boxShadow: `0 0 20px ${MAGENTA}60` }}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg text-white leading-tight tracking-tight">P&G Dashboard</h1>
                <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {storeCode} · {currentYear} · {primaryRecord ? MONTHS_FULL[(selectedMonth || 1) - 1] : 'Sin datos'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4 text-white/60" />
            </motion.button>
          </div>

          {/* Selector mes + tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
              >
                <span style={{ color: MAGENTA }}>●</span>
                {selectedMonth ? MONTHS_SHORT[selectedMonth - 1] : 'Mes'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-50 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 rounded-2xl z-20 p-3 grid grid-cols-4 gap-1.5"
                  style={{ background: 'rgba(15,15,25,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                  {MONTHS_SHORT.map((m, i) => {
                    const hasData = allRecords.some(r => r.month === i + 1);
                    return (
                      <button key={i} disabled={!hasData}
                        onClick={() => { setSelectedMonth(i + 1); setMonthDropdownOpen(false); }}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={selectedMonth === i + 1
                          ? { background: MAGENTA, color: '#fff', boxShadow: `0 0 12px ${MAGENTA}60` }
                          : hasData
                            ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }
                            : { color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                        }>
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeTab === tab.id
                    ? { background: 'rgba(255,255,255,0.12)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
                    : { color: 'rgba(255,255,255,0.45)' }
                  }>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 py-6 space-y-5 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${MAGENTA}20`, border: `1px solid ${MAGENTA}40` }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAGENTA }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando datos de P&G…</p>
          </div>
        ) : !primaryRecord ? (
          <div className="flex flex-col items-center justify-center py-32" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold text-white/60 text-xl">Sin datos para {MONTHS_FULL[(selectedMonth || 1) - 1]}</p>
            <p className="text-sm mt-2 text-white/30">Meses disponibles: {allRecords.map(r => MONTHS_SHORT[r.month - 1]).join(', ')}</p>
          </div>
        ) : (
          <>
            {/* ── TAB: RESUMEN ── */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KPICard label="Margen EBITDA" value={fmt(primaryRecord.margen_ebitda)}
                    prev={prevRecord ? fmt(prevRecord.margen_ebitda) : null}
                    delta={prevRecord ? pctNum(primaryRecord.margen_ebitda) - pctNum(prevRecord.margen_ebitda) : null}
                    icon={TrendingUp} accent={ACCENTS.ebitda} inverse={false}
                    badge={pctNum(primaryRecord.margen_ebitda) >= 25 ? '🏆 Excelente' : pctNum(primaryRecord.margen_ebitda) >= 18 ? '✓ Normal' : '⚠ Crítico'}
                    onClick={() => setActiveKPI('ebitda')} />
                  <KPICard label="Costo Personal" value={fmt(primaryRecord.costo_personal)}
                    prev={prevRecord ? fmt(prevRecord.costo_personal) : null}
                    delta={prevRecord ? pctNum(primaryRecord.costo_personal) - pctNum(prevRecord.costo_personal) : null}
                    icon={Users} accent={ACCENTS.personal} inverse={true}
                    badge={pctNum(primaryRecord.costo_personal) <= 22 ? '✓ Óptimo' : pctNum(primaryRecord.costo_personal) <= 25 ? '⚠ Revisar' : '🔴 Alto'}
                    onClick={() => setActiveKPI('personal')} />
                  <KPICard label="Costo Real / Teórico" value={`${fmt(primaryRecord.cost_real)} / ${fmt(primaryRecord.cost_teorico)}`}
                    prev={prevRecord ? `${fmt(prevRecord.cost_real)}` : null}
                    delta={prevRecord ? pctNum(primaryRecord.cost_real) - pctNum(prevRecord.cost_real) : null}
                    icon={Package} accent={ACCENTS.costo} inverse={true}
                    badge={pctNum(primaryRecord.cost_real) <= pctNum(primaryRecord.cost_teorico) ? '✓ En presupuesto' : '⚠ Exceso'}
                    onClick={() => setActiveKPI('costo')} />
                  <KPICard label="Gastos % Venta" value={fmt(primaryRecord.gastos_pct_venta)}
                    prev={prevRecord ? fmt(prevRecord.gastos_pct_venta) : null}
                    delta={prevRecord ? pctNum(primaryRecord.gastos_pct_venta) - pctNum(prevRecord.gastos_pct_venta) : null}
                    icon={DollarSign} accent={ACCENTS.gastos} inverse={true}
                    onClick={() => setActiveKPI('gastos')} />
                </div>

                {/* Insights cuantitativos */}
                <div className="rounded-2xl p-6" style={GLASS.card}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${MAGENTA}, #6366f1)`, boxShadow: `0 0 16px ${MAGENTA}40` }}>
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Análisis Cuantitativo</h3>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Insights accionables basados en datos</p>
                    </div>
                  </div>
                  <QuantInsights primaryRecord={primaryRecord} prevRecord={prevRecord} trendData={trendData} dark />
                </div>

                {/* Mini trend EBITDA */}
                {trendData.length >= 2 && (
                  <div className="rounded-2xl p-6" style={GLASS.card}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-white text-sm">Evolución EBITDA {currentYear}</h3>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{trendData.length} meses registrados</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                        style={{ background: `${MAGENTA}20`, color: MAGENTA, border: `1px solid ${MAGENTA}30` }}>
                        EBITDA
                      </span>
                    </div>
                    <TrendChart data={trendData} metrics={['EBITDA']} height={220} dark />
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: TENDENCIAS ── */}
            {activeTab === 'trends' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {trendData.length >= 2 ? (
                  <>
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-1">EBITDA vs Costo Personal</h3>
                      <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Relación inversa clave: personal sube → EBITDA baja</p>
                      <TrendChart data={trendData} metrics={['EBITDA', 'Personal']} height={280} dark />
                    </div>
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-1">Costo Real vs Teórico</h3>
                      <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Desvíos sobre el presupuesto de costo</p>
                      <CostBarsChart data={trendData} dark />
                      <div className="flex gap-4 mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: MAGENTA }} />Costo Real</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(255,255,255,0.2)' }} />Costo Teórico</span>
                      </div>
                    </div>
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-1">Panorama Completo de Métricas</h3>
                      <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>EBITDA · Costo Real · Personal · Gastos</p>
                      <TrendChart data={trendData} metrics={['EBITDA', 'C.Real', 'Personal', 'Gastos']} height={300} dark />
                    </div>
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-5">Tabla Histórica Completa</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[500px]">
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <th className="text-left py-3 px-3 font-semibold rounded-l-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>Métrica</th>
                              {trendData.map(d => (
                                <th key={d.mes} className="text-right py-3 px-3 font-semibold"
                                  style={{ color: d.month === selectedMonth ? MAGENTA : 'rgba(255,255,255,0.4)', background: d.month === selectedMonth ? `${MAGENTA}15` : 'transparent' }}>
                                  {d.mes}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {['EBITDA', 'C.Real', 'C.Teo', 'Personal', 'Gastos'].map(k => (
                              <tr key={k} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <td className="py-2.5 px-3 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{k === 'C.Real' ? 'Costo Real' : k === 'C.Teo' ? 'Costo Teórico' : k}</td>
                                {trendData.map(d => (
                                  <td key={d.mes} className="py-2.5 px-3 text-right font-bold"
                                    style={{ color: d.month === selectedMonth && k === 'EBITDA' ? MAGENTA : 'rgba(255,255,255,0.7)' }}>
                                    {d[k] != null ? `${d[k].toFixed(1)}%` : '—'}
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
                  <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Necesitas al menos 2 meses de datos para ver tendencias</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TAB: SIMULADOR ── */}
            {activeTab === 'simulator' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <EBITDASimulator primaryRecord={primaryRecord} trendData={trendData} dark />
                {trendData.length >= 2 && (() => {
                  const bestMonth = trendData.reduce((b, d) => (d.EBITDA || 0) > (b.EBITDA || 0) ? d : b, trendData[0]);
                  const currentInTrend = trendData.find(d => d.month === selectedMonth);
                  if (!currentInTrend || bestMonth.month === selectedMonth) return null;
                  return (
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-1">¿Qué hiciste diferente en {bestMonth.mes}?</h3>
                      <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Tu mejor mes vs el mes seleccionado</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['EBITDA', 'C.Real', 'Personal', 'Gastos'].map(k => {
                          const curr = currentInTrend[k];
                          const best = bestMonth[k];
                          const diff = curr != null && best != null ? curr - best : null;
                          const isKpi = k === 'EBITDA';
                          const isBetter = isKpi ? diff >= 0 : diff <= 0;
                          return (
                            <div key={k} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <p className="text-[10px] font-semibold uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{k === 'C.Real' ? 'Costo Real' : k}</p>
                              <div className="flex items-end gap-2">
                                <span className="font-black text-xl text-white">{curr?.toFixed(1)}%</span>
                                <span className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>vs {best?.toFixed(1)}%</span>
                              </div>
                              {diff != null && (
                                <p className={`text-xs font-bold mt-1.5 ${isBetter ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp {isBetter ? '↑ mejor' : '↓ peor'} que {bestMonth.mes}
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

            {/* ── TAB: DESGLOSE ── */}
            {activeTab === 'breakdown' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="rounded-2xl p-6" style={GLASS.card}>
                  <h3 className="font-bold text-white text-sm mb-5">Desglose de Costos — {MONTHS_FULL[(selectedMonth || 1) - 1]}</h3>
                  <CostTable primaryRecord={primaryRecord} prevRecord={prevRecord} dark />
                </div>
                {primaryRecord?.otros_gastos && (() => {
                  let others = [];
                  try { others = Object.entries(JSON.parse(primaryRecord.otros_gastos)).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]); } catch {}
                  if (!others.length) return null;
                  return (
                    <div className="rounded-2xl p-6" style={GLASS.card}>
                      <h3 className="font-bold text-white text-sm mb-4">Otros Gastos Detallados</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {others.map(([k, v]) => (
                          <div key={k} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="text-[10px] font-medium truncate mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</p>
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

      {/* Modal detalle KPI */}
      {activeKPI && (
        <KPIDetailModal
          kpiId={activeKPI}
          onClose={() => setActiveKPI(null)}
          primaryRecord={primaryRecord}
          prevRecord={prevRecord}
          trendData={trendData}
          selectedMonth={selectedMonth}
        />
      )}
    </motion.div>
  );
}