import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, BarChart3, AlertTriangle, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell
} from 'recharts';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const HOUR_LABELS = HOURS.map(h => h <= 12 ? `${h}am` : `${h === 12 ? 12 : h - 12}pm`);

function getHourValues(rec) {
  return HOURS.map(h => Math.max(0, rec?.[`hour_${h}`] || 0));
}

function stdDev(values) {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function getColor(val, mean, sd) {
  if (val >= mean + sd) return '#22c55e'; // green
  if (val >= mean) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

function getLabel(val, mean, sd) {
  if (val >= mean + sd) return 'Pico';
  if (val >= mean) return 'Normal';
  return 'Bajo';
}

const CustomBarTooltip = ({ active, payload, label, mean, total }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value || 0;
  const pctVsAvg = mean > 0 ? ((val - mean) / mean * 100) : 0;
  const pctOfDay = total > 0 ? (val / total * 100) : 0;
  const sd = payload[0]?.payload?.sd || 0;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs min-w-[160px]">
      <p className="font-bold text-slate-300 mb-1">{label}</p>
      <p className="text-lg font-black text-white">{val.toLocaleString()} txn</p>
      <p className={`mt-1 font-semibold ${pctVsAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {pctVsAvg >= 0 ? '+' : ''}{pctVsAvg.toFixed(1)}% vs promedio
      </p>
      <p className="text-slate-400 mt-0.5">{pctOfDay.toFixed(1)}% del día</p>
      <p className={`mt-1 font-bold ${payload[0]?.fill === '#22c55e' ? 'text-emerald-400' : payload[0]?.fill === '#f59e0b' ? 'text-yellow-400' : 'text-red-400'}`}>
        {getLabel(val, mean, sd)}
      </p>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.dataKey === 'current')?.value;
  const prev = payload.find(p => p.dataKey === 'previous')?.value;
  const diff = (curr != null && prev != null && prev > 0) ? ((curr - prev) / prev * 100) : null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs min-w-[180px]">
      <p className="font-bold text-slate-300 mb-2">{label}</p>
      {curr != null && <p className="text-emerald-400">Actual: <span className="font-black text-white">{curr.toLocaleString()}</span></p>}
      {prev != null && <p className="text-blue-300">Anterior: <span className="font-black text-white">{prev.toLocaleString()}</span></p>}
      {diff != null && (
        <p className={`mt-1 font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
        </p>
      )}
    </div>
  );
};

export default function StoreHourlyView({ storeCode, storeName, allRecords, onBack }) {
  const availableMonths = useMemo(() => {
    return [...new Set(allRecords.map(r => `${Math.round(r.year)}-${Math.round(r.month)}`))]
      .map(key => {
        const [y, m] = key.split('-');
        return { year: parseInt(y), month: parseInt(m) };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [allRecords]);

  const [selectedPeriod, setSelectedPeriod] = useState(availableMonths[0] || null);
  const [sortKey, setSortKey] = useState('transactions');
  const [sortDir, setSortDir] = useState('desc');

  // Actualizar selectedPeriod cuando llegan los datos (allRecords puede llegar tarde)
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedPeriod) {
      setSelectedPeriod(availableMonths[0]);
    }
  }, [availableMonths]);

  const currentRecord = useMemo(() => {
    if (!selectedPeriod) return null;
    return allRecords.find(r => Math.round(r.month) === selectedPeriod.month && Math.round(r.year) === selectedPeriod.year) || null;
  }, [allRecords, selectedPeriod]);

  const prevRecord = useMemo(() => {
    if (!selectedPeriod) return null;
    let prevMonth = selectedPeriod.month - 1;
    let prevYear = selectedPeriod.year;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    return allRecords.find(r => Math.round(r.month) === prevMonth && Math.round(r.year) === prevYear) || null;
  }, [allRecords, selectedPeriod]);

  const hourValues = useMemo(() => getHourValues(currentRecord), [currentRecord]);
  const prevValues = useMemo(() => getHourValues(prevRecord), [prevRecord]);

  const mean = useMemo(() => {
    const active = hourValues.filter(v => v > 0);
    if (!active.length) return 0;
    return active.reduce((s, v) => s + v, 0) / active.length;
  }, [hourValues]);

  const sd = useMemo(() => stdDev(hourValues.filter(v => v > 0)), [hourValues]);

  const total = useMemo(() => hourValues.reduce((s, v) => s + v, 0), [hourValues]);

  const peakHour = useMemo(() => {
    const max = Math.max(...hourValues);
    return { hour: HOURS[hourValues.indexOf(max)], value: max, label: HOUR_LABELS[hourValues.indexOf(max)] };
  }, [hourValues]);

  const valleyHour = useMemo(() => {
    const active = hourValues.map((v, i) => ({ v, i })).filter(x => x.v > 0);
    if (!active.length) return { hour: 0, value: 0, label: '—' };
    const min = Math.min(...active.map(x => x.v));
    const idx = active.find(x => x.v === min).i;
    return { hour: HOURS[idx], value: min, label: HOUR_LABELS[idx] };
  }, [hourValues]);

  const cv = useMemo(() => mean > 0 ? (sd / mean * 100) : 0, [sd, mean]);
  const peakConcentration = useMemo(() => total > 0 ? (peakHour.value / total * 100) : 0, [peakHour, total]);

  // Bar chart data
  const barData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    transactions: hourValues[i],
    color: getColor(hourValues[i], mean, sd),
    sd,
    mean,
  }));

  // Line chart data (compare)
  const lineData = HOURS.map((h, i) => ({
    hour: HOUR_LABELS[i],
    current: hourValues[i] || null,
    previous: prevValues[i] || null,
    diff: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
  }));

  // Ranking table
  const rankingData = useMemo(() => {
    return HOURS.map((h, i) => ({
      hour: HOUR_LABELS[i],
      hourNum: h,
      transactions: hourValues[i],
      pctTotal: total > 0 ? (hourValues[i] / total * 100) : 0,
      vsPrev: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
      color: getColor(hourValues[i], mean, sd),
      label: getLabel(hourValues[i], mean, sd),
    }));
  }, [hourValues, prevValues, total, mean, sd]);

  const sortedRanking = useMemo(() => {
    return [...rankingData].sort((a, b) => {
      let va = a[sortKey === 'transactions' ? 'transactions' : sortKey === 'pctTotal' ? 'pctTotal' : sortKey === 'vsPrev' ? (a.vsPrev ?? -Infinity) : 0];
      let vb = b[sortKey === 'transactions' ? 'transactions' : sortKey === 'pctTotal' ? 'pctTotal' : sortKey === 'vsPrev' ? (b.vsPrev ?? -Infinity) : 0];
      if (sortKey === 'vsPrev') { va = a.vsPrev ?? -Infinity; vb = b.vsPrev ?? -Infinity; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [rankingData, sortKey, sortDir]);

  // Insights
  const insights = useMemo(() => {
    if (!currentRecord) return [];
    const items = [];

    items.push(`🕐 Tu hora pico es las <strong>${peakHour.label}</strong> con <strong>${peakHour.value.toLocaleString()}</strong> transacciones, representando el <strong>${peakConcentration.toFixed(1)}%</strong> del día.`);

    // Top block (3 consecutive peak hours)
    let maxBlockSum = 0;
    let maxBlockStart = 0;
    for (let s = 0; s <= HOURS.length - 3; s++) {
      const sum = hourValues[s] + hourValues[s + 1] + hourValues[s + 2];
      if (sum > maxBlockSum) { maxBlockSum = sum; maxBlockStart = s; }
    }
    const blockPct = total > 0 ? (maxBlockSum / total * 100).toFixed(1) : '0';
    const blockLabel1 = HOUR_LABELS[maxBlockStart];
    const blockLabel2 = HOUR_LABELS[maxBlockStart + 2];
    items.push(`📊 Las horas de <strong>${blockLabel1}</strong> a <strong>${blockLabel2}</strong> concentran el <strong>${blockPct}%</strong> de tus transacciones — considera reforzar el equipo en este bloque.`);

    items.push(`🌙 Tu hora de menor tráfico es <strong>${valleyHour.label}</strong> — ideal para operaciones internas o capacitaciones.`);

    if (cv > 40) {
      items.push(`⚠️ Tu demanda está muy concentrada en pocos horarios (CV: <strong>${cv.toFixed(1)}%</strong>) — hay riesgo de cuellos de botella en horas pico.`);
    } else {
      items.push(`✅ Tu demanda es relativamente uniforme (CV: <strong>${cv.toFixed(1)}%</strong>) — distribución horaria equilibrada.`);
    }

    if (prevRecord) {
      const prevTotal = prevValues.reduce((s, v) => s + v, 0);
      const totalGrowth = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100) : null;
      if (totalGrowth !== null) {
        items.push(`📈 Crecimiento general vs mes anterior: <strong>${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}%</strong> (${total.toLocaleString()} vs ${prevTotal.toLocaleString()} txn).`);
      }

      // Best and worst hour vs prev
      const diffs = HOURS.map((h, i) => ({
        i, hour: HOUR_LABELS[i],
        diff: (prevValues[i] > 0 && hourValues[i] > 0) ? ((hourValues[i] - prevValues[i]) / prevValues[i] * 100) : null,
      })).filter(x => x.diff !== null);

      const best = [...diffs].sort((a, b) => b.diff - a.diff)[0];
      const worst = [...diffs].sort((a, b) => a.diff - b.diff)[0];

      if (best && worst) {
        items.push(`🔍 Creciste <strong>${best.diff.toFixed(1)}%</strong> en <strong>${best.hour}</strong> y caíste <strong>${Math.abs(worst.diff).toFixed(1)}%</strong> en <strong>${worst.hour}</strong> vs mes anterior.`);
      }

      // Alert: hours down >15%
      const bigDrops = diffs.filter(x => x.diff < -15);
      bigDrops.forEach(d => {
        items.push(`🚨 Alerta: la hora <strong>${d.hour}</strong> cayó un <strong>${Math.abs(d.diff).toFixed(1)}%</strong> vs el mes pasado.`);
      });
    } else {
      items.push(`ℹ️ No hay datos del mes anterior para comparar.`);
    }

    return items;
  }, [currentRecord, prevRecord, hourValues, prevValues, peakHour, valleyHour, cv, total, peakConcentration]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <Minus className="w-3 h-3 text-slate-300" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-slate-900" /> : <ChevronUp className="w-3 h-3 text-slate-900" />;
  };

  if (!currentRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <BarChart3 className="w-16 h-16 text-slate-200 mb-4" />
        <p className="text-slate-500">Sin datos disponibles para esta tienda</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">{storeCode}</h1>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{storeName}</p>
            </div>
          </div>
          {/* Month Selector */}
          <select
            value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ''}
            onChange={e => {
              const [y, m] = e.target.value.split('-');
              setSelectedPeriod({ year: parseInt(y), month: parseInt(m) });
            }}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-slate-900 bg-white"
          >
            {availableMonths.map(p => (
              <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                {MONTHS[p.month - 1]} {p.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Mes', value: total.toLocaleString('es-CO'), sub: 'transacciones', icon: Activity, color: 'bg-slate-900 text-white', textColor: 'text-white', subColor: 'text-slate-300' },
            { label: 'Hora Pico', value: peakHour.label, sub: `${peakHour.value.toLocaleString()} txn`, icon: TrendingUp, color: 'bg-emerald-500 text-white', textColor: 'text-white', subColor: 'text-emerald-100' },
            { label: 'Hora Valle', value: valleyHour.label, sub: `${valleyHour.value.toLocaleString()} txn`, icon: TrendingDown, color: 'bg-red-50 text-red-700 border border-red-200', textColor: 'text-red-700', subColor: 'text-red-400' },
            { label: 'Promedio/Hora', value: mean.toFixed(1), sub: 'transacciones', icon: BarChart3, color: 'bg-blue-50 text-blue-700 border border-blue-200', textColor: 'text-blue-700', subColor: 'text-blue-400' },
            { label: 'Coef. Variación', value: `${cv.toFixed(1)}%`, sub: cv > 40 ? 'Muy concentrado' : cv > 25 ? 'Moderado' : 'Uniforme', icon: Activity, color: cv > 40 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-50 border border-slate-200', textColor: cv > 40 ? 'text-orange-700' : 'text-slate-700', subColor: cv > 40 ? 'text-orange-400' : 'text-slate-400' },
            { label: 'Conc. Pico', value: `${peakConcentration.toFixed(1)}%`, sub: 'del total del día', icon: Clock, color: 'bg-slate-50 border border-slate-200', textColor: 'text-slate-700', subColor: 'text-slate-400' },
          ].map(({ label, value, sub, icon: Icon, color, textColor, subColor }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl p-4 ${color}`}
            >
              <p className={`text-xs font-semibold mb-1 ${subColor}`}>{label}</p>
              <p className={`text-xl font-black ${textColor}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-black text-slate-900 mb-1">Transacciones por Hora</h2>
          <p className="text-xs text-slate-500 mb-5">
            🟢 Hora pico &nbsp;|&nbsp; 🟡 Normal &nbsp;|&nbsp; 🔴 Bajo rendimiento
            &nbsp;·&nbsp; Promedio: <strong>{mean.toFixed(1)}</strong> txn/h
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomBarTooltip mean={mean} total={total} />} />
              <ReferenceLine y={mean} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: 'Prom.', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="transactions" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={700}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-black text-slate-900 mb-1">Comparativo vs Mes Anterior</h2>
          {!prevRecord ? (
            <p className="text-slate-400 text-sm py-8 text-center">No hay datos del mes anterior disponibles.</p>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-2">
                Actual: <strong>{MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}</strong> &nbsp;vs&nbsp;
                Anterior: <strong>{MONTHS[(selectedPeriod.month <= 1 ? 12 : selectedPeriod.month - 1) - 1]} {selectedPeriod.month <= 1 ? selectedPeriod.year - 1 : selectedPeriod.year}</strong>
              </p>
              {/* Diff indicators */}
              <div className="flex gap-1 flex-wrap mb-4">
                {lineData.map((d, i) => (
                  d.diff !== null && (
                    <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      d.diff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {d.hour}: {d.diff >= 0 ? '+' : ''}{d.diff.toFixed(1)}%
                    </span>
                  )
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="current" name="Actual" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 4, fill: '#0f172a' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="previous" name="Mes anterior" stroke="#93c5fd" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#93c5fd' }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-black text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" /> Insights Automáticos
          </h2>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white/8 rounded-xl px-4 py-3 text-sm text-slate-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ins }}
              />
            ))}
          </div>
        </div>

        {/* Ranking Table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
          <h2 className="font-black text-slate-900 mb-4">Ranking de Horas</h2>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 rounded-xl">
                <th className="text-left py-3 px-4 font-bold text-slate-600 text-xs">Hora</th>
                {[
                  { key: 'transactions', label: 'Transacciones' },
                  { key: 'pctTotal', label: '% del Total' },
                  { key: 'vsPrev', label: 'vs Mes Ant.' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-right py-3 px-4 font-bold text-slate-600 text-xs cursor-pointer hover:text-slate-900 select-none"
                  >
                    <span className="flex items-center justify-end gap-1">
                      {col.label} <SortIcon k={col.key} />
                    </span>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-bold text-slate-600 text-xs">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {sortedRanking.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{row.hour}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">{row.transactions.toLocaleString('es-CO')}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{row.pctTotal.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">
                    {row.vsPrev !== null ? (
                      <span className={`font-bold ${row.vsPrev >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.vsPrev >= 0 ? '+' : ''}{row.vsPrev.toFixed(1)}%
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      row.color === '#22c55e' ? 'bg-emerald-100 text-emerald-700' :
                      row.color === '#f59e0b' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ background: row.color }} />
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