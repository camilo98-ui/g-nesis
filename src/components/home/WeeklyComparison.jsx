import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NUM = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function fmt(val) {
  if (!val) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

function Delta({ pct, size = 'sm' }) {
  if (pct == null || isNaN(pct)) return null;
  const isPos = pct > 0;
  const isZero = pct === 0;
  const color = isZero ? '#94a3b8' : isPos ? '#10b981' : '#ef4444';
  const Icon = isZero ? Minus : isPos ? ArrowUpRight : ArrowDownRight;
  const textSize = size === 'lg' ? 'text-[16px]' : 'text-[10px]';
  return (
    <span className={`flex items-center gap-0.5 font-bold tabular-nums ${textSize}`} style={{ color }}>
      <Icon style={{ width: size === 'lg' ? 14 : 10, height: size === 'lg' ? 14 : 10 }} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function WeeklyComparison({ dailySales = [] }) {
  const { thisWeek, lastWeek, chartData, totals } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekDays = Array(7).fill(null).map((_, i) => ({ sales: 0, tickets: 0, transactions: 0 }));
    const lastWeekDays = Array(7).fill(null).map((_, i) => ({ sales: 0, tickets: 0, transactions: 0 }));

    for (const d of dailySales) {
      const date = parseISO(d.date);
      const dow = DAY_NUM[date.getDay()]; // 0=Mon, 6=Sun
      if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
        thisWeekDays[dow].sales += d.total_sales || 0;
        thisWeekDays[dow].tickets += d.total_tickets || 0;
        thisWeekDays[dow].transactions += d.total_transactions || 0;
      } else if (isWithinInterval(date, { start: prevStart, end: prevEnd })) {
        lastWeekDays[dow].sales += d.total_sales || 0;
        lastWeekDays[dow].tickets += d.total_tickets || 0;
        lastWeekDays[dow].transactions += d.total_transactions || 0;
      }
    }

    const chartData = DAYS.map((label, i) => ({
      label,
      esta: thisWeekDays[i].sales,
      anterior: lastWeekDays[i].sales,
      delta: lastWeekDays[i].sales > 0
        ? ((thisWeekDays[i].sales - lastWeekDays[i].sales) / lastWeekDays[i].sales) * 100
        : null,
    }));

    const totalThis = thisWeekDays.reduce((s, d) => s + d.sales, 0);
    const totalLast = lastWeekDays.reduce((s, d) => s + d.sales, 0);
    const totalThisTxn = thisWeekDays.reduce((s, d) => s + d.transactions, 0);
    const totalLastTxn = lastWeekDays.reduce((s, d) => s + d.transactions, 0);

    const salesDelta = totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : null;
    const txnDelta = totalLastTxn > 0 ? ((totalThisTxn - totalLastTxn) / totalLastTxn) * 100 : null;

    const ticketThis = totalThisTxn > 0 ? totalThis / totalThisTxn : 0;
    const ticketLast = totalLastTxn > 0 ? totalLast / totalLastTxn : 0;
    const ticketDelta = ticketLast > 0 ? ((ticketThis - ticketLast) / ticketLast) * 100 : null;

    return {
      thisWeek: thisWeekDays,
      lastWeek: lastWeekDays,
      chartData,
      totals: { totalThis, totalLast, salesDelta, totalThisTxn, totalLastTxn, txnDelta, ticketThis, ticketLast, ticketDelta }
    };
  }, [dailySales]);

  const hasData = totals.totalThis > 0 || totals.totalLast > 0;
  if (!hasData) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;
  const accentColor = totals.salesDelta == null ? '#94a3b8' : overallUp ? '#10b981' : '#ef4444';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
    const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
    const pct = ant > 0 ? ((esta - ant) / ant * 100) : null;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        fontSize: 11
      }}>
        <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#C21875', fontWeight: 700 }}>Esta semana: {fmt(esta)}</p>
        <p style={{ color: '#94a3b8', fontWeight: 600 }}>Semana anterior: {fmt(ant)}</p>
        {pct != null && (
          <p style={{ color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, marginTop: 2 }}>
            {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  const kpis = [
    { label: 'Ventas esta semana', value: fmt(totals.totalThis), sub: fmt(totals.totalLast) + ' sem. ant.', delta: totals.salesDelta },
    { label: 'Transacciones', value: totals.totalThisTxn, sub: `${totals.totalLastTxn} sem. ant.`, delta: totals.txnDelta },
    { label: 'Ticket Promedio', value: fmt(totals.ticketThis), sub: fmt(totals.ticketLast) + ' sem. ant.', delta: totals.ticketDelta },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-4 lg:mb-6 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)'
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}>
            {overallUp
              ? <TrendingUp style={{ width: 13, height: 13, color: accentColor }} />
              : <TrendingDown style={{ width: 13, height: 13, color: accentColor }} />}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-none">Semana vs Semana Anterior</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">Comparativo de ritmo de ventas diarias</p>
          </div>
        </div>
        <Delta pct={totals.salesDelta} size="lg" />
      </div>

      {/* KPI Pills */}
      <div className="grid grid-cols-3 gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        {kpis.map((k, i) => (
          <div key={i} className="text-center">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">{k.label}</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-[13px] font-black text-slate-800 tabular-nums">{k.value}</p>
              <Delta pct={k.delta} />
            </div>
            <p className="text-[8px] text-slate-300 font-medium mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 pt-3 pb-4">
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} barCategoryGap="28%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            {/* Sem anterior — gris neutro */}
            <Bar dataKey="anterior" radius={[4, 4, 2, 2]} fill="rgba(148,163,184,0.25)" />
            {/* Esta semana — color dinámico por barra */}
            <Bar dataKey="esta" radius={[5, 5, 2, 2]}>
              {chartData.map((entry, i) => {
                const color = entry.delta == null
                  ? '#C21875'
                  : entry.delta >= 0 ? '#10b981' : '#ef4444';
                return <Cell key={i} fill={color} opacity={0.85} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(148,163,184,0.4)' }} />
            <span className="text-[8px] font-medium text-slate-400">Semana anterior</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#10b981' }} />
            <span className="text-[8px] font-medium text-slate-400">Esta semana (↑ mejor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} />
            <span className="text-[8px] font-medium text-slate-400">Esta semana (↓ peor)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}