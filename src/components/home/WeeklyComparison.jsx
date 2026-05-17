import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  if (!b) return null;
  return ((a - b) / b) * 100;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
  const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
  const delta = ant > 0 ? ((esta - ant) / ant * 100) : null;
  const isPos = delta != null && delta >= 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,77,141,0.12)',
      borderRadius: 10,
      padding: '9px 13px',
      boxShadow: '0 8px 28px rgba(216,27,96,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      minWidth: 120,
    }}>
      <p style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 900, color: '#111827', fontFamily: 'Inter Tight, Inter, sans-serif', marginBottom: 2 }}>{fmt(esta)}</p>
      <p style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8', marginBottom: delta != null ? 6 : 0 }}>{fmt(ant)} sem. ant.</p>
      {delta != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          background: isPos ? 'rgba(216,27,96,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${isPos ? 'rgba(216,27,96,0.16)' : 'rgba(239,68,68,0.16)'}`,
          borderRadius: 6, padding: '2px 7px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: isPos ? '#D81B60' : '#ef4444' }}>
            {isPos ? '+' : ''}{delta.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

const CustomDot = ({ cx, cy, payload }) => {
  if (!cx || !cy || !payload?.esta) return null;
  const isPos = payload.delta == null || payload.delta >= 0;
  const color = isPos ? '#D81B60' : '#FF4D8D';
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="rgba(216,27,96,0.06)" />
      <circle cx={cx} cy={cy} r={4} fill="white" stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
    </g>
  );
};

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
    const ticketThis = totalThisTxn > 0 ? totalThis / totalThisTxn : 0;
    const ticketLast = totalLastTxn > 0 ? totalLast / totalLastTxn : 0;

    return {
      chartData,
      totals: {
        totalThis, totalLast, salesDelta: pct(totalThis, totalLast),
        totalThisTxn, totalLastTxn, txnDelta: pct(totalThisTxn, totalLastTxn),
        ticketThis, ticketLast, ticketDelta: pct(ticketThis, ticketLast),
      }
    };
  }, [dailySales]);

  if (totals.totalThis === 0 && totals.totalLast === 0) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;
  const OverallIcon = overallUp ? ArrowUpRight : ArrowDownRight;

  const kpis = [
    { label: 'Ventas', val: fmt(totals.totalThis), delta: totals.salesDelta, prev: fmt(totals.totalLast) },
    { label: 'Transacc.', val: totals.totalThisTxn || '—', delta: totals.txnDelta, prev: totals.totalLastTxn || '—' },
    { label: 'Ticket Prom.', val: fmt(totals.ticketThis), delta: totals.ticketDelta, prev: fmt(totals.ticketLast) },
  ];

  // Only show badge on days with significant deltas
  const badgeDays = chartData.map((d, i) => ({
    ...d, i,
    show: d.delta != null && Math.abs(d.delta) >= 5 && d.esta > 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(216,27,96,0.04)',
        position: 'relative',
      }}>

      {/* Very subtle ambient top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'radial-gradient(ellipse 80% 100% at 30% 0%, rgba(216,27,96,0.04) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Hairline top accent */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(216,27,96,0.35), transparent)',
      }} />

      {/* ── METRICS ROW ── */}
      <div className="relative flex items-center px-5 pt-4 pb-3 gap-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>

        {/* KPI items */}
        <div className="flex items-stretch gap-0 flex-1 min-w-0">
          {kpis.map((k, i) => {
            const isPos = k.delta != null && k.delta >= 0;
            const dColor = k.delta == null ? '#94a3b8' : isPos ? '#D81B60' : '#ef4444';
            const DIcon = k.delta == null ? null : isPos ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={i} className="flex-1 flex flex-col justify-center"
                style={{
                  paddingLeft: i === 0 ? 0 : 16,
                  marginLeft: i === 0 ? 0 : 16,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                }}>
                <p style={{
                  fontSize: 7.5, fontWeight: 700, letterSpacing: '0.13em',
                  textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3,
                  fontFamily: 'Inter Tight, Inter, sans-serif'
                }}>{k.label}</p>

                <div className="flex items-baseline gap-1.5">
                  <p style={{
                    fontSize: 17, fontWeight: 900, color: '#0f172a', lineHeight: 1,
                    fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums'
                  }}>{k.val}</p>
                  {DIcon && (
                    <span className="flex items-center" style={{ color: dColor, fontSize: 9, fontWeight: 800 }}>
                      <DIcon style={{ width: 9, height: 9 }} />
                      {Math.abs(k.delta).toFixed(1)}%
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 7.5, color: '#cbd5e1', fontWeight: 500, marginTop: 2 }}>{k.prev} ant.</p>
              </div>
            );
          })}
        </div>

        {/* Overall trend badge — right side */}
        <div style={{ marginLeft: 20, flexShrink: 0 }}>
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
            style={{
              background: overallUp ? '#FFF7FA' : '#fef2f2',
              border: `1px solid ${overallUp ? 'rgba(216,27,96,0.14)' : 'rgba(239,68,68,0.14)'}`,
            }}>
            <OverallIcon style={{ width: 11, height: 11, color: overallUp ? '#D81B60' : '#ef4444' }} />
            <span style={{
              fontSize: 13, fontWeight: 900, fontFamily: 'Inter Tight, Inter, sans-serif',
              letterSpacing: '-0.02em', color: overallUp ? '#D81B60' : '#ef4444',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totals.salesDelta != null ? `${totals.salesDelta >= 0 ? '+' : ''}${totals.salesDelta.toFixed(1)}%` : '—'}
            </span>
          </div>
          <p style={{ fontSize: 7, color: '#cbd5e1', textAlign: 'center', marginTop: 3, fontWeight: 500 }}>vs sem. ant.</p>
        </div>
      </div>

      {/* ── SPARKLINE ── */}
      <div className="relative" style={{ paddingBottom: 8 }}>

        {/* Floating delta badges — positioned absolutely over chart */}
        <div style={{
          position: 'absolute', top: 4, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around',
          paddingLeft: 28, paddingRight: 16,
          pointerEvents: 'none', zIndex: 10,
        }}>
          {badgeDays.map((d) => {
            if (!d.show) return <div key={d.i} style={{ flex: 1 }} />;
            const isPos = d.delta >= 0;
            return (
              <motion.div
                key={d.i}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + d.i * 0.04 }}
                style={{
                  flex: 1, display: 'flex', justifyContent: 'center',
                }}>
                <div style={{
                  background: isPos ? 'rgba(252,231,243,0.9)' : 'rgba(254,226,226,0.9)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isPos ? 'rgba(216,27,96,0.18)' : 'rgba(239,68,68,0.18)'}`,
                  borderRadius: 5,
                  padding: '1.5px 5px',
                  fontSize: 7.5,
                  fontWeight: 800,
                  color: isPos ? '#D81B60' : '#ef4444',
                  boxShadow: `0 2px 6px ${isPos ? 'rgba(216,27,96,0.08)' : 'rgba(239,68,68,0.08)'}`,
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter Tight, Inter, sans-serif',
                  letterSpacing: '-0.01em',
                }}>
                  {isPos ? '+' : ''}{d.delta.toFixed(0)}%
                </div>
              </motion.div>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={88}>
          <AreaChart
            data={chartData}
            margin={{ top: 22, right: 14, left: 14, bottom: 0 }}>
            <defs>
              <linearGradient id="wc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D81B60" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#D81B60" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wc-fill-prev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF8FB8" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#FF8FB8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(216,27,96,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />

            {/* Previous week — ghost line */}
            <Area
              type="monotone"
              dataKey="anterior"
              stroke="rgba(255,143,184,0.28)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="url(#wc-fill-prev)"
              dot={false}
              activeDot={false}
            />

            {/* This week — main premium line */}
            <Area
              type="monotone"
              dataKey="esta"
              stroke="#D81B60"
              strokeWidth={2.5}
              fill="url(#wc-fill)"
              dot={<CustomDot />}
              activeDot={{
                r: 5, fill: '#fff', stroke: '#D81B60', strokeWidth: 2.5,
                style: { filter: 'drop-shadow(0 0 5px rgba(216,27,96,0.35))' }
              }}
              style={{ filter: 'drop-shadow(0 0 4px rgba(216,27,96,0.10))' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend — ultra minimal */}
        <div className="flex items-center justify-center gap-4 pb-1" style={{ marginTop: -2 }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 2, borderRadius: 1, background: '#D81B60', opacity: 0.85 }} />
            <span style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 600 }}>Esta semana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 1, borderRadius: 1, background: '#FF8FB8', opacity: 0.5, borderTop: '1px dashed #FF8FB8' }} />
            <span style={{ fontSize: 7.5, color: '#cbd5e1', fontWeight: 500 }}>Anterior</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}