import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, Users, Wrench, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts';
import SectionCard from '../SectionCard';
import { TARGETS } from '../gerenteUtils';

const METRICS = [
  { key: 'margen_ebitda', label: 'EBITDA', color: '#10b981', icon: Zap, target: TARGETS.ebitda },
  { key: 'costo_personal', label: 'Costo Personal', color: '#6366f1', icon: Users, target: null },
  { key: 'teorico_vs_real', label: 'Teórico vs Real', color: '#C21875', icon: Scale, target: null },
  { key: 'gastos_pct_venta', label: 'Gastos Operacionales', color: '#f59e0b', icon: Wrench, target: null },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <p className="font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || '#C21875' }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
}

function GlobalStatCard({ label, value, target, color, icon: Icon, delay }) {
  const compliance = target != null && value != null ? (value / target * 100) : null;
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
      <p className="text-[28px] font-black tabular-nums leading-none mb-2" style={{ color, letterSpacing: '-0.03em' }}>{value != null ? `${value.toFixed(1)}%` : '—'}</p>
      {target != null && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Meta: <span className="font-bold text-slate-600">{target}%</span></span>
          {compliance != null && (
            <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(compliance, 100)}%`, background: color }} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function PYGView({ storeData, districtTotals, mode }) {
  const [metric, setMetric] = useState('margen_ebitda');
  const activeMetric = METRICS.find(m => m.key === metric) || METRICS[0];
  const isGrouped = metric === 'teorico_vs_real';

  const chartData = useMemo(() => storeData.map(s => {
    const p = s.pyg || {};
    if (isGrouped) return { name: s.shortName, teorico: p.cost_teorico != null ? +(p.cost_teorico * 100).toFixed(1) : 0, real: p.cost_real != null ? +(p.cost_real * 100).toFixed(1) : 0 };
    return { name: s.shortName, value: p[metric] != null ? +(p[metric] * 100).toFixed(1) : 0 };
  }), [storeData, metric, isGrouped]);

  const globalPYG = useMemo(() => {
    const weighted = (field) => {
      let num = 0, den = 0;
      storeData.forEach(s => { if (s.pyg?.[field] != null && s.monthSales > 0) { num += s.pyg[field] * s.monthSales; den += s.monthSales; } });
      return den > 0 ? (num / den) * 100 : null;
    };
    return {
      ebitda: districtTotals.ebitda,
      costo_personal: weighted('costo_personal'),
      cost_teorico: weighted('cost_teorico'),
      cost_real: weighted('cost_real'),
      gastos_pct_venta: weighted('gastos_pct_venta'),
    };
  }, [storeData, districtTotals]);

  const storesWithPYG = storeData.filter(s => s.pyg);

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 overflow-x-auto">
        {METRICS.map(m => {
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

      {mode === 'global' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlobalStatCard label="EBITDA" value={globalPYG.ebitda} target={TARGETS.ebitda} color="#10b981" icon={Zap} delay={0.05} />
            <GlobalStatCard label="Costo Personal" value={globalPYG.costo_personal} target={null} color="#6366f1" icon={Users} delay={0.1} />
            <GlobalStatCard label="Costo Real" value={globalPYG.cost_real} target={globalPYG.cost_teorico} color="#C21875" icon={Scale} delay={0.15} />
            <GlobalStatCard label="Gastos Operac." value={globalPYG.gastos_pct_venta} target={null} color="#f59e0b" icon={Wrench} delay={0.2} />
          </div>
          <SectionCard icon={Scale} title="Teórico vs Real — Distrito" subtitle="Comparación de costos a nivel consolidado" color="#C21875">
            <div className="flex items-center gap-8 py-4 justify-center">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Costo Teórico</p>
                <p className="text-[32px] font-black" style={{ color: '#6366f1' }}>{globalPYG.cost_teorico != null ? `${globalPYG.cost_teorico.toFixed(1)}%` : '—'}</p>
              </div>
              <div className="text-[24px] text-slate-300">→</div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Costo Real</p>
                <p className="text-[32px] font-black" style={{ color: '#C21875' }}>{globalPYG.cost_real != null ? `${globalPYG.cost_real.toFixed(1)}%` : '—'}</p>
              </div>
              {globalPYG.cost_real != null && globalPYG.cost_teorico != null && (
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: globalPYG.cost_real > globalPYG.cost_teorico ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Desviación</p>
                  <p className="text-[20px] font-black" style={{ color: globalPYG.cost_real > globalPYG.cost_teorico ? '#ef4444' : '#10b981' }}>
                    {globalPYG.cost_real > globalPYG.cost_teorico ? '+' : ''}{(globalPYG.cost_real - globalPYG.cost_teorico).toFixed(1)} pp
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      ) : storesWithPYG.length === 0 ? (
        <SectionCard icon={DollarSign} title={`P&G — ${activeMetric.label}`} subtitle="Sin reportes P&G cargados" color={activeMetric.color}>
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <DollarSign style={{ width: 24, height: 24, color: '#cbd5e1' }} />
            <p className="text-[12px] text-slate-400">No hay reportes P&G cargados para las tiendas del distrito</p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          icon={activeMetric.icon}
          title={`P&G — ${activeMetric.label}`}
          subtitle={`${storesWithPYG.length} de ${storeData.length} tiendas con reporte · Meta: ${activeMetric.target != null ? activeMetric.target + '%' : 'N/A'}`}
          color={activeMetric.color}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 0 }} barCategoryGap="24%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
              {activeMetric.target != null && <ReferenceLine y={activeMetric.target} stroke={activeMetric.color} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Meta', fontSize: 9, fill: activeMetric.color, position: 'right' }} />}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `${activeMetric.color}06` }} />
              {isGrouped ? (
                <>
                  <Bar dataKey="teorico" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={28} name="Teórico" />
                  <Bar dataKey="real" fill="#C21875" radius={[5, 5, 0, 0]} maxBarSize={28} name="Real">
                    <LabelList dataKey="real" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                  </Bar>
                </>
              ) : (
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} name={activeMetric.label}>
                  {chartData.map((e, i) => <Cell key={i} fill={activeMetric.color} />)}
                  <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
}