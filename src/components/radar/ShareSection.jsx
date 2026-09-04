import { motion } from 'framer-motion';
import { PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { PremiumSection, CustomTooltip } from './RadarShared';
import { POPSY_COLOR } from './radarModel';

export default function ShareSection({ model }) {
  const { shareRows, periodLabel, prevPeriodLabel } = model;
  const data = shareRows.map((r) => ({
    name: r.name,
    color: r.color,
    Actual: r.currPct == null ? null : Number(r.currPct.toFixed(1)),
    [prevPeriodLabel]: r.prevPct == null ? null : Number(r.prevPct.toFixed(1)),
  }));
  const withData = shareRows.filter((r) => (r.currPct != null || r.prevPct != null)).length;

  return (
    <PremiumSection
      title="06 · Participación en Transacciones Observadas"
      sub={`Periodo actual vs ${prevPeriodLabel}`}
      tip="Porcentaje de cada marca sobre el total de transacciones observadas durante los estudios del centro comercial. No representa el market share real del mall."
      delay={0.22} icon={PieIcon}>
      {withData === 0 ? (
        <div className="py-8 text-center"><p className="text-xs text-slate-300">Sin datos de participación en los periodos seleccionados.</p></div>
      ) : (
        <>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="25%" barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={34} />
                <Tooltip content={<CustomTooltip formatter={(v) => `${v?.toFixed(1)}%`} />} cursor={{ fill: 'rgba(194,24,117,0.03)' }} />
                <Bar dataKey={prevPeriodLabel} name={prevPeriodLabel} fill="#e2e8f0" radius={[5, 5, 0, 0]} maxBarSize={18} />
                <Bar dataKey="Actual" name={periodLabel} radius={[5, 5, 0, 0]} maxBarSize={18}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-rose-50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: '#cbd5e1' }} />
              <span className="text-[9px] font-bold text-slate-400">{prevPeriodLabel} (anterior)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: POPSY_COLOR }} />
              <span className="text-[9px] font-bold text-slate-400">{periodLabel} (POPSY destacado)</span>
            </div>
            <span className="text-[9px] text-slate-300 ml-auto">Las barras de colores del periodo actual usan el color de cada marca</span>
          </div>
          {/* Cambios de participación */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 mt-3">
            {shareRows.filter((r) => r.currPct != null && r.prevPct != null && r.prevPct > 0).slice(0, 8).map((r) => {
              const delta = r.currPct - r.prevPct;
              const up = delta > 0;
              return (
                <div key={r.key} className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                  style={{ background: '#fafafa', border: '1px solid #f1f5f9' }}>
                  <span className="text-[10px] font-bold text-slate-600 truncate">{r.name}</span>
                  <span className="text-[10px] font-black tabular-nums" style={{ color: up ? '#10b981' : delta < 0 ? '#e11d48' : '#94a3b8' }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PremiumSection>
  );
}