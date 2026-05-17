import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, TrendingDown } from 'lucide-react';
import { parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NUM = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function fmt(val) {
  if (!val && val !== 0) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

function pct(a, b) {
  if (!b) return null;
  return ((a - b) / b) * 100;
}

// Custom dot for main line — glassy with glow
const MainDot = ({ cx, cy, payload, index, activeIndex }) => {
  if (cx == null || cy == null) return null;
  const isActive = index === activeIndex;
  return (
    <g>
      {/* outer glow ring */}
      <circle cx={cx} cy={cy} r={isActive ? 12 : 9} fill="rgba(255,77,141,0.08)" />
      <circle cx={cx} cy={cy} r={isActive ? 8 : 6} fill="rgba(255,77,141,0.12)" />
      {/* white core with pink border */}
      <circle
        cx={cx} cy={cy} r={isActive ? 5 : 4}
        fill="white"
        stroke="#D81B60"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 4px rgba(216,27,96,0.45))' }}
      />
    </g>
  );
};

// Custom dot for previous week — small ghost dots at bottom axis
const PrevDot = ({ cx, cy }) => {
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,143,184,0.3)" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
  const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
  const delta = ant > 0 ? ((esta - ant) / ant * 100) : null;
  const isPos = delta != null && delta >= 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,77,141,0.15)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 8px 28px rgba(216,27,96,0.10)',
      minWidth: 130,
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.03em', marginBottom: 3 }}>{fmt(esta)}</p>
      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginBottom: delta != null ? 6 : 0 }}>{fmt(ant)} ant.</p>
      {delta != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          background: isPos ? 'rgba(216,27,96,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${isPos ? 'rgba(216,27,96,0.18)' : 'rgba(239,68,68,0.18)'}`,
          borderRadius: 6, padding: '2px 8px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: isPos ? '#D81B60' : '#ef4444' }}>
            {isPos ? '+' : ''}{delta.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function WeeklyComparison({ dailySales = [] }) {
  const [isHovered, setIsHovered] = useState(false);
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
      esta: thisW[i].sales || null,
      anterior: lastW[i].sales || null,
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

  const overallDelta = totals.salesDelta;
  const overallUp = overallDelta != null && overallDelta >= 0;

  const kpis = [
    { label: 'Ventas', val: fmt(totals.totalThis), delta: totals.salesDelta, prev: fmt(totals.totalLast) },
    { label: 'Transacc.', val: totals.totalThisTxn ? totals.totalThisTxn.toLocaleString('es-CO') : '—', delta: totals.txnDelta, prev: totals.totalLastTxn ? totals.totalLastTxn.toLocaleString('es-CO') : '—' },
    { label: 'Ticket Prom.', val: fmt(totals.ticketThis), delta: totals.ticketDelta, prev: fmt(totals.ticketLast) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 rounded-2xl overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? 'linear-gradient(145deg, #FFF7FA 0%, #FFF2F6 100%)' : '#ffffff',
        border: `1px solid ${isHovered ? 'rgba(255,77,141,0.18)' : 'rgba(255,77,141,0.10)'}`,
        boxShadow: isHovered ? '0 4px 24px rgba(216,27,96,0.08), 0 1px 4px rgba(0,0,0,0.04)' : '0 2px 16px rgba(216,27,96,0.04), 0 1px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.3s ease',
      }}>

      {/* Subtle ambient glow blobs */}
      <div style={{
        position: 'absolute', top: -30, left: -30, width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(255,77,141,0.09) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: -20, right: 60, width: 150, height: 150,
        background: 'radial-gradient(circle, rgba(216,27,96,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* ── HEADER / METRICS ── */}
      <div className="relative flex items-center px-5 pt-4 pb-3 gap-4"
        style={{ borderBottom: '1px solid rgba(255,77,141,0.08)' }}>

        {/* Title block */}
        <div className="flex items-center gap-2.5 flex-shrink-0 mr-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,141,0.15), rgba(255,143,184,0.1))',
              border: '1px solid rgba(255,77,141,0.2)',
            }}>
            <TrendingDown style={{ width: 14, height: 14, color: '#D81B60' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', lineHeight: 1.1, fontFamily: 'Inter Tight, Inter, sans-serif' }}>Semana actual</p>
            <p style={{ fontSize: 8.5, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>vs. semana anterior</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 36, background: 'rgba(255,77,141,0.12)', flexShrink: 0 }} />

        {/* KPI metrics */}
        <div className="flex items-stretch gap-0 flex-1 min-w-0">
          {kpis.map((k, i) => {
            const isPos = k.delta != null && k.delta >= 0;
            const dColor = k.delta == null ? '#94a3b8' : isPos ? '#10b981' : '#D81B60';
            const DIcon = k.delta == null ? null : isPos ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={i} className="flex flex-col justify-center flex-1"
                style={{
                  paddingLeft: i === 0 ? 0 : 16,
                  marginLeft: i === 0 ? 0 : 16,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(255,77,141,0.08)',
                }}>
                <p style={{
                  fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3,
                }}>
                  {k.label}
                </p>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span style={{
                    fontSize: 17, fontWeight: 600, color: '#1e293b', lineHeight: 1,
                    fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{k.val}</span>
                  {DIcon && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 1, color: dColor, fontSize: 9.5, fontWeight: 800 }}>
                      <DIcon style={{ width: 10, height: 10 }} />
                      {Math.abs(k.delta).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 8, color: '#cbd5e1', fontWeight: 500, marginTop: 2 }}>{k.prev} ant.</p>
              </div>
            );
          })}
        </div>

        {/* Overall badge */}
        <div style={{ flexShrink: 0, marginLeft: 8 }}>
          <div className="flex flex-col items-center rounded-xl px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,77,141,0.15)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 12px rgba(216,27,96,0.07)',
            }}>
            <div className="flex items-center gap-1 mb-0.5">
              {overallUp
                ? <ArrowUpRight style={{ width: 11, height: 11, color: '#10b981' }} />
                : <ArrowDownRight style={{ width: 11, height: 11, color: '#D81B60' }} />}
              <span style={{
                fontSize: 15, fontWeight: 700, fontFamily: 'Inter Tight, Inter, sans-serif',
                letterSpacing: '-0.03em', color: overallUp ? '#10b981' : '#D81B60',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {overallDelta != null ? `${Math.abs(overallDelta).toFixed(1)}%` : '—'}
              </span>
            </div>
            <p style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>vs. semana anterior</p>
          </div>
        </div>
      </div>

      {/* ── CHART AREA ── */}
      <div className="relative" style={{ paddingTop: 4 }}>

        {/* Delta badges — absolutely positioned over chart */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          paddingLeft: 40,
          paddingRight: 16,
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {chartData.map((d, i) => {
            const show = d.delta != null && Math.abs(d.delta) >= 3 && d.esta;
            if (!show) return <div key={i} style={{ flex: 1 }} />;
            const isPos = d.delta >= 0;
            return (
              <motion.div
                key={i}
                style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}>
                <div style={{
                  background: isPos ? 'rgba(236,253,245,0.92)' : 'rgba(255,240,246,0.92)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isPos ? 'rgba(16,185,129,0.25)' : 'rgba(255,77,141,0.25)'}`,
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 8,
                  fontWeight: 800,
                  color: isPos ? '#059669' : '#D81B60',
                  boxShadow: isPos ? '0 2px 6px rgba(16,185,129,0.1)' : '0 2px 6px rgba(216,27,96,0.1)',
                  fontFamily: 'Inter Tight, Inter, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {isPos ? '+' : ''}{d.delta.toFixed(0)}%
                </div>
              </motion.div>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={140}>
          <LineChart
            data={chartData}
            margin={{ top: 36, right: 20, left: 20, bottom: 8 }}>
            <defs>
              <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(216,27,96,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            {/* Previous week — soft dashed ghost */}
            <Line
              type="monotone"
              dataKey="anterior"
              stroke="rgba(255,143,184,0.45)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={<PrevDot />}
              activeDot={false}
              connectNulls
            />

            {/* This week — premium main line */}
            <Line
              type="monotone"
              dataKey="esta"
              stroke="#FF4D8D"
              strokeWidth={3}
              dot={<MainDot />}
              activeDot={{
                r: 6, fill: 'white', stroke: '#D81B60', strokeWidth: 2.5,
                style: { filter: 'drop-shadow(0 0 6px rgba(216,27,96,0.5))' }
              }}
              connectNulls
              style={{ filter: 'drop-shadow(0 0 5px rgba(255,77,141,0.25))' }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 pb-3" style={{ marginTop: -6 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 20, height: 2.5, borderRadius: 2, background: 'linear-gradient(90deg, #FF4D8D, #D81B60)' }} />
            <span style={{ fontSize: 8.5, color: '#6b7280', fontWeight: 600 }}>Esta semana</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{
              width: 20, height: 0, borderTop: '1.5px dashed rgba(255,143,184,0.6)',
            }} />
            <span style={{ fontSize: 8.5, color: '#9ca3af', fontWeight: 500 }}>Semana anterior</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}