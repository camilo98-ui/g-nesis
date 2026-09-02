import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Layers, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, BarChart3, Building2
} from 'lucide-react';

const EXEC = {
  bg: '#fdf2f8', bgCard: '#ffffff', bgCardAlt: '#fef6fb',
  border: 'rgba(194,24,117,0.15)', borderLight: 'rgba(194,24,117,0.08)',
  accent1: '#C21875', accent2: '#db2777', accent3: '#7c3aed',
  accent4: '#10b981', accent5: '#f59e0b', danger: '#ef4444',
  textPrimary: '#1e293b', textSecondary: '#64748b', textMuted: '#94a3b8',
  grad1: 'linear-gradient(135deg, #C21875, #db2777)',
};
const COLORS = ['#C21875','#db2777','#f472b6','#7c3aed','#10b981','#f59e0b','#6366f1','#84cc16','#06b6d4','#f97316'];
const MONTHS_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatCurrency(val) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val || 0));
}
function formatPart(val) {
  if (val === null || val === undefined) return '—';
  return val.toFixed(2).replace('.', ',') + ' %';
}

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
  return { hierarchy, grandTotal };
}

function DistrictHierarchyTable({ hierarchy, prevHierarchy }) {
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const toggleDept = (d) => setExpandedDepts(p => ({ ...p, [d]: !p[d] }));
  const toggleSection = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

  const prevProductMap = useMemo(() => {
    const m = {};
    prevHierarchy?.forEach(h => h.sections.forEach(s => s.products.forEach(p => { m[p.product] = p; })));
    return m;
  }, [prevHierarchy]);

  const fixDelta = (delta) => delta !== null ? (
    <span className={`inline-flex items-center gap-0.5 font-bold text-xs ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
      {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  ) : <span style={{ color: EXEC.textMuted }}>—</span>;

  return (
    <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ background: EXEC.bg, borderBottom: `1px solid ${EXEC.border}` }}>
            <th className="py-3 px-3 w-8"></th>
            <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Departamento</th>
            <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Sección</th>
            <th className="py-3 px-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Producto</th>
            <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.accent1 }}>% Part.</th>
            <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Venta Bruta</th>
            <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Uds.</th>
            <th className="py-3 px-3 text-right font-bold text-xs uppercase tracking-wider" style={{ color: EXEC.textSecondary }}>Δ Uds. %</th>
          </tr>
        </thead>
        <tbody>
          {hierarchy.length === 0 && (
            <tr><td colSpan={8} className="py-10 text-center" style={{ color: EXEC.textMuted }}>Sin datos de participación para este distrito.</td></tr>
          )}
          {hierarchy.map(({ dept, sections, deptSales, deptPart }) => {
            const deptExpanded = expandedDepts[dept];
            const deptUnits = sections.flatMap(s => s.products).reduce((s, p) => s + (p.units_sold || 0), 0);
            const prevDept = prevHierarchy?.find(h => h.dept === dept);
            const prevDeptUnits = prevDept ? prevDept.sections.flatMap(s => s.products).reduce((s, p) => s + (p.units_sold || 0), 0) : 0;
            const deptDelta = prevDept && prevDeptUnits > 0 ? ((deptUnits - prevDeptUnits) / prevDeptUnits) * 100 : null;
            return (
              <React.Fragment key={dept}>
                <tr style={{ borderBottom: `1px solid rgba(194,24,117,0.10)` }}>
                  <td className="py-2.5 px-3" style={{ background: 'rgba(194,24,117,0.06)' }}>
                    <button onClick={() => toggleDept(dept)} className="w-5 h-5 flex items-center justify-center rounded-lg text-xs font-bold"
                      style={{ border: `1px solid ${EXEC.border}`, color: EXEC.accent1, background: EXEC.bgCard }}>
                      {deptExpanded ? '−' : '+'}
                    </button>
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 font-bold text-sm uppercase tracking-wider" style={{ background: 'rgba(194,24,117,0.06)', color: EXEC.textPrimary }}>{dept}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: 'rgba(194,24,117,0.06)', color: EXEC.accent1 }}>{formatPart(deptPart)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ background: 'rgba(194,24,117,0.06)', color: EXEC.accent2 }}>{formatCurrency(deptSales)}</td>
                  <td className="py-2.5 px-3 text-right text-xs font-semibold whitespace-nowrap" style={{ background: 'rgba(194,24,117,0.06)', color: EXEC.textSecondary }}>{deptUnits.toLocaleString('es-CO')}</td>
                  <td className="py-2.5 px-3 text-right" style={{ background: 'rgba(194,24,117,0.06)' }}>{fixDelta(deptDelta)}</td>
                </tr>
                {deptExpanded && sections.map((section) => {
                  const sectionKey = `${dept}__${section.name}`;
                  const sectionExpanded = expandedSections[sectionKey];
                  const secUnits = section.products.reduce((s, p) => s + (p.units_sold || 0), 0);
                  const prevSection = prevDept?.sections.find(s => s.name === section.name);
                  const prevSecUnits = prevSection ? prevSection.products.reduce((s, p) => s + (p.units_sold || 0), 0) : 0;
                  const secDelta = prevSection && prevSecUnits > 0 ? ((secUnits - prevSecUnits) / prevSecUnits) * 100 : null;
                  return (
                    <React.Fragment key={sectionKey}>
                      <tr style={{ background: 'rgba(194,24,117,0.02)', borderBottom: `1px solid ${EXEC.borderLight}` }}>
                        <td className="py-2 px-3">
                          <button onClick={() => toggleSection(sectionKey)} className="w-5 h-5 flex items-center justify-center rounded-lg text-xs font-bold"
                            style={{ border: `1px solid rgba(194,24,117,0.25)`, color: EXEC.accent1, background: EXEC.bgCard }}>
                            {sectionExpanded ? '−' : '+'}
                          </button>
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3 font-semibold text-sm" style={{ color: EXEC.accent2 }}>
                          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" style={{ color: EXEC.accent2 }} />{section.name || '—'}</span>
                        </td>
                        <td className="py-2 px-3"></td>
                        <td className="py-2 px-3 text-right font-semibold text-sm whitespace-nowrap" style={{ color: EXEC.accent1 }}>{formatPart(section.sectionPart)}</td>
                        <td className="py-2 px-3 text-right font-bold text-sm whitespace-nowrap" style={{ color: EXEC.textPrimary }}>{formatCurrency(section.sectionSales)}</td>
                        <td className="py-2 px-3 text-right text-xs font-semibold whitespace-nowrap" style={{ color: EXEC.textSecondary }}>{secUnits.toLocaleString('es-CO')}</td>
                        <td className="py-2 px-3 text-right text-xs whitespace-nowrap">{fixDelta(secDelta)}</td>
                      </tr>
                      {sectionExpanded && section.products.map((p, idx) => {
                        const prevP = prevProductMap[p.product];
                        const d = prevP && (prevP.units_sold ?? 0) > 0 ? ((p.units_sold - prevP.units_sold) / prevP.units_sold) * 100 : null;
                        return (
                          <tr key={`p-${sectionKey}-${idx}`} style={{ borderBottom: `1px solid ${EXEC.borderLight}` }}>
                            <td className="py-1.5 px-3"></td>
                            <td className="py-1.5 px-3"></td>
                            <td className="py-1.5 px-3"></td>
                            <td className="py-1.5 px-3 text-xs pl-8" style={{ color: EXEC.textPrimary }}>{p.product}</td>
                            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap font-semibold" style={{ color: EXEC.accent1 }}>{formatPart(p.participation)}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-xs whitespace-nowrap" style={{ color: EXEC.textPrimary }}>{formatCurrency(p.total_sales)}</td>
                            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap font-medium" style={{ color: EXEC.textSecondary }}>{p.units_sold != null && p.units_sold > 0 ? p.units_sold.toLocaleString('es-CO') : '—'}</td>
                            <td className="py-1.5 px-3 text-right text-xs whitespace-nowrap">{fixDelta(d)}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DistrictParticipationView({ district, storeEntities }) {
  const [sortDir, setSortDir] = useState('desc');

  const districtStoreCodes = useMemo(() => {
    return (storeEntities || [])
      .filter(s => s.district === district && s.is_active !== false)
      .map(s => s.code)
      .filter(Boolean);
  }, [storeEntities, district]);

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['district-participation', district],
    queryFn: () => base44.entities.SalesReport.list('-uploaded_at', 5000),
    enabled: !!district && districtStoreCodes.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const districtReports = useMemo(() => {
    if (!allReports.length) return [];
    const codes = new Set(districtStoreCodes.map(c => c.toUpperCase().replace(/BOGOTA/g, 'BTA').trim()));
    return allReports.filter(r => {
      const c = (r.store_code || '').toUpperCase().replace(/BOGOTA/g, 'BTA').trim();
      return codes.has(c) || codes.has(c.replace(/\s/g, ''));
    });
  }, [allReports, districtStoreCodes]);

  const { effectiveMonth, effectiveYear, availableMonths } = useMemo(() => {
    if (!districtReports.length) return { effectiveMonth: null, effectiveYear: null, availableMonths: [] };
    const set = new Set(districtReports.filter(r => r.month && r.year).map(r => `${r.year}-${r.month}`));
    const months = [...set].map(k => { const [y, m] = k.split('-'); return { year: +y, month: +m }; })
      .sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    const latest = months[months.length - 1];
    return { effectiveMonth: latest.month, effectiveYear: latest.year, availableMonths: months };
  }, [districtReports]);

  const currentRecords = useMemo(() =>
    districtReports.filter(r => r.month === effectiveMonth && r.year === effectiveYear),
    [districtReports, effectiveMonth, effectiveYear]);

  const prevMonthKey = useMemo(() => {
    const sorted = [...availableMonths].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    const curKey = effectiveYear * 12 + effectiveMonth;
    const prev = [...sorted].reverse().find(m => (m.year * 12 + m.month) < curKey);
    return prev;
  }, [availableMonths, effectiveMonth, effectiveYear]);

  const prevRecords = useMemo(() =>
    prevMonthKey ? districtReports.filter(r => r.month === prevMonthKey.month && r.year === prevMonthKey.year) : [],
    [districtReports, prevMonthKey]);

  const { hierarchy, grandTotal } = useMemo(() => buildHierarchy(currentRecords), [currentRecords]);
  const { hierarchy: prevHierarchy } = useMemo(() => buildHierarchy(prevRecords), [prevRecords]);

  const currentMonthLabel = effectiveMonth ? `${MONTHS_NAMES[effectiveMonth - 1]} ${effectiveYear}` : '—';
  const prevMonthLabel = prevMonthKey ? `${MONTHS_NAMES[prevMonthKey.month - 1]} ${prevMonthKey.year}` : null;

  const deptChartData = useMemo(() => {
    const data = hierarchy.map(h => ({ name: h.dept, sales: h.deptSales, part: h.deptPart }));
    return data.sort((a, b) => sortDir === 'desc' ? b.sales - a.sales : a.sales - b.sales);
  }, [hierarchy, sortDir]);

  const prevTotal = useMemo(() => prevHierarchy.reduce((s, h) => s + h.deptSales, 0), [prevHierarchy]);
  const totalDelta = prevTotal > 0 ? ((grandTotal - prevTotal) / prevTotal) * 100 : null;

  if (!district) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden mb-6"
      style={{ background: EXEC.bgCard, border: `1px solid ${EXEC.borderLight}` }}>
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${EXEC.borderLight}` }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5 flex items-center gap-1.5" style={{ color: EXEC.textMuted }}>
              <Building2 className="w-3 h-3" /> Distrito
            </p>
            <h3 className="font-black text-lg leading-tight" style={{ color: EXEC.accent1 }}>Participación del Distrito · {district}</h3>
            <p className="text-xs mt-0.5" style={{ color: EXEC.textMuted }}>
              {currentMonthLabel}{prevMonthLabel ? ` · vs ${prevMonthLabel}` : ''} · {districtStoreCodes.length} tiendas
            </p>
          </div>
          <div className="text-right rounded-xl px-3 py-2" style={{ background: `${EXEC.accent1}15` }}>
            <p className="text-xl font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(grandTotal)}</p>
            <p className="text-[10px]" style={{ color: EXEC.textMuted }}>venta total distrito</p>
            {totalDelta !== null && (
              <p className={`text-[10px] font-bold mt-0.5 ${totalDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(1)}% vs {prevMonthLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: EXEC.border, borderTopColor: EXEC.accent1 }} />
          <p className="text-xs mt-3" style={{ color: EXEC.textMuted }}>Cargando participación del distrito…</p>
        </div>
      ) : !effectiveMonth ? (
        <div className="p-10 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: EXEC.textMuted }} />
          <p className="text-sm" style={{ color: EXEC.textMuted }}>No hay reportes de participación cargados para este distrito.</p>
        </div>
      ) : (
        <>
          {/* Gráfica de departamentos */}
          <div className="px-5 sm:px-6 py-5" style={{ borderBottom: `1px solid ${EXEC.borderLight}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: EXEC.textMuted }}>Participación por Departamento</p>
              <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: `${EXEC.accent1}10`, color: EXEC.accent1 }}>
                {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                {sortDir === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
              </button>
            </div>
            <div style={{ width: '100%', height: Math.max(300, deptChartData.length * 44) }}>
              <ResponsiveContainer>
                <BarChart data={deptChartData} layout="vertical" margin={{ left: 8, right: 32, top: 8, bottom: 8 }}>
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
                    {deptChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Cards de participación */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {deptChartData.map((d, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: EXEC.bgCardAlt, border: `1px solid ${EXEC.borderLight}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold truncate" style={{ color: EXEC.textPrimary }}>{d.name}</span>
                  </div>
                  <p className="text-sm font-black" style={{ color: EXEC.accent1 }}>{formatCurrency(d.sales)}</p>
                  <p className="text-[10px]" style={{ color: EXEC.textMuted }}>{d.part.toFixed(2)}% participación</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla jerárquica */}
          <div className="px-5 sm:px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: EXEC.textMuted }}>Tabla Jerárquica · Depto › Sección › Producto</p>
            <DistrictHierarchyTable hierarchy={hierarchy} prevHierarchy={prevHierarchy} />
          </div>
        </>
      )}
    </motion.div>
  );
}