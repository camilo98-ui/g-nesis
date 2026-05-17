import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceDot, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NUM = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function fmt(val) {
  if (!val) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

function pct(a, b) {
  if (!b || b === 0) return null;
  return ((a - b) / b) * 100;
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || payload.esta === 0) return null;
  const delta = payload.delta;
  const color = delta == null ? '#D81B60' : delta >= 0 ? '#D81B60' : '#FF4D8D';
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="white" stroke={color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
    </g>
  );
};

const PrevDot = () => null;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
  const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
  const delta = ant > 0 ? ((esta - ant) / ant * 100) : null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(216,27,96,0.15)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(216,27,96,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      minWidth: 130
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: '#D81B60', fontWeight: 600 }}>Esta sem.</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>{fmt(esta)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Anterior</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{fmt(ant)}</span>
      </div>
      {delta != null && (
        <div style={{
          background: delta >= 0 ? 'rgba(216,27,96,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${delta >= 0 ? 'rgba(216,27,96,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 8,
          padding: '3px 8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: delta >= 0 ? '#D81B60' : '#ef4444' }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function WeeklyComparison({ dailySales = [] }) {
  const [hovered, setHovered] = useState(null);

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
    const ticketThis = totalThisTxn > 0 ? totalThis / totalThisTxn : 0;
    const ticketLast = totalLastTxn > 0 ? totalLast / totalLastTxn : 0;

    return {
      chartData,
      totals: {
        totalThis, totalLast,
        salesDelta: pct(totalThis, totalLast),
        totalThisTxn, totalLastTxn,
        txnDelta: pct(totalThisTxn, totalLastTxn),
        ticketThis, ticketLast,
        ticketDelta: pct(ticketThis, ticketLast),
      }
    };
  }, [dailySales]);

  const hasData = totals.totalThis > 0 || totals.totalLast > 0;
  if (!hasData) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;

  // Find peak and worst day for badges
  const peakDay = chartData.reduce((best, d, i) => d.esta > (chartData[best]?.esta || 0) ? i : best, 0);

  const kpis = [
    { label: 'Ventas', val: fmt(totals.totalThis), delta: totals.salesDelta, prev: fmt(totals.totalLast) },
    { label: 'Transacc.', val: totals.totalThisTxn || '—', delta: totals.txnDelta, prev: totals.totalLastTxn || '—' },
    { label: 'Ticket Prom.', val: fmt(totals.ticketThis), delta: totals.ticketDelta, prev: fmt(totals.ticketLast) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 rounded-2xl overflow-hidden relative"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(216,27,96,0.1)',
        boxShadow: '0 4px 24px rgba(216,27,96,0.06), 0 1px 4px rgba(0,0,0,0.04)',
      }}>

      {/* Ambient glow top-left */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 200, height: 100,
        background: 'radial-gradient(ellipse at 0% 0%, rgba(216,27,96,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #D81B60, #FF8FB8, transparent)',
        borderRadius: '9999px 9999px 0 0'
      }} />

      {/* ── HEADER ROW ── */}
      <div className="relative flex items-center gap-0 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(216,27,96,0.06)' }}>

        {/* Title */}
        <div className="flex items-center gap-2 mr-5 flex-shrink-0">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FCE7F3, #FFF7FA)', border: '1px solid rgba(216,27,96,0.15)' }}>
            <Sparkles style={{ width: 12, height: 12, color: '#D81B60' }} />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-800 leading-none tracking-tight">Semana actual</p>
            <p className="text-[8px] text-slate-400 mt-0.5 font-medium">vs. semana anterior</p>
          </div>
        </div>

        <div className="w-px h-7 flex-shrink-0 mr-5" style={{ background: 'rgba(216,27,96,0.08)' }} />

        {/* KPIs */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {kpis.map((k, i) => {
            const isPos = k.delta != null && k.delta >= 0;
            const color = k.delta == null ? '#94a3b8' : isPos ? '#D81B60' : '#ef4444';
            const Icon = k.delta == null ? null : isPos ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={i} className="flex flex-col gap-0.5 flex-shrink-0">
                <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">{k.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[15px] font-black text-slate-800 tabular-nums leading-none">{k.val}</p>
                  {Icon && (
                    <span className="flex items-center font-black tabular-nums" style={{ color, fontSize: 9 }}>
                      <Icon style={{ width: 9, height: 9 }} />{Math.abs(k.delta).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[7px] font-medium" style={{ color: 'rgba(148,163,184,0.7)' }}>{k.prev} ant.</p>
              </div>
            );
          })}

          {/* Overall badge */}
          <div className="ml-auto flex-shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{
                background: overallUp ? 'linear-gradient(135deg, rgba(216,27,96,0.08), rgba(255,143,184,0.06))' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${overallUp ? 'rgba(216,27,96,0.18)' : 'rgba(239,68,68,0.18)'}`,
              }}>
              {overallUp
                ? <TrendingUp style={{ width: 10, height: 10, color: '#D81B60' }} />
                : <TrendingDown style={{ width: 10, height: 10, color: '#ef4444' }} />}
              <span className="text-[12px] font-black tabular-nums"
                style={{ color: overallUp ? '#D81B60' : '#ef4444' }}>
                {totals.salesDelta != null ? `${totals.salesDelta >= 0 ? '+' : ''}${totals.salesDelta.toFixed(1)}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SPARKLINE CHART ── */}
      <div className="relative px-2 pt-2 pb-2">
        <ResponsiveContainer width="100%" height={82}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
            onMouseMove={(e) => e?.activeTooltipIndex != null && setHovered(e.activeTooltipIndex)}
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <linearGradient id="wc-gradient-main" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D81B60" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#D81B60" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wc-gradient-prev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF8FB8" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#FF8FB8" stopOpacity={0} />
              </linearGradient>
              <filter id="wc-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: '#cbd5e1', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(216,27,96,0.12)', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {/* Semana anterior — línea muy tenue */}
            <Area
              type="monotone"
              dataKey="anterior"
              stroke="rgba(255,143,184,0.3)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#wc-gradient-prev)"
              dot={false}
              activeDot={false}
            />

            {/* Esta semana — línea principal premium */}
            <Area
              type="monotone"
              dataKey="esta"
              stroke="#D81B60"
              strokeWidth={2.5}
              fill="url(#wc-gradient-main)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#fff', stroke: '#D81B60', strokeWidth: 2.5, style: { filter: 'drop-shadow(0 0 6px rgba(216,27,96,0.5))' } }}
              style={{ filter: 'drop-shadow(0 0 3px rgba(216,27,96,0.3))' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Day delta badges over chart — float above at specific x positions */}
        <div className="absolute top-3 left-0 right-0 pointer-events-none px-10 flex justify-between items-start">
          {chartData.map((d, i) => {
            if (d.delta == null || d.esta === 0 || Math.abs(d.delta) < 3) return <div key={i} />;
            const isPos = d.delta >= 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                style={{
                  background: isPos ? 'rgba(252,231,243,0.92)' : 'rgba(254,226,226,0.92)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${isPos ? 'rgba(216,27,96,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: 6,
                  padding: '1px 5px',
                  fontSize: 7.5,
                  fontWeight: 800,
                  color: isPos ? '#D81B60' : '#ef4444',
                  boxShadow: isPos ? '0 2px 8px rgba(216,27,96,0.12)' : '0 2px 8px rgba(239,68,68,0.1)',
                  whiteSpace: 'nowrap',
                }}>
                {isPos ? '+' : ''}{d.delta.toFixed(0)}%
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}