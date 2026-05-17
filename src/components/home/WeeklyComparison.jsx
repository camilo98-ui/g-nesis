import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NUM = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function fmt(val) {
  if (!val) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

export default function WeeklyComparison({ dailySales = [] }) {
  const { chartData, totals } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisW = Array(7).fill(null).map(() => ({ sales: 0, transactions: 0 }));
    const lastW = Array(7).fill(null).map(() => ({ sales: 0, transactions: 0 }));

    for (const d of dailySales) {
      const date = parseISO(d.date);
      const dow = DAY_NUM[date.getDay()];
      if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
        thisW[dow].sales += d.total_sales || 0;
        thisW[dow].transactions += d.total_transactions || 0;
      } else if (isWithinInterval(date, { start: prevStart, end: prevEnd })) {
        lastW[dow].sales += d.total_sales || 0;
        lastW[dow].transactions += d.total_transactions || 0;
      }
    }

    const chartData = DAYS.map((label, i) => ({
      label,
      esta: thisW[i].sales,
      anterior: lastW[i].sales,
      delta: lastW[i].sales > 0 ? ((thisW[i].sales - lastW[i].sales) / lastW[i].sales) * 100 : null,
    }));

    const totalThis = thisW.reduce((s, d) => s + d.sales, 0);
    const totalLast = lastW.reduce((s, d) => s + d.sales, 0);
    const totalThisTxn = thisW.reduce((s, d) => s + d.transactions, 0);
    const totalLastTxn = lastW.reduce((s, d) => s + d.transactions, 0);
    const salesDelta = totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : null;
    const txnDelta = totalLastTxn > 0 ? ((totalThisTxn - totalLastTxn) / totalLastTxn) * 100 : null;
    const ticketThis = totalThisTxn > 0 ? totalThis / totalThisTxn : 0;
    const ticketLast = totalLastTxn > 0 ? totalLast / totalLastTxn : 0;
    const ticketDelta = ticketLast > 0 ? ((ticketThis - ticketLast) / ticketLast) * 100 : null;

    return { chartData, totals: { totalThis, totalLast, salesDelta, totalThisTxn, totalLastTxn, txnDelta, ticketThis, ticketLast, ticketDelta } };
  }, [dailySales]);

  const hasData = totals.totalThis > 0 || totals.totalLast > 0;
  if (!hasData) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
    const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
    const pct = ant > 0 ? ((esta - ant) / ant * 100) : null;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{label}</p>
        <p style={{ color: '#C21875', fontWeight: 700 }}>Esta: {fmt(esta)}</p>
        <p style={{ color: '#94a3b8', fontWeight: 600 }}>Ant: {fmt(ant)}</p>
        {pct != null && <p style={{ color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</p>}
      </div>
    );
  };

  const kpis = [
    { label: 'Ventas', val: fmt(totals.totalThis), prev: fmt(totals.totalLast), delta: totals.salesDelta },
    { label: 'Transacc.', val: totals.totalThisTxn || '—', prev: totals.totalLastTxn || '—', delta: totals.txnDelta },
    { label: 'Ticket', val: fmt(totals.ticketThis), prev: fmt(totals.ticketLast), delta: totals.ticketDelta },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-2xl overflow-hidden bg-white"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Header + KPIs en una sola fila */}
      <div className="flex items-center gap-0 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        {/* Título */}
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: overallUp ? '#dcfce7' : '#fee2e2' }}>
            {overallUp
              ? <TrendingUp style={{ width: 12, height: 12, color: '#10b981' }} />
              : <TrendingDown style={{ width: 12, height: 12, color: '#ef4444' }} />}
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-800 leading-none">Sem. vs Sem.</p>
            <p className="text-[8px] text-slate-400 mt-0.5">Esta vs anterior</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-100 mr-4 flex-shrink-0" />

        {/* KPIs inline */}
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
          {kpis.map((k, i) => {
            const isPos = k.delta != null && k.delta >= 0;
            const color = k.delta == null ? '#94a3b8' : isPos ? '#10b981' : '#ef4444';
            const Icon = k.delta == null ? null : isPos ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={i} className="flex flex-col gap-0.5 flex-shrink-0">
                <p className="text-[7px] font-semibold uppercase tracking-[0.1em] text-slate-400">{k.label}</p>
                <div className="flex items-center gap-1">
                  <p className="text-[13px] font-black text-slate-800 tabular-nums leading-none">{k.val}</p>
                  {Icon && (
                    <span className="flex items-center text-[9px] font-bold tabular-nums" style={{ color }}>
                      <Icon style={{ width: 9, height: 9 }} />{Math.abs(k.delta).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[7px] text-slate-300">{k.prev} ant.</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfica pequeña */}
      <div className="px-3 pt-2 pb-3">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={2} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }} />
            <Bar dataKey="anterior" radius={[3, 3, 1, 1]} fill="rgba(148,163,184,0.2)" />
            <Bar dataKey="esta" radius={[4, 4, 1, 1]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={
                  entry.esta === 0 ? 'rgba(148,163,184,0.15)'
                  : entry.delta == null ? '#C21875'
                  : entry.delta >= 0 ? '#10b981' : '#ef4444'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}