import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, TrendingUp, TrendingDown, Loader2, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, GitCompare, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
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
  const bog = upper.match(/\bBOGOTA?\s*(\d+)/); if (bog) return `BOGOTA ${bog[1]}`;
  return storeId;
}

// Delta badge
function Delta({ val, prev, inverse = false }) {
  if (val == null || prev == null) return null;
  const diff = pctNum(val) - pctNum(prev);
  if (Math.abs(diff) < 0.05) return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">={diff.toFixed(1)}pp</span>;
  const good = inverse ? diff < 0 : diff > 0;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${good ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
      {diff > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp
    </span>
  );
}

// Tarjeta KPI grande
function KPIBig({ label, value, prev, inverse = false, delay = 0, accent }) {
  const v = pctNum(value);
  const p = pctNum(prev);
  const diff = v != null && p != null ? v - p : null;
  const good = diff != null ? (inverse ? diff <= 0 : diff >= 0) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 flex flex-col gap-2"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-3">
        <p className={`text-4xl font-black ${accent}`}>{v != null ? `${v.toFixed(1)}%` : '—'}</p>
        {diff != null && (
          <div className={`mb-1 flex items-center gap-1 text-sm font-bold ${good ? 'text-emerald-600' : 'text-red-500'}`}>
            {diff > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp
          </div>
        )}
      </div>
      {p != null && <p className="text-xs text-slate-400">Anterior: {p.toFixed(1)}%</p>}
    </motion.div>
  );
}

// Barra de progreso con comparativa
function BarRow({ label, value, prev, accent, delay = 0 }) {
  const v = pctNum(value);
  const p = pctNum(prev);
  if (v == null) return null;
  const max = Math.max(v, p || 0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          {p != null && <span className="text-xs text-slate-400">{p.toFixed(1)}%</span>}
          <span className={`text-sm font-black ${accent}`}>{v.toFixed(1)}%</span>
          <Delta val={value} prev={prev != null ? prev / 100 : undefined} inverse />
        </div>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        {p != null && (
          <div className="absolute h-full bg-slate-200 rounded-full" style={{ width: `${(p / max) * 100}%` }} />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(v / max) * 100}%` }}
          transition={{ duration: 0.8, delay }}
          className={`absolute h-full rounded-full ${accent.replace('text-', 'bg-')}`}
        />
      </div>
    </motion.div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-1">
      <p className="font-bold text-pink-300">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(1)}%</p>)}
    </div>
  );
};

export default function PYGModal({ onClose, storeId }) {
  const storeCode = extractStoreCode(storeId);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const [comparableMode, setComparableMode] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth]);

  const primaryMonth = selectedMonths[selectedMonths.length - 1];

  const toggleMonth = (m) => {
    if (!comparableMode) return;
    setSelectedMonths(prev =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter(x => x !== m) : prev
        : [...prev, m].sort((a, b) => a - b)
    );
  };

  const enableComparable = () => {
    setComparableMode(true);
    // preselect current + previous month
    const prev = currentMonth > 1 ? currentMonth - 1 : 12;
    setSelectedMonths([prev, currentMonth]);
  };

  const disableComparable = () => {
    setComparableMode(false);
    setSelectedMonths([currentMonth]);
  };

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['pyg-modal', storeCode, currentYear],
    queryFn: async () => {
      if (!storeCode) return [];
      const all = await base44.entities.PYGReport.filter({ year: currentYear });
      return all.filter(r => String(r.store_code || '').trim().toUpperCase() === storeCode.toUpperCase());
    },
    enabled: !!storeCode,
  });

  const primaryRecord = allRecords.find(r => r.month === primaryMonth) || null;
  const prevMonth = selectedMonths.length >= 2 ? selectedMonths[selectedMonths.length - 2] : (primaryMonth > 1 ? primaryMonth - 1 : null);
  const prevRecord = prevMonth ? allRecords.find(r => r.month === prevMonth) || null : null;

  const trendData = useMemo(() =>
    MONTHS_SHORT.map((m, i) => {
      const rec = allRecords.find(r => r.month === i + 1);
      if (!rec) return null;
      return {
        mes: m, month: i + 1,
        EBITDA: pctNum(rec.margen_ebitda),
        'C. Real': pctNum(rec.cost_real),
        Personal: pctNum(rec.costo_personal),
      };
    }).filter(Boolean),
    [allRecords]
  );

  const otrosGastos = useMemo(() => {
    if (!primaryRecord?.otros_gastos) return [];
    try {
      return Object.entries(JSON.parse(primaryRecord.otros_gastos))
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ name: k, value: v }));
    } catch { return []; }
  }, [primaryRecord]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-rose-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-xl leading-tight">P&G · {storeCode || 'Tienda'}</h1>
                <p className="text-white/70 text-xs">
                  {comparableMode
                    ? `Comparando: ${selectedMonths.map(m => MONTHS_SHORT[m - 1]).join(' vs ')} ${currentYear}`
                    : `${MONTHS_FULL[primaryMonth - 1]} ${currentYear}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!comparableMode ? (
                <button
                  onClick={enableComparable}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-all px-4 py-2 rounded-xl text-sm font-bold"
                >
                  <GitCompare className="w-4 h-4" />
                  Comparable
                </button>
              ) : (
                <button
                  onClick={disableComparable}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-all px-4 py-2 rounded-xl text-sm font-bold"
                >
                  <X className="w-4 h-4" />
                  Salir
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selector de meses (solo en comparable) */}
          <AnimatePresence>
            {comparableMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1">
                  <p className="text-white/60 text-xs mb-2">Toca los meses que quieres comparar:</p>
                  <div className="flex flex-wrap gap-2">
                    {MONTHS_SHORT.map((m, i) => {
                      const hasData = allRecords.some(r => r.month === i + 1);
                      const active = selectedMonths.includes(i + 1);
                      return (
                        <button
                          key={i}
                          onClick={() => hasData && toggleMonth(i + 1)}
                          disabled={!hasData}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-white text-pink-600 shadow-md'
                              : hasData
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-white/5 text-white/25 cursor-not-allowed'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
        ) : !primaryRecord ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <TrendingUp className="w-20 h-20 mb-4 opacity-20" />
            <p className="font-bold text-slate-600 text-xl">Sin datos para {MONTHS_FULL[primaryMonth - 1]} {currentYear}</p>
            <p className="text-sm mt-2">El gerente debe cargar el archivo P&G desde el menú principal</p>
          </div>
        ) : (
          <>
            {/* ── KPIs principales ── */}
            <div>
              <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3">Indicadores Clave</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPIBig
                  label="Margen EBITDA"
                  value={primaryRecord.margen_ebitda}
                  prev={prevRecord?.margen_ebitda}
                  accent="text-pink-600"
                  delay={0}
                />
                <KPIBig
                  label="Costo Personal"
                  value={primaryRecord.costo_personal}
                  prev={prevRecord?.costo_personal}
                  inverse
                  accent="text-fuchsia-600"
                  delay={0.06}
                />
                <KPIBig
                  label="Gastos % Venta"
                  value={primaryRecord.gastos_pct_venta}
                  prev={prevRecord?.gastos_pct_venta}
                  inverse
                  accent="text-rose-600"
                  delay={0.12}
                />
              </div>
            </div>

            {/* ── Costo Real vs Teórico ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100"
            >
              <p className="font-black text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-2 h-6 bg-pink-500 rounded-full inline-block" />
                Costo Real vs Teórico
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`rounded-2xl p-5 text-center ${
                  primaryRecord.cost_real <= (primaryRecord.cost_teorico || 0.3)
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Costo Real</p>
                  <p className={`text-4xl font-black ${
                    primaryRecord.cost_real <= (primaryRecord.cost_teorico || 0.3) ? 'text-emerald-600' : 'text-red-600'
                  }`}>{fmt(primaryRecord.cost_real)}</p>
                  {prevRecord?.cost_real != null && (
                    <p className="text-xs text-slate-400 mt-1">Anterior: {fmt(prevRecord.cost_real)}</p>
                  )}
                </div>
                <div className="rounded-2xl p-5 text-center bg-blue-50 border border-blue-200">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Costo Teórico</p>
                  <p className="text-4xl font-black text-blue-600">{fmt(primaryRecord.cost_teorico)}</p>
                  {prevRecord?.cost_teorico != null && (
                    <p className="text-xs text-slate-400 mt-1">Anterior: {fmt(prevRecord.cost_teorico)}</p>
                  )}
                </div>
              </div>
              {primaryRecord.cost_real != null && primaryRecord.cost_teorico != null && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
                  primaryRecord.cost_real <= primaryRecord.cost_teorico
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {primaryRecord.cost_real <= primaryRecord.cost_teorico
                    ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Bajo el teórico en {Math.abs(pctNum(primaryRecord.cost_teorico) - pctNum(primaryRecord.cost_real)).toFixed(1)}pp ✅</>
                    : <><TrendingUp className="w-4 h-4 flex-shrink-0" /> Sobre el teórico en {Math.abs(pctNum(primaryRecord.cost_real) - pctNum(primaryRecord.cost_teorico)).toFixed(1)}pp ⚠️</>}
                </div>
              )}
            </motion.div>

            {/* ── Desglose de gastos ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100"
            >
              <p className="font-black text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-2 h-6 bg-fuchsia-500 rounded-full inline-block" />
                Desglose de Gastos
                {prevRecord && <span className="text-xs font-normal text-slate-400 ml-2">Barra gris = {MONTHS_SHORT[prevMonth - 1]}</span>}
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Costo Personal',    value: primaryRecord.costo_personal,    prev: prevRecord?.costo_personal,    accent: 'text-fuchsia-600' },
                  { label: 'Arriendos',          value: primaryRecord.arriendos,          prev: prevRecord?.arriendos,          accent: 'text-pink-500' },
                  { label: 'Servicios Públicos', value: primaryRecord.servicios_publicos, prev: prevRecord?.servicios_publicos, accent: 'text-rose-500' },
                  { label: 'Administración',     value: primaryRecord.administracion,     prev: prevRecord?.administracion,     accent: 'text-violet-500' },
                  { label: 'Impuestos',          value: primaryRecord.impuestos,          prev: prevRecord?.impuestos,          accent: 'text-slate-500' },
                ].filter(r => r.value != null).map((r, i) => (
                  <BarRow key={r.label} {...r} delay={0.22 + i * 0.05} />
                ))}
              </div>
            </motion.div>

            {/* ── Tabla comparativa (modo comparable) ── */}
            <AnimatePresence>
              {comparableMode && selectedMonths.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100"
                >
                  <p className="font-black text-slate-800 mb-5 flex items-center gap-2">
                    <span className="w-2 h-6 bg-rose-500 rounded-full inline-block" />
                    Tabla Comparativa
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-pink-100">
                          <th className="text-left text-xs text-slate-400 font-bold pb-3 pr-4">Concepto</th>
                          {selectedMonths.map(m => (
                            <th key={m} className="text-right text-xs font-bold pb-3 px-3 text-pink-600">{MONTHS_FULL[m - 1]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'margen_ebitda',    label: 'EBITDA',         good: (v, p) => v >= p },
                          { key: 'cost_real',        label: 'Costo Real',     good: (v, p) => v <= p },
                          { key: 'cost_teorico',     label: 'Costo Teórico',  good: null },
                          { key: 'costo_personal',   label: 'Personal',       good: (v, p) => v <= p },
                          { key: 'arriendos',        label: 'Arriendos',      good: null },
                          { key: 'servicios_publicos', label: 'Serv. Públicos', good: (v, p) => v <= p },
                          { key: 'gastos_pct_venta', label: 'Gastos %',       good: (v, p) => v <= p },
                        ].map((row) => (
                          <tr key={row.key} className="border-b border-slate-50 hover:bg-pink-50/30 transition-colors">
                            <td className="py-3 text-sm text-slate-600 font-medium pr-4">{row.label}</td>
                            {selectedMonths.map((m, idx) => {
                              const rec = allRecords.find(r => r.month === m);
                              const val = rec?.[row.key];
                              const prevRec = idx > 0 ? allRecords.find(r => r.month === selectedMonths[idx - 1]) : null;
                              const pv = prevRec?.[row.key];
                              const vn = pctNum(val);
                              const pn = pctNum(pv);
                              const diff = vn != null && pn != null ? vn - pn : null;
                              const good = row.good && diff != null ? row.good(vn, pn) : null;
                              return (
                                <td key={m} className="py-3 text-right px-3">
                                  <span className={`font-black text-base ${good === true ? 'text-emerald-600' : good === false ? 'text-red-500' : 'text-slate-800'}`}>
                                    {vn != null ? `${vn.toFixed(1)}%` : '—'}
                                  </span>
                                  {diff != null && idx > 0 && (
                                    <span className={`text-[10px] ml-1.5 font-bold ${diff > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
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
            </AnimatePresence>

            {/* ── Gráfica de tendencia ── */}
            {trendData.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100"
              >
                <p className="font-black text-slate-800 mb-1 flex items-center gap-2">
                  <span className="w-2 h-6 bg-pink-400 rounded-full inline-block" />
                  Evolución {currentYear}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {comparableMode ? 'Toca las barras para agregar meses al comparativo' : 'Presiona "Comparable" para seleccionar meses'}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData} margin={{ left: -10, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#e2e8f0" />
                    <Bar dataKey="EBITDA" name="EBITDA" radius={[4,4,0,0]}>
                      {trendData.map((d, i) => (
                        <Cell key={i}
                          fill={selectedMonths.includes(d.month) ? '#db2777' : '#fbcfe8'}
                          cursor={comparableMode ? 'pointer' : 'default'}
                          onClick={() => comparableMode && toggleMonth(d.month)}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="C. Real" name="C. Real" radius={[4,4,0,0]}>
                      {trendData.map((d, i) => (
                        <Cell key={i}
                          fill={selectedMonths.includes(d.month) ? '#9333ea' : '#e9d5ff'}
                          cursor={comparableMode ? 'pointer' : 'default'}
                          onClick={() => comparableMode && toggleMonth(d.month)}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="Personal" name="Personal" radius={[4,4,0,0]}>
                      {trendData.map((d, i) => (
                        <Cell key={i}
                          fill={selectedMonths.includes(d.month) ? '#e11d48' : '#fecdd3'}
                          cursor={comparableMode ? 'pointer' : 'default'}
                          onClick={() => comparableMode && toggleMonth(d.month)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-5 mt-2 justify-center">
                  {[['#db2777','EBITDA'],['#9333ea','C. Real'],['#e11d48','Personal']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
                      <span className="text-xs text-slate-500">{l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Otros gastos ── */}
            {otrosGastos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100"
              >
                <p className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-slate-400 rounded-full inline-block" />
                  Otros Gastos
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {otrosGastos.map(({ name, value }) => (
                    <div key={name} className="bg-slate-50 rounded-xl px-3 py-2.5 flex justify-between items-center border border-slate-100">
                      <span className="text-xs text-slate-600 truncate flex-1 mr-2">{name}</span>
                      <span className="text-xs font-black text-slate-800 flex-shrink-0">{pctNum(value)?.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Botón cerrar flotante */}
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-2 z-50"
      >
        <X className="w-4 h-4" /> Cerrar
      </button>
    </motion.div>
  );
}