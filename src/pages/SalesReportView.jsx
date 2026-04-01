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

function formatPart(val) {
  if (val === null || val === undefined) return '—';
  return val.toFixed(2).replace('.', ',') + ' %';
}

// Tabla jerárquica tipo pivot: Departamento | Sección | Descripción Prod. | % Part. | Venta Bruta
function HierarchyTable({ hierarchy, filterDept, filterSection, totalSales }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  const toggleDept = (dept) => setExpandedDepts(p => ({ ...p, [dept]: !p[dept] }));
  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const filtered = filterDept !== 'all'
    ? hierarchy.filter(h => h.dept === filterDept)
    : hierarchy;

  const rows = [];

  filtered.forEach(({ dept, sections, deptSales, deptPart }) => {
    const deptExpanded = expandedDepts[dept];
    const filteredSections = filterSection !== 'all'
      ? sections.filter(s => s.name === filterSection)
      : sections;

    if (filteredSections.length === 0) return;

    // Dept row
    rows.push(
      <tr key={`dept-${dept}`} className="bg-slate-100 border-b border-slate-200">
        <td className="py-2 px-3 w-8">
          <button
            onClick={() => toggleDept(dept)}
            className="w-5 h-5 border border-slate-400 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-sm text-xs font-bold"
          >
            {deptExpanded ? '−' : '+'}
          </button>
        </td>
        <td className="py-2 px-3 font-semibold text-slate-800 text-sm uppercase tracking-wide">{dept}</td>
        <td className="py-2 px-3"></td>
        <td className="py-2 px-3"></td>
        <td className="py-2 px-3 text-right font-semibold text-rose-500 text-sm whitespace-nowrap">{formatPart(deptPart)}</td>
        <td className="py-2 px-3 text-right font-bold text-rose-500 text-sm whitespace-nowrap">{formatCurrency(deptSales)}</td>
      </tr>
    );

    if (!deptExpanded) return;

    filteredSections.forEach((section) => {
      const sectionKey = `${dept}__${section.name}`;
      const sectionExpanded = expandedSections[sectionKey];
      const hasProducts = section.products && section.products.length > 0;

      rows.push(
        <tr key={`section-${sectionKey}`} className="border-b border-slate-100 bg-white hover:bg-slate-50">
          <td className="py-1.5 px-3 w-8">
            {hasProducts && (
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-5 h-5 border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-sm text-xs font-bold"
              >
                {sectionExpanded ? '−' : '+'}
              </button>
            )}
          </td>
          <td className="py-1.5 px-3"></td>
          <td className="py-1.5 px-3 font-medium text-slate-700 text-sm pl-4">{section.name || '—'}</td>
          <td className="py-1.5 px-3"></td>
          <td className="py-1.5 px-3 text-right text-rose-400 font-medium text-sm whitespace-nowrap">{formatPart(section.sectionPart)}</td>
          <td className="py-1.5 px-3 text-right font-bold text-rose-400 text-sm whitespace-nowrap">{formatCurrency(section.sectionSales)}</td>
        </tr>
      );

      if (!sectionExpanded || !hasProducts) return;

      section.products.forEach((p, idx) => {
        rows.push(
          <tr key={`prod-${sectionKey}-${idx}`} className="border-b border-slate-50 bg-white hover:bg-pink-50/20">
            <td className="py-1 px-3 w-8"></td>
            <td className="py-1 px-3"></td>
            <td className="py-1 px-3"></td>
            <td className="py-1 px-3 text-slate-600 text-xs pl-8">{p.product}</td>
            <td className="py-1 px-3 text-right text-pink-400 text-xs whitespace-nowrap">{formatPart(p.participation)}</td>
            <td className="py-1 px-3 text-right font-bold text-pink-500 text-xs whitespace-nowrap">{formatCurrency(p.total_sales)}</td>
          </tr>
        );
      });
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-700 text-white">
            <th className="py-3 px-3 w-8"></th>
            <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Departamento</th>
            <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Sección</th>
            <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Descripción Prod.</th>
            <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap">% Part. Venta Bruta</th>
            <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Venta Bruta</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows : (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">No hay datos para los filtros seleccionados.</td>
            </tr>
          )}
        </tbody>
      </table>
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

  // All records are product-level: build hierarchy by summing from products up
  const { hierarchy, summary, top5 } = useMemo(() => {
    // All records are product rows (level='product')
    const products = rawRecords.filter(r => r.product && r.department);
    const grandTotal = products.reduce((s, r) => s + (r.total_sales || 0), 0);

    // Group by dept -> section -> products
    const deptMap = {};
    products.forEach(r => {
      const dept = r.department;
      const sec = r.section || '';
      if (!deptMap[dept]) deptMap[dept] = {};
      if (!deptMap[dept][sec]) deptMap[dept][sec] = [];
      deptMap[dept][sec].push(r);
    });

    const hierarchy = Object.entries(deptMap).map(([dept, sectionMap]) => {
      const sections = Object.entries(sectionMap).map(([secName, prods]) => {
        const sectionSales = prods.reduce((s, p) => s + (p.total_sales || 0), 0);
        const sectionPart = grandTotal > 0 ? (sectionSales / grandTotal) * 100 : 0;
        // participation in DB is decimal (e.g. 0.9137) → multiply by 100 to display
        const mappedProds = prods.map(p => ({
          ...p,
          participation: (p.participation || 0) * 100,
        }));
        return { name: secName, sectionSales, sectionPart, products: mappedProds };
      });
      const deptSales = sections.reduce((s, sec) => s + sec.sectionSales, 0);
      const deptPart = grandTotal > 0 ? (deptSales / grandTotal) * 100 : 0;
      return { dept, sections, deptSales, deptPart };
    });

    const topProduct = [...products].sort((a, b) => b.total_sales - a.total_sales)[0];
    const summary = {
      totalSales: grandTotal,
      totalTransactions: products.reduce((s, r) => s + (r.total_transactions || 0), 0),
      topProduct: topProduct ? { ...topProduct, participation: (topProduct.participation || 0) * 100 } : null,
    };

    const top5 = [...products]
      .filter(r => r.total_sales > 0)
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 5);

    return { hierarchy, summary, top5 };
  }, [rawRecords]);

  const depts = useMemo(() => [...new Set(rawRecords.map(r => r.department).filter(Boolean))], [rawRecords]);
  const sections = useMemo(() => {
    const filtered = filterDept === 'all' ? rawRecords : rawRecords.filter(r => r.department === filterDept);
    return [...new Set(filtered.map(r => r.section).filter(Boolean))];
  }, [rawRecords, filterDept]);

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
                  <span className="text-xs text-slate-400">Haz clic en + para expandir</span>
                </div>
                <HierarchyTable
                  hierarchy={hierarchy}
                  filterDept={filterDept}
                  filterSection={filterSection}
                  totalSales={summary.totalSales}
                />
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