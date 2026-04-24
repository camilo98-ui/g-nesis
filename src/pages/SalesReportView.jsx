import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BarChart3, DollarSign, TrendingUp,
  Filter, Search, X, Package, Layers, Star, Award, PieChart,
  Activity, ChevronDown, Calendar, GitCompare, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PYGModal from '@/components/reports/PYGModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RechartsPie, Pie, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
const MONTHS_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatCurrency(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Math.round(val || 0));
}

function formatPart(val) {
  if (val === null || val === undefined) return '—';
  return val.toFixed(2).replace('.', ',') + ' %';
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs max-w-[200px]">
      <p className="font-bold mb-1 text-pink-300 truncate">{label}</p>
      <p className="text-emerald-400 font-semibold">{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

function normalizeCode(code) {
  if (!code) return '';
  return code.toUpperCase().replace(/BOGOTA/g, 'BTA').replace(/\s+/g, ' ').trim();
}

// ─── Tabla jerárquica con buscador ───────────────────────────────────────────
function HierarchyTable({ hierarchy, filterDept, filterSection, onSelectProduct, selectedProduct, prevHierarchy }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [search, setSearch] = useState('');

  const toggleDept = (dept) => setExpandedDepts(p => ({ ...p, [dept]: !p[dept] }));
  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const searchActive = search.trim().length > 0;
  const searchLower = search.toLowerCase();

  // Build prev product map for quick lookup
  const prevProductMap = useMemo(() => {
    const map = {};
    prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => {
      map[p.product] = p;
    })));
    return map;
  }, [prevHierarchy]);

  const filtered = filterDept !== 'all' ? hierarchy.filter(h => h.dept === filterDept) : hierarchy;
  const rows = [];

  filtered.forEach(({ dept, sections, deptSales, deptPart }) => {
    const filteredSections = filterSection !== 'all' ? sections.filter(s => s.name === filterSection) : sections;
    let sectionsToShow = filteredSections;
    if (searchActive) {
      sectionsToShow = filteredSections
        .map(s => ({ ...s, products: s.products.filter(p => p.product?.toLowerCase().includes(searchLower)) }))
        .filter(s => s.products.length > 0);
    }
    if (sectionsToShow.length === 0) return;

    const deptExpanded = searchActive ? true : expandedDepts[dept];

    rows.push(
      <tr key={`dept-${dept}`} className="border-b border-rose-100">
        <td className="py-2.5 px-3 w-8" style={{ background: '#fdf2f8' }}>
          {!searchActive && (
            <button onClick={() => toggleDept(dept)}
              className="w-5 h-5 border flex items-center justify-center rounded-lg text-xs font-bold transition-all"
              style={{ borderColor: '#f9a8d4', color: '#e91e8c', background: '#fff' }}>
              {deptExpanded ? '−' : '+'}
            </button>
          )}
        </td>
        <td colSpan={3} className="py-2.5 px-3 font-bold text-sm uppercase tracking-wider" style={{ background: '#fdf2f8', color: '#9d174d' }}>{dept}</td>
        <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: '#fdf2f8', color: '#e91e8c' }}>{formatPart(deptPart)}</td>
        <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: '#fdf2f8', color: '#be185d' }}>{formatCurrency(deptSales)}</td>
        <td className="py-2.5 px-3 text-right" style={{ background: '#fdf2f8' }}>
          {(() => {
            const total = sections.flatMap(s => s.products).reduce((sum, p) => sum + (p.units_sold || 0), 0);
            return total > 0 ? <span className="text-slate-300 text-xs font-semibold">{total.toLocaleString('es-CO')}</span> : <span className="text-slate-500 text-xs">—</span>;
          })()}
        </td>
        <td className="py-2.5 px-3 text-right" style={{ background: '#fdf2f8' }}>
          {(() => {
            const prevDeptProds = sections.flatMap(s => s.products).map(p => {
              const prev = prevProductMap[p.product];
              return prev && prev.total_sales > 0 ? { curr: p.total_sales, prev: prev.total_sales } : null;
            }).filter(Boolean);
            if (prevDeptProds.length === 0) return <span className="text-slate-500 text-xs">—</span>;
            const currTotal = prevDeptProds.reduce((s, x) => s + x.curr, 0);
            const prevTotal = prevDeptProds.reduce((s, x) => s + x.prev, 0);
            const delta = ((currTotal - prevTotal) / prevTotal) * 100;
            return (
              <span className={`flex items-center justify-end gap-0.5 font-bold text-xs ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
              </span>
            );
          })()}
        </td>
      </tr>
    );

    if (!deptExpanded) return;

    sectionsToShow.forEach((section) => {
      const sectionKey = `${dept}__${section.name}`;
      const sectionExpanded = searchActive ? true : expandedSections[sectionKey];
      const hasProducts = section.products && section.products.length > 0;

      rows.push(
        <tr key={`section-${sectionKey}`} className="border-b border-rose-50 hover:bg-rose-50/30" style={{ background: '#fff9fb' }}>
          <td className="py-2 px-3 w-8">
            {hasProducts && !searchActive && (
              <button onClick={() => toggleSection(sectionKey)}
                className="w-5 h-5 border flex items-center justify-center rounded-lg text-xs font-bold transition-all"
                style={{ borderColor: '#fecdd3', color: '#f43f5e', background: '#fff' }}>
                {sectionExpanded ? '−' : '+'}
              </button>
            )}
          </td>
          <td className="py-2 px-3"></td>
          <td className="py-2 px-3 font-semibold text-sm" style={{ color: '#be185d' }}>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f9a8d4' }} />
              {section.name || '—'}
            </span>
          </td>
          <td className="py-2 px-3"></td>
          <td className="py-2 px-3 text-right font-semibold text-sm whitespace-nowrap" style={{ color: '#e91e8c' }}>{formatPart(section.sectionPart)}</td>
          <td className="py-2 px-3 text-right font-bold text-sm whitespace-nowrap text-slate-700">{formatCurrency(section.sectionSales)}</td>
          <td className="py-2 px-3 text-right text-indigo-500 text-xs whitespace-nowrap font-semibold">
            {(() => {
              const total = section.products.reduce((sum, p) => sum + (p.units_sold || 0), 0);
              return total > 0 ? total.toLocaleString('es-CO') : '—';
            })()}
          </td>
          <td className="py-2 px-3 text-right text-xs whitespace-nowrap">
            {(() => {
              const pairs = section.products.map(p => {
                const prev = prevProductMap[p.product];
                return prev && prev.total_sales > 0 ? { curr: p.total_sales, prev: prev.total_sales } : null;
              }).filter(Boolean);
              if (pairs.length === 0) return <span className="text-slate-300">—</span>;
              const currTotal = pairs.reduce((s, x) => s + x.curr, 0);
              const prevTotal = pairs.reduce((s, x) => s + x.prev, 0);
              const delta = ((currTotal - prevTotal) / prevTotal) * 100;
              return (
                <span className={`flex items-center justify-end gap-0.5 font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                </span>
              );
            })()}
          </td>
        </tr>
      );

      if (!sectionExpanded || !hasProducts) return;

      section.products.forEach((p, idx) => {
        const isSelected = selectedProduct?.product === p.product && selectedProduct?.section === p.section;
        const matchSearch = searchActive && p.product?.toLowerCase().includes(searchLower);
        const prev = prevProductMap[p.product];
        const hasPrev = !!prev;
        const delta = hasPrev && prev.total_sales > 0 ? ((p.total_sales - prev.total_sales) / prev.total_sales) * 100 : null;

        rows.push(
          <tr
            key={`prod-${sectionKey}-${idx}`}
            onClick={() => onSelectProduct(isSelected ? null : p)}
            className={`border-b border-slate-50 cursor-pointer transition-all duration-150
              ${isSelected ? 'bg-pink-100 border-pink-200' : 'bg-white hover:bg-pink-50/40'}
              ${matchSearch ? 'ring-1 ring-inset ring-amber-300' : ''}`}
          >
            <td className="py-1.5 px-3 w-8"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3 text-slate-700 text-xs pl-8 flex items-center gap-1.5">
              {isSelected && <Star className="w-3 h-3 text-pink-500 flex-shrink-0" />}
              <span className={isSelected ? 'font-bold text-pink-700' : ''}>{p.product}</span>
            </td>
            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap font-semibold" style={{ color: '#e91e8c' }}>{formatPart(p.participation)}</td>
            <td className="py-1.5 px-3 text-right font-bold text-slate-700 text-xs whitespace-nowrap">{formatCurrency(p.total_sales)}</td>
            <td className="py-1.5 px-3 text-right text-slate-500 text-xs whitespace-nowrap font-medium">
              {p.units_sold != null && p.units_sold > 0 ? p.units_sold.toLocaleString('es-CO') : '—'}
            </td>
            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap">
              {delta !== null ? (
                <span className={`flex items-center justify-end gap-0.5 font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                </span>
              ) : <span className="text-slate-300">—</span>}
            </td>
          </tr>
        );
      });
    });
  });

  return (
    <div>
      <div className="p-3 border-b border-rose-50" style={{ background: '#fff9fb' }}>
      <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#f9a8d4' }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border rounded-lg focus:outline-none bg-white"
            style={{ borderColor: '#fce7f3' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchActive && (
          <p className="text-xs text-amber-600 mt-1.5 pl-1">
            🔍 Resultados para "<strong>{search}</strong>" — clic para analizar
          </p>
        )}
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: '#fdf2f8' }}>
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Departamento</th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Sección</th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider text-slate-500">Producto</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: '#e91e8c' }}>% Part.</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap text-slate-500">Venta Bruta</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap text-slate-500">Uds.</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap text-slate-500">vs Mes Ant.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron resultados.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Panel de análisis de producto seleccionado ───────────────────────────────
function ProductAnalysisPanel({ product, hierarchy, grandTotal, prevHierarchy, prevMonthLabel }) {
  const dept = hierarchy.find(h => h.sections.some(s => s.products.some(p => p.product === product.product)));
  const section = dept?.sections.find(s => s.products.some(p => p.product === product.product));
  const siblingsInSection = section?.products || [];
  const siblingsInDept = dept?.sections.flatMap(s => s.products) || [];

  const rankInSection = [...siblingsInSection].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;
  const rankInDept = [...siblingsInDept].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;

  // Previous month data
  const prevProductMap = {};
  prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { prevProductMap[p.product] = p; })));
  const prevData = prevProductMap[product.product];
  const delta = prevData && prevData.total_sales > 0 ? ((product.total_sales - prevData.total_sales) / prevData.total_sales) * 100 : null;
  const absChange = prevData ? product.total_sales - prevData.total_sales : null;

  const competitors = [...siblingsInSection]
    .filter(p => p.product !== product.product)
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 4);

  const compChartData = [
    { name: product.product.length > 18 ? product.product.slice(0, 18) + '…' : product.product, venta: product.total_sales, fill: '#ec4899', isSelf: true },
    ...competitors.map((p, i) => ({
      name: p.product.length > 18 ? p.product.slice(0, 18) + '…' : p.product,
      venta: p.total_sales,
      fill: COLORS[(i + 1) % COLORS.length],
      isSelf: false
    }))
  ];

  // Insight
  const getInsight = () => {
    let insight = `<strong>${product.product}</strong> representa el <strong>${formatPart(product.participation)}</strong> de las ventas, siendo el <strong>#${rankInSection}</strong> en su sección y <strong>#${rankInDept}</strong> en el departamento.`;
    if (delta !== null) {
      if (delta > 10) insight += ` 🚀 Creció un <strong>+${delta.toFixed(1)}%</strong> vs ${prevMonthLabel} — producto en alza, prioridad de exhibición.`;
      else if (delta > 0) insight += ` 📈 Leve crecimiento de <strong>+${delta.toFixed(1)}%</strong> vs ${prevMonthLabel}. Mantener el desempeño.`;
      else if (delta > -10) insight += ` ⚠️ Cayó un <strong>${delta.toFixed(1)}%</strong> vs ${prevMonthLabel}. Revisar posicionamiento y stock.`;
      else insight += ` 🔴 Caída significativa de <strong>${delta.toFixed(1)}%</strong> vs ${prevMonthLabel}. Acción urgente recomendada.`;
    } else {
      insight += product.participation > (grandTotal > 0 ? (section?.sectionSales / grandTotal) * 100 / siblingsInSection.length : 0)
        ? ' Participación por encima del promedio — producto clave a potenciar.'
        : ' Hay oportunidad de crecimiento frente al promedio de la sección.';
    }
    return insight;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl shadow-lg border border-pink-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Análisis de Producto</p>
            <h3 className="text-xl font-black leading-tight">{product.product}</h3>
            <p className="text-white/80 text-sm mt-1">{dept?.dept} › {section?.name}</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center flex-shrink-0 ml-3">
            <p className="text-2xl font-black">{rankInSection}°</p>
            <p className="text-xs text-white/80">en sección</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">{formatPart(product.participation)}</p>
            <p className="text-xs text-white/70">Participación</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-lg font-black">{formatCurrency(product.total_sales)}</p>
            <p className="text-xs text-white/70">Venta Bruta</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            {delta !== null ? (
              <>
                <p className={`text-lg font-black ${delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                </p>
                <p className="text-xs text-white/70">vs {prevMonthLabel}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black">#{rankInDept}</p>
                <p className="text-xs text-white/70">en depto.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Variación vs mes anterior */}
        {delta !== null && (
          <div className={`rounded-xl p-4 border flex items-center gap-3 ${delta >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {delta >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <ArrowDownRight className="w-5 h-5 text-red-500 flex-shrink-0" />}
            <div>
              <p className={`font-black text-lg ${delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs {prevMonthLabel}
              </p>
              <p className={`text-xs ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {absChange >= 0 ? '+' : ''}{formatCurrency(absChange)} en ventas
              </p>
            </div>
          </div>
        )}

        {/* Insight narrativo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">💡 Insight</p>
          <p className="text-sm text-amber-700" dangerouslySetInnerHTML={{ __html: getInsight() }} />
        </div>

        {/* Comparación vs sección */}
        {compChartData.length > 1 && (
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-500" />
              Comparación vs. Competidores en Sección
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={compChartData} margin={{ left: 0, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 9 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="venta" radius={[6, 6, 0, 0]}>
                  {compChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} opacity={entry.isSelf ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radial gauges */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 text-center">% del Total Tienda</h4>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart innerRadius="60%" outerRadius="90%" data={[{ value: Math.min(product.participation, 100), fill: '#ec4899' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize={14} fontWeight="bold">
                  {product.participation.toFixed(1)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 text-center">% del Departamento</h4>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart innerRadius="60%" outerRadius="90%"
                data={[{ value: Math.min(dept?.deptSales > 0 ? (product.total_sales / dept.deptSales) * 100 : 0, 100), fill: '#8b5cf6' }]}
                startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#1e293b" fontSize={14} fontWeight="bold">
                  {(dept?.deptSales > 0 ? (product.total_sales / dept.deptSales) * 100 : 0).toFixed(1)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Gráfica donut departamentos ──────────────────────────────────────────────
function DeptPieChart({ hierarchy }) {
  const [activeDept, setActiveDept] = useState(null);
  const data = hierarchy.filter(h => h.deptSales > 0).map((h, i) => ({
    name: h.dept, value: h.deptSales, pct: h.deptPart, fill: COLORS[i % COLORS.length],
    sections: h.sections.length, products: h.sections.reduce((s, sec) => s + sec.products.length, 0),
  })).sort((a, b) => b.value - a.value);
  const active = activeDept ? data.find(d => d.name === activeDept) : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <RechartsPie>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}
                onMouseEnter={(_, idx) => setActiveDept(data[idx].name)}
                onMouseLeave={() => setActiveDept(null)}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} opacity={activeDept && activeDept !== entry.name ? 0.35 : 1} stroke="white" strokeWidth={2} style={{ cursor: 'pointer' }} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n, p) => [formatCurrency(v), p.payload.name]}
                contentStyle={{ borderRadius: 12, fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {active ? (
              <><p style={{ fontSize: 10 }} className="text-xs font-black text-slate-700">{active.pct.toFixed(1)}%</p><p style={{ fontSize: 8 }} className="text-slate-400">del total</p></>
            ) : (
              <><p style={{ fontSize: 9 }} className="text-xs font-black text-slate-700">{data.length}</p><p style={{ fontSize: 8 }} className="text-slate-400">deptos.</p></>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div key={i} onMouseEnter={() => setActiveDept(d.name)} onMouseLeave={() => setActiveDept(null)}
              className={`rounded-xl p-2.5 transition-all cursor-default ${activeDept === d.name ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                <span className="text-xs font-bold text-slate-700 truncate flex-1">{d.name}</span>
                <span className="text-xs font-black text-slate-800 flex-shrink-0">{d.pct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.pct}%`, background: d.fill }} />
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0">{formatCurrency(d.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top 10 ───────────────────────────────────────────────────────────────────
function Top10Chart({ products, onSelectProduct, selectedProduct, prevHierarchy }) {
  const prevMap = {};
  prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { prevMap[p.product] = p; })));

  const top10 = [...products].filter(p => p.total_sales > 0).sort((a, b) => b.total_sales - a.total_sales).slice(0, 10);
  const maxVal = top10[0]?.total_sales || 1;

  return (
    <div className="space-y-2">
      {top10.map((entry, idx) => {
        const isSelected = selectedProduct?.product === entry.product;
        const pct = (entry.total_sales / maxVal) * 100;
        const color = COLORS[idx % COLORS.length];
        const prev = prevMap[entry.product];
        const delta = prev && prev.total_sales > 0 ? ((entry.total_sales - prev.total_sales) / prev.total_sales) * 100 : null;
        return (
          <motion.div key={idx} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => onSelectProduct(isSelected ? null : entry)}
            className={`cursor-pointer rounded-xl px-4 py-3 transition-all border ${
              isSelected ? 'bg-pink-50 border-pink-300 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-black text-slate-400 w-5 flex-shrink-0">#{idx + 1}</span>
                <span className={`text-sm font-semibold truncate ${isSelected ? 'text-pink-700' : 'text-slate-700'}`}>{entry.product}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {delta !== null && (
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                )}
                <span className="text-sm font-black text-slate-800">{formatCurrency(entry.total_sales)}</span>
                <span className="text-xs text-slate-400">{formatPart(entry.participation)}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: idx * 0.04 }}
                className="h-full rounded-full" style={{ background: color, opacity: isSelected ? 1 : 0.75 }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Utilidad para construir jerarquía ────────────────────────────────────────
function buildHierarchy(records) {
  const products = records.filter(r => r.product && r.department);
  const grandTotal = products.reduce((s, r) => s + (r.total_sales || 0), 0);
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
      // Recalcular participación desde ventas reales para evitar valores absurdos del origen
      const mappedProds = prods.map(p => ({
        ...p,
        participation: grandTotal > 0 ? (p.total_sales / grandTotal) * 100 : 0
      }));
      return { name: secName, sectionSales, sectionPart, products: mappedProds };
    });
    const deptSales = sections.reduce((s, sec) => s + sec.sectionSales, 0);
    const deptPart = grandTotal > 0 ? (deptSales / grandTotal) * 100 : 0;
    return { dept, sections, deptSales, deptPart };
  }).sort((a, b) => b.deptSales - a.deptSales);
  const allProducts = products.map(p => ({
    ...p,
    participation: grandTotal > 0 ? (p.total_sales / grandTotal) * 100 : 0
  }));
  const topProduct = [...allProducts].sort((a, b) => b.total_sales - a.total_sales)[0];
  return {
    hierarchy, allProducts, grandTotal,
    summary: {
      totalSales: grandTotal,
      topProduct,
      totalProducts: allProducts.length,
      totalDepts: Object.keys(deptMap).length,
    }
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SalesReportView() {
  const storeCode = (() => {
    try {
      const session = JSON.parse(localStorage.getItem('popsySession') || '{}');
      return session.store || '';
    } catch { return ''; }
  })();

  const userRole = localStorage.getItem('userRole') || '';
  const now = new Date();

  const [filterDept, setFilterDept] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedCharts, setExpandedCharts] = useState({ pie: false, top10: false });
  const [showPYG, setShowPYG] = useState(false);

  // Month selector
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareMonth, setCompareMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [compareYear, setCompareYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['salesReport', storeCode],
    queryFn: async () => {
      if (!storeCode) return [];
      const records = await base44.entities.SalesReport.list('-uploaded_at', 5000);
      const normalizedSearch = normalizeCode(storeCode);
      return records.filter(r => {
        const normalizedCode = normalizeCode(r.store_code);
        return normalizedCode === normalizedSearch ||
               r.store_code === storeCode ||
               normalizedCode.replace(/\s/g, '') === normalizedSearch.replace(/\s/g, '');
      });
    },
    enabled: !!storeCode,
  });

  // Available months from data (deduplicated)
  const availableMonths = useMemo(() => {
    const seen = new Set();
    const result = [];
    allRecords.forEach(r => {
      if (r.month && r.year) {
        const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
        if (!seen.has(key)) { seen.add(key); result.push({ month: Number(r.month), year: Number(r.year) }); }
      }
    });
    // Fallback: group by report_id if no month fields
    if (result.length === 0) {
      const seenIds = new Set();
      allRecords.forEach(r => {
        if (r.report_id && !seenIds.has(r.report_id)) {
          seenIds.add(r.report_id);
          const date = r.uploaded_at ? new Date(r.uploaded_at) : new Date();
          const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
          if (!seen.has(key)) { seen.add(key); result.push({ month: date.getMonth() + 1, year: date.getFullYear() }); }
        }
      });
    }
    return result.sort((a, b) => b.year - a.year || b.month - a.month);
  }, [allRecords]);

  // Automatically select the latest available month
  const latestAvailable = availableMonths[0];
  const effectiveMonth = availableMonths.length > 0 ? selectedMonth : (now.getMonth() + 1);
  const effectiveYear = availableMonths.length > 0 ? selectedYear : now.getFullYear();

  // Filter records by selected month/year
  const currentRecords = useMemo(() => {
    if (allRecords.length === 0) return [];
    // If records have month/year fields
    const withMonths = allRecords.filter(r => r.month && r.year);
    if (withMonths.length > 0) {
      return withMonths.filter(r => r.month === effectiveMonth && r.year === effectiveYear);
    }
    // Fallback: use latest report_id
    const latestReportId = allRecords[0]?.report_id;
    return allRecords.filter(r => r.report_id === latestReportId);
  }, [allRecords, effectiveMonth, effectiveYear]);

  // Previous month records
  const prevRecords = useMemo(() => {
    const withMonths = allRecords.filter(r => r.month && r.year);
    if (withMonths.length > 0) {
      const pm = compareMode ? compareMonth : (effectiveMonth === 1 ? 12 : effectiveMonth - 1);
      const py = compareMode ? compareYear : (effectiveMonth === 1 ? effectiveYear - 1 : effectiveYear);
      return withMonths.filter(r => r.month === pm && r.year === py);
    }
    return [];
  }, [allRecords, effectiveMonth, effectiveYear, compareMode, compareMonth, compareYear]);

  const prevMonthLabel = useMemo(() => {
    if (compareMode) return `${MONTHS_NAMES[compareMonth - 1]} ${compareYear}`;
    const pm = effectiveMonth === 1 ? 12 : effectiveMonth - 1;
    const py = effectiveMonth === 1 ? effectiveYear - 1 : effectiveYear;
    return `${MONTHS_NAMES[pm - 1]} ${py}`;
  }, [compareMode, compareMonth, compareYear, effectiveMonth, effectiveYear]);

  const { hierarchy, summary, allProducts } = useMemo(() => buildHierarchy(currentRecords), [currentRecords]);
  const { hierarchy: prevHierarchy } = useMemo(() => buildHierarchy(prevRecords), [prevRecords]);

  const hasData = currentRecords.length > 0;

  const depts = useMemo(() => [...new Set(currentRecords.map(r => r.department).filter(Boolean))], [currentRecords]);
  const sections = useMemo(() => {
    const filtered = filterDept === 'all' ? currentRecords : currentRecords.filter(r => r.department === filterDept);
    return [...new Set(filtered.map(r => r.section).filter(Boolean))];
  }, [currentRecords, filterDept]);

  const handleBack = () => window.history.back();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const currentMonthLabel = `${MONTHS_NAMES[effectiveMonth - 1]} ${effectiveYear}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-rose-100 px-4 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
          <button onClick={handleBack} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-rose-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-800">Participación del Negocio</h1>
            <p className="text-slate-400 text-xs">{storeCode}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setShowPYG(true)} className="gap-2 h-9 px-3 text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f472b6, #e91e8c)' }}>
              <TrendingUp className="w-4 h-4" /> P&G
            </Button>
            {hasData && (
              <div className="hidden md:block text-right ml-2 bg-rose-50 rounded-xl px-4 py-2">
                <p className="text-lg font-black" style={{ color: '#e91e8c' }}>{formatCurrency(summary.totalSales)}</p>
                <p className="text-xs text-slate-400">Venta Total</p>
              </div>
            )}
          </div>
        </div>

        {/* Month filter bar */}
        <div className="max-w-6xl mx-auto mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-slate-500 font-medium">Ver mes:</span>
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedProduct(null); }}
              className="bg-transparent text-slate-700 text-sm font-bold border-none outline-none cursor-pointer"
            >
              {MONTHS_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedProduct(null); }}
              className="bg-transparent text-slate-700 text-sm font-bold border-none outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Available months chips */}
          {availableMonths.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {availableMonths.slice(0, 6).map((m, i) => {
                const isActive = m.month === selectedMonth && m.year === selectedYear;
                return (
                  <button key={i} onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); setSelectedProduct(null); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isActive ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500'}`}
                    style={isActive ? { background: 'linear-gradient(135deg, #f9a8d4, #e91e8c)', border: 'none' } : {}}>
                    {MONTHS_NAMES[m.month - 1].slice(0, 3)} {m.year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Compare toggle */}
          <button
            onClick={() => setCompareMode(m => !m)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${compareMode ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-rose-200 bg-white'}`}
            style={compareMode ? { background: 'linear-gradient(135deg, #f9a8d4, #e91e8c)' } : {}}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {compareMode ? 'Comparando' : 'Comparar meses'}
          </button>

          {compareMode && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              <span className="text-xs font-medium" style={{ color: '#e91e8c' }}>vs</span>
              <select value={compareMonth} onChange={e => setCompareMonth(Number(e.target.value))}
                className="bg-transparent text-slate-700 text-xs font-bold border-none outline-none cursor-pointer">
                {MONTHS_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={compareYear} onChange={e => setCompareYear(Number(e.target.value))}
                className="bg-transparent text-slate-700 text-xs font-bold border-none outline-none cursor-pointer">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {!hasData ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Sin datos para {currentMonthLabel}</h2>
            <p className="text-slate-500 text-sm">
              {availableMonths.length > 0
                ? `Selecciona otro mes. Meses disponibles: ${availableMonths.map(m => `${MONTHS_NAMES[m.month-1]} ${m.year}`).join(', ')}`
                : 'El gerente debe cargar el reporte de participación para ver los datos.'}
            </p>
            <Button onClick={handleBack} variant="outline" className="mt-6"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </motion.div>
        ) : (
          <>
            {/* Compare summary banner */}
            {compareMode && prevRecords.length > 0 && (() => {
              const prevTotal = prevRecords.filter(r => r.product && r.department).reduce((s, r) => s + (r.total_sales || 0), 0);
              const delta = prevTotal > 0 ? ((summary.totalSales - prevTotal) / prevTotal) * 100 : null;
              return (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-rose-100 bg-rose-50 p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fdf2f8' }}>
                    <GitCompare className="w-4 h-4" style={{ color: '#e91e8c' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Comparativo: <span style={{ color: '#e91e8c' }}>{currentMonthLabel}</span> <span className="text-slate-400">vs</span> <span className="text-slate-500">{prevMonthLabel}</span></p>
                    <p className="text-xs mt-0.5 text-slate-500">
                      {formatCurrency(summary.totalSales)} vs {formatCurrency(prevTotal)}
                      {delta !== null && ` · ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% variación`}
                    </p>
                  </div>
                  <div className={`text-lg font-black flex items-center gap-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                    {delta >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    {delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : '—'}
                  </div>
                </motion.div>
              );
            })()}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Venta Total', value: formatCurrency(summary.totalSales), sub: null, accent: '#e91e8c', accentBg: '#fdf2f8' },
                { icon: Package, label: 'Productos', value: summary.totalProducts, sub: null, accent: '#9d4edd', accentBg: '#f5f0ff' },
                { icon: Layers, label: 'Departamentos', value: summary.totalDepts, sub: null, accent: '#6b7280', accentBg: '#f9fafb' },
                { icon: Award, label: 'Top Producto', value: summary.topProduct?.product || '—', sub: formatCurrency(summary.topProduct?.total_sales), accent: '#e91e8c', accentBg: '#fdf2f8' },
              ].map(({ icon: Icon, label, value, sub, accent, accentBg }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4 overflow-hidden relative hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[2rem] opacity-40" style={{ background: accentBg }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 flex-shrink-0" style={{ background: accentBg }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
                  <p className={`font-black text-slate-800 ${typeof value === 'string' && value.length > 15 ? 'text-xs leading-tight' : 'text-xl'}`}>{value}</p>
                  {sub && <p className="text-xs font-semibold mt-0.5" style={{ color: accent }}>{sub}</p>}
                </motion.div>
              ))}
            </div>

            {/* Charts Row — PRO White + Magenta Suave */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Mix de Departamentos */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header con acento magenta */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">Distribución</p>
                      <h3 className="text-slate-900 font-black text-lg leading-tight">Mix de Departamentos</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{currentMonthLabel} · {hierarchy.length} categorías</p>
                    </div>
                    <div className="text-right bg-rose-50 rounded-xl px-3 py-2">
                      <p className="text-xl font-black" style={{ color: '#e91e8c' }}>{formatCurrency(summary.totalSales)}</p>
                      <p className="text-slate-400 text-[10px]">venta total</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
                  {hierarchy.filter(h => h.deptSales > 0).map((h, i) => {
                    const isTop = i === 0;
                    return (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isTop ? '#e91e8c' : '#cbd5e1' }} />
                            <span className={`text-sm font-semibold truncate ${isTop ? 'text-slate-900' : 'text-slate-600'}`}>{h.dept}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            <span className="text-slate-400 text-xs">{formatCurrency(h.deptSales)}</span>
                            <span className="text-sm font-black min-w-[3rem] text-right" style={{ color: isTop ? '#e91e8c' : '#94a3b8' }}>
                              {h.deptPart.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(h.deptPart, 100)}%` }}
                            transition={{ duration: 0.9, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{
                              background: isTop
                                ? 'linear-gradient(90deg, #e91e8c, #f472b6)'
                                : 'linear-gradient(90deg, #cbd5e1, #e2e8f0)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Top 10 Productos */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">Ranking</p>
                      <h3 className="text-slate-900 font-black text-lg leading-tight">Top 10 Productos</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{currentMonthLabel} · clic para análisis</p>
                    </div>
                    <div className="text-right bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-xl font-black text-slate-700">{allProducts.length}</p>
                      <p className="text-slate-400 text-[10px]">productos</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
                  {(() => {
                    const prevMap = {};
                    prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { prevMap[p.product] = p; })));
                    const top10 = [...allProducts].filter(p => p.total_sales > 0).sort((a, b) => b.total_sales - a.total_sales).slice(0, 10);
                    const maxVal = top10[0]?.total_sales || 1;
                    return top10.map((p, i) => {
                      const pct = (p.total_sales / maxVal) * 100;
                      const prev = prevMap[p.product];
                      const delta = prev && prev.total_sales > 0 ? ((p.total_sales - prev.total_sales) / prev.total_sales) * 100 : null;
                      const isSelected = selectedProduct?.product === p.product;
                      const isTop3 = i < 3;
                      return (
                        <motion.div key={i}
                          whileHover={{ backgroundColor: '#fdf2f8' }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedProduct(isSelected ? null : p)}
                          className="cursor-pointer rounded-xl px-3 py-2.5 transition-all"
                          style={{
                            background: isSelected ? '#fce7f3' : 'transparent',
                            border: isSelected ? '1px solid #f9a8d4' : '1px solid transparent',
                          }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* Número */}
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                              style={{
                                background: isTop3 ? (isSelected ? '#e91e8c' : '#fce7f3') : '#f1f5f9',
                                color: isTop3 ? (isSelected ? '#fff' : '#e91e8c') : '#94a3b8'
                              }}>
                              {i + 1}
                            </div>
                            <span className="text-slate-800 text-xs font-semibold truncate flex-1">{p.product}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {delta !== null && (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                                </span>
                              )}
                              <span className="text-xs font-black text-slate-800">{formatCurrency(p.total_sales)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-8">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full"
                              style={{
                                background: isSelected
                                  ? '#e91e8c'
                                  : isTop3
                                  ? `linear-gradient(90deg, #e91e8c, #f9a8d4)`
                                  : '#e2e8f0'
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            </div>

            {/* Product analysis modal */}
            <AnimatePresence>
              {selectedProduct && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                  onClick={() => setSelectedProduct(null)}>
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                    <button onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow text-slate-500 hover:text-slate-800 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                    <ProductAnalysisPanel
                      product={selectedProduct}
                      hierarchy={hierarchy}
                      grandTotal={summary.totalSales}
                      prevHierarchy={prevHierarchy}
                      prevMonthLabel={prevMonthLabel}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabla jerárquica */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-rose-50" style={{ background: '#fff9fb' }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" style={{ color: '#e91e8c' }} />
                      Tabla Jerárquica · {currentMonthLabel}
                    </h3>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterSection('all'); }}
                        className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
                        <option value="all">Todos los deptos.</option>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                        className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
                        <option value="all">Todas las secciones</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    La columna <strong>"vs Mes Ant."</strong> compara vs <strong>{prevMonthLabel}</strong> · Clic en producto para análisis completo
                    {prevRecords.length === 0 && (
                      <span className="ml-2 text-amber-500 font-semibold">⚠ Sin datos de {prevMonthLabel} — carga ese mes para ver comparativo</span>
                    )}
                  </p>
                </div>
                <HierarchyTable
                  hierarchy={hierarchy}
                  filterDept={filterDept}
                  filterSection={filterSection}
                  onSelectProduct={setSelectedProduct}
                  selectedProduct={selectedProduct}
                  prevHierarchy={prevHierarchy}
                />
              </div>
            </motion.div>

            <div className="flex justify-center pb-6">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver al Panel
              </Button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showPYG && <PYGModal storeId={storeCode} onClose={() => setShowPYG(false)} />}
      </AnimatePresence>
    </div>
  );
}