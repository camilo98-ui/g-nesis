import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Upload, FileSpreadsheet, X, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const fmt = (n) => n >= 1000000
  ? `$${(n / 1000000).toFixed(1)}M`
  : n >= 1000
  ? `$${(n / 1000).toFixed(0)}K`
  : `$${n?.toLocaleString('es-CO') ?? 0}`;

const pct = (n) => `${n >= 0 ? '+' : ''}${n?.toFixed(1) ?? 0}%`;

function KPICard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {sub && (
        <div className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

export default function PowerBIReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((file) => {
    setLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });
        processData(rows);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  }, []);

  const processData = (rows) => {
    // Detect columns automatically
    const cols = Object.keys(rows[0] || {});

    // Try to find relevant columns (sales, store, date, budget, etc.)
    const findCol = (keywords) => cols.find(c =>
      keywords.some(k => c.toLowerCase().includes(k.toLowerCase()))
    );

    const storeCol = findCol(['punto', 'tienda', 'store', 'pdv', 'local']);
    const salesCol = findCol(['venta', 'sale', 'real', 'total_venta', 'ventas']);
    const budgetCol = findCol(['presup', 'budget', 'ppto', 'meta']);
    const dateCol = findCol(['fecha', 'date', 'día', 'dia']);

    // Aggregate by store
    const byStore = {};
    rows.forEach(row => {
      const store = storeCol ? String(row[storeCol]) : 'Sin tienda';
      if (!byStore[store]) byStore[store] = { store, sales: 0, budget: 0, count: 0 };
      byStore[store].sales += Number(row[salesCol] || 0);
      byStore[store].budget += Number(row[budgetCol] || 0);
      byStore[store].count += 1;
    });

    const storeData = Object.values(byStore)
      .map(s => ({
        ...s,
        compliance: s.budget > 0 ? (s.sales / s.budget) * 100 : null,
        gap: s.sales - s.budget,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 15);

    // Aggregate by date if available
    let timeData = [];
    if (dateCol) {
      const byDate = {};
      rows.forEach(row => {
        const d = String(row[dateCol]).substring(0, 10);
        if (!byDate[d]) byDate[d] = { date: d, sales: 0, budget: 0 };
        byDate[d].sales += Number(row[salesCol] || 0);
        byDate[d].budget += Number(row[budgetCol] || 0);
      });
      timeData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    }

    const totalSales = storeData.reduce((s, r) => s + r.sales, 0);
    const totalBudget = storeData.reduce((s, r) => s + r.budget, 0);
    const totalGap = totalSales - totalBudget;
    const compliance = totalBudget > 0 ? (totalSales / totalBudget) * 100 : null;

    setData({ storeData, timeData, totalSales, totalBudget, totalGap, compliance, cols, rows: rows.length });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.1)' }}>
              <ShoppingBag style={{ color: '#C21875', width: 20, height: 20 }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Producto para llevar</h1>
              <p className="text-xs text-slate-400 font-medium">Sube tu Excel y visualiza los datos</p>
            </div>
          </div>
          {data && (
            <button
              onClick={() => { setData(null); setFileName(''); }}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-500 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors"
            >
              <X size={14} /> Cambiar archivo
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-16 cursor-pointer ${dragOver ? 'border-pink-400 bg-pink-50' : 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50'}`}
                onClick={() => document.getElementById('excel-input').click()}
                style={{ minHeight: 340 }}
              >
                <input id="excel-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />

                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Procesando archivo...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(194,24,117,0.08)' }}>
                      <FileSpreadsheet size={40} style={{ color: '#C21875' }} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Sube tu archivo de Excel</h2>
                    <p className="text-slate-400 text-sm text-center max-w-sm mb-6">
                      Arrastra y suelta tu archivo aquí, o haz clic para buscarlo. Compatible con <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong>
                    </p>
                    <div className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
                      <Upload size={16} /> Seleccionar archivo
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* File badge */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileSpreadsheet size={14} className="text-green-500" />
                <span className="font-semibold text-slate-700">{fileName}</span>
                <span>· {data.rows.toLocaleString()} registros</span>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Ventas Totales" value={fmt(data.totalSales)} icon={TrendingUp} color="#C21875" />
                <KPICard label="Presupuesto" value={fmt(data.totalBudget)} icon={BarChart3} color="#6366f1" />
                <KPICard
                  label="Brecha"
                  value={fmt(Math.abs(data.totalGap))}
                  sub={data.totalGap >= 0 ? 'Por encima' : 'Por debajo'}
                  trend={data.totalGap}
                  icon={data.totalGap >= 0 ? TrendingUp : TrendingDown}
                  color={data.totalGap >= 0 ? '#10b981' : '#ef4444'}
                />
                <KPICard
                  label="Cumplimiento"
                  value={data.compliance ? `${data.compliance.toFixed(1)}%` : 'N/A'}
                  sub={data.compliance ? pct(data.compliance - 100) + ' vs meta' : ''}
                  trend={data.compliance ? data.compliance - 100 : 0}
                  icon={BarChart3}
                  color="#f59e0b"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by store */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Ventas por Tienda</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.storeData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="store" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="sales" fill="#C21875" radius={[0, 6, 6, 0]} name="Ventas" />
                      {data.storeData[0]?.budget > 0 && <Bar dataKey="budget" fill="#e9d5ff" radius={[0, 6, 6, 0]} name="Presupuesto" />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeline or compliance */}
                {data.timeData.length > 0 ? (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Tendencia de Ventas</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={data.timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#C21875" strokeWidth={2} dot={false} name="Ventas" />
                        {data.timeData[0]?.budget > 0 && <Line type="monotone" dataKey="budget" stroke="#a78bfa" strokeWidth={2} dot={false} name="Presupuesto" strokeDasharray="5 5" />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Cumplimiento por Tienda</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.storeData.filter(s => s.compliance !== null)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 120]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="store" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                        <Tooltip formatter={(v) => `${v?.toFixed(1)}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="compliance" radius={[0, 6, 6, 0]} name="Cumplimiento %"
                          fill="#C21875"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700">Detalle por Tienda</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Tienda</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Ventas</th>
                        {data.storeData[0]?.budget > 0 && <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Presupuesto</th>}
                        {data.storeData[0]?.budget > 0 && <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Brecha</th>}
                        {data.storeData[0]?.compliance !== null && <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Cumplimiento</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.storeData.map((row, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-700">{row.store}</td>
                          <td className="p-3 text-right font-semibold text-slate-800">{fmt(row.sales)}</td>
                          {data.storeData[0]?.budget > 0 && <td className="p-3 text-right text-slate-500">{fmt(row.budget)}</td>}
                          {data.storeData[0]?.budget > 0 && (
                            <td className={`p-3 text-right font-semibold ${row.gap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {fmt(Math.abs(row.gap))} {row.gap >= 0 ? '▲' : '▼'}
                            </td>
                          )}
                          {row.compliance !== null && (
                            <td className="p-3 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.compliance >= 100 ? 'bg-emerald-100 text-emerald-700' : row.compliance >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {row.compliance.toFixed(1)}%
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}