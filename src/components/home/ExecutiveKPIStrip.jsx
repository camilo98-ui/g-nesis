import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Receipt, BarChart2, Users, Target, Zap } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import PremiumSparkline from './PremiumSparkline';

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function Delta({ val, size = 'sm' }) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const pos = val >= 0;
  const cls = size === 'lg'
    ? 'text-[13px] font-bold'
    : 'text-[10.5px] font-semibold';
  return (
    <span className={`flex items-center gap-0.5 tabular-nums ${cls} ${pos ? 'text-emerald-500' : 'text-rose-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>
  );
}

// Circular gauge for PPT compliance
function PPTGauge({ value, budget }) {
  const pct = value ?? 0;
  const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : pct >= 50 ? '#f97316' : '#e11d48';
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'rgba(0,0,0,0.04)' }];

  return (
    <div className="relative flex flex-col items-center">
      <div style={{ width: 80, height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="95%"
            startAngle={220} endAngle={-40}
            data={data}
            barSize={6}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'rgba(0,0,0,0.04)', cornerRadius: 4 }} />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-black tabular-nums leading-none" style={{ color }}>
            {value !== null ? `${value}` : '—'}
          </span>
          <span className="text-[8px] font-semibold text-slate-300 mt-0.5">%</span>
        </div>
      </div>
      <p className="text-[9px] font-semibold text-slate-400 tracking-wide mt-1">PPT Día</p>
      {budget && (
        <p className="text-[8.5px] text-slate-300 font-medium">{fmt(budget)} meta</p>
      )}
    </div>
  );
}

// Standard KPI tile
function KPITile({ label, value, change, icon: Icon, color, sparkData, accent, delay, wide }) {
  const isPos = change > 0;
  const sparkColor = isPos ? '#10b981' : change < 0 ? '#f43f5e' : '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`relative rounded-2xl p-4 overflow-hidden group cursor-default ${wide ? 'col-span-2' : ''}`}
      style={{
        background: accent
          ? `linear-gradient(135deg, ${color}0a 0%, ${color}03 100%)`
          : 'rgba(255,255,255,0.88)',
        border: accent ? `1px solid ${color}18` : '1px solid rgba(0,0,0,0.06)',
        boxShadow: accent
          ? `0 1px 3px rgba(0,0,0,0.04), 0 8px 32px ${color}08`
          : '0 1px 3px rgba(0,0,0,0.04)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Subtle top shine */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: accent ? `linear-gradient(90deg, transparent, ${color}30, transparent)` : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }} />

      <div className="flex items-start justify-between mb-2.5">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: `${color}10` }}>
          <Icon style={{ color, width: 13, height: 13, opacity: 0.9 }} />
        </div>
        <Delta val={change} />
      </div>

      <p className="text-[24px] font-black leading-none tracking-tight tabular-nums mb-0.5"
        style={{ color: accent ? color : '#1e293b' }}>
        {value}
      </p>
      <p className="text-[10.5px] font-medium text-slate-400 mb-2.5">{label}</p>

      <div className="opacity-75">
        <PremiumSparkline data={sparkData || [3,4,4,5,4,6,5,7]} color={sparkColor} width={90} height={22} />
      </div>

      {/* Hover glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
    </motion.div>
  );
}

export default function ExecutiveKPIStrip({
  latest, prev, salesVal, txnVal, ticketVal, salesChange,
  cashiers = [], budget = [], sparkSales = [], sparkTxn = []
}) {
  // PPT compliance for today
  const now = new Date();
  const activeBudget = useMemo(() => budget.find(b => b.is_active) || budget[0], [budget]);

  // Daily PPT = monthly budget / days in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyPPT = activeBudget?.sales_budget ? activeBudget.sales_budget / daysInMonth : null;
  const todaySales = latest?.total_sales ?? null;
  const todayPPTPct = dailyPPT && todaySales !== null
    ? Math.round((todaySales / dailyPPT) * 100)
    : null;

  const txnChange = latest && prev
    ? Math.round(((latest.total_transactions - prev.total_transactions) / (prev.total_transactions || 1)) * 100)
    : 0;

  const ebitdaVal = todaySales ? fmt(Math.round(todaySales * 0.34)) : '—';
  const sparkEbitda = sparkSales.map(v => Math.round(v * 0.34));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-7"
    >
      {/* Hero PPT card — full width */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-2xl p-5 mb-3 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(194,24,117,0.06) 0%, rgba(99,102,241,0.04) 50%, rgba(255,255,255,0.9) 100%)',
          border: '1px solid rgba(194,24,117,0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(194,24,117,0.06)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Decorative gradient blob */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.07) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-6 flex-wrap">
          {/* Gauge */}
          <PPTGauge value={todayPPTPct} budget={dailyPPT} />

          {/* Divider */}
          <div className="h-16 w-px hidden sm:block" style={{ background: 'rgba(194,24,117,0.1)' }} />

          {/* Main metric */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C21875', boxShadow: '0 0 5px rgba(194,24,117,0.6)' }} />
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-[0.15em]">Rendimiento del día</p>
            </div>
            <p className="text-[32px] font-black leading-none tracking-tight tabular-nums mb-1"
              style={{ color: '#1e293b' }}>
              {salesVal}
            </p>
            <div className="flex items-center gap-3">
              <Delta val={salesChange} size="lg" />
              <span className="text-[11px] text-slate-400 font-medium">vs ayer</span>
              {dailyPPT && (
                <span className="text-[10px] text-slate-300 font-medium">· meta {fmt(dailyPPT)}</span>
              )}
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex gap-5 flex-shrink-0">
            {[
              { label: 'Txn', value: txnVal, delta: txnChange },
              { label: 'Ticket', value: ticketVal, delta: null },
              { label: 'EBITDA', value: ebitdaVal, delta: null },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-black tabular-nums text-slate-700 leading-none">{s.value}</p>
                {s.delta !== null && <Delta val={s.delta} />}
                <p className="text-[9px] text-slate-300 font-semibold tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div className="hidden lg:block flex-shrink-0 opacity-60">
            <PremiumSparkline data={sparkSales.length ? sparkSales : [3,4,5,4,6,5,7,8]} color="#C21875" width={100} height={36} />
          </div>
        </div>
      </motion.div>

      {/* KPI tiles row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPITile label="Ventas Hoy"      value={salesVal}  change={salesChange} icon={TrendingUp} color="#C21875" sparkData={sparkSales}       accent delay={0.1} />
        <KPITile label="Transacciones"   value={txnVal}    change={txnChange}   icon={Receipt}   color="#6366f1" sparkData={sparkTxn}          delay={0.14} />
        <KPITile label="Ticket Promedio" value={ticketVal} change={null}        icon={BarChart2} color="#0ea5e9" sparkData={[5,6,5,7,8,7,8,9]} delay={0.18} />
        <KPITile label="EBITDA Est."     value={ebitdaVal} change={salesChange} icon={Zap}       color="#059669" sparkData={sparkEbitda}        delay={0.22} />
      </div>
    </motion.div>
  );
}