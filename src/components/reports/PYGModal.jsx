import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronUp,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus, Calendar, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts';

const MONTHS = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic'
];
const MONTHS_FULL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
const pctNum = (v) => v != null ? parseFloat((v * 100).toFixed(2)) : null;

function extractStoreCode(storeId) {
  if (!storeId) return null;
  const upper = String(storeId).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const bta = upper.match(/\bBTA\s*(\d+)/);
  if (bta) return `BTA ${bta[1]}`;
  const tunja = upper.match(/\bTUNJA\s*(\d+)/);
  if (tunja) return `TUNJA ${tunja[1]}`;
  const bogota = upper.match(/\bBOGOTA\s*(\d+)/);
  if (bogota) return `BOGOTA ${bogota[1]}`;
  const bog = upper.match(/\bBOG\s*(\d+)/);
  if (bog) return `BOGOTA ${bog[1]}`;
  return storeId;
}

// Tarjeta KPI principal
function KPICard({ label, value, prevValue, color, bg, icon: Icon, inverse = false, delay = 0 }) {
  const valNum = pctNum(value);
  const prevNum = pctNum(prevValue);
  const diff = (valNum != null && prevNum != null) ? (valNum - prevNum) : null;
  const improved = diff != null ? (inverse ? diff < 0 : diff > 0) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${bg} rounded-2xl p-5 relative overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-white/30`}>
          <Icon className="w-5 h-5" />
        </div>
        {diff != null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            improved ? 'bg-white/30 text-white' : 'bg-white/20 text-white/80'
          }`}>
            {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : diff < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp
          </div>
        )}
      </div>
      <p className="text-white/70 text-xs font-medium mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{valNum != null ? `${valNum}%` : '—'}</p>
      {prevNum != null && (
        <p className="text-white/60 text-xs mt-1">Anterior: {prevNum}%</p>
      )}
    </motion.div>
  );
}

// Barra comparativa simple
function CompareBar({ label, value, refValue, color, delay = 0 }) {
  const v = pctNum(value);
  const r = pctNum(refValue);
  if (v == null) return null;
  const max = Math.max(v || 0, r || 0, 5);
  const width = Math.min((v / max) * 100, 100);
  const refWidth = r != null ? Math.min((r / max) * 100, 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {r != null && <span className="text-xs text-slate-400">{r.toFixed(1)}%</span>}
          <span className={`text-sm font-black ${color}`}>{v.toFixed(1)}%</span>
        </div>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        {refWidth != null && (
          <div
            className="absolute h-full rounded-full bg-slate-300 opacity-60"
            style={{ width: `${refWidth}%` }}
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.7, delay }}
          className={`absolute h-full rounded-full ${color.replace('text-', 'bg-')}`}
        />
      </div>
    </motion.div>
  );
}

// Pill de mes seleccionable
function MonthPill({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        selected
          ? 'bg-emerald-600 text-white shadow-md'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}%</p>
      ))}
    </div>
  );
};

export default function PYGModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentYear = now.getFullYear();

  // Meses seleccionados para comparativo (por defecto el mes actual)
  const [selectedMonths, setSelectedMonths] = useState([now.getMonth() + 1]);
  const [year, setYear] = useState(currentYear);

  const toggleMonth = (m) => {
    setSelectedMonths(prev =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter(x => x !== m) : prev) : [...prev, m].sort((a, b) => a - b)
    );
  };

  // Traer todos los registros de la tienda para el año
  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-all', storeCode, year],
    queryFn: async () => {
      if (!storeCode) return [];
      const all = await base44.entities.PYGReport.filter({ year });
      return all.filter(r => String(r.store_code || '').trim().toUpperCase() === storeCode.toUpperCase());
    },
    enabled: !!storeCode,
  });

  // Registro del mes principal (último seleccionado)
  const primaryMonth = selectedMonths[selectedMonths.length - 1];
  const primaryRecord = allRecords.find(r => r.month === primaryMonth) || null;

  // Registro anterior (para comparar)
  const prevRecord = selectedMonths.length >= 2
    ? allRecords.find(r => r.month === selectedMonths[selectedMonths.length - 2]) || null
    : allRecords.find(r => r.month === primaryMonth - 1) || null;

  // Datos para gráfica de tendencia
  const trendData = useMemo(() => {
    return MONTHS.map((m, i) => {
      const rec = allRecords.find(r => r.month === i + 1);
      if (!rec) return { mes: m, month: i + 1, hasData: false };
      return {
        mes: m,
        month: i + 1,
        hasData: true,
        ebitda: pctNum(rec.margen_ebitda),
        costoReal: pctNum(rec.cost_real),
        costoTeorico: pctNum(rec.cost_teorico),
        personal: pctNum(rec.costo_personal),
        gastos: pctNum(rec.gastos_pct_venta),
        selected: selectedMonths.includes(i + 1),
      };
    }).filter(d => d.hasData);
  }, [allRecords, selectedMonths]);

  // Otros gastos parseados
  const otrosGastos = useMemo(() => {
    if (!primaryRecord?.otros_gastos) return [];
    try {
      const parsed = JSON.parse(primaryRecord.otros_gastos);
      return Object.entries(parsed)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ name: k, value: v }));
    } catch { return []; }
  }, [primaryRecord]);

  const selectedMonthLabel = selectedMonths.length === 1
    ? `${MONTHS_FULL[primaryMonth - 1]} ${year}`
    : `${selectedMonths.map(m => MONTHS_FULL[m - 1]).join(' vs ')} ${year}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-stretch justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-50 w-full max-w-3xl ml-auto h-full flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-xl leading-tight">P&G · {storeCode}</h2>
                <p className="text-white/70 text-xs">{selectedMonthLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de año */}
          <div className="flex items-center gap-2 mt-3">
            <Calendar className="w-4 h-4 text-white/60" />
            <div className="flex gap-1">
              {[currentYear - 1, currentYear].map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    year === y ? 'bg-white text-emerald-700' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <span className="text-white/40 text-xs ml-2">Selecciona meses para comparar:</span>
          </div>

          {/* Selector de meses */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {MONTHS.map((m, i) => {
              const hasData = allRecords.some(r => r.month === i + 1);
              return (
                <button
                  key={i}
                  onClick={() => hasData && toggleMonth(i + 1)}
                  disabled={!hasData}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedMonths.includes(i + 1)
                      ? 'bg-white text-emerald-700 shadow'
                      : hasData
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'bg-white/5 text-white/25 cursor-not-allowed'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido principal scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
          ) : !primaryRecord ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold text-slate-600 text-lg">Sin datos para {MONTHS_FULL[primaryMonth - 1]} {year}</p>
              <p className="text-sm mt-2">Carga el Excel P&G desde el menú del gerente</p>
            </div>
          ) : (
            <>
              {/* KPIs principales */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Indicadores Clave</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <KPICard
                    label="Margen EBITDA"
                    value={primaryRecord.margen_ebitda}
                    prevValue={prevRecord?.margen_ebitda}
                    color="text-white"
                    bg={primaryRecord.margen_ebitda >= 0.3 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : primaryRecord.margen_ebitda >= 0.15 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-700'}
                    icon={TrendingUp}
                    delay={0}
                  />
                  <KPICard
                    label="Costo Personal"
                    value={primaryRecord.costo_personal}
                    prevValue={prevRecord?.costo_personal}
                    color="text-white"
                    bg={primaryRecord.costo_personal <= 0.22 ? 'bg-gradient-to-br from-blue-500 to-indigo-700' : primaryRecord.costo_personal <= 0.28 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-700'}
                    icon={BarChart3}
                    inverse
                    delay={0.05}
                  />
                  <KPICard
                    label="Gastos % Venta"
                    value={primaryRecord.gastos_pct_venta}
                    prevValue={prevRecord?.gastos_pct_venta}
                    color="text-white"
                    bg={primaryRecord.gastos_pct_venta <= 0.38 ? 'bg-gradient-to-br from-violet-500 to-purple-700' : primaryRecord.gastos_pct_venta <= 0.45 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-700'}
                    icon={BarChart3}
                    inverse
                    delay={0.1}
                  />
                </div>
              </div>

              {/* Costo Real vs Teórico */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-bold text-slate-800">Costo Real vs Teórico</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Costo Real</p>
                    <p className={`text-3xl font-black ${
                      primaryRecord.cost_real <= (primaryRecord.cost_teorico || 0.28)
                        ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {pctNum(primaryRecord.cost_real)?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Costo Teórico</p>
                    <p className="text-3xl font-black text-blue-600">
                      {pctNum(primaryRecord.cost_teorico)?.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {primaryRecord.cost_real != null && primaryRecord.cost_teorico != null && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                    primaryRecord.cost_real <= primaryRecord.cost_teorico
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {primaryRecord.cost_real <= primaryRecord.cost_teorico
                      ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Bajo costo teórico por {Math.abs(pctNum(primaryRecord.cost_teorico) - pctNum(primaryRecord.cost_real)).toFixed(1)}pp</>
                      : <><TrendingUp className="w-4 h-4 flex-shrink-0" /> Sobre costo teórico por {Math.abs(pctNum(primaryRecord.cost_real) - pctNum(primaryRecord.cost_teorico)).toFixed(1)}pp</>}
                  </div>
                )}
              </motion.div>

              {/* Desglose de gastos */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <p className="font-bold text-slate-800 mb-4">Desglose de Gastos</p>
                <div className="space-y-3">
                  {[
                    { label: 'Costo Personal', value: primaryRecord.costo_personal, prev: prevRecord?.costo_personal, color: 'text-blue-600' },
                    { label: 'Arriendos', value: primaryRecord.arriendos, prev: prevRecord?.arriendos, color: 'text-violet-600' },
                    { label: 'Servicios Públicos', value: primaryRecord.servicios_publicos, prev: prevRecord?.servicios_publicos, color: 'text-amber-600' },
                    { label: 'Administración', value: primaryRecord.administracion, prev: prevRecord?.administracion, color: 'text-pink-600' },
                    { label: 'Impuestos', value: primaryRecord.impuestos, prev: prevRecord?.impuestos, color: 'text-slate-600' },
                  ].filter(item => item.value != null).map((item, i) => (
                    <CompareBar
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      refValue={item.prev}
                      color={item.color}
                      delay={0.22 + i * 0.04}
                    />
                  ))}
                </div>
                {prevRecord && (
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <span className="w-3 h-2 bg-slate-300 rounded inline-block" /> Barra gris = {MONTHS_FULL[selectedMonths[selectedMonths.length - 2] - 1] || 'mes anterior'}
                  </p>
                )}
              </motion.div>

              {/* Gráfica de tendencia */}
              {trendData.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                  <p className="font-bold text-slate-800 mb-1">Evolución {year}</p>
                  <p className="text-xs text-slate-400 mb-4">Haz clic en un mes del encabezado para seleccionarlo</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData} margin={{ left: -10, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                      <Bar dataKey="ebitda" name="EBITDA" radius={[4, 4, 0, 0]}>
                        {trendData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.selected ? '#059669' : '#d1fae5'}
                            cursor="pointer"
                            onClick={() => toggleMonth(entry.month)}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="costoReal" name="Costo Real" radius={[4, 4, 0, 0]}>
                        {trendData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.selected ? '#3b82f6' : '#bfdbfe'}
                            cursor="pointer"
                            onClick={() => toggleMonth(entry.month)}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="personal" name="Personal" radius={[4, 4, 0, 0]}>
                        {trendData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.selected ? '#8b5cf6' : '#ede9fe'}
                            cursor="pointer"
                            onClick={() => toggleMonth(entry.month)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 justify-center">
                    {[
                      { color: '#059669', label: 'EBITDA' },
                      { color: '#3b82f6', label: 'Costo Real' },
                      { color: '#8b5cf6', label: 'Personal' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                        <span className="text-xs text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Comparativo si hay 2+ meses seleccionados */}
              {selectedMonths.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                  <p className="font-bold text-slate-800 mb-4">Comparativo por mes seleccionado</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-xs text-slate-400 font-semibold pb-2">Concepto</th>
                          {selectedMonths.map(m => (
                            <th key={m} className="text-right text-xs text-slate-500 font-semibold pb-2 px-2">{MONTHS[m - 1]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'margen_ebitda', label: 'EBITDA', good: (v, prev) => v >= prev },
                          { key: 'cost_real', label: 'Costo Real', good: (v, prev) => v <= prev },
                          { key: 'cost_teorico', label: 'Costo Teórico', good: null },
                          { key: 'costo_personal', label: 'Personal', good: (v, prev) => v <= prev },
                          { key: 'gastos_pct_venta', label: 'Gastos %', good: (v, prev) => v <= prev },
                          { key: 'arriendos', label: 'Arriendos', good: null },
                        ].map(row => (
                          <tr key={row.key} className="border-b border-slate-50">
                            <td className="py-2.5 text-slate-600 font-medium">{row.label}</td>
                            {selectedMonths.map((m, idx) => {
                              const rec = allRecords.find(r => r.month === m);
                              const val = rec?.[row.key];
                              const prevVal = idx > 0 ? allRecords.find(r => r.month === selectedMonths[idx - 1])?.[row.key] : null;
                              const diff = val != null && prevVal != null ? pctNum(val) - pctNum(prevVal) : null;
                              const improved = row.good && diff != null ? row.good(pctNum(val), pctNum(prevVal)) : null;
                              return (
                                <td key={m} className="py-2.5 text-right px-2">
                                  <span className={`font-bold text-sm ${
                                    improved === true ? 'text-emerald-600' :
                                    improved === false ? 'text-red-500' : 'text-slate-700'
                                  }`}>
                                    {val != null ? `${pctNum(val).toFixed(1)}%` : '—'}
                                  </span>
                                  {diff != null && idx > 0 && (
                                    <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Otros gastos */}
              {otrosGastos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                  <p className="font-bold text-slate-800 mb-3">Otros Gastos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {otrosGastos.map(({ name, value }) => (
                      <div key={name} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-xs text-slate-600 truncate flex-1 mr-2">{name}</span>
                        <span className="text-xs font-bold text-slate-800 flex-shrink-0">{pctNum(value)?.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}