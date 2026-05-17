import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Zap, Minus } from 'lucide-react';
import { parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NUM = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function fmt(val) {
  if (!val) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

function pctColor(pct) {
  if (pct == null || isNaN(pct)) return '#64748b';
  if (Math.abs(pct) < 0.1) return '#64748b';
  return pct > 0 ? '#34d399' : '#f87171';
}

function DeltaBadge({ pct }) {
  if (pct == null || isNaN(pct)) return <span style={{ color: '#64748b', fontSize: 10 }}>—</span>;
  const color = pctColor(pct);
  const Icon = Math.abs(pct) < 0.1 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-0.5 font-black tabular-nums" style={{ color, fontSize: 11 }}>
      <Icon style={{ width: 11, height: 11 }} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function WeeklyComparison({ dailySales = [] }) {
  const { chartData, totals } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekDays = Array(7).fill(null).map(() => ({ sales: 0, transactions: 0 }));
    const lastWeekDays = Array(7).fill(null).map(() => ({ sales: 0, transactions: 0 }));

    for (const d of dailySales) {
      const date = parseISO(d.date);
      const dow = DAY_NUM[date.getDay()];
      if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
        thisWeekDays[dow].sales += d.total_sales || 0;
        thisWeekDays[dow].transactions += d.total_transactions || 0;
      } else if (isWithinInterval(date, { start: prevStart, end: prevEnd })) {
        lastWeekDays[dow].sales += d.total_sales || 0;
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
    const daysAbove = chartData.filter(d => d.delta != null && d.delta >= 0).length;
    const daysBelow = chartData.filter(d => d.delta != null && d.delta < 0).length;

    return { chartData, totals: { totalThis, totalLast, salesDelta, totalThisTxn, totalLastTxn, txnDelta, ticketThis, ticketLast, ticketDelta, daysAbove, daysBelow } };
  }, [dailySales]);

  const hasData = totals.totalThis > 0 || totals.totalLast > 0;
  if (!hasData) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;
  const accentGreen = '#34d399';
  const accentRed = '#f87171';
  const mainAccent = totals.salesDelta == null ? '#C21875' : overallUp ? accentGreen : accentRed;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
    const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
    const pct = ant > 0 ? ((esta - ant) / ant * 100) : null;
    return (
      <div style={{
        background: 'rgba(2,6,23,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${pct == null ? 'rgba(255,255,255,0.1)' : pct >= 0 ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        minWidth: 148
      }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>Esta sem.</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{fmt(esta)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>Ant.</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{fmt(ant)}</span>
        </div>
        {pct != null && (
          <div style={{
            background: pct >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            borderRadius: 8,
            padding: '4px 8px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: pct >= 0 ? accentGreen : accentRed }}>
              {pct >= 0 ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  const kpis = [
    { label: 'Ventas', emoji: '💰', val: fmt(totals.totalThis), prev: fmt(totals.totalLast), delta: totals.salesDelta },
    { label: 'Transacciones', emoji: '🔁', val: totals.totalThisTxn || '—', prev: totals.totalLastTxn || '—', delta: totals.txnDelta },
    { label: 'Ticket Prom.', emoji: '🎯', val: fmt(totals.ticketThis), prev: fmt(totals.ticketLast), delta: totals.ticketDelta },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 lg:mb-6 rounded-3xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1a1f35 50%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}>

      {/* Ambient glow top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${mainAccent}18 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${mainAccent}, transparent)`,
        opacity: 0.8
      }} />

      {/* ── HEADER ── */}
      <div className="relative px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${mainAccent}25, ${mainAccent}08)`,
              border: `1.5px solid ${mainAccent}30`,
              boxShadow: `0 0 20px ${mainAccent}20`
            }}>
            {overallUp
              ? <TrendingUp style={{ width: 16, height: 16, color: mainAccent }} />
              : <TrendingDown style={{ width: 16, height: 16, color: mainAccent }} />}
          </div>
          <div>
            <p className="text-[13px] font-black leading-none tracking-tight" style={{ color: '#f1f5f9' }}>Ritmo Semanal</p>
            <p className="text-[9px] font-medium mt-0.5 tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Esta semana vs. semana anterior</p>
          </div>
        </div>

        {/* Big delta pill */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: `${mainAccent}15`,
              border: `1px solid ${mainAccent}30`,
              boxShadow: `0 0 16px ${mainAccent}10`
            }}>
            {overallUp
              ? <TrendingUp style={{ width: 11, height: 11, color: mainAccent }} />
              : <TrendingDown style={{ width: 11, height: 11, color: mainAccent }} />}
            <span className="text-[14px] font-black tabular-nums" style={{ color: mainAccent }}>
              {totals.salesDelta != null ? `${totals.salesDelta >= 0 ? '+' : ''}${totals.salesDelta.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totals.daysAbove > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(52,211,153,0.12)', color: accentGreen, border: '1px solid rgba(52,211,153,0.2)' }}>
                ↑{totals.daysAbove}d
              </span>
            )}
            {totals.daysBelow > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(248,113,113,0.1)', color: accentRed, border: '1px solid rgba(248,113,113,0.2)' }}>
                ↓{totals.daysBelow}d
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-3 mx-5 mb-4 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
        {kpis.map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="px-3 py-3 flex flex-col gap-1"
            style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 9 }}>{k.emoji}</span>
              <p className="text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{k.label}</p>
            </div>
            <p className="text-[17px] font-black leading-none tabular-nums" style={{ color: '#f1f5f9' }}>{k.val}</p>
            <DeltaBadge pct={k.delta} />
            <p className="text-[7.5px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{k.prev} ant.</p>
          </motion.div>
        ))}
      </div>

      {/* ── CHART ── */}
      <div className="px-4 pb-4">
        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Sem. anterior</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: accentGreen }} />
            <span className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>↑ Mejor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: accentRed }} />
            <span className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>↓ Peor</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barCategoryGap="28%" barGap={3} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />

            <Bar dataKey="anterior" radius={[5, 5, 2, 2]} fill="rgba(255,255,255,0.08)" />
            <Bar dataKey="esta" radius={[6, 6, 2, 2]}>
              {chartData.map((entry, i) => {
                const c = entry.esta === 0 ? 'rgba(255,255,255,0.06)'
                  : entry.delta == null ? '#C21875'
                  : entry.delta >= 0 ? accentGreen : accentRed;
                return <Cell key={i} fill={c} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── INSIGHT FOOTER ── */}
      <div className="mx-5 mb-5">
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
          style={{
            background: overallUp ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${overallUp ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`
          }}>
          <Zap style={{ width: 12, height: 12, color: mainAccent, flexShrink: 0, marginTop: 1 }} />
          <p className="text-[9.5px] font-semibold leading-relaxed" style={{ color: overallUp ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)' }}>
            {overallUp
              ? `Ventas ${totals.salesDelta?.toFixed(1)}% arriba de la semana pasada — sostén el impulso y aprovecha el momentum.`
              : `Ventas ${Math.abs(totals.salesDelta ?? 0).toFixed(1)}% por debajo — enfoca sugeridos y ticket promedio hoy.`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}