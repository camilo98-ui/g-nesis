import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, BarChart3,
  ChevronUp, ChevronDown, Minus, GitCompare, Zap, AlertTriangle,
  CheckCircle, Target, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell, AreaChart, Area,
  ComposedChart, Scatter
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const HOUR_LABELS = HOURS.map(h => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);

// Paleta Popsy
const MAGENTA = '#e91e8c';
const MAGENTA_DARK = '#c0156f';
const MAGENTA_LIGHT = '#f472b6';
const MAGENTA_PALE = '#fce7f3';

function getHourValues(rec) {
  return HOURS.map(h => Math.max(0, rec?.[`hour_${h}`] || 0));
}

function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
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

// Tooltip barra
const BarTooltip = ({ active, payload, label, mean, total }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value || 0;
  const pctVsAvg = mean > 0 ? ((val - mean) / mean * 100) : 0;
  const pctOfDay = total > 0 ? (val / total * 100) : 0;
  return (
    <div className="bg-white border border-pink-100 shadow-2xl px-4 py-3 rounded-2xl text-xs min-w-[170px]">
      <p className="font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900">{val.toLocaleString('es-CO')}</p>
      <p className="text-xs text-slate-400 mt-0.5">transacciones</p>
      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">vs promedio</span>
          <span className={`font-bold ${pctVsAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {pctVsAvg >= 0 ? '+' : ''}{pctVsAvg.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">% del día</span>
          <span className="font-bold text-slate-700">{pctOfDay.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// Tooltip línea comparativa
const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.dataKey === 'current')?.value;
  const prev = payload.find(p => p.dataKey === 'previous')?.value;
  const diff = (curr != null && prev != null && prev > 0) ? ((curr - prev) / prev * 100) : null;
  return (
    <div className="bg-white border border-pink-100 shadow-2xl px-4 py-3 rounded-2xl text-xs min-w-[200px]">
      <p className="font-bold text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
      {curr != null && (
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Actual</span>
          <span className="font-black text-slate-900">{curr.toLocaleString('es-CO')}</span>
        </div>
      )}
      {prev != null && (
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Anterior</span>
          <span className="font-black text-slate-500">{prev.toLocaleString('es-CO')}</span>
        </div>
      )}
      {diff != null && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-slate-400">Variación</span>
          <span className={`font-black text-base ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Tooltip tendencia mensual
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const txn = payload.find(p => p.dataKey === 'total')?.value;
  return (
    <div className="bg-white border border-pink-100 shadow-2xl px-4 py-3 rounded-2xl text-xs min-w-[160px]">
      <p className="font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-slate-900">{(txn || 0).toLocaleString('es-CO')}</p>
      <p className="text-xs text-slate-400">transacciones totales</p>
    </div>
  );
};

// KPI Card con comparativo
function KPICard({ label, value, sub, icon: Icon, delta, deltaLabel, accentColor, delay = 0 }) {
  const isPositive = delta >= 0;
  const hasDelta = delta != null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: 'easeOut' }}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {hasDelta && (
          <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
      {hasDelta && (
        <p className="text-[10px] text-slate-400 mt-1">{deltaLabel}</p>
      )}
    </motion.div>
  );
}

// Insight card estructurado
function InsightCard({ title, body, status, delay }) {
  const styles = {
    good: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: '✅', titleColor: 'text-emerald-800', bodyColor: 'text-emerald-700' },
    warn: { border: 'border-amber-200', bg: 'bg-amber-50', icon: '⚠️', titleColor: 'text-amber-800', bodyColor: 'text-amber-700' },
    alert: { border: 'border-red-200', bg: 'bg-red-50', icon: '🔴', titleColor: 'text-red-800', bodyColor: 'text-red-700' },
    info: { border: 'border-pink-200', bg: 'bg-pink-50', icon: '📊', titleColor: 'text-pink-800', bodyColor: 'text-pink-700' },
  }[status] || { border: 'border-slate-200', bg: 'bg-slate-50', icon: '📌', titleColor: 'text-slate-800', bodyColor: 'text-slate-600' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border rounded-xl p-4 ${styles.border} ${styles.bg}`}
    >
      <p className={`text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 ${styles.titleColor}`}>
        <span>{styles.icon}</span> {title}
      </p>
      <p className={`text-sm leading-relaxed ${styles.bodyColor}`} dangerouslySetInnerHTML={{ __html: body }} />
    </motion.div>
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
  const [sortKey, setSortKey] = useState('transactions');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedPeriod) {
      setSelectedPeriod(availableMonths[0]);
    }
  }, [availableMonths]);

  // Inicializar comparePeriod en el segundo mes disponible
  useEffect(() => {
    if (availableMonths.length > 1 && !comparePeriod) {
      setComparePeriod(availableMonths[1]);
    }
  }, [availableMonths]);

  const currentRecord = useMemo(() => {
    if (!selectedPeriod) return null;
    return allRecords.find(r => Math.round(r.month) === selectedPeriod.month && Math.round(r.year) === selectedPeriod.year) || null;
  }, [allRecords, selectedPeriod]);

  // Mes anterior automático
  const autoPrevRecord = useMemo(() => {
    if (!selectedPeriod) return null;
    let pm = selectedPeriod.month - 1; let py = selectedPeriod.year;
    if (pm < 1) { pm = 12; py -= 1; }
    return allRecords.find(r => Math.round(r.month) === pm && Math.round(r.year) === py) || null;
  }, [allRecords, selectedPeriod]);

  // Mes comparado (modo manual)
  const compareRecord = useMemo(() => {
    if (!comparePeriod) return null;
    return allRecords.find(r => Math.round(r.month) === comparePeriod.month && Math.round(r.year) === comparePeriod.year) || null;
  }, [allRecords, comparePeriod]);

  const prevRecord = compareMode ? compareRecord : autoPrevRecord;

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
    return { value: max, label: HOUR_LABELS[idx], hour: HOURS[idx] };
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

  // Bloque de 3 horas con mayor concentración
  const peakBlock = useMemo(() => {
    let maxSum = 0; let maxStart = 0;
    for (let s = 0; s <= HOURS.length - 3; s++) {
      const sum = hourValues[s] + hourValues[s + 1] + hourValues[s + 2];
      if (sum > maxSum) { maxSum = sum; maxStart = s; }
    }
    return { sum: maxSum, label1: HOUR_LABELS[maxStart], label2: HOUR_LABELS[maxStart + 2], pct: total > 0 ? (maxSum / total * 100) : 0 };
  }, [hourValues, total]);

  // Comparativo por hora
  const hourDiffs = useMemo(() => {
    return HOURS.map((h, i) => ({
      hour: HOUR_LABELS[i],
      diff: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
    })).filter(x => x.diff !== null);
  }, [hourValues, prevValues]);

  // Tendencia histórica de todos los meses
  const trendData = useMemo(() => {
    return [...availableMonths]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(p => {
        const rec = allRecords.find(r => Math.round(r.month) === p.month && Math.round(r.year) === p.year);
        const t = rec ? HOURS.reduce((s, h) => s + Math.max(0, rec[`hour_${h}`] || 0), 0) : 0;
        return { label: `${MONTHS_SHORT[p.month - 1]} ${p.year}`, total: t, month: p.month, year: p.year };
      });
  }, [availableMonths, allRecords]);

  // Datos gráficas
  const barData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    transactions: hourValues[i],
    prev: prevValues[i] || 0,
    color: getBarColor(hourValues[i], mean, sd),
  }));

  const lineData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    current: hourValues[i] || null,
    previous: prevValues[i] || null,
    diff: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
  }));

  // Ranking table
  const rankingData = useMemo(() => HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    transactions: hourValues[i],
    pctTotal: total > 0 ? (hourValues[i] / total * 100) : 0,
    vsPrev: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
    color: getBarColor(hourValues[i], mean, sd),
    label: getLabel(hourValues[i], mean, sd),
  })), [hourValues, prevValues, total, mean, sd]);

  const sortedRanking = useMemo(() => {
    return [...rankingData].sort((a, b) => {
      let va = sortKey === 'vsPrev' ? (a.vsPrev ?? -Infinity) : a[sortKey];
      let vb = sortKey === 'vsPrev' ? (b.vsPrev ?? -Infinity) : b[sortKey];
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [rankingData, sortKey, sortDir]);

  // Insights económicos estructurados
  const insights = useMemo(() => {
    if (!currentRecord) return [];
    const items = [];
    const prevName = prevRecord ? `${MONTHS[(prevRecord.month || 1) - 1]} ${prevRecord.year}` : 'mes anterior';
    const currName = `${MONTHS[(currentRecord.month || 1) - 1]} ${currentRecord.year}`;

    // 1. Volumen total y tendencia
    if (totalGrowth !== null) {
      const dir = totalGrowth >= 0 ? 'expansión' : 'contracción';
      items.push({
        title: 'Variación de Demanda',
        body: `La tienda registró <strong>${total.toLocaleString('es-CO')} transacciones</strong> en ${currName}, frente a <strong>${prevTotal.toLocaleString('es-CO')}</strong> en ${prevName}. Esto representa una <strong>${dir} del ${Math.abs(totalGrowth).toFixed(1)}%</strong> en el volumen de clientes atendidos.`,
        status: totalGrowth >= 5 ? 'good' : totalGrowth >= 0 ? 'info' : totalGrowth >= -10 ? 'warn' : 'alert',
      });
    }

    // 2. Concentración horaria
    items.push({
      title: 'Ventana de Mayor Productividad',
      body: `El bloque <strong>${peakBlock.label1} – ${peakBlock.label2}</strong> concentra el <strong>${peakBlock.pct.toFixed(1)}%</strong> del total de transacciones diarias (${peakBlock.sum.toLocaleString('es-CO')} txn). La asignación óptima del equipo en este intervalo tiene un impacto directo sobre el volumen de ventas.`,
      status: peakBlock.pct > 60 ? 'warn' : 'info',
    });

    // 3. Hora pico y valle
    items.push({
      title: 'Eficiencia Horaria',
      body: `La hora de máxima demanda es <strong>${peakHour.label}</strong> con <strong>${peakHour.value.toLocaleString('es-CO')} txn</strong> (${peakConcentration.toFixed(1)}% del día). En contraste, <strong>${valleyHour.label}</strong> es el momento de menor tráfico (${valleyHour.value.toLocaleString('es-CO')} txn) — idóneo para recepción de mercancía, capacitaciones o limpieza profunda sin afectar la experiencia del cliente.`,
      status: 'info',
    });

    // 4. Coeficiente de variación
    if (cv > 45) {
      items.push({
        title: 'Riesgo Operacional: Alta Concentración',
        body: `El coeficiente de variación de <strong>${cv.toFixed(1)}%</strong> indica que la demanda está fuertemente concentrada en pocas horas. Esto eleva el riesgo de cuellos de botella, tiempos de espera prolongados y pérdida de ventas por capacidad insuficiente en horas pico.`,
        status: 'alert',
      });
    } else if (cv > 28) {
      items.push({
        title: 'Distribución Moderada de Tráfico',
        body: `Con un CV de <strong>${cv.toFixed(1)}%</strong>, la distribución de clientes presenta variabilidad moderada. Se recomienda un modelo de staffing dinámico que refuerce las horas pico sin sobredimensionar las horas valle, optimizando el costo de personal.`,
        status: 'warn',
      });
    } else {
      items.push({
        title: 'Flujo de Clientes Estable',
        body: `El CV de <strong>${cv.toFixed(1)}%</strong> evidencia una distribución de tráfico consistente a lo largo del día. Este patrón facilita la planificación operativa, el control de costos y la estandarización de la experiencia del cliente.`,
        status: 'good',
      });
    }

    // 5. Mejores y peores horas vs anterior
    if (hourDiffs.length > 0) {
      const best = [...hourDiffs].sort((a, b) => b.diff - a.diff)[0];
      const worst = [...hourDiffs].sort((a, b) => a.diff - b.diff)[0];
      if (best && worst && best.hour !== worst.hour) {
        items.push({
          title: 'Análisis de Variación Horaria',
          body: `El mayor crecimiento se registró en <strong>${best.hour}</strong> (+${best.diff.toFixed(1)}% vs ${prevName}), mientras que la mayor caída ocurrió en <strong>${worst.hour}</strong> (${worst.diff.toFixed(1)}%). ${worst.diff < -20 ? 'Esta caída supera el umbral crítico del 20% y requiere revisión de causas operativas o de disponibilidad.' : 'La variación está dentro de rangos gestionables.'}`,
          status: worst.diff < -20 ? 'alert' : worst.diff < -10 ? 'warn' : 'info',
        });
      }

      // Horas con caída >15%
      const bigDrops = hourDiffs.filter(x => x.diff < -15);
      if (bigDrops.length > 0) {
        items.push({
          title: `${bigDrops.length} Hora${bigDrops.length > 1 ? 's' : ''} con Caída Significativa`,
          body: `Las franjas <strong>${bigDrops.map(d => d.hour).join(', ')}</strong> registraron decrecimientos superiores al 15% vs ${prevName}. Se recomienda revisar factores de afluencia en estas ventanas: competencia local, condiciones climáticas, eventos externos o problemas de servicio.`,
          status: 'alert',
        });
      }
    }

    return items;
  }, [currentRecord, prevRecord, hourValues, prevValues, total, prevTotal, totalGrowth, peakHour, valleyHour, cv, peakBlock, peakConcentration, hourDiffs]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <Minus className="w-3 h-3 text-slate-300" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3" style={{ color: MAGENTA }} /> : <ChevronUp className="w-3 h-3" style={{ color: MAGENTA }} />;
  };

  if (!currentRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <BarChart3 className="w-16 h-16 text-slate-200 mb-4" />
        <p className="text-slate-500 font-semibold">Sin datos disponibles para esta tienda</p>
        <button onClick={onBack} className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: MAGENTA }}>Volver</button>
      </div>
    );
  }

  const prevName = prevRecord
    ? `${MONTHS[(prevRecord.month || 1) - 1]} ${prevRecord.year}`
    : compareMode ? 'Período seleccionado' : 'Mes anterior';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">{storeCode}</h1>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{storeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Comparativo */}
            <button
              onClick={() => setCompareMode(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                compareMode ? 'text-white border-transparent' : 'border-pink-200 text-pink-600 bg-pink-50 hover:bg-pink-100'
              }`}
              style={compareMode ? { background: MAGENTA, borderColor: MAGENTA } : {}}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Comparar meses
            </button>

            {/* Selector período actual */}
            <select
              value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ''}
              onChange={e => { const [y, m] = e.target.value.split('-'); setSelectedPeriod({ year: parseInt(y), month: parseInt(m) }); }}
              className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none bg-white text-slate-900"
              style={{ borderColor: MAGENTA + '44' }}
            >
              {availableMonths.map(p => (
                <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                  {MONTHS[p.month - 1]} {p.year}
                </option>
              ))}
            </select>

            {/* Selector período comparado (solo en modo comparar) */}
            {compareMode && availableMonths.length > 1 && (
              <select
                value={comparePeriod ? `${comparePeriod.year}-${comparePeriod.month}` : ''}
                onChange={e => { const [y, m] = e.target.value.split('-'); setComparePeriod({ year: parseInt(y), month: parseInt(m) }); }}
                className="border-2 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none bg-white text-pink-700"
                style={{ borderColor: MAGENTA }}
              >
                {availableMonths.filter(p => !(p.year === selectedPeriod?.year && p.month === selectedPeriod?.month)).map(p => (
                  <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                    {MONTHS[p.month - 1]} {p.year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Transacciones Mes"
            value={total.toLocaleString('es-CO')}
            sub={`${MONTHS[(currentRecord.month || 1) - 1]} ${currentRecord.year}`}
            icon={Activity}
            delta={totalGrowth}
            deltaLabel={prevRecord ? `vs ${prevName}` : null}
            accentColor={MAGENTA}
            delay={0}
          />
          <KPICard
            label="Hora Pico"
            value={peakHour.label}
            sub={`${peakHour.value.toLocaleString('es-CO')} txn · ${peakConcentration.toFixed(1)}% del día`}
            icon={TrendingUp}
            delta={prevRecord ? ((peakHour.value - (prevValues[hourValues.indexOf(peakHour.value)] || 0)) / Math.max(1, prevValues[hourValues.indexOf(peakHour.value)]) * 100) : null}
            deltaLabel="vs mes anterior"
            accentColor="#10b981"
            delay={0.05}
          />
          <KPICard
            label="Hora Valle"
            value={valleyHour.label}
            sub={`${valleyHour.value.toLocaleString('es-CO')} txn · menor tráfico`}
            icon={TrendingDown}
            delta={null}
            accentColor="#ef4444"
            delay={0.1}
          />
          <KPICard
            label="Promedio por Hora"
            value={mean.toFixed(0)}
            sub="transacciones/hora activa"
            icon={BarChart3}
            delta={prevRecord ? (() => { const pm = getHourValues(prevRecord).filter(v=>v>0); const pmean = pm.length ? pm.reduce((s,v)=>s+v,0)/pm.length : 0; return pmean > 0 ? (mean - pmean) / pmean * 100 : null; })() : null}
            deltaLabel={prevRecord ? `vs ${prevName}` : null}
            accentColor="#3b82f6"
            delay={0.15}
          />
          <KPICard
            label="Bloque Productivo"
            value={`${peakBlock.label1}–${peakBlock.label2}`}
            sub={`${peakBlock.pct.toFixed(1)}% de la demanda diaria`}
            icon={Target}
            delta={null}
            accentColor="#f59e0b"
            delay={0.2}
          />
          <KPICard
            label="Concentración"
            value={`${cv.toFixed(1)}%`}
            sub={cv > 45 ? 'Demanda muy concentrada' : cv > 28 ? 'Variabilidad moderada' : 'Distribución uniforme'}
            icon={Zap}
            delta={null}
            accentColor={cv > 45 ? '#ef4444' : cv > 28 ? '#f59e0b' : '#10b981'}
            delay={0.25}
          />
        </div>

        {/* Gráfica 1: Distribución horaria */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-black text-slate-900 text-base">Distribución de Transacciones por Hora</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {MONTHS[(currentRecord.month||1)-1]} {currentRecord.year} · Promedio: <strong>{mean.toFixed(0)} txn/h</strong> · Total: <strong>{total.toLocaleString('es-CO')} txn</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: MAGENTA }} /> Alto</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-pink-200" /> Normal</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-200" /> Bajo</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MAGENTA} stopOpacity={1} />
                  <stop offset="100%" stopColor={MAGENTA_DARK} stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip mean={mean} total={total} />} cursor={{ fill: '#f9fafb' }} />
              <ReferenceLine y={mean} stroke={MAGENTA_LIGHT} strokeDasharray="6 3"
                label={{ value: `Prom. ${mean.toFixed(0)}`, position: 'insideTopRight', fontSize: 10, fill: MAGENTA }} />
              <Bar dataKey="transactions" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={800}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica 2: Comparativo premium */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900 text-base">
                Análisis Comparativo de Demanda Horaria
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold" style={{ color: MAGENTA }}>{MONTHS[(currentRecord.month||1)-1]} {currentRecord.year}</span>
                {' '} vs {' '}
                <span className="font-semibold text-slate-500">{prevName}</span>
                {totalGrowth !== null && (
                  <span className={`ml-2 font-black ${totalGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(1)}% en total
                  </span>
                )}
              </p>
            </div>
          </div>

          {!prevRecord ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <GitCompare className="w-12 h-12 mb-3" />
              <p className="text-sm text-slate-400">
                {compareMode ? 'Selecciona un período para comparar' : 'Sin datos del mes anterior para comparar'}
              </p>
            </div>
          ) : (
            <>
              {/* Chips de variación por hora */}
              <div className="flex gap-1.5 flex-wrap mb-5">
                {lineData.map((d, i) => d.diff !== null && (
                  <div key={i} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${
                    d.diff >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
                  }`}>
                    {d.diff >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    {d.hour} {d.diff >= 0 ? '+' : ''}{d.diff.toFixed(1)}%
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={MAGENTA} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={MAGENTA} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<LineTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                    formatter={(value) => <span style={{ color: value === 'Actual' ? MAGENTA : '#94a3b8' }}>{value}</span>}
                  />
                  <Area type="monotone" dataKey="current" fill="url(#currentGrad)" stroke="none" />
                  <Line type="monotone" dataKey="current" name="Actual" stroke={MAGENTA} strokeWidth={3}
                    dot={{ r: 5, fill: MAGENTA, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, stroke: MAGENTA, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="previous" name={prevName} stroke="#cbd5e1" strokeWidth={2}
                    strokeDasharray="6 3" dot={{ r: 3, fill: '#cbd5e1' }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Gráfica 3: Tendencia histórica */}
        {trendData.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="font-black text-slate-900 text-base">Tendencia Histórica de Transacciones</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evolución mensual de la demanda total · {trendData.length} meses de datos
                {trendData.length >= 2 && (() => {
                  const first = trendData[0].total;
                  const last = trendData[trendData.length - 1].total;
                  const g = first > 0 ? ((last - first) / first * 100) : null;
                  return g !== null ? (
                    <span className={`ml-2 font-bold ${g >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {g >= 0 ? '+' : ''}{g.toFixed(1)}% acumulado
                    </span>
                  ) : null;
                })()}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={MAGENTA} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={MAGENTA} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrendTooltip />} />
                <Area type="monotone" dataKey="total" stroke={MAGENTA} strokeWidth={3}
                  fill="url(#trendGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isSelected = payload.month === selectedPeriod?.month && payload.year === selectedPeriod?.year;
                    return (
                      <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={isSelected ? 7 : 4}
                        fill={isSelected ? MAGENTA : '#fff'} stroke={MAGENTA} strokeWidth={2} />
                    );
                  }}
                  activeDot={{ r: 7, fill: MAGENTA, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            {/* Explicación de tendencia */}
            {trendData.length >= 2 && (() => {
              const vals = trendData.map(d => d.total).filter(v => v > 0);
              const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
              const last = vals[vals.length - 1];
              const isAboveAvg = last > avg;
              return (
                <div className={`mt-4 rounded-xl px-4 py-3 text-xs border ${isAboveAvg ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                  <strong>{isAboveAvg ? '↑ Mes actual por encima del promedio histórico' : '↓ Mes actual por debajo del promedio histórico'}</strong>
                  {' · '}Promedio histórico: <strong>{Math.round(avg).toLocaleString('es-CO')} txn/mes</strong>
                  {' · '}Período analizado: <strong>{trendData.length} meses</strong>
                </div>
              );
            })()}
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-black text-slate-900 text-base">Análisis de Gestión</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: MAGENTA }}>
              {insights.length} indicadores
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <InsightCard key={i} {...ins} delay={i * 0.06} />
            ))}
          </div>
        </div>

        {/* Ranking Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="font-black text-slate-900 text-base mb-4">Ranking de Franjas Horarias</h2>
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr style={{ background: MAGENTA_PALE }}>
                <th className="text-left py-3 px-4 font-bold text-xs rounded-l-xl" style={{ color: MAGENTA_DARK }}>Hora</th>
                {[
                  { key: 'transactions', label: 'Transacciones' },
                  { key: 'pctTotal', label: '% del Total' },
                  { key: 'vsPrev', label: `vs ${prevName}` },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className="text-right py-3 px-4 font-bold text-xs cursor-pointer select-none hover:opacity-80"
                    style={{ color: MAGENTA_DARK }}>
                    <span className="flex items-center justify-end gap-1">{col.label} <SortIcon k={col.key} /></span>
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
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      row.label === 'Alto' ? 'text-white' : row.label === 'Normal' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'
                    }`} style={row.label === 'Alto' ? { background: MAGENTA } : {}}>
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
  );
}