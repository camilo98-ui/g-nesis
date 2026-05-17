import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
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

function Delta({ pct, size = 'sm' }) {
  if (pct == null || isNaN(pct)) return null;
  const isPos = pct > 0;
  const isZero = Math.abs(pct) < 0.1;
  const color = isZero ? '#94a3b8' : isPos ? '#10b981' : '#ef4444';
  const Icon = isZero ? Minus : isPos ? ArrowUpRight : ArrowDownRight;
  const sz = size === 'lg' ? 15 : size === 'md' ? 12 : 10;
  const fs = size === 'lg' ? 15 : size === 'md' ? 12 : 10;
  return (
    <span className="flex items-center gap-0.5 font-black tabular-nums" style={{ color, fontSize: fs }}>
      <Icon style={{ width: sz, height: sz }} />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function MiniBar({ value, max, color, animated = false }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 3;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(0,0,0,0.06)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        style={{ height: '100%', background: color, borderRadius: 9999 }}
      />
    </div>
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

    return {
      chartData,
      totals: { totalThis, totalLast, salesDelta, totalThisTxn, totalLastTxn, txnDelta, ticketThis, ticketLast, ticketDelta, daysAbove, daysBelow }
    };
  }, [dailySales]);

  const hasData = totals.totalThis > 0 || totals.totalLast > 0;
  if (!hasData) return null;

  const overallUp = totals.salesDelta != null && totals.salesDelta >= 0;
  const mainColor = totals.salesDelta == null ? '#C21875' : overallUp ? '#10b981' : '#ef4444';
  const maxBar = Math.max(...chartData.map(d => Math.max(d.esta, d.anterior)), 1);

  const now = new Date();
  const weekLabel = `${format(startOfWeek(now, { weekStartsOn: 1 }), 'd MMM', { locale: es })} – ${format(now, 'd MMM', { locale: es })}`;
  const prevLabel = `${format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'd MMM', { locale: es })} – ${format(subWeeks(now, 1), 'd MMM', { locale: es })}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const esta = payload.find(p => p.dataKey === 'esta')?.value || 0;
    const ant = payload.find(p => p.dataKey === 'anterior')?.value || 0;
    const pct = ant > 0 ? ((esta - ant) / ant * 100) : null;
    const color = pct == null ? '#C21875' : pct >= 0 ? '#10b981' : '#ef4444';
    return (
      <div style={{
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        minWidth: 140
      }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Esta sem.</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{fmt(esta)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Ant.</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{fmt(ant)}</span>
          </div>
          {pct != null && (
            <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="mb-4 lg:mb-6 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)'
      }}>

      {/* ── HEADER ── */}
      <div className="relative px-5 pt-5 pb-4 flex items-start justify-between gap-4"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${mainColor}18, ${mainColor}08)`,
              border: `1.5px solid ${mainColor}25`,
              boxShadow: `0 4px 12px ${mainColor}15`
            }}>
            {overallUp
              ? <TrendingUp style={{ width: 15, height: 15, color: mainColor }} />
              : <TrendingDown style={{ width: 15, height: 15, color: mainColor }} />}
          </div>
          <div>
            <p className="text-[12px] font-black text-slate-800 leading-none tracking-tight">Ritmo Semanal</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5 tracking-wide">Esta semana vs semana anterior</p>
          </div>
        </div>

        {/* Right — main delta badge */}
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: `${mainColor}10`,
              border: `1px solid ${mainColor}20`
            }}>
            {overallUp
              ? <TrendingUp style={{ width: 11, height: 11, color: mainColor }} />
              : <TrendingDown style={{ width: 11, height: 11, color: mainColor }} />}
            <span className="text-[13px] font-black tabular-nums" style={{ color: mainColor }}>
              {totals.salesDelta != null ? `${totals.salesDelta >= 0 ? '+' : ''}${totals.salesDelta.toFixed(1)}%` : '—'}
            </span>
          </div>
          <p className="text-[8px] text-slate-300 font-medium">vs sem. anterior</p>
        </div>

        {/* Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${mainColor}, ${mainColor}40, transparent)` }} />
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-3 divide-x" style={{ divideColor: 'rgba(0,0,0,0.05)' }}>
        {[
          {
            label: 'Ventas', icon: '💰',
            thisVal: fmt(totals.totalThis), prevVal: fmt(totals.totalLast),
            delta: totals.salesDelta, color: '#C21875'
          },
          {
            label: 'Transacciones', icon: '🔁',
            thisVal: totals.totalThisTxn || '—', prevVal: totals.totalLastTxn || '—',
            delta: totals.txnDelta, color: '#7c3aed'
          },
          {
            label: 'Ticket Prom.', icon: '🎯',
            thisVal: fmt(totals.ticketThis), prevVal: fmt(totals.ticketLast),
            delta: totals.ticketDelta, color: '#0ea5e9'
          },
        ].map((k, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            className="px-4 py-3 flex flex-col gap-1"
            style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px]">{k.icon}</span>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">{k.label}</p>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p className="text-[16px] font-black text-slate-800 leading-none tabular-nums">{k.thisVal}</p>
              <Delta pct={k.delta} size="md" />
            </div>
            <MiniBar
              value={totals.totalThis}
              max={Math.max(totals.totalThis, totals.totalLast, 1)}
              color={k.color}
            />
            <p className="text-[8px] text-slate-300 font-medium mt-0.5">{k.prevVal} sem. ant.</p>
          </motion.div>
        ))}
      </div>

      {/* ── CHART ── */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(148,163,184,0.5)' }} />
              <span className="text-[8px] font-semibold text-slate-400">{prevLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: mainColor }} />
              <span className="text-[8px] font-semibold text-slate-500">{weekLabel}</span>
            </div>
          </div>
          {/* Win/loss counter */}
          <div className="flex items-center gap-2">
            {totals.daysAbove > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-[8px] font-bold" style={{ color: '#10b981' }}>↑ {totals.daysAbove}d mejor</span>
              </div>
            )}
            {totals.daysBelow > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <span className="text-[8px] font-bold" style={{ color: '#ef4444' }}>↓ {totals.daysBelow}d peor</span>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={3} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />

            {/* Semana anterior — gris sutil */}
            <Bar dataKey="anterior" radius={[5, 5, 2, 2]} fill="rgba(148,163,184,0.2)" />

            {/* Esta semana — dinámico verde/rojo */}
            <Bar dataKey="esta" radius={[6, 6, 2, 2]}>
              {chartData.map((entry, i) => {
                const color = entry.esta === 0
                  ? 'rgba(148,163,184,0.15)'
                  : entry.delta == null
                  ? '#C21875'
                  : entry.delta >= 0 ? '#10b981' : '#ef4444';
                const opacity = entry.esta === 0 ? 0.4 : 0.88;
                return <Cell key={i} fill={color} opacity={opacity} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── FOOTER INSIGHT ── */}
      <div className="px-5 pb-4 pt-1">
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{
            background: overallUp ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${overallUp ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)'}`
          }}>
          <Zap style={{ width: 11, height: 11, color: overallUp ? '#10b981' : '#ef4444', flexShrink: 0 }} />
          <p className="text-[9.5px] font-semibold leading-snug" style={{ color: overallUp ? '#059669' : '#dc2626' }}>
            {overallUp
              ? `El ritmo de ventas esta semana supera la anterior en ${totals.salesDelta?.toFixed(1)}% — ¡buen momento para sostener el impulso!`
              : `Las ventas van ${Math.abs(totals.salesDelta ?? 0).toFixed(1)}% por debajo de la semana pasada — enfoca el equipo en sugeridos y ticket promedio.`
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
}