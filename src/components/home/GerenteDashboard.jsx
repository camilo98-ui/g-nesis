import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STORES } from '@/components/StoreSelector';
import { BarChart3, Package, DollarSign, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

const fmtM = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
};

function GapChip({ value }) {
  const isPos = value >= 0;
  const color = isPos ? '#059669' : '#e11d48';
  const Icon = isPos ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
      style={{ color, background: `${color}14` }}>
      <Icon style={{ width: 10, height: 10 }} />
      {fmtM(Math.abs(value))}
    </span>
  );
}

function MiniBar({ pct, color }) {
  const w = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: `${color}18` }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export default function GerenteDashboard() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: allDailySales = [] } = useQuery({
    queryKey: ['gerente-all-daily-sales'],
    queryFn: () => base44.entities.DailySales.list('-date', 500),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ['gerente-all-budgets'],
    queryFn: () => base44.entities.Budget.filter({ month: now.getMonth() + 1, year: now.getFullYear() }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: allPYG = [] } = useQuery({
    queryKey: ['gerente-all-pyg'],
    queryFn: () => base44.entities.PYGReport.list('-created_date', 200),
    staleTime: 10 * 60 * 1000,
  });

  const { data: allSalesReports = [] } = useQuery({
    queryKey: ['gerente-all-sales-reports'],
    queryFn: () => base44.entities.SalesReport.list('-created_date', 500),
    staleTime: 10 * 60 * 1000,
  });

  const { data: storeEntities = [] } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => base44.entities.Store.list(),
    staleTime: 60 * 60 * 1000,
  });

  const storeData = useMemo(() => {
    const activeStores = storeEntities.filter((s) => s.is_active !== false);
    if (!activeStores.length) return [];

    const salesByStore = {};
    allDailySales.forEach((d) => {
      if (!salesByStore[d.store_id]) salesByStore[d.store_id] = [];
      salesByStore[d.store_id].push(d);
    });

    const budgetByStore = {};
    allBudgets.forEach((b) => { budgetByStore[b.store_id] = b; });

    const pygByStore = {};
    allPYG.forEach((p) => {
      const key = p.store_code;
      if (!pygByStore[key] || new Date(p.created_date) > new Date(pygByStore[key].created_date)) {
        pygByStore[key] = p;
      }
    });

    const productsByStore = {};
    allSalesReports.forEach((r) => {
      if (!productsByStore[r.store_code]) productsByStore[r.store_code] = {};
      const key = r.product_name || 'Producto';
      if (!productsByStore[r.store_code][key]) productsByStore[r.store_code][key] = 0;
      productsByStore[r.store_code][key] += r.sales_amount || 0;
    });

    return activeStores.map((store) => {
      const storeSales = (salesByStore[store.id] || []).filter((d) => {
        try { return isWithinInterval(parseISO(d.date), { start: monthStart, end: monthEnd }); } catch { return false; }
      });
      const totalSales = storeSales.reduce((s, d) => s + (d.total_sales || 0), 0);
      const budget = budgetByStore[store.id];
      const monthlyBudget = budget?.sales_budget || 0;
      const dayOfMonth = now.getDate();
      const daysInMonth = monthEnd.getDate();
      const budgetUntilToday = monthlyBudget > 0 ? monthlyBudget / daysInMonth * dayOfMonth : 0;
      const gap = totalSales - budgetUntilToday;
      const projPct = budgetUntilToday > 0 ? (totalSales / budgetUntilToday) * 100 : null;
      const monthProjection = dayOfMonth > 0 ? (totalSales / dayOfMonth) * daysInMonth : 0;

      const prods = productsByStore[store.code] || {};
      const top3 = Object.entries(prods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => ({ name, amount }));

      const pyg = pygByStore[store.code] || null;
      const lastDay = storeSales.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      return { store, totalSales, monthlyBudget, gap, projPct, monthProjection, top3, pyg, lastDay, budgetUntilToday };
    });
  }, [storeEntities, allDailySales, allBudgets, allPYG, allSalesReports]);

  if (!storeEntities.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(194,24,117,0.10)', border: '1px solid rgba(194,24,117,0.15)' }}>
          <BarChart3 style={{ color: '#C21875', width: 15, height: 15 }} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-700" style={{ letterSpacing: '-0.03em' }}>
            Rendimiento de Tiendas
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {format(now, 'MMMM yyyy')} &middot; {storeData.length} tiendas activas
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-auto px-2.5 py-1.5 rounded-xl"
          style={{ background: 'rgba(194,24,117,0.06)', border: '1px solid rgba(194,24,117,0.12)' }}>
          <Sparkles style={{ color: '#C21875', width: 11, height: 11 }} />
          <span className="text-[10px] font-semibold" style={{ color: '#C21875' }}>Nova activo</span>
        </div>
      </motion.div>

      {/* Store Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {storeData.map(({ store, totalSales, monthlyBudget, gap, projPct, monthProjection, top3, pyg, lastDay, budgetUntilToday }, i) => {
          const gapColor = gap >= 0 ? '#059669' : '#e11d48';
          const projColor = projPct == null ? '#94a3b8' : projPct >= 100 ? '#059669' : projPct >= 80 ? '#f59e0b' : '#e11d48';
          const projLabel = projPct == null ? '—' : `${projPct.toFixed(0)}%`;
          const pptPct = budgetUntilToday > 0 ? Math.min((totalSales / budgetUntilToday) * 100, 150) : 0;
          const ebitda = pyg?.margen_ebitda != null ? `${(pyg.margen_ebitda * 100).toFixed(1)}%` : null;
          const ebitdaColor = pyg?.margen_ebitda > 0.15 ? '#059669' : pyg?.margen_ebitda > 0.05 ? '#f59e0b' : '#e11d48';

          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(40px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
              }}>

              {/* Store header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{store.code}</p>
                  <p className="text-[13px] font-black text-slate-700 leading-tight" style={{ letterSpacing: '-0.02em' }}>
                    {store.name}
                  </p>
                </div>
                {lastDay &&
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-medium">Hoy</p>
                    <p className="text-[11px] font-bold text-slate-600">{fmtM(lastDay.total_sales)}</p>
                  </div>
                }
              </div>

              <div className="p-4 space-y-3">
                {/* Ventas vs PPT */}
                <div className="rounded-xl p-3"
                  style={{ background: 'rgba(194,24,117,0.04)', border: '1px solid rgba(194,24,117,0.08)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Ventas del Mes</p>
                    <span className="text-[9px] font-semibold" style={{ color: '#C21875' }}>
                      {pptPct > 0 ? `${pptPct.toFixed(0)}% del PPT` : '—'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-[20px] font-black text-slate-800 leading-none tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                      {fmtM(totalSales)}
                    </p>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400">Meta: {fmtM(budgetUntilToday)}</p>
                      <GapChip value={gap} />
                    </div>
                  </div>
                  <MiniBar pct={pptPct} color="#C21875" />
                </div>

                {/* Proyeccion + Brecha */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-2.5"
                    style={{ background: `${projColor}0a`, border: `1px solid ${projColor}18` }}>
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: `${projColor}99` }}>Proyeccion</p>
                    <p className="text-[16px] font-black leading-none tabular-nums" style={{ color: projColor }}>{projLabel}</p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5 font-medium">{fmtM(monthProjection)}</p>
                  </div>
                  <div className="rounded-xl p-2.5"
                    style={{ background: `${gapColor}0a`, border: `1px solid ${gapColor}18` }}>
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: `${gapColor}99` }}>Brecha mes</p>
                    <p className="text-[13px] font-black leading-none tabular-nums" style={{ color: gapColor }}>
                      {gap >= 0 ? '+' : ''}{fmtM(gap)}
                    </p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5 font-medium">vs PPT acum.</p>
                  </div>
                </div>

                {/* Top 3 Productos */}
                {top3.length > 0 &&
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.10)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2 flex items-center gap-1">
                      <Package style={{ width: 9, height: 9 }} />
                      Top 3 Productos
                    </p>
                    <div className="space-y-1.5">
                      {top3.map((p, idx) => {
                        const maxAmt = top3[0].amount || 1;
                        const barPct = (p.amount / maxAmt) * 100;
                        const colors = ['#6366f1', '#8b5cf6', '#a78bfa'];
                        return (
                          <div key={p.name}>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[9.5px] font-semibold text-slate-600 truncate flex-1 pr-2">
                                <span className="text-[8px] text-slate-400 mr-1">{idx + 1}.</span>
                                {p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name}
                              </p>
                              <p className="text-[9px] font-bold tabular-nums flex-shrink-0" style={{ color: colors[idx] }}>{fmtM(p.amount)}</p>
                            </div>
                            <div className="w-full h-1 rounded-full" style={{ background: `${colors[idx]}18` }}>
                              <div className="h-1 rounded-full" style={{ width: `${barPct}%`, background: colors[idx] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                }

                {/* PYG */}
                {pyg &&
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.10)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2 flex items-center gap-1">
                      <DollarSign style={{ width: 9, height: 9 }} />
                      {'P&G'} &middot; {pyg.period || 'Ultimo reporte'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'EBITDA', value: ebitda, color: ebitdaColor },
                        { label: 'Costo', value: pyg.cost_real != null ? `${(pyg.cost_real * 100).toFixed(1)}%` : null, color: pyg.cost_real < 0.35 ? '#059669' : '#e11d48' },
                        { label: 'Personal', value: pyg.costo_personal != null ? `${(pyg.costo_personal * 100).toFixed(1)}%` : null, color: '#7c3aed' },
                      ].filter(x => x.value).map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg p-1.5 text-center"
                          style={{ background: `${color}0c`, border: `1px solid ${color}18` }}>
                          <p className="text-[7.5px] text-slate-400 font-medium mb-0.5">{label}</p>
                          <p className="text-[11px] font-black tabular-nums" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

      {!storeData.length &&
        <div className="text-center py-16 text-slate-400 text-sm">
          No hay datos de tiendas con presupuesto activo para este mes.
        </div>
      }
    </div>
  );
}