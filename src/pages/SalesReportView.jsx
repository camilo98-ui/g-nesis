import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BarChart3, DollarSign, TrendingUp, FileText,
  Filter, Search, X, Package, Layers, Star, Award,
  ChevronDown, Calendar, ArrowUpRight, ArrowDownRight,
  AlertTriangle, CheckCircle, TrendingDown, Zap, Shield, GitCompare,
  Download, Printer, Target, Activity, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PYGModal from '@/components/reports/PYGModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar, LineChart, Line, PieChart, Pie
} from 'recharts';

// ─── Paleta ejecutiva oscura premium ─────────────────────────────────────────
const EXEC = {
  bg: '#080d1a',
  bgCard: '#0e1629',
  bgCardAlt: '#111827',
  border: 'rgba(99,102,241,0.18)',
  borderLight: 'rgba(255,255,255,0.06)',
  accent1: '#6366f1',     // indigo
  accent2: '#8b5cf6',     // violet
  accent3: '#06b6d4',     // cyan
  accent4: '#10b981',     // emerald
  accent5: '#f59e0b',     // amber
  danger: '#ef4444',
  grad1: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  grad2: 'linear-gradient(135deg, #06b6d4, #6366f1)',
  grad3: 'linear-gradient(135deg, #10b981, #06b6d4)',
  grad4: 'linear-gradient(135deg, #f59e0b, #f97316)',
  gradHero: 'linear-gradient(135deg, #080d1a 0%, #0f172a 40%, #1e1b4b 100%)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f472b6','#84cc16'];
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
    <div style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }} className="px-4 py-3 rounded-xl shadow-2xl text-xs max-w-[200px]">
      <p className="font-bold mb-1 truncate" style={{ color: EXEC.accent1 }}>{label}</p>
      <p className="font-semibold" style={{ color: EXEC.accent4 }}>{formatCurrency(payload[0]?.value)}</p>
    </div>
  );
};

function normalizeCode(code) {
  if (!code) return '';
  return code.toUpperCase().replace(/BOGOTA/g, 'BTA').replace(/\s+/g, ' ').trim();
}

// ─── Tabla jerárquica ─────────────────────────────────────────────────────────
function HierarchyTable({ hierarchy, filterDept, filterSection, onSelectProduct, selectedProduct, prevHierarchy }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [search, setSearch] = useState('');

  const toggleDept = (dept) => setExpandedDepts(p => ({ ...p, [dept]: !p[dept] }));
  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const searchActive = search.trim().length > 0;
  const searchLower = search.toLowerCase();

  const prevProductMap = useMemo(() => {
    const map = {};
    prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { map[p.product] = p; })));
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
      <tr key={`dept-${dept}`} style={{ borderBottom: `1px solid rgba(99,102,241,0.15)` }}>
        <td className="py-2.5 px-3 w-8" style={{ background: 'rgba(99,102,241,0.08)' }}>
          {!searchActive && (
            <button onClick={() => toggleDept(dept)}
              className="w-5 h-5 flex items-center justify-center rounded-lg text-xs font-bold transition-all"
              style={{ border: `1px solid ${EXEC.border}`, color: EXEC.accent1, background: EXEC.bgCard }}>
              {deptExpanded ? '−' : '+'}
            </button>
          )}
        </td>
        <td colSpan={3} className="py-2.5 px-3 font-bold text-sm uppercase tracking-wider" style={{ background: 'rgba(99,102,241,0.08)', color: EXEC.textPrimary }}>{dept}</td>
        <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: 'rgba(99,102,241,0.08)', color: EXEC.accent1 }}>{formatPart(deptPart)}</td>
        <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: 'rgba(99,102,241,0.08)', color: EXEC.accent3 }}>{formatCurrency(deptSales)}</td>
        <td className="py-2.5 px-3 text-right" style={{ background: 'rgba(99,102,241,0.08)' }}>
          {(() => {
            const total = sections.flatMap(s => s.products).reduce((sum, p) => sum + (p.units_sold || 0), 0);
            return total > 0 ? <span className="text-xs font-semibold" style={{ color: EXEC.textSecondary }}>{total.toLocaleString('es-CO')}</span> : <span className="text-xs" style={{ color: EXEC.textMuted }}>—</span>;
          })()}
        </td>
        <td className="py-2.5 px-3 text-right" style={{ background: 'rgba(99,102,241,0.08)' }}>
          {(() => {
            const prevDept = prevHierarchy?.find(h => h.dept === dept);
            if (!prevDept) return <span className="text-xs" style={{ color: EXEC.textMuted }}>—</span>;
            // Diferencia en puntos porcentuales de participación
            const delta = deptPart - prevDept.deptPart;
            return (
              <span className={`flex items-center justify-end gap-0.5 font-bold text-xs ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {delta >= 0 ? '+' : ''}{delta.toFixed(2)}pp
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
        <tr key={`section-${sectionKey}`} style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${EXEC.borderLight}` }}>
          <td className="py-2 px-3 w-8">
            {hasProducts && !searchActive && (
              <button onClick={() => toggleSection(sectionKey)}
                className="w-5 h-5 flex items-center justify-center rounded-lg text-xs font-bold transition-all"
                style={{ border: `1px solid rgba(139,92,246,0.3)`, color: EXEC.accent2, background: EXEC.bgCard }}>
                {sectionExpanded ? '−' : '+'}
              </button>
            )}
          </td>
          <td className="py-2 px-3"></td>
          <td className="py-2 px-3 font-semibold text-sm" style={{ color: EXEC.accent2 }}>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 flex-shrink-0" style={{ color: EXEC.accent2 }} />
              {section.name || '—'}
            </span>
          </td>
          <td className="py-2 px-3"></td>
          <td className="py-2 px-3 text-right font-semibold text-sm whitespace-nowrap" style={{ color: EXEC.accent1 }}>{formatPart(section.sectionPart)}</td>
          <td className="py-2 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ color: EXEC.textPrimary }}>{formatCurrency(section.sectionSales)}</td>
          <td className="py-2 px-3 text-right text-xs whitespace-nowrap font-semibold" style={{ color: EXEC.textSecondary }}>
            {(() => {
              const total = section.products.reduce((sum, p) => sum + (p.units_sold || 0), 0);
              return total > 0 ? total.toLocaleString('es-CO') : '—';
            })()}
          </td>
          <td className="py-2 px-3 text-right text-xs whitespace-nowrap">
            {(() => {
              const prevDept = prevHierarchy?.find(h => h.dept === dept);
              const prevSection = prevDept?.sections.find(s => s.name === section.name);
              if (!prevSection) return <span style={{ color: EXEC.textMuted }}>—</span>;
              // Diferencia en puntos porcentuales de participación
              const delta = section.sectionPart - prevSection.sectionPart;
              return (
                <span className={`flex items-center justify-end gap-0.5 font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta >= 0 ? '+' : ''}{delta.toFixed(2)}pp
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
        // Diferencia en puntos porcentuales de participación
        const delta = prev != null ? (p.participation - (prev.participation ?? 0)) : null;

        rows.push(
          <tr
            key={`prod-${sectionKey}-${idx}`}
            onClick={() => onSelectProduct(isSelected ? null : p)}
            className="cursor-pointer transition-all duration-150"
            style={{
              background: isSelected ? 'rgba(99,102,241,0.15)' : matchSearch ? 'rgba(245,158,11,0.08)' : 'transparent',
              borderBottom: `1px solid ${EXEC.borderLight}`,
              outline: isSelected ? `1px solid rgba(99,102,241,0.4)` : 'none',
            }}
          >
            <td className="py-1.5 px-3 w-8"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3"></td>
            <td className="py-1.5 px-3 text-xs pl-8 flex items-center gap-1.5" style={{ color: isSelected ? EXEC.accent1 : EXEC.textPrimary }}>
              {isSelected && <Star className="w-3 h-3 flex-shrink-0" style={{ color: EXEC.accent1 }} />}
              <span className={isSelected ? 'font-bold' : ''}>{p.product}</span>
            </td>
            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap font-semibold" style={{ color: EXEC.accent1 }}>{formatPart(p.participation)}</td>
            <td className="py-1.5 px-3 text-right font-bold text-xs whitespace-nowrap" style={{ color: EXEC.textPrimary }}>{formatCurrency(p.total_sales)}</td>
            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap font-medium" style={{ color: EXEC.textSecondary }}>
              {p.units_sold != null && p.units_sold > 0 ? p.units_sold.toLocaleString('es-CO') : '—'}
            </td>
            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap">
              {delta !== null ? (
                <span className={`flex items-center justify-end gap-0.5 font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {delta >= 0 ? '+' : ''}{delta.toFixed(2)}pp
                </span>
              ) : <span style={{ color: EXEC.textMuted }}>—</span>}
            </td>
          </tr>
        );
      });
    });
  });

  return (
    <div style={{ background: EXEC.bgCard }}>
      <div className="p-3" style={{ borderBottom: `1px solid ${EXEC.border}` }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: EXEC.textMuted }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg focus:outline-none"
            style={{ background: EXEC.bg, border: `1px solid ${EXEC.border}`, color: EXEC.textPrimary }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: EXEC.textMuted }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchActive && (
          <p className="text-xs mt-1.5 pl-1" style={{ color: EXEC.accent5 }}>
            🔍 Resultados para "<strong>{search}</strong>" — clic para analizar
          </p>
        )}
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: EXEC.bg, borderBottom: `1px solid ${EXEC.border}` }}>
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Departamento</th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Sección</th>
              <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Producto</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: EXEC.accent1 }}>% Part.</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: EXEC.textSecondary }}>Venta Bruta</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: EXEC.textSecondary }}>Uds.</th>
              <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: EXEC.textSecondary }}>Δ Part. pp</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows : (
              <tr>
                <td colSpan={8} className="py-10 text-center" style={{ color: EXEC.textMuted }}>
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

// ─── Panel de análisis de producto ───────────────────────────────────────────
function ProductAnalysisPanel({ product, hierarchy, grandTotal, prevHierarchy, prevMonthLabel }) {
  const dept = hierarchy.find(h => h.sections.some(s => s.products.some(p => p.product === product.product)));
  const section = dept?.sections.find(s => s.products.some(p => p.product === product.product));
  const siblingsInSection = section?.products || [];
  const siblingsInDept = dept?.sections.flatMap(s => s.products) || [];

  const rankInSection = [...siblingsInSection].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;
  const rankInDept = [...siblingsInDept].sort((a, b) => b.total_sales - a.total_sales).findIndex(p => p.product === product.product) + 1;

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
      className="rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}
    >
      <div className="p-5 text-white" style={{ background: EXEC.gradHero }}>
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
        {delta !== null && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: delta >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${delta >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            {delta >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <ArrowDownRight className="w-5 h-5 text-red-400 flex-shrink-0" />}
            <div>
              <p className={`font-black text-lg ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs {prevMonthLabel}
              </p>
              <p className={`text-xs ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {absChange >= 0 ? '+' : ''}{formatCurrency(absChange)} en ventas
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl p-4" style={{ background: `${EXEC.accent5}10`, border: `1px solid ${EXEC.accent5}30` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: EXEC.accent5 }}>💡 Insight</p>
          <p className="text-sm" style={{ color: EXEC.textSecondary }} dangerouslySetInnerHTML={{ __html: getInsight() }} />
        </div>

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

// ─── Informe Ejecutivo Gerencial PREMIUM ──────────────────────────────────────
function ExecutiveReport({ hierarchy, allProducts, summary, prevHierarchy, currentMonthLabel, prevMonthLabel, storeCode }) {

  const prevProductMap = useMemo(() => {
    const map = {};
    prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { map[p.product] = p; })));
    return map;
  }, [prevHierarchy]);

  const prevTotal = useMemo(() => {
    return Object.values(prevProductMap).reduce((s, p) => s + (p.total_sales || 0), 0);
  }, [prevProductMap]);

  const totalDelta = prevTotal > 0 ? ((summary.totalSales - prevTotal) / prevTotal) * 100 : null;

  const withDelta = allProducts.map(p => {
    const prev = prevProductMap[p.product];
    return { ...p, delta: prev && prev.total_sales > 0 ? ((p.total_sales - prev.total_sales) / prev.total_sales) * 100 : null };
  }).filter(p => p.delta !== null);

  const winners = [...withDelta].sort((a, b) => b.delta - a.delta).slice(0, 5);
  const losers = [...withDelta].sort((a, b) => a.delta - b.delta).slice(0, 5);
  const topDept = hierarchy[0];
  const top5Sales = [...allProducts].sort((a, b) => b.total_sales - a.total_sales).slice(0, 5).reduce((s, p) => s + p.total_sales, 0);
  const concentracionPct = summary.totalSales > 0 ? (top5Sales / summary.totalSales) * 100 : 0;
  const top3 = [...allProducts].sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);

  const now = new Date();
  const reportDate = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusColor = totalDelta === null ? EXEC.textSecondary : totalDelta >= 5 ? '#10b981' : totalDelta >= 0 ? '#f59e0b' : '#ef4444';
  const statusLabel = totalDelta === null ? 'Sin comparativo' : totalDelta >= 5 ? 'Desempeño Sobresaliente' : totalDelta >= 0 ? 'Desempeño Estable' : 'Alerta: Caída en Ventas';

  // Descargar como texto formateado (print)
  const handleDownload = () => {
    const content = `
REPORTE EJECUTIVO DE PARTICIPACIÓN DEL NEGOCIO
================================================
Tienda: ${storeCode}
Período: ${currentMonthLabel}
Comparativo: ${prevMonthLabel}
Emitido: ${reportDate}

MÉTRICAS GENERALES
------------------
Venta Bruta Total: ${formatCurrency(summary.totalSales)}
Variación vs ${prevMonthLabel}: ${totalDelta !== null ? `${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(1)}%` : 'Sin datos'}
Total Productos Activos: ${summary.totalProducts}
Total Departamentos: ${summary.totalDepts}
Concentración Top 5 productos: ${concentracionPct.toFixed(1)}%

ESTADO GENERAL: ${statusLabel}

RANKING DE DEPARTAMENTOS
-------------------------
${hierarchy.map((h, i) => {
  const prevD = prevHierarchy?.find(ph => ph.dept === h.dept);
  const dDelta = prevD && prevD.deptSales > 0 ? ((h.deptSales - prevD.deptSales) / prevD.deptSales * 100).toFixed(1) : '—';
  return `${i + 1}. ${h.dept}: ${h.deptPart.toFixed(1)}% — ${formatCurrency(h.deptSales)} (${dDelta !== '—' ? `${Number(dDelta) >= 0 ? '+' : ''}${dDelta}% vs ant.` : 'sin comparativo'})`;
}).join('\n')}

TOP 5 PRODUCTOS
----------------
${top3.map((p, i) => `${i + 1}. ${p.product}: ${formatCurrency(p.total_sales)} (${p.participation.toFixed(1)}%)`).join('\n')}

PRODUCTOS EN ALZA
------------------
${winners.map((p, i) => `${i + 1}. ${p.product}: +${p.delta.toFixed(1)}% — ${formatCurrency(p.total_sales)}`).join('\n')}

PRODUCTOS EN BAJA
------------------
${losers.map((p, i) => `${i + 1}. ${p.product}: ${p.delta.toFixed(1)}% — ${formatCurrency(p.total_sales)}`).join('\n')}

RECOMENDACIONES
---------------
${concentracionPct > 60 ? `⚠ Alta concentración (${concentracionPct.toFixed(0)}% en top 5). Diversificar mix.` : `✓ Mix saludable: concentración de ${concentracionPct.toFixed(0)}% en top 5.`}
${topDept ? `★ Depto. líder "${topDept.dept}" (${topDept.deptPart.toFixed(1)}%): priorizar inventario y exhibición.` : ''}
${winners[0] ? `↑ Impulsar "${winners[0].product}" (+${winners[0].delta.toFixed(1)}%). Asegurar stock.` : ''}
${losers[0] && losers[0].delta < -10 ? `↓ Alerta en "${losers[0].product}" (${losers[0].delta.toFixed(1)}%). Revisar posicionamiento.` : ''}

================================================
Generado automáticamente · ${reportDate}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_${storeCode}_${currentMonthLabel.replace(' ', '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
      {/* Header */}
      <div className="relative px-8 py-8 overflow-hidden" style={{ background: EXEC.gradHero }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', transform: 'translate(30%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', transform: 'translate(-30%, 40%)' }} />
        </div>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: EXEC.grad1 }}>
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: EXEC.accent1 }}>INFORME EJECUTIVO CONFIDENCIAL</p>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Reporte de Participación</h2>
              <p className="text-sm mt-1" style={{ color: EXEC.textSecondary }}>{storeCode} · {currentMonthLabel} · vs {prevMonthLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: EXEC.grad1, color: '#fff' }}>
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${EXEC.borderLight}`, color: EXEC.textSecondary }}>
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>

        {/* KPIs hero en header */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
          {[
            { label: 'Venta Bruta', value: formatCurrency(summary.totalSales), color: EXEC.accent1 },
            { label: `vs ${prevMonthLabel}`, value: totalDelta !== null ? `${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(1)}%` : '—', color: totalDelta === null ? EXEC.textSecondary : totalDelta >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Productos Activos', value: summary.totalProducts, color: EXEC.accent3 },
            { label: 'Departamentos', value: summary.totalDepts, color: EXEC.accent5 },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${EXEC.borderLight}` }}>
              <p className="font-black text-xl md:text-2xl" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: EXEC.textMuted }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">

        {/* Banner de estado */}
        <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: `${statusColor}12`, border: `2px solid ${statusColor}30` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: statusColor }}>
            {totalDelta === null ? <Zap className="w-5 h-5 text-white" /> : totalDelta >= 5 ? <CheckCircle className="w-5 h-5 text-white" /> : totalDelta >= 0 ? <TrendingUp className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="font-black text-lg" style={{ color: statusColor }}>{statusLabel}</p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: EXEC.textSecondary }}>
              {totalDelta === null
                ? `${storeCode} generó ${formatCurrency(summary.totalSales)} con ${summary.totalProducts} productos en ${summary.totalDepts} departamentos. Sin datos del período anterior para comparación.`
                : totalDelta >= 5
                ? `${storeCode} registró crecimiento de ${totalDelta.toFixed(1)}% vs ${prevMonthLabel}, alcanzando ${formatCurrency(summary.totalSales)}. Portafolio de ${summary.totalProducts} productos con dinamismo positivo.`
                : totalDelta >= 0
                ? `${storeCode} mantuvo estabilidad con ${totalDelta.toFixed(1)}% de variación vs ${prevMonthLabel}. Venta bruta de ${formatCurrency(summary.totalSales)} con espacio de crecimiento.`
                : `${storeCode} presenta caída de ${Math.abs(totalDelta).toFixed(1)}% vs ${prevMonthLabel}. Se requiere revisión urgente del mix y estrategia de exhibición.`}
            </p>
          </div>
        </div>

        {/* Departamentos */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: EXEC.textMuted }}>Ranking de Departamentos</p>
          <div className="space-y-3">
            {hierarchy.map((h, i) => {
              const prevD = prevHierarchy?.find(ph => ph.dept === h.dept);
              const dDelta = prevD && prevD.deptSales > 0 ? ((h.deptSales - prevD.deptSales) / prevD.deptSales) * 100 : null;
              const barColor = COLORS[i % COLORS.length];
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: i === 0 ? `${EXEC.accent1}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? EXEC.border : EXEC.borderLight}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: i === 0 ? EXEC.grad1 : 'rgba(255,255,255,0.1)' }}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold" style={{ color: EXEC.textPrimary }}>{h.dept}</span>
                      {i === 0 && <Crown className="w-3.5 h-3.5" style={{ color: EXEC.accent5 }} />}
                    </div>
                    <div className="flex items-center gap-3">
                      {dDelta !== null && (
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${dDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {dDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {dDelta >= 0 ? '+' : ''}{dDelta.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-xs font-black" style={{ color: barColor }}>{h.deptPart.toFixed(1)}%</span>
                      <span className="text-xs" style={{ color: EXEC.textSecondary }}>{formatCurrency(h.deptSales)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: barColor }}
                      initial={{ width: 0 }} animate={{ width: `${h.deptPart}%` }} transition={{ duration: 1, delay: i * 0.08 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Productos */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: EXEC.textMuted }}>Top 5 Productos Líderes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...allProducts].sort((a, b) => b.total_sales - a.total_sales).slice(0, 6).map((p, i) => {
              const prev = prevProductMap[p.product];
              const pDelta = prev && prev.total_sales > 0 ? ((p.total_sales - prev.total_sales) / prev.total_sales) * 100 : null;
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${EXEC.borderLight}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: i < 3 ? EXEC.grad1 : 'rgba(255,255,255,0.1)' }}>
                      {i + 1}
                    </div>
                    {pDelta !== null && (
                      <span className={`text-[10px] font-black ${pDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pDelta >= 0 ? '+' : ''}{pDelta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold leading-tight mb-1.5" style={{ color: EXEC.textPrimary }}>{p.product}</p>
                  <p className="text-sm font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(p.total_sales)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: EXEC.textMuted }}>{p.participation.toFixed(2)}% del total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ganadores y Perdedores */}
        {withDelta.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2" style={{ color: EXEC.textMuted }}>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Mayor Crecimiento vs {prevMonthLabel}
              </p>
              <div className="space-y-2">
                {winners.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: EXEC.textPrimary }}>{p.product}</p>
                      <p className="text-[10px] text-emerald-400">{formatCurrency(p.total_sales)}</p>
                    </div>
                    <span className="text-sm font-black text-emerald-400 flex-shrink-0">+{p.delta.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2" style={{ color: EXEC.textMuted }}>
                <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Mayor Caída vs {prevMonthLabel}
              </p>
              <div className="space-y-2">
                {losers.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                      <ArrowDownRight className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: EXEC.textPrimary }}>{p.product}</p>
                      <p className="text-[10px] text-red-400">{formatCurrency(p.total_sales)}</p>
                    </div>
                    <span className="text-sm font-black text-red-400 flex-shrink-0">{p.delta.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Concentración del negocio */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${EXEC.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: EXEC.textMuted }}>Concentración del Portafolio</p>
            <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: concentracionPct > 60 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: concentracionPct > 60 ? EXEC.accent5 : EXEC.accent4 }}>
              {concentracionPct.toFixed(0)}% en Top 5
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: concentracionPct > 60 ? EXEC.grad4 : EXEC.grad3 }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(concentracionPct, 100)}%` }} transition={{ duration: 1.2 }} />
          </div>
          <p className="text-xs" style={{ color: EXEC.textSecondary }}>
            {concentracionPct > 60
              ? `⚠ Alta concentración: el ${concentracionPct.toFixed(0)}% de las ventas viene de solo 5 productos. Diversificar mix para reducir riesgo.`
              : `✓ Portafolio balanceado: la concentración del ${concentracionPct.toFixed(0)}% en el top 5 refleja una distribución saludable.`}
          </p>
        </div>

        {/* Acciones recomendadas */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: EXEC.textMuted }}>Acciones Recomendadas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              concentracionPct > 60
                ? { icon: AlertTriangle, color: EXEC.accent5, bg: `${EXEC.accent5}12`, border: `${EXEC.accent5}30`, text: `Diversificar: el ${concentracionPct.toFixed(0)}% se concentra en 5 productos. Potenciar secciones secundarias.` }
                : { icon: CheckCircle, color: EXEC.accent4, bg: `${EXEC.accent4}12`, border: `${EXEC.accent4}30`, text: `Mix saludable (${concentracionPct.toFixed(0)}% top 5). Continuar impulsando variedad de exhibición.` },
              topDept ? { icon: Target, color: EXEC.accent1, bg: `${EXEC.accent1}12`, border: `${EXEC.accent1}30`, text: `Depto. líder "${topDept.dept}" (${topDept.deptPart.toFixed(1)}%): priorizar inventario y exhibición estelar.` } : null,
              winners[0] ? { icon: Zap, color: EXEC.accent2, bg: `${EXEC.accent2}12`, border: `${EXEC.accent2}30`, text: `Impulsar "${winners[0].product}" (+${winners[0].delta.toFixed(1)}%). Maximizar visibilidad y asegurar stock.` } : null,
              losers[0] && losers[0].delta < -10 ? { icon: TrendingDown, color: EXEC.danger, bg: `${EXEC.danger}12`, border: `${EXEC.danger}30`, text: `Alerta en "${losers[0].product}" (${losers[0].delta.toFixed(1)}%). Revisar posicionamiento, precio y stock.` } : null,
              { icon: Activity, color: EXEC.accent3, bg: `${EXEC.accent3}12`, border: `${EXEC.accent3}30`, text: `Con ${summary.totalProducts} productos activos en ${summary.totalDepts} departamentos, el portafolio tiene amplio margen de rotación y exhibición.` },
            ].filter(Boolean).map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl p-4" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: item.color }} />
                  <p className="text-xs leading-relaxed" style={{ color: EXEC.textPrimary }}>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${EXEC.borderLight}` }}>
          <p className="text-[10px]" style={{ color: EXEC.textMuted }}>Generado automáticamente · {reportDate} · {storeCode} · Uso Confidencial Gerencial</p>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: EXEC.grad1, color: '#fff' }}>
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Comparativo simple ─────────────────────────────────────────────────
function ComparativeModal({ open, onClose, availableMonths, currentMonth, currentYear, compareMonth, compareYear, setCompareMonth, setCompareYear, prevHierarchy, summary, prevMonthLabel, currentMonthLabel }) {
  // Usar el total calculado desde prevHierarchy (misma lógica que el mes actual)
  const prevTotal = useMemo(() => {
    if (!prevHierarchy || prevHierarchy.length === 0) return 0;
    return prevHierarchy.reduce((s, h) => s + (h.deptSales || 0), 0);
  }, [prevHierarchy]);

  const hasPrevData = prevTotal > 0;

  const delta = prevTotal > 0 ? ((summary.totalSales - prevTotal) / prevTotal) * 100 : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <GitCompare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Comparativo</p>
                  <p className="text-white/60 text-[10px]">{currentMonthLabel} vs {prevMonthLabel}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selector de mes */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Selecciona el mes a comparar</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select value={compareMonth} onChange={e => setCompareMonth(Number(e.target.value))}
                    className="bg-transparent text-slate-800 text-sm font-bold border-none outline-none cursor-pointer flex-1">
                    {MONTHS_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select value={compareYear} onChange={e => setCompareYear(Number(e.target.value))}
                    className="bg-transparent text-slate-800 text-sm font-bold border-none outline-none cursor-pointer">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {/* Chips de meses disponibles */}
                <div className="flex gap-1.5 flex-wrap">
                  {availableMonths.filter(m => !(m.month === currentMonth && m.year === currentYear)).map((m, i) => {
                    const isActive = m.month === compareMonth && m.year === compareYear;
                    return (
                      <button key={i} onClick={() => { setCompareMonth(m.month); setCompareYear(m.year); }}
                        className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                        style={isActive
                          ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none' }
                          : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
                        {MONTHS_NAMES[m.month - 1].slice(0, 3)} {m.year}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resultados */}
              {!hasPrevData ? (
                <div className="rounded-2xl p-4 border border-amber-200 bg-amber-50 text-center">
                  <p className="text-amber-800 text-sm font-bold">Sin datos para {prevMonthLabel}</p>
                  <p className="text-amber-600 text-xs mt-1">Carga ese reporte para ver el comparativo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 border" style={{ background: '#f0f4ff', borderColor: '#c7d2fe' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400 mb-1">{currentMonthLabel}</p>
                      <p className="font-black text-lg text-indigo-900">{formatCurrency(summary.totalSales)}</p>
                      <p className="text-[10px] text-indigo-400 mt-0.5">Período actual</p>
                    </div>
                    <div className="rounded-2xl p-4 border bg-slate-50 border-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{prevMonthLabel}</p>
                      <p className="font-black text-lg text-slate-700">{formatCurrency(prevTotal)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Período comparado</p>
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 border flex items-center gap-4 ${delta >= 0 ? 'border-emerald-200' : 'border-red-200'}`}
                    style={{ background: delta >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${delta >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {delta >= 0 ? <ArrowUpRight className="w-5 h-5 text-white" /> : <ArrowDownRight className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className={`font-black text-2xl ${delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                      </p>
                      <p className={`text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatCurrency(summary.totalSales - prevTotal)} vs {prevMonthLabel}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

  const now = new Date();

  const [filterDept, setFilterDept] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPYG, setShowPYG] = useState(false);
  const [showComparative, setShowComparative] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [compareMonth, setCompareMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [compareYear, setCompareYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [compareInitialized, setCompareInitialized] = useState(false);

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

  const availableMonths = useMemo(() => {
    const seen = new Set();
    const result = [];
    allRecords.forEach(r => {
      if (r.month && r.year) {
        const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
        if (!seen.has(key)) { seen.add(key); result.push({ month: Number(r.month), year: Number(r.year) }); }
      }
    });
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

  const effectiveMonth = availableMonths.length > 0 ? selectedMonth : (now.getMonth() + 1);
  const effectiveYear = availableMonths.length > 0 ? selectedYear : now.getFullYear();

  const currentRecords = useMemo(() => {
    if (allRecords.length === 0) return [];
    const withMonths = allRecords.filter(r => r.month && r.year);
    if (withMonths.length > 0) {
      return withMonths.filter(r => r.month === effectiveMonth && r.year === effectiveYear);
    }
    const latestReportId = allRecords[0]?.report_id;
    return allRecords.filter(r => r.report_id === latestReportId);
  }, [allRecords, effectiveMonth, effectiveYear]);

  // Auto-inicializar al mes más reciente disponible (solo una vez)
  useEffect(() => {
    if (!compareInitialized && availableMonths.length >= 1) {
      const mostRecent = availableMonths[0];
      setSelectedMonth(mostRecent.month);
      setSelectedYear(mostRecent.year);
      setCompareInitialized(true);
    }
  }, [availableMonths, compareInitialized]);

  // El comparativo es el mes disponible cronológicamente anterior al seleccionado
  const autoCompare = useMemo(() => {
    // Convertir el mes actual a un número comparable (año*12 + mes)
    const currentKey = effectiveYear * 12 + effectiveMonth;
    // Ordenar descendente y encontrar el primero que sea menor al actual
    const sorted = [...availableMonths].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
    const prev = sorted.find(m => (m.year * 12 + m.month) < currentKey);
    // Si no hay mes anterior, tomar el siguiente más reciente diferente
    return prev || sorted.find(m => !(m.month === effectiveMonth && m.year === effectiveYear)) || null;
  }, [availableMonths, effectiveMonth, effectiveYear]);

  const effectiveCompareMonth = autoCompare?.month ?? compareMonth;
  const effectiveCompareYear = autoCompare?.year ?? compareYear;

  const prevRecords = useMemo(() => {
    const withMonths = allRecords.filter(r => r.month && r.year);
    if (withMonths.length > 0) {
      return withMonths.filter(r => r.month === effectiveCompareMonth && r.year === effectiveCompareYear);
    }
    return [];
  }, [allRecords, effectiveCompareMonth, effectiveCompareYear]);

  const prevMonthLabel = useMemo(() => {
    return `${MONTHS_NAMES[effectiveCompareMonth - 1]} ${effectiveCompareYear}`;
  }, [effectiveCompareMonth, effectiveCompareYear]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-800 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const currentMonthLabel = `${MONTHS_NAMES[effectiveMonth - 1]} ${effectiveYear}`;

  return (
    <div className="min-h-screen" style={{ background: EXEC.bg }}>
      {/* Header ejecutivo oscuro premium */}
      <div className="sticky top-0 z-30" style={{ background: EXEC.bgCard, borderBottom: `1px solid ${EXEC.border}`, boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleBack} className="p-2 rounded-xl transition-all flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${EXEC.borderLight}` }}>
              <ArrowLeft className="w-5 h-5" style={{ color: EXEC.textSecondary }} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black tracking-tight" style={{ color: EXEC.textPrimary }}>Participación del Negocio</h1>
              <p className="text-xs font-medium" style={{ color: EXEC.textMuted }}>{storeCode} · {currentMonthLabel} · vs {prevMonthLabel}</p>
            </div>

            {/* Selector de mes */}
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(99,102,241,0.1)', border: `1px solid ${EXEC.border}` }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: EXEC.accent1 }} />
              <select value={selectedMonth} onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedProduct(null); }}
                className="text-xs font-bold border-none outline-none cursor-pointer" style={{ background: 'transparent', color: EXEC.textPrimary }}>
                {MONTHS_NAMES.map((m, i) => <option key={i+1} value={i+1} style={{ background: EXEC.bgCard }}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedProduct(null); }}
                className="text-xs font-bold border-none outline-none cursor-pointer" style={{ background: 'transparent', color: EXEC.textPrimary }}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ background: EXEC.bgCard }}>{y}</option>)}
              </select>
            </div>

            {hasData && (
              <div className="rounded-xl px-4 py-2 text-right flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', border: `1px solid ${EXEC.border}` }}>
                <p className="text-base font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(summary.totalSales)}</p>
                <p className="text-[10px]" style={{ color: EXEC.textMuted }}>Venta Total</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {!hasData ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl shadow-lg p-12 text-center" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: EXEC.textPrimary }}>Sin datos para {currentMonthLabel}</h2>
            <p className="text-sm" style={{ color: EXEC.textSecondary }}>
              {availableMonths.length > 0
                ? `Selecciona otro mes. Meses disponibles: ${availableMonths.map(m => `${MONTHS_NAMES[m.month-1]} ${m.year}`).join(', ')}`
                : 'El gerente debe cargar el reporte de participación para ver los datos.'}
            </p>
            <button onClick={handleBack} className="mt-6 flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: EXEC.grad1, color: '#fff' }}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          </motion.div>
        ) : (
          <>
            {/* KPI Cards ejecutivos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: 'Venta Total', value: formatCurrency(summary.totalSales), sub: null, grad: EXEC.grad1, accent: EXEC.accent1 },
                { icon: Package, label: 'Productos', value: summary.totalProducts, sub: null, grad: EXEC.grad2, accent: EXEC.accent3 },
                { icon: Layers, label: 'Departamentos', value: summary.totalDepts, sub: null, grad: EXEC.grad3, accent: EXEC.accent4 },
                { icon: Award, label: 'Top Producto', value: summary.topProduct?.product || '—', sub: formatCurrency(summary.topProduct?.total_sales), grad: EXEC.grad4, accent: EXEC.accent5 },
              ].map(({ icon: Icon, label, value, sub, grad, accent }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-4 overflow-hidden relative hover:scale-[1.02] transition-transform"
                  style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15" style={{ background: grad }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: grad }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: EXEC.textMuted }}>{label}</p>
                  <p className={`font-black ${typeof value === 'string' && value.length > 15 ? 'text-xs leading-tight' : 'text-xl'}`} style={{ color: EXEC.textPrimary }}>{value}</p>
                  {sub && <p className="text-xs font-bold mt-0.5" style={{ color: accent }}>{sub}</p>}
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Mix de Departamentos */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl overflow-hidden" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${EXEC.borderLight}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: EXEC.textMuted }}>Distribución</p>
                      <h3 className="font-black text-lg leading-tight" style={{ color: EXEC.textPrimary }}>Mix de Departamentos</h3>
                      <p className="text-xs mt-0.5" style={{ color: EXEC.textMuted }}>{currentMonthLabel} · {hierarchy.length} categorías</p>
                    </div>
                    <div className="text-right rounded-xl px-3 py-2" style={{ background: `${EXEC.accent1}15` }}>
                      <p className="text-xl font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(summary.totalSales)}</p>
                      <p className="text-[10px]" style={{ color: EXEC.textMuted }}>venta total</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
                  {hierarchy.filter(h => h.deptSales > 0).map((h, i) => {
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-sm font-semibold truncate" style={{ color: i === 0 ? EXEC.textPrimary : EXEC.textSecondary }}>{h.dept}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            <span className="text-xs" style={{ color: EXEC.textMuted }}>{formatCurrency(h.deptSales)}</span>
                            <span className="text-sm font-black min-w-[3rem] text-right" style={{ color }}>{h.deptPart.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(h.deptPart, 100)}%` }}
                            transition={{ duration: 0.9, delay: i * 0.07 }}
                            className="h-full rounded-full"
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Top 10 Productos */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${EXEC.borderLight}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: EXEC.textMuted }}>Ranking</p>
                      <h3 className="font-black text-lg leading-tight" style={{ color: EXEC.textPrimary }}>Top 10 Productos</h3>
                      <p className="text-xs mt-0.5" style={{ color: EXEC.textMuted }}>{currentMonthLabel} · clic para análisis</p>
                    </div>
                    <div className="text-right rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xl font-black" style={{ color: EXEC.textPrimary }}>{allProducts.length}</p>
                      <p className="text-[10px]" style={{ color: EXEC.textMuted }}>productos</p>
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
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedProduct(isSelected ? null : p)}
                          className="cursor-pointer rounded-xl px-3 py-2.5 transition-all"
                          style={{ background: isSelected ? `${EXEC.accent1}18` : 'transparent', border: isSelected ? `1px solid ${EXEC.accent1}40` : '1px solid transparent' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                              style={{
                                background: isTop3 ? (isSelected ? EXEC.accent1 : `${EXEC.accent1}20`) : 'rgba(255,255,255,0.06)',
                                color: isTop3 ? (isSelected ? '#fff' : EXEC.accent1) : EXEC.textMuted
                              }}>
                              {i + 1}
                            </div>
                            <span className="text-xs font-semibold truncate flex-1" style={{ color: EXEC.textPrimary }}>{p.product}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {delta !== null && (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                                </span>
                              )}
                              <span className="text-xs font-black" style={{ color: EXEC.textPrimary }}>{formatCurrency(p.total_sales)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden ml-8" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                              className="h-full rounded-full"
                              style={{ background: isSelected ? EXEC.accent1 : isTop3 ? EXEC.grad1 : 'rgba(255,255,255,0.15)' }}
                            />
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            </div>

            {/* Modal Comparativo */}
            <ComparativeModal
              open={showComparative}
              onClose={() => setShowComparative(false)}
              availableMonths={availableMonths}
              currentMonth={effectiveMonth}
              currentYear={effectiveYear}
              compareMonth={effectiveCompareMonth}
              compareYear={effectiveCompareYear}
              setCompareMonth={setCompareMonth}
              setCompareYear={setCompareYear}
              prevHierarchy={prevHierarchy}
              summary={summary}
              prevMonthLabel={prevMonthLabel}
              currentMonthLabel={currentMonthLabel}
            />

            {/* Product analysis modal */}
            <AnimatePresence>
              {selectedProduct && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                  onClick={() => setSelectedProduct(null)}>
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                    <button onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-full shadow transition-all"
                      style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                      <X className="w-5 h-5" style={{ color: EXEC.textSecondary }} />
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
              <div className="rounded-2xl overflow-hidden" style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.border}` }}>
                <div className="p-4" style={{ borderBottom: `1px solid ${EXEC.border}` }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold flex items-center gap-2" style={{ color: EXEC.textPrimary }}>
                      <BarChart3 className="w-4 h-4" style={{ color: EXEC.accent1 }} />
                      Tabla Jerárquica · {currentMonthLabel}
                    </h3>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <Filter className="w-3.5 h-3.5" style={{ color: EXEC.textMuted }} />
                      <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterSection('all'); }}
                        className="h-8 px-2 text-xs rounded-lg focus:outline-none"
                        style={{ background: EXEC.bg, border: `1px solid ${EXEC.border}`, color: EXEC.textPrimary }}>
                        <option value="all">Todos los deptos.</option>
                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                        className="h-8 px-2 text-xs rounded-lg focus:outline-none"
                        style={{ background: EXEC.bg, border: `1px solid ${EXEC.border}`, color: EXEC.textPrimary }}>
                        <option value="all">Todas las secciones</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: EXEC.textMuted }}>
                    "Δ Part. pp" muestra diferencia en puntos porcentuales de participación vs <strong style={{ color: EXEC.textSecondary }}>{prevMonthLabel}</strong> · Clic en producto para análisis completo
                    {prevRecords.length === 0 && (
                      <span className="ml-2 font-semibold" style={{ color: EXEC.accent5 }}>⚠ Sin datos comparativos aún</span>
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

            {/* INFORME EJECUTIVO — AL FINAL */}
            <ExecutiveReport
              hierarchy={hierarchy}
              allProducts={allProducts}
              summary={summary}
              prevHierarchy={prevHierarchy}
              currentMonthLabel={currentMonthLabel}
              prevMonthLabel={prevMonthLabel}
              storeCode={storeCode}
            />

            <div className="flex justify-center pb-8">
              <button onClick={handleBack} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${EXEC.borderLight}`, color: EXEC.textSecondary }}>
                <ArrowLeft className="w-4 h-4" /> Volver al Panel
              </button>
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