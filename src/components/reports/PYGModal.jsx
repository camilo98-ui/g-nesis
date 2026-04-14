import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart3, Zap,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend, PieChart, Pie
} from 'recharts';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const pctNum = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;
const fmt = (v) => v != null ? `${pctNum(v).toFixed(1)}%` : '—';

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const upper = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const bta = upper.match(/\bBTA\s*(\d+)/);  if (bta) return `BTA ${bta[1]}`;
  const tunja = upper.match(/\bTUNJA\s*(\d+)/); if (tunja) return `TUNJA ${tunja[1]}`;
  const bog = upper.match(/\bBOGOTA\s*(\d+)/); if (bog) return `BOGOTA ${bog[1]}`;
  return String(storeId).toUpperCase().trim();
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-1">
      <p className="font-bold text-pink-300">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(2)}%</p>)}
    </div>
  );
};

// Insight Card
function InsightCard({ title, value, prev, trend, icon: Icon, color, inverse = false }) {
  const improved = trend > 0 ? (inverse ? false : true) : (inverse ? true : false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border-2 ${color.border} ${color.bg}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-bold ${color.label}`}>{title}</p>
          <p className={`text-2xl font-black ${color.text} mt-1`}>{value}</p>
          {prev && <p className={`text-xs ${color.muted} mt-1`}>Anterior: {prev}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.icon}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend != null && (
        <div className={`mt-3 flex items-center gap-1 text-sm font-bold ${improved ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend > 0 ? '+' : ''}{trend.toFixed(2)}pp
        </div>
      )}
    </motion.div>
  );
}

export default function PYGModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-modal', storeCode, currentYear],
    queryFn: async () => {
      if (!storeCode) return [];
      const all = await base44.entities.PYGReport.filter({ year: currentYear });
      return all.filter(r => String(r.store_code || '').trim().toUpperCase() === storeCode.toUpperCase());
    },
    enabled: !!storeCode,
  });

  // Detectar el último mes con datos
  const lastMonthWithData = useMemo(() => {
    if (allRecords.length === 0) return null;
    return Math.max(...allRecords.map(r => r.month));
  }, [allRecords]);

  const [selectedMonths, setSelectedMonths] = useState(() => [lastMonthWithData || 1]);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  const primaryMonth = selectedMonths[selectedMonths.length - 1];
  const primaryRecord = allRecords.find(r => r.month === primaryMonth) || null;
  const prevMonth = primaryMonth > 1 ? primaryMonth - 1 : null;
  const prevRecord = prevMonth ? allRecords.find(r => r.month === prevMonth) : null;

  const toggleMonth = (m) => {
    setSelectedMonths(prev =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter(x => x !== m) : prev
        : [...prev, m].sort((a, b) => a - b)
    );
  };

  const trendData = useMemo(() =>
    MONTHS_SHORT.map((m, i) => {
      const rec = allRecords.find(r => r.month === i + 1);
      if (!rec) return null;
      return {
        mes: m, month: i + 1,
        EBITDA: pctNum(rec.margen_ebitda),
        'C.Real': pctNum(rec.cost_real),
        'C.Teo': pctNum(rec.cost_teorico),
        Personal: pctNum(rec.costo_personal),
        Gastos: pctNum(rec.gastos_pct_venta),
      };
    }).filter(Boolean),
    [allRecords]
  );

  const gasteosData = useMemo(() => {
    if (!primaryRecord) return [];
    return [
      { name: 'Costo Personal', value: pctNum(primaryRecord.costo_personal), color: '#db2777' },
      { name: 'Arriendos', value: pctNum(primaryRecord.arriendos), color: '#9333ea' },
      { name: 'Gastos %', value: pctNum(primaryRecord.gastos_pct_venta), color: '#e11d48' },
      { name: 'Otros', value: Math.max(0, 100 - pctNum(primaryRecord.costo_personal) - pctNum(primaryRecord.arriendos) - pctNum(primaryRecord.gastos_pct_venta)), color: '#f97316' },
    ].filter(d => d.value > 0);
  }, [primaryRecord]);

  const otrosGastos = useMemo(() => {
    if (!primaryRecord?.otros_gastos) return [];
    try {
      return Object.entries(JSON.parse(primaryRecord.otros_gastos))
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ name: k, value: pctNum(v) }));
    } catch { return []; }
  }, [primaryRecord]);

  const insights = useMemo(() => {
    if (!primaryRecord) return [];
    const insights = [];
    const ebitda = pctNum(primaryRecord.margen_ebitda);
    const costReal = pctNum(primaryRecord.cost_real);
    const costTeorico = pctNum(primaryRecord.cost_teorico);
    const personal = pctNum(primaryRecord.costo_personal);
    const gastos = pctNum(primaryRecord.gastos_pct_venta);

    if (ebitda >= 30) insights.push({ type: 'success', text: `Margen EBITDA excelente (${ebitda.toFixed(1)}%) - Rentabilidad muy saludable 💚` });
    else if (ebitda >= 20) insights.push({ type: 'info', text: `Margen EBITDA moderado (${ebitda.toFixed(1)}%) - Dentro de rango esperado` });
    else insights.push({ type: 'warning', text: `Margen EBITDA bajo (${ebitda.toFixed(1)}%) - Requiere atención inmediata ⚠️` });

    if (costReal <= costTeorico) insights.push({ type: 'success', text: `Costo Real bajo ${(costTeorico - costReal).toFixed(2)}pp vs teórico - Excelente control 🎯` });
    else insights.push({ type: 'warning', text: `Costo Real supera teórico en ${(costReal - costTeorico).toFixed(2)}pp - Revisar ineficiencias` });

    if (personal <= 20) insights.push({ type: 'success', text: `Costo Personal optimizado (${personal.toFixed(1)}%) - Buena productividad 📊` });
    else if (personal <= 25) insights.push({ type: 'info', text: `Costo Personal normal (${personal.toFixed(1)}%)` });
    else insights.push({ type: 'warning', text: `Costo Personal alto (${personal.toFixed(1)}%) - Considerar optimización` });

    if (gastos <= 40) insights.push({ type: 'success', text: `Gastos operacionales controlados (${gastos.toFixed(1)}%) - Buena gestión` });
    else insights.push({ type: 'warning', text: `Gastos operacionales elevados (${gastos.toFixed(1)}%) - Oportunidad de mejora` });

    return insights;
  }, [primaryRecord]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-rose-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-2xl">P&G Dashboard</h1>
                <p className="text-white/70 text-xs">{storeCode || 'Tienda'} · {selectedMonths.length === 1 ? MONTHS_FULL[primaryMonth - 1] : `Comparativo: ${selectedMonths.map(m => MONTHS_SHORT[m - 1]).join(' vs ')}`}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            >
              {selectedMonths.length === 1 ? '📅' : '📊'} {selectedMonths.map(m => MONTHS_SHORT[m - 1]).join(', ')}
              <ChevronDown className={`w-4 h-4 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {monthDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-pink-100 z-20 min-w-max p-3 grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((m, i) => {
                  const hasData = allRecords.some(r => r.month === i + 1);
                  const active = selectedMonths.includes(i + 1);
                  return (
                    <button
                      key={i}
                      onClick={() => hasData && toggleMonth(i + 1)}
                      disabled={!hasData}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? 'bg-pink-600 text-white shadow-md'
                          : hasData
                          ? 'bg-pink-50 text-slate-700 hover:bg-pink-100'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-5 py-6 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : !primaryRecord ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <BarChart3 className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-slate-600 text-xl">Sin datos para {MONTHS_FULL[primaryMonth - 1]}</p>
          </div>
        ) : (
          <>
            {/* KPIs principales */}
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-600" /> Indicadores Clave
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InsightCard
                  title="Margen EBITDA"
                  value={fmt(primaryRecord.margen_ebitda)}
                  prev={prevRecord ? fmt(prevRecord.margen_ebitda) : null}
                  trend={prevRecord ? pctNum(primaryRecord.margen_ebitda) - pctNum(prevRecord.margen_ebitda) : null}
                  icon={TrendingUp}
                  color={{ border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', label: 'text-pink-500', muted: 'text-pink-400', icon: 'bg-pink-600' }}
                />
                <InsightCard
                  title="Costo Personal"
                  value={fmt(primaryRecord.costo_personal)}
                  prev={prevRecord ? fmt(prevRecord.costo_personal) : null}
                  trend={prevRecord ? pctNum(primaryRecord.costo_personal) - pctNum(prevRecord.costo_personal) : null}
                  icon={BarChart3}
                  color={{ border: 'border-fuchsia-200', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', label: 'text-fuchsia-500', muted: 'text-fuchsia-400', icon: 'bg-fuchsia-600' }}
                  inverse
                />
                <InsightCard
                  title="Costo Real"
                  value={fmt(primaryRecord.cost_real)}
                  prev={prevRecord ? fmt(prevRecord.cost_real) : null}
                  trend={prevRecord ? pctNum(primaryRecord.cost_real) - pctNum(prevRecord.cost_real) : null}
                  icon={TrendingDown}
                  color={{ border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', label: 'text-blue-500', muted: 'text-blue-400', icon: 'bg-blue-600' }}
                  inverse
                />
                <InsightCard
                  title="Gastos % Venta"
                  value={fmt(primaryRecord.gastos_pct_venta)}
                  prev={prevRecord ? fmt(prevRecord.gastos_pct_venta) : null}
                  trend={prevRecord ? pctNum(primaryRecord.gastos_pct_venta) - pctNum(prevRecord.gastos_pct_venta) : null}
                  icon={AlertCircle}
                  color={{ border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-600', label: 'text-rose-500', muted: 'text-rose-400', icon: 'bg-rose-600' }}
                  inverse
                />
              </div>
            </div>

            {/* Insights analíticos */}
            {insights.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">💡</span> Análisis & Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${
                        insight.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        insight.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span>{insight.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Gráficas principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolución EBITDA */}
              {trendData.length >= 2 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-black text-slate-800 mb-4">Evolución EBITDA</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="EBITDA" stroke="#db2777" strokeWidth={3} dot={{ fill: '#db2777', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Pie Chart Gastos */}
              {gasteosData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-black text-slate-800 mb-4">Distribución de Gastos</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={gasteosData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={{ fontSize: 10 }}>
                        {gasteosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Costo Real vs Teórico */}
              {trendData.length >= 2 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-black text-slate-800 mb-4">Costo Real vs Teórico</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="C.Real" fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="C.Teo" fill="#94a3b8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Comparación de métricas */}
              {trendData.length >= 2 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-black text-slate-800 mb-4">Todas las Métricas</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="EBITDA" stroke="#db2777" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="C.Real" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Personal" stroke="#9333ea" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* Tabla desglose completo */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <h3 className="font-black text-slate-800 mb-4">Desglose Completo de Gastos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: 'Costo Personal', value: primaryRecord.costo_personal, prev: prevRecord?.costo_personal },
                      { label: 'Arriendos', value: primaryRecord.arriendos, prev: prevRecord?.arriendos },
                      { label: 'Servicios Públicos', value: primaryRecord.servicios_publicos, prev: prevRecord?.servicios_publicos },
                      { label: 'Administración', value: primaryRecord.administracion, prev: prevRecord?.administracion },
                      { label: 'Impuestos', value: primaryRecord.impuestos, prev: prevRecord?.impuestos },
                    ].filter(r => r.value != null).map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-pink-50/50">
                        <td className="py-3 text-slate-700 font-medium">{row.label}</td>
                        <td className="py-3 text-right">
                          <span className="font-black text-slate-800">{fmt(row.value)}</span>
                          {row.prev && <span className="text-slate-400 ml-2 text-xs">({fmt(row.prev)})</span>}
                        </td>
                        {row.prev && (
                          <td className="py-3 text-right text-xs font-bold">
                            <span className={pctNum(row.value) <= pctNum(row.prev) ? 'text-emerald-600' : 'text-red-500'}>
                              {(pctNum(row.value) - pctNum(row.prev)).toFixed(2)}pp
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Otros gastos */}
            {otrosGastos.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <h3 className="font-black text-slate-800 mb-4">Otros Gastos Detalllados</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {otrosGastos.map(({ name, value }) => (
                    <div key={name} className="bg-gradient-to-br from-slate-50 to-pink-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-600 font-medium truncate">{name}</p>
                      <p className="text-lg font-black text-slate-800 mt-1">{value.toFixed(3)}%</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Comparativo multi-mes */}
            {selectedMonths.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <h3 className="font-black text-slate-800 mb-4">Tabla Comparativa</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-pink-200">
                        <th className="text-left py-3 font-black">Métrica</th>
                        {selectedMonths.map(m => <th key={m} className="text-right py-3 font-black text-pink-600 px-3">{MONTHS_SHORT[m - 1]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {['margen_ebitda', 'cost_real', 'cost_teorico', 'costo_personal', 'gastos_pct_venta', 'arriendos'].map(key => {
                        const labels = { margen_ebitda: 'EBITDA', cost_real: 'Costo Real', cost_teorico: 'Costo Teórico', costo_personal: 'Personal', gastos_pct_venta: 'Gastos %', arriendos: 'Arriendos' };
                        return (
                          <tr key={key} className="border-b border-slate-100 hover:bg-pink-50/30">
                            <td className="py-2.5 font-medium text-slate-700">{labels[key]}</td>
                            {selectedMonths.map(m => {
                              const rec = allRecords.find(r => r.month === m);
                              return <td key={m} className="py-2.5 text-right px-3 font-black text-slate-800">{fmt(rec?.[key])}</td>;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}