import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Receipt, DollarSign, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine, AreaChart, Area } from 'recharts';
import SectionCard from '../SectionCard';
import { fmtM, fmtInt, fmtCOP, TARGETS } from '../gerenteUtils';

const PALETTE = ['#C21875', '#e91e8c', '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'];

function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || p.color || '#C21875' }}>
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function GlobalStatCard({ label, value, sub, color, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-2xl p-5"
      style={{ background: `linear-gradient(135deg, ${color}06 0%, rgba(255,255,255,0.98) 55%)`, border: `1px solid ${color}12` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon style={{ color, width: 15, height: 15 }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="text-[28px] font-black tabular-nums leading-none mb-1" style={{ color, letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </motion.div>
  );
}

export default function SalesView({ storeData, districtTotals, dailyTrend, mode }) {
  const [metric, setMetric] = useState('ventas');

  const metrics = [
    { key: 'ventas', label: 'Ventas', color: '#C21875', icon: DollarSign, fmt: fmtM, dataKey: 'rangeSales' },
    { key: 'transacciones', label: 'Transacciones', color: '#0ea5e9', icon: CreditCard, fmt: fmtInt, dataKey: 'rangeTx' },
    { key: 'ticket', label: 'Ticket Prom.', color: '#f59e0b', icon: Receipt, fmt: fmtM, dataKey: 'avgTicket' },
    { key: 'proyeccion', label: 'Proyección', color: '#10b981', icon: TrendingUp, fmt: fmtM, dataKey: 'projection' },
  ];

  const activeMetric = metrics.find(m => m.key === metric) || metrics[0];

  const chartData = useMemo(() => storeData.map(s => ({
    name: s.shortName,
    value: s[activeMetric.dataKey] || 0,
    color: s.color,
  })), [storeData, activeMetric]);

  const storesWithData = storeData.filter(s => s.hasData);

  return (
    <div className="space-y-4">
      {mode === 'global' ? (
        <div className="space-y-4">
          {/* Global stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlobalStatCard label="Ventas del Rango" value={fmtM(districtTotals.totalRangeSales)} sub={`Mes: ${fmtM(districtTotals.totalMonthSales)}`} color="#C21875" icon={DollarSign} delay={0.05} />
            <GlobalStatCard label="Proyección Cierre" value={fmtM(districtTotals.totalProjection)} sub={districtTotals.projCompliance != null ? `${districtTotals.projCompliance.toFixed(1)}% del PPT` : '—'} color="#10b981" icon={TrendingUp} delay={0.1} />
            <GlobalStatCard label="Transacciones" value={fmtInt(districtTotals.totalRangeTx)} sub="En el rango" color="#0ea5e9" icon={CreditCard} delay={0.15} />
            <GlobalStatCard label="Ticket Promedio" value={fmtM(districtTotals.avgTicket)} sub={`Meta: ${fmtM(TARGETS.ticket)}`} color="#f59e0b" icon={Receipt} delay={0.2} />
          </div>

          {/* Daily trend area chart */}
          <SectionCard icon={TrendingUp} title="Tendencia Diaria del Distrito" subtitle={`Ventas y transacciones · ${dailyTrend.length} días`} color="#C21875">
            {dailyTrend.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <TrendingUp style={{ width: 24, height: 24, color: '#cbd5e1' }} />
                <p className="text-[12px] text-slate-400">Sin suficientes días con datos para mostrar tendencia</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C21875" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#C21875" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tickFormatter={fmtM} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={fmtInt} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(194,24,117,0.2)', strokeWidth: 1 }} />
                  <Area yAxisId="left" type="monotone" dataKey="sales" name="Ventas" stroke="#C21875" strokeWidth={2.5} fill="url(#gradSales)" dot={{ r: 3, fill: '#C21875', strokeWidth: 1.5 }} activeDot={{ r: 5 }} animationDuration={800} />
                  <Area yAxisId="right" type="monotone" dataKey="tx" name="Transacciones" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradTx)" dot={false} activeDot={{ r: 4 }} animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>
      ) : (
        <>
          {/* Metric selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 overflow-x-auto">
            {metrics.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap"
                  style={{
                    background: metric === m.key ? `${m.color}0f` : 'transparent',
                    color: metric === m.key ? m.color : '#94a3b8',
                    border: metric === m.key ? `1px solid ${m.color}20` : '1px solid transparent',
                  }}>
                  <Icon style={{ width: 13, height: 13 }} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {storesWithData.length === 0 ? (
            <SectionCard icon={BarChart3} title={`Ventas — ${activeMetric.label}`} subtitle="Sin datos de ventas" color={activeMetric.color}>
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <BarChart3 style={{ width: 24, height: 24, color: '#cbd5e1' }} />
                <p className="text-[12px] text-slate-400">No hay ventas registradas en el período seleccionado</p>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              icon={activeMetric.icon}
              title={`Ventas — ${activeMetric.label} por Tienda`}
              subtitle={`${storesWithData.length} tiendas con datos`}
              color={activeMetric.color}
            >
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                  <YAxis tickFormatter={activeMetric.fmt} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                  {metric === 'proyeccion' && districtTotals.totalBudget > 0 && (
                    <ReferenceLine y={districtTotals.totalBudget / storeData.length} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'PPT prom.', fontSize: 9, fill: '#10b981', position: 'right' }} />
                  )}
                  <Tooltip content={<ChartTooltip fmt={activeMetric.fmt} />} cursor={{ fill: `${activeMetric.color}06` }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} name={activeMetric.label}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="top" formatter={activeMetric.fmt} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}