import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronRight, BarChart3, DollarSign, Zap, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

function formatCurrency(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Math.round(val || 0));
}

function HierarchyRow({ dept, sections, filterSection }) {
  const [expanded, setExpanded] = useState(false);

  const filteredSections = filterSection && filterSection !== 'all'
    ? sections.filter(s => s.name === filterSection)
    : sections;

  const deptTotals = sections.reduce((acc, s) => ({
    sales: acc.sales + s.total_sales,
    transactions: acc.transactions + s.total_transactions,
    participation: acc.participation + s.participation,
  }), { sales: 0, transactions: 0, participation: 0 });

  if (filteredSections.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      {/* Dept Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 transition-all"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-bold text-sm">{dept}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/80">
          <span>{formatCurrency(deptTotals.sales)}</span>
          <span>{deptTotals.transactions.toLocaleString()} trans.</span>
          <span>{deptTotals.participation.toFixed(1)}%</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {filteredSections.map((section) => (
              <SectionRow key={section.name} section={section} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionRow({ section }) {
  const [expanded, setExpanded] = useState(false);
  const hasProducts = section.products && section.products.length > 0;

  return (
    <div className="border-t border-slate-100">
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={!hasProducts}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-pink-50 hover:to-rose-50 transition-all"
      >
        <div className="flex items-center gap-2 pl-4">
          {hasProducts ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          ) : <div className="w-3.5" />}
          <span className="font-semibold text-sm text-slate-700">{section.name || '—'}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{formatCurrency(section.total_sales)}</span>
          <span>{section.total_transactions.toLocaleString()} trans.</span>
          <span className="text-pink-600 font-semibold">{section.participation.toFixed(2)}%</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && hasProducts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-slate-500">
                  <th className="text-left p-2 pl-12 font-medium">Producto</th>
                  <th className="text-right p-2 font-medium">Venta Bruta</th>
                  <th className="text-right p-2 font-medium"># Trans.</th>
                  <th className="text-right p-2 font-medium pr-3">% Part.</th>
                </tr>
              </thead>
              <tbody>
                {section.products.map((p, idx) => (
                  <tr key={idx} className="border-t border-slate-50 hover:bg-pink-50/30">
                    <td className="p-2 pl-12 text-slate-700">{p.product}</td>
                    <td className="p-2 text-right font-medium text-slate-800">{formatCurrency(p.total_sales)}</td>
                    <td className="p-2 text-right text-slate-600">{p.total_transactions.toLocaleString()}</td>
                    <td className="p-2 text-right text-pink-600 font-semibold pr-3">{p.participation.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SalesReportView() {
  // Get store from session
  const storeCode = (() => {
    try {
      const session = JSON.parse(localStorage.getItem('popsySession') || '{}');
      return session.store || '';
    } catch { return ''; }
  })();

  const [filterDept, setFilterDept] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  const { data: rawRecords = [], isLoading } = useQuery({
    queryKey: ['salesReport', storeCode],
    queryFn: () => base44.entities.SalesReport.filter({ store_code: storeCode }),
    enabled: !!storeCode,
  });

  const hasData = rawRecords.length > 0;

  // Build hierarchy
  const hierarchy = useMemo(() => {
    const deptMap = {};
    rawRecords.forEach(r => {
      if (!r.department) return;
      if (!deptMap[r.department]) deptMap[r.department] = {};
      const sectionKey = r.section || '__root__';
      if (!deptMap[r.department][sectionKey]) {
        deptMap[r.department][sectionKey] = {
          name: r.section || '',
          total_sales: 0,
          total_transactions: 0,
          participation: 0,
          products: [],
        };
      }
      if (r.level === 'section') {
        deptMap[r.department][sectionKey].total_sales = r.total_sales;
        deptMap[r.department][sectionKey].total_transactions = r.total_transactions;
        deptMap[r.department][sectionKey].participation = r.participation;
      } else if (r.level === 'product' && r.product) {
        deptMap[r.department][sectionKey].products.push(r);
        // Acumular si no hay fila de sección
        if (!deptMap[r.department][sectionKey].total_sales) {
          deptMap[r.department][sectionKey].total_sales += r.total_sales;
          deptMap[r.department][sectionKey].total_transactions += r.total_transactions;
        }
      }
    });

    return Object.entries(deptMap).map(([dept, sections]) => ({
      dept,
      sections: Object.values(sections),
    }));
  }, [rawRecords]);

  // Summary
  const summary = useMemo(() => {
    const deptRows = rawRecords.filter(r => r.level === 'department');
    const totalSales = deptRows.reduce((s, r) => s + r.total_sales, 0);
    const totalTransactions = deptRows.reduce((s, r) => s + r.total_transactions, 0);

    const products = rawRecords.filter(r => r.level === 'product' && r.product);
    const topProduct = products.sort((a, b) => b.participation - a.participation)[0];

    return { totalSales, totalTransactions, topProduct };
  }, [rawRecords]);

  // Top 5 products chart
  const top5 = useMemo(() => {
    return rawRecords
      .filter(r => r.level === 'product' && r.product && r.total_sales > 0)
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 5);
  }, [rawRecords]);

  const depts = useMemo(() => [...new Set(rawRecords.map(r => r.department).filter(Boolean))], [rawRecords]);
  const sections = useMemo(() => {
    const filtered = filterDept === 'all' ? rawRecords : rawRecords.filter(r => r.department === filterDept);
    return [...new Set(filtered.map(r => r.section).filter(Boolean))];
  }, [rawRecords, filterDept]);

  const filteredHierarchy = useMemo(() => {
    if (filterDept === 'all') return hierarchy;
    return hierarchy.filter(h => h.dept === filterDept);
  }, [hierarchy, filterDept]);

  const handleBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!storeCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-slate-600">No hay sesión activa. Por favor inicia sesión.</p>
          <Button onClick={handleBack} className="mt-4">Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-5 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">Participación del Negocio</h1>
            <p className="text-white/70 text-sm">{storeCode}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">El gerente aún no ha cargado el reporte</h2>
            <p className="text-slate-500 text-sm">Cuando el gerente suba el archivo, podrás ver los datos de participación de tu tienda aquí.</p>
            <Button onClick={handleBack} variant="outline" className="mt-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Total Venta Bruta</p>
                </div>
                <p className="text-2xl font-black text-slate-800">{formatCurrency(summary.totalSales)}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Total Transacciones</p>
                </div>
                <p className="text-2xl font-black text-slate-800">{summary.totalTransactions.toLocaleString()}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Top Producto</p>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-tight">{summary.topProduct?.product || '—'}</p>
                <p className="text-xs text-pink-600 font-semibold mt-1">{summary.topProduct?.participation?.toFixed(2)}% part.</p>
              </motion.div>
            </div>

            {/* Top 5 Chart */}
            {top5.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-500" />
                  Top 5 Productos por Venta Bruta
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top5} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="product" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => formatCurrency(v)} labelFormatter={l => l} />
                    <Bar dataKey="total_sales" radius={[6, 6, 0, 0]}>
                      {top5.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Filtros:</span>
              </div>
              <Select value={filterDept} onValueChange={v => { setFilterDept(v); setFilterSection('all'); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las secciones</SelectItem>
                  {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Hierarchy Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Tabla Jerárquica</h3>
                  <span className="text-xs text-slate-400">Haz clic para expandir</span>
                </div>
                <div className="p-4 space-y-2">
                  {filteredHierarchy.map(({ dept, sections }) => (
                    <HierarchyRow
                      key={dept}
                      dept={dept}
                      sections={sections}
                      filterSection={filterSection}
                    />
                  ))}
                  {filteredHierarchy.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No hay datos para los filtros seleccionados.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Back button */}
            <div className="flex justify-center pb-6">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Panel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}