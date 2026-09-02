import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, PieChart, Pie
} from 'recharts';
import {
  X, BarChart3, Layers, TrendingUp, Percent, DollarSign, History, Search, Check, GitCompare
} from 'lucide-react';

const COLORS = ['#C21875','#db2777','#f472b6','#7c3aed','#10b981','#f59e0b','#6366f1','#84cc16','#06b6d4','#f97316'];
const MONTHS_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const EXEC = {
  bgCard: '#ffffff', bgCardAlt: '#fef6fb', border: 'rgba(194,24,117,0.15)', borderLight: 'rgba(194,24,117,0.08)',
  accent1: '#C21875', accent2: '#db2777', accent4: '#10b981', accent5: '#f59e0b',
  textPrimary: '#1e293b', textSecondary: '#64748b', textMuted: '#94a3b8',
};

function formatCurrency(val) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val || 0));
}

const METRICS = [
  { key: 'sales', label: 'Venta', icon: DollarSign },
  { key: 'participation', label: 'Participación', icon: Percent },
  { key: 'growth', label: 'Crecimiento', icon: TrendingUp },
];

export default function ProductComparisonView({
  allRecords, hierarchy, availableMonths, grandTotal, currentMonthLabel, effectiveMonth, effectiveYear, onClose
}) {
  const [viewMode, setViewMode] = useState('departments'); // departments | products
  const [metric, setMetric] = useState('sales');
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Productos del mes actual (planos)
  const currentProducts = useMemo(() => {
    const list = [];
    hierarchy.forEach(h => h.sections.forEach(s => s.products.forEach(p => {
      if (p.product && (p.total_sales || 0) > 0) list.push({ ...p, dept: h.dept });
    })));
    return list.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));
  }, [hierarchy]);

  const productNames = currentProducts.map(p => p.product);

  const toggleProduct = (name) => {
    setSelectedProducts(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  // Totales por mes (para participación histórica)
  const monthTotals = useMemo(() => {
    const totals = {};
    allRecords.filter(r => r.month && r.year).forEach(r => {
      const k = `${r.year}-${r.month}`;
      totals[k] = (totals[k] || 0) + (r.total_sales || 0);
    });
    return totals;
  }, [allRecords]);

  // Mes anterior inmediato (para growth snapshot)
  const prevMonthKey = useMemo(() => {
    const sorted = [...availableMonths].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    const currentKey = effectiveYear * 12 + effectiveMonth;
    const prev = [...sorted].reverse().find(m => (m.year * 12 + m.month) < currentKey);
    return prev ? `${prev.year}-${prev.month}` : null;
  }, [availableMonths, effectiveMonth, effectiveYear]);

  // Datos snapshot (mes actual)
  const snapshotData = useMemo(() => {
    return selectedProducts.map(name => {
      const recs = allRecords.filter(r => r.product === name && r.month === effectiveMonth && r.year === effectiveYear);
      const sales = recs.reduce((s, r) => s + (r.total_sales || 0), 0);
      const units = recs.reduce((s, r) => s + (r.units_sold || 0), 0);
      const participation = grandTotal > 0 ? (sales / grandTotal) * 100 : 0;
      let growth = null;
      if (prevMonthKey) {
        const prevRecs = allRecords.filter(r => r.product === name && `${r.year}-${r.month}` === prevMonthKey);
        const prevSales = prevRecs.reduce((s, r) => s + (r.total_sales || 0), 0);
        growth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : null;
      }
      return { name, sales, units, participation, growth };
    });
  }, [selectedProducts, allRecords, effectiveMonth, effectiveYear, grandTotal, prevMonthKey]);

  // Datos históricos (mes a mes)
  const historyData = useMemo(() => {
    const sorted = [...availableMonths].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    return sorted.map(({ month, year }) => {
      const k = `${year}-${month}`;
      const point = { label: `${MONTHS_NAMES[month - 1].slice(0, 3)} ${String(year).slice(2)}` };
      selectedProducts.forEach(name => {
        const recs = allRecords.filter(r => r.product === name && r.month === month && r.year === year);
        const sales = recs.reduce((s, r) => s + (r.total_sales || 0), 0);
        if (metric === 'sales') point[name] = sales;
        else if (metric === 'participation') point[name] = monthTotals[k] > 0 ? (sales / monthTotals[k]) * 100 : 0;
        else point[name] = sales; // growth handled in chart via computed
      });
      return point;
    });
  }, [availableMonths, selectedProducts, allRecords, metric, monthTotals]);

  // Para growth histórico, calcular MoM
  const historyGrowthData = useMemo(() => {
    if (metric !== 'growth') return historyData;
    const sorted = [...availableMonths].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    return historyData.map((point, idx) => {
      const newPoint = { label: point.label };
      selectedProducts.forEach(name => {
        if (idx === 0) { newPoint[name] = null; return; }
        const prev = historyData[idx - 1][name];
        const curr = point[name];
        newPoint[name] = prev > 0 ? ((curr - prev) / prev) * 100 : null;
      });
      return newPoint;
    });
  }, [historyData, metric, availableMonths, selectedProducts]);

  const chartData = metric === 'growth' && historyMode ? historyGrowthData : historyData;

  const metricValue = (item) => {
    const v = item[metric];
    if (v === null || v === undefined) return null;
    return v;
  };
  const formatMetric = (v) => {
    if (v === null || v === undefined) return '—';
    if (metric === 'sales') return formatCurrency(v);
    if (metric === 'participation') return v.toFixed(2) + '%';
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  };

  const filteredProductNames = productNames.filter(n => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #fff5fa 0%, #ffffff 30%, #fdf2f8 100%)' }}>
      {/* Header */}
      <div className="z-30" style={{ background: 'rgba(255,255,255,0.95)', borderBottom: `1px solid ${EXEC.border}`, boxShadow: '0 2px 16px rgba(194,24,117,0.08)' }}>
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center gap-3 flex-wrap">
          <button onClick={onClose} className="p-2 rounded-xl flex-shrink-0" style={{ border: `1px solid ${EXEC.borderLight}` }}>
            <X className="w-5 h-5" style={{ color: EXEC.textSecondary }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2" style={{ color: EXEC.textPrimary }}>
              <GitCompare className="w-5 h-5" style={{ color: EXEC.accent1 }} />
              Análisis Comparativo
            </h1>
            <p className="text-xs font-medium" style={{ color: EXEC.textMuted }}>
              {currentMonthLabel} · {viewMode === 'departments' ? 'Vista por departamentos' : `${selectedProducts.length} producto(s) seleccionado(s)`}
            </p>
          </div>

          {/* Toggle Departamentos / Productos */}
          <div className="flex items-center rounded-xl p-1" style={{ background: 'rgba(194,24,117,0.06)', border: `1px solid ${EXEC.border}` }}>
            <button onClick={() => setViewMode('departments')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: viewMode === 'departments' ? EXEC.accent1 : 'transparent', color: viewMode === 'departments' ? '#fff' : EXEC.textSecondary }}>
              <Layers className="w-3.5 h-3.5" /> Departamentos
            </button>
            <button onClick={() => setViewMode('products')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: viewMode === 'products' ? EXEC.accent1 : 'transparent', color: viewMode === 'products' ? '#fff' : EXEC.textSecondary }}>
              <BarChart3 className="w-3.5 h-3.5" /> Productos
            </button>
          </div>
        </div>
      </div>

      {/* Controles cuando es modo productos */}
      {viewMode === 'products' && (
        <div className="max-w-[1500px] mx-auto w-full px-6 py-4 flex items-center gap-3 flex-wrap">
          {/* Selector de métrica */}
          <div className="flex items-center rounded-xl p-1" style={{ background: 'rgba(194,24,117,0.06)', border: `1px solid ${EXEC.border}` }}>
            {METRICS.map(m => {
              const Icon = m.icon;
              const active = metric === m.key;
              return (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: active ? EXEC.accent1 : 'transparent', color: active ? '#fff' : EXEC.textSecondary }}>
                  <Icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              );
            })}
          </div>

          {/* Botón Historia */}
          <button onClick={() => setHistoryMode(h => !h)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: historyMode ? EXEC.accent1 : 'rgba(194,24,117,0.08)',
              color: historyMode ? '#fff' : EXEC.accent1,
              border: `1px solid ${historyMode ? EXEC.accent1 : EXEC.border}`,
            }}>
            <History className="w-3.5 h-3.5" /> {historyMode ? 'Historia activa' : 'Ver Historia'}
          </button>

          {/* Multi-select de productos */}
          <div className="relative flex-1 min-w-[240px]">
            <button onClick={() => setPickerOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${EXEC.border}`, color: EXEC.textPrimary }}>
              <span className="truncate">
                {selectedProducts.length === 0 ? 'Selecciona productos para comparar…' : `${selectedProducts.length} seleccionado(s)`}
              </span>
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: EXEC.textMuted }} />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 right-0 z-40 rounded-xl shadow-2xl overflow-hidden"
                  style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                  <div className="p-2 border-b" style={{ borderColor: EXEC.borderLight }}>
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…"
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: EXEC.bgCardAlt, border: `1px solid ${EXEC.borderLight}`, color: EXEC.textPrimary }} />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {filteredProductNames.slice(0, 200).map(name => {
                      const checked = selectedProducts.includes(name);
                      return (
                        <button key={name} onClick={() => toggleProduct(name)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-rose-50/50 transition-colors"
                          style={{ color: EXEC.textPrimary }}>
                          <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: checked ? EXEC.accent1 : 'transparent', border: `1.5px solid ${checked ? EXEC.accent1 : EXEC.borderLight}` }}>
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span className="truncate">{name}</span>
                        </button>
                      );
                    })}
                    {filteredProductNames.length === 0 && (
                      <p className="px-3 py-4 text-xs text-center" style={{ color: EXEC.textMuted }}>Sin resultados</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Área de gráfica */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1500px] mx-auto px-6 pb-8">
          {/* VISTA DEPARTAMENTOS */}
          {viewMode === 'departments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
              <h3 className="font-black text-lg mb-1" style={{ color: EXEC.textPrimary }}>Participación por Departamento</h3>
              <p className="text-xs mb-5" style={{ color: EXEC.textMuted }}>{currentMonthLabel} · ordenado por venta</p>
              <div style={{ width: '100%', height: Math.max(360, hierarchy.length * 44) }}>
                <ResponsiveContainer>
                  <BarChart data={hierarchy.map(h => ({ name: h.dept, sales: h.deptSales, part: h.deptPart })).sort((a,b) => b.sales - a.sales)}
                    layout="vertical" margin={{ left: 8, right: 32, top: 8, bottom: 8 }}>
                    <CartesianGrid horizontal={false} stroke="rgba(194,24,117,0.06)" />
                    <XAxis type="number" tickFormatter={v => new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v)} tick={{ fontSize: 10, fill: EXEC.textMuted }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: EXEC.textSecondary }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="px-4 py-3 rounded-xl shadow-2xl text-xs" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                        <p className="font-bold mb-1" style={{ color: EXEC.accent1 }}>{payload[0].payload.name}</p>
                        <p className="font-semibold" style={{ color: EXEC.accent4 }}>{formatCurrency(payload[0].payload.sales)}</p>
                        <p style={{ color: EXEC.textSecondary }}>Part: {payload[0].payload.part.toFixed(1)}%</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="sales" radius={[0, 6, 6, 0]} barSize={28}>
                      {hierarchy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Pie de participación */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {hierarchy.slice().sort((a,b) => b.deptSales - a.deptSales).map((h, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: EXEC.bgCardAlt, border: `1px solid ${EXEC.borderLight}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-bold truncate" style={{ color: EXEC.textPrimary }}>{h.dept}</span>
                    </div>
                    <p className="text-sm font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(h.deptSales)}</p>
                    <p className="text-[10px]" style={{ color: EXEC.textMuted }}>{h.deptPart.toFixed(2)}% participación</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VISTA PRODUCTOS */}
          {viewMode === 'products' && (
            selectedProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl p-12 text-center" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: EXEC.textPrimary }}>Selecciona productos para comparar</h3>
                <p className="text-sm" style={{ color: EXEC.textSecondary }}>Usa el buscador de arriba para elegir uno o varios productos.</p>
              </motion.div>
            ) : !historyMode ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                <h3 className="font-black text-lg mb-1" style={{ color: EXEC.textPrimary }}>
                  Comparativa · {METRICS.find(m => m.key === metric).label}
                </h3>
                <p className="text-xs mb-5" style={{ color: EXEC.textMuted }}>{currentMonthLabel} · {selectedProducts.length} producto(s)</p>
                <div style={{ width: '100%', height: Math.max(360, selectedProducts.length * 52) }}>
                  <ResponsiveContainer>
                    <BarChart data={snapshotData} layout="vertical" margin={{ left: 8, right: 32, top: 8, bottom: 8 }}>
                      <CartesianGrid horizontal={false} stroke="rgba(194,24,117,0.06)" />
                      <XAxis type="number"
                        tickFormatter={v => metric === 'sales' ? new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v) : (v + '%')}
                        tick={{ fontSize: 10, fill: EXEC.textMuted }} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10, fill: EXEC.textSecondary }} />
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="px-4 py-3 rounded-xl shadow-2xl text-xs" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                          <p className="font-bold mb-1 truncate" style={{ color: EXEC.accent1 }}>{payload[0].payload.name}</p>
                          <p className="font-semibold" style={{ color: EXEC.accent4 }}>{formatMetric(metricValue(payload[0].payload))}</p>
                        </div>
                      ) : null} />
                      <Bar dataKey={metric} radius={[0, 6, 6, 0]} barSize={32}>
                        {snapshotData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                <h3 className="font-black text-lg mb-1 flex items-center gap-2" style={{ color: EXEC.textPrimary }}>
                  <History className="w-4 h-4" style={{ color: EXEC.accent1 }} />
                  Historia mes a mes · {METRICS.find(m => m.key === metric).label}
                </h3>
                <p className="text-xs mb-5" style={{ color: EXEC.textMuted }}>
                  {selectedProducts.length} producto(s) · {availableMonths.length} períodos
                </p>
                <div style={{ width: '100%', height: 440 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,117,0.08)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: EXEC.textMuted }} />
                      <YAxis
                        tickFormatter={v => metric === 'sales' ? new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v) : (v + '%')}
                        tick={{ fontSize: 10, fill: EXEC.textMuted }} />
                      <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                        <div className="px-4 py-3 rounded-xl shadow-2xl text-xs" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                          <p className="font-bold mb-1.5" style={{ color: EXEC.accent1 }}>{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="font-semibold flex items-center gap-1.5 mb-0.5" style={{ color: p.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                              <span className="truncate max-w-[160px]">{p.name}:</span>
                              <span>{formatMetric(p.value)}</span>
                            </p>
                          ))}
                        </div>
                      ) : null} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {selectedProducts.map((name, i) => (
                        <Line key={name} type="monotone" dataKey={name}
                          stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }}
                          connectNulls={metric === 'growth'} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}