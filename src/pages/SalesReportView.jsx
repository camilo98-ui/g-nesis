import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BarChart3, DollarSign, TrendingUp, Filter,
  Search, X, Package, Layers, Star, Award, PieChart, Activity, ChevronDown, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AggregatorsModal from '@/components/reports/AggregatorsModal';
import PYGModal from '@/components/reports/PYGModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RechartsPie, Pie, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
const GRADIENT_PAIRS = [
  ['#ec4899', '#f472b6'],
  ['#8b5cf6', '#a78bfa'],
  ['#3b82f6', '#60a5fa'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
];

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
      {payload[1] && <p className="text-purple-300">{payload[1]?.value?.toFixed(2)}% part.</p>}
    </div>
  );
};

// ─── Tabla jerárquica con buscador ───────────────────────────────────────────
function HierarchyTable({ hierarchy, filterDept, filterSection, onSelectProduct, selectedProduct }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [search, setSearch] = useState('');

  const toggleDept = (dept) => setExpandedDepts(p => ({ ...p, [dept]: !p[dept] }));
  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const searchActive = search.trim().length > 0;
  const searchLower = search.toLowerCase();

  const filtered = filterDept !== 'all'
    ? hierarchy.filter(h => h.dept === filterDept)
    : hierarchy;

  const rows = [];

  filtered.forEach(({ dept, sections, deptSales, deptPart }) => {
    const filteredSections = filterSection !== 'all'
      ? sections.filter(s => s.name === filterSection)
      : sections;

    // When searching, filter products and only show depts/sections that have matches
    let sectionsToShow = filteredSections;
    if (searchActive) {
      sectionsToShow = filteredSections
        .map(s => ({ ...s, products: s.products.filter(p => p.product?.toLowerCase().includes(searchLower)) }))
        .filter(s => s.products.length > 0);
    }

    if (sectionsToShow.length === 0) return;

    const deptExpanded = searchActive ? true : expandedDepts[dept];

    rows.push(
      <tr key={`dept-${dept}`} className="border-b border-slate-200">
        <td className="py-2.5 px-3 w-8 bg-gradient-to-r from-slate-800 to-slate-700">
          {!searchActive && (
            <button onClick={() => toggleDept(dept)}
              className="w-5 h-5 border border-slate-400 flex items-center justify-center text-white hover:bg-white/20 rounded-sm text-xs font-bold">
              {deptExpanded ? '−' : '+'}
            </button>
          )}
        </td>
        <td colSpan={3} className="py-2.5 px-3 font-bold text-white text-sm uppercase tracking-wider bg-gradient-to-r from-slate-800 to-slate-700">
          {dept}
        </td>
        <td className="py-2.5 px-3 text-right font-bold text-pink-300 text-sm whitespace-nowrap bg-gradient-to-r from-slate-700 to-slate-800">{formatPart(deptPart)}</td>
        <td className="py-2.5 px-3 text-right font-bold text-emerald-300 text-sm whitespace-nowrap bg-gradient-to-r from-slate-700 to-slate-800">{formatCurrency(deptSales)}</td>
      </tr>
    );

    if (!deptExpanded) return;

    sectionsToShow.forEach((section) => {
      const sectionKey = `${dept}__${section.name}`;
      const sectionExpanded = searchActive ? true : expandedSections[sectionKey];
      const hasProducts = section.products && section.products.length > 0;

      rows.push(
        <tr key={`section-${sectionKey}`} className="border-b border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50">
          <td className="py-2 px-3 w-8">
            {hasProducts && !searchActive && (
              <button onClick={() => toggleSection(sectionKey)}
                className="w-5 h-5 border border-indigo-300 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 rounded-sm text-xs font-bold">
                {sectionExpanded ? '−' : '+'}
              </button>
            )}
          </td>
          <td className="py-2 px-3"></td>
          <td colSpan={2} className="py-2 px-3 font-semibold text-indigo-700 text-sm pl-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            {section.name || '—'}
          </td>
          <td className="py-2 px-3 text-right text-indigo-500 font-semibold text-sm whitespace-nowrap">{formatPart(section.sectionPart)}</td>
          <td className="py-2 px-3 text-right font-bold text-indigo-600 text-sm whitespace-nowrap">{formatCurrency(section.sectionSales)}</td>
        </tr>
      );

      if (!sectionExpanded || !hasProducts) return;

      section.products.forEach((p, idx) => {
        const isSelected = selectedProduct?.product === p.product && selectedProduct?.section === p.section;
        const matchSearch = searchActive && p.product?.toLowerCase().includes(searchLower);
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
            <td className="py-1.5 px-3 text-right text-pink-500 text-xs whitespace-nowrap font-medium">{formatPart(p.participation)}</td>
            <td className="py-1.5 px-3 text-right font-bold text-pink-600 text-xs whitespace-nowrap">{formatCurrency(p.total_sales)}</td>
          </tr>
        );
      });
    });
  });

  return (
    <div>
      {/* Search bar */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchActive && (
          <p className="text-xs text-amber-600 mt-1.5 pl-1">
            🔍 Mostrando resultados para "<strong>{search}</strong>" — haz clic en un producto para analizarlo
          </p>
        )}
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-white">
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Departamento</th>
              <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Sección</th>
              <th className="py-3 px-3 text-left font-semibold text-xs uppercase tracking-wider">Producto</th>
              <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap">% Participación</th>
              <th className="py-3 px-3 text-right font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Venta Bruta</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
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
function ProductAnalysisPanel({ product, hierarchy, grandTotal }) {
  if (!product) return null;

  const dept = hierarchy.find(h => h.sections.some(s => s.products.some(p => p.product === product.product)));
  const section = dept?.sections.find(s => s.products.some(p => p.product === product.product));
  const siblingsInSection = section?.products || [];
  const siblingsInDept = dept?.sections.flatMap(s => s.products) || [];

  const rankInSection = [...siblingsInSection].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;
  const rankInDept = [...siblingsInDept].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;

  // Top competitors in section (excluding self)
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

  // Participation gauge data
  const gaugeData = [{ name: 'Part.', value: product.participation, fill: '#ec4899' }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl shadow-lg border border-pink-200 overflow-hidden"
    >
      {/* Header del panel */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Análisis de Producto</p>
            <h3 className="text-xl font-black leading-tight">{product.product}</h3>
            <p className="text-white/80 text-sm mt-1">
              {dept?.dept} › {section?.name}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center flex-shrink-0 ml-3">
            <p className="text-2xl font-black">{rankInSection}°</p>
            <p className="text-xs text-white/80">en sección</p>
          </div>
        </div>

        {/* KPI strip */}
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
            <p className="text-lg font-black">#{rankInDept}</p>
            <p className="text-xs text-white/70">en depto.</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Insight narrativo */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">💡 Insight</p>
          <p className="text-sm text-amber-700">
            <strong>{product.product}</strong> representa el <strong>{formatPart(product.participation)}</strong> de las ventas totales
            de la tienda, siendo el <strong>producto #{rankInSection}</strong> dentro de su sección{' '}
            <strong>{section?.name}</strong> y el <strong>#{rankInDept}</strong> en el departamento <strong>{dept?.dept}</strong>.
            {product.participation > (grandTotal > 0 ? (section?.sectionSales / grandTotal) * 100 / siblingsInSection.length : 0)
              ? ' Su participación está por encima del promedio de la sección — un producto clave a potenciar.'
              : ' Hay oportunidad de crecimiento frente al promedio de la sección.'}
          </p>
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

        {/* Share radial */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 text-center">% del Total Tienda</h4>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart innerRadius="60%" outerRadius="90%" data={[{ value: Math.min(product.participation, 100), fill: '#ec4899' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-black" fill="#1e293b" fontSize={14} fontWeight="bold">
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

// ─── Gráfica de participación por departamento (Donut + lista) ───────────────
function DeptPieChart({ hierarchy }) {
  const [activeDept, setActiveDept] = useState(null);

  const data = hierarchy
    .filter(h => h.deptSales > 0)
    .map((h, i) => ({
      name: h.dept,
      value: h.deptSales,
      pct: h.deptPart,
      fill: COLORS[i % COLORS.length],
      sections: h.sections.length,
      products: h.sections.reduce((s, sec) => s + sec.products.length, 0),
    }))
    .sort((a, b) => b.value - a.value);

  const active = activeDept ? data.find(d => d.name === activeDept) : null;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <RechartsPie>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                dataKey="value"
                paddingAngle={2}
                onMouseEnter={(_, idx) => setActiveDept(data[idx].name)}
                onMouseLeave={() => setActiveDept(null)}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.fill}
                    opacity={activeDept && activeDept !== entry.name ? 0.35 : 1}
                    stroke="white"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n, p) => [formatCurrency(v), p.payload.name]}
                contentStyle={{ borderRadius: 12, fontSize: 11, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
          {/* Centro del donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {active ? (
              <>
                <p className="text-xs font-black text-slate-700" style={{ fontSize: 10 }}>{active.pct.toFixed(1)}%</p>
                <p className="text-slate-400" style={{ fontSize: 8 }}>del total</p>
              </>
            ) : (
              <>
                <p className="text-xs font-black text-slate-700" style={{ fontSize: 9 }}>{data.length}</p>
                <p className="text-slate-400" style={{ fontSize: 8 }}>deptos.</p>
              </>
            )}
          </div>
        </div>

        {/* Lista de departamentos */}
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveDept(d.name)}
              onMouseLeave={() => setActiveDept(null)}
              className={`rounded-xl p-2.5 transition-all cursor-default ${
                activeDept === d.name ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50'
              }`}
            >
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
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-slate-400">{d.sections} secciones</span>
                <span className="text-[10px] text-slate-400">{d.products} productos</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top 10 productos horizontal bar ─────────────────────────────────────────
function Top10Chart({ products, onSelectProduct, selectedProduct }) {
  const top10 = [...products].filter(p => p.total_sales > 0).sort((a, b) => b.total_sales - a.total_sales).slice(0, 10);
  const maxVal = top10[0]?.total_sales || 1;

  return (
    <div className="space-y-2">
      {top10.map((entry, idx) => {
        const isSelected = selectedProduct?.product === entry.product;
        const pct = (entry.total_sales / maxVal) * 100;
        const color = COLORS[idx % COLORS.length];
        return (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectProduct(isSelected ? null : entry)}
            className={`cursor-pointer rounded-xl px-4 py-3 transition-all border ${
              isSelected
                ? 'bg-pink-50 border-pink-300 shadow-md'
                : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-black text-slate-400 w-5 flex-shrink-0">#{idx + 1}</span>
                <span className={`text-sm font-semibold truncate ${isSelected ? 'text-pink-700' : 'text-slate-700'}`}>
                  {entry.product}
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <span className="text-sm font-black text-slate-800">{formatCurrency(entry.total_sales)}</span>
                <span className="text-xs text-slate-400 ml-2">{formatPart(entry.participation)}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: idx * 0.04 }}
                className="h-full rounded-full"
                style={{ background: color, opacity: isSelected ? 1 : 0.75 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SalesReportView() {
  const storeCode = (() => {
    try {
      const session = JSON.parse(localStorage.getItem('popsySession') || '{}');
      return session.store || '';
    } catch { return ''; }
  })();

  const [filterDept, setFilterDept] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedCharts, setExpandedCharts] = useState({ pie: false, top10: false });
  const [showAggregators, setShowAggregators] = useState(false);
  const [showPYG, setShowPYG] = useState(false);

  const { data: rawRecords = [], isLoading } = useQuery({
    queryKey: ['salesReport', storeCode],
    queryFn: async () => {
      if (!storeCode) return [];
      // Traer todos los registros del último report_id
      const allRecords = await base44.entities.SalesReport.list('-uploaded_at', 2000);
      if (allRecords.length === 0) return [];

      // Normalizar el storeCode de sesión para comparar
      const normalizeCode = (code) => {
        if (!code) return '';
        return code.toUpperCase()
          .replace(/BOGOTA/g, 'BTA')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedSearch = normalizeCode(storeCode);
      
      // Filtrar por el report_id más reciente
      const latestReportId = allRecords[0]?.report_id;
      const latestRecords = allRecords.filter(r => r.report_id === latestReportId);

      // Buscar coincidencia flexible
      const filtered = latestRecords.filter(r => {
        const normalizedCode = normalizeCode(r.store_code);
        return normalizedCode === normalizedSearch || 
               r.store_code === storeCode ||
               normalizedCode.replace(/\s/g, '') === normalizedSearch.replace(/\s/g, '');
      });

      return filtered;
    },
    enabled: !!storeCode,
  });

  const hasData = rawRecords.length > 0;

  const { hierarchy, summary, allProducts } = useMemo(() => {
    const products = rawRecords.filter(r => r.product && r.department);
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
        const mappedProds = prods.map(p => ({
          ...p,
          participation: (p.participation || 0) * 100,
        }));
        return { name: secName, sectionSales, sectionPart, products: mappedProds };
      });
      const deptSales = sections.reduce((s, sec) => s + sec.sectionSales, 0);
      const deptPart = grandTotal > 0 ? (deptSales / grandTotal) * 100 : 0;
      return { dept, sections, deptSales, deptPart };
    }).sort((a, b) => b.deptSales - a.deptSales);

    const allProductsMapped = products.map(p => ({ ...p, participation: (p.participation || 0) * 100 }));
    const topProduct = [...allProductsMapped].sort((a, b) => b.total_sales - a.total_sales)[0];

    const summary = {
      totalSales: grandTotal,
      totalTransactions: products.reduce((s, r) => s + (r.total_transactions || 0), 0),
      topProduct,
      totalProducts: allProductsMapped.length,
      totalDepts: Object.keys(deptMap).length,
    };

    return { hierarchy, summary, allProducts: allProductsMapped };
  }, [rawRecords]);

  const depts = useMemo(() => [...new Set(rawRecords.map(r => r.department).filter(Boolean))], [rawRecords]);
  const sections = useMemo(() => {
    const filtered = filterDept === 'all' ? rawRecords : rawRecords.filter(r => r.department === filterDept);
    return [...new Set(filtered.map(r => r.section).filter(Boolean))];
  }, [rawRecords, filterDept]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-purple-900 text-white px-4 py-6 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight">Participación del Negocio</h1>
            <p className="text-white/60 text-sm">{storeCode} · Reporte de ventas por producto</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={() => setShowPYG(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-4 text-sm font-semibold"
            >
              <TrendingUp className="w-4 h-4" />
              P&G
            </Button>
            <Button
              onClick={() => setShowAggregators(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9 px-4 text-sm font-semibold"
            >
              <Truck className="w-4 h-4" />
              Agregadores
            </Button>
            {hasData && (
              <div className="hidden md:block text-right">
                <p className="text-2xl font-black text-emerald-300">{formatCurrency(summary.totalSales)}</p>
                <p className="text-xs text-white/50">Venta Total</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {!hasData ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">El gerente aún no ha cargado el reporte</h2>
            <p className="text-slate-500 text-sm">Cuando el gerente suba el archivo, podrás ver los datos aquí.</p>
            <Button onClick={handleBack} variant="outline" className="mt-6"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </motion.div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Venta Total', value: formatCurrency(summary.totalSales), bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
                { icon: Package, label: 'Productos', value: summary.totalProducts, bg: 'from-blue-500 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50' },
                { icon: Layers, label: 'Departamentos', value: summary.totalDepts, bg: 'from-purple-500 to-violet-500', text: 'text-purple-600', light: 'bg-purple-50' },
                { icon: Award, label: 'Top Producto', value: summary.topProduct?.product || '—', sub: formatCurrency(summary.topProduct?.total_sales), bg: 'from-pink-500 to-rose-500', text: 'text-pink-600', light: 'bg-pink-50' },
              ].map(({ icon: Icon, label, value, sub, bg, text, light }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl ${light} opacity-60`} />
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                  <p className={`font-black text-slate-800 ${typeof value === 'string' && value.length > 15 ? 'text-xs leading-tight' : 'text-xl'}`}>{value}</p>
                  {sub && <p className={`text-xs ${text} font-semibold mt-0.5`}>{sub}</p>}
                </motion.div>
              ))}
            </div>

            {/* Charts Row - Collapsible */}
            <div className="space-y-4">

              {/* Mix de Departamentos - Collapsible */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl shadow-lg overflow-hidden border border-purple-100 scroll-mt-20">
                <button
                  onClick={() => setExpandedCharts(p => ({ ...p, pie: !p.pie }))}
                  className="w-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-5 py-4 text-white text-left hover:opacity-90 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <PieChart className="w-4 h-4 text-purple-200" />
                        <h3 className="font-bold text-sm">Mix de Departamentos</h3>
                      </div>
                      <p className="text-purple-200 text-xs">Distribución de venta total por categoría</p>
                    </div>
                    <div className="text-right bg-white/10 rounded-xl px-3 py-2 mr-3">
                      <p className="text-lg font-black">{hierarchy.length}</p>
                      <p className="text-purple-200 text-xs">deptos.</p>
                    </div>
                    <motion.div animate={{ rotate: expandedCharts.pie ? 0 : -90 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 text-purple-200" />
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {hierarchy.slice(0, 3).map((h, i) => (
                      <div key={i} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-xs font-black text-white">{h.deptPart.toFixed(1)}%</p>
                        <p className="text-[9px] text-purple-200 truncate">{h.dept.split(' ')[0]}</p>
                      </div>
                    ))}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedCharts.pie && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white p-5">
                      <DeptPieChart hierarchy={hierarchy} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Top 10 — Collapsible */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl shadow-lg overflow-hidden border border-pink-100 scroll-mt-20">
                <button
                  onClick={() => setExpandedCharts(p => ({ ...p, top10: !p.top10 }))}
                  className="w-full bg-gradient-to-br from-pink-600 via-rose-500 to-orange-500 px-5 py-4 text-white text-left hover:opacity-90 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Activity className="w-4 h-4 text-pink-200" />
                        <h3 className="font-bold text-sm">Top 10 Productos</h3>
                      </div>
                      <p className="text-pink-100 text-xs">Ranking por venta bruta · clic para analizar</p>
                    </div>
                    <div className="text-right bg-white/10 rounded-xl px-3 py-2 mr-3">
                      <p className="text-lg font-black">{allProducts.length}</p>
                      <p className="text-pink-200 text-xs">productos</p>
                    </div>
                    <motion.div animate={{ rotate: expandedCharts.top10 ? 0 : -90 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 text-pink-200" />
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {allProducts.filter(p => p.total_sales > 0).sort((a, b) => b.total_sales - a.total_sales).slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[9px] text-pink-100">{['🥇', '🥈', '🥉'][i]}</p>
                        <p className="text-[9px] text-white font-bold truncate">{p.product?.split(' ')[0]}</p>
                        <p className="text-[9px] text-pink-200">{formatCurrency(p.total_sales).replace('$', '$')}</p>
                      </div>
                    ))}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedCharts.top10 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white p-4 max-h-[360px] overflow-y-auto">
                      <Top10Chart products={allProducts} onSelectProduct={setSelectedProduct} selectedProduct={selectedProduct} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </div>

            {/* Product analysis modal */}
            <AnimatePresence>
              {selectedProduct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                  onClick={() => setSelectedProduct(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                  >
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow text-slate-500 hover:text-slate-800 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <ProductAnalysisPanel
                      product={selectedProduct}
                      hierarchy={hierarchy}
                      grandTotal={summary.totalSales}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters + Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                {/* Table header with filters */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-pink-500" />
                      Tabla Jerárquica
                    </h3>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <Select value={filterDept} onValueChange={v => { setFilterDept(v); setFilterSection('all'); }}>
                        <SelectTrigger className="h-8 w-44 text-xs">
                          <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los deptos.</SelectItem>
                          {depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={filterSection} onValueChange={setFilterSection}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Sección" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las secciones</SelectItem>
                          {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Haz clic en un producto para ver su análisis detallado</p>
                </div>

                <HierarchyTable
                  hierarchy={hierarchy}
                  filterDept={filterDept}
                  filterSection={filterSection}
                  onSelectProduct={setSelectedProduct}
                  selectedProduct={selectedProduct}
                />
              </div>
            </motion.div>

            <div className="flex justify-center pb-6">
              <Button onClick={handleBack} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Panel
              </Button>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showAggregators && (
          <AggregatorsModal storeId={storeCode} onClose={() => setShowAggregators(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPYG && (
          <PYGModal storeId={storeCode} onClose={() => setShowPYG(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}