import { motion } from 'framer-motion';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import { PremiumSection, CustomTooltip } from './RadarShared';
import { POPSY_KEY, POPSY_COLOR, fmtInt, fmtPct } from './radarModel';

const MONTH_STATE = {
  win: { emoji: '🟢', color: '#059669' },
  lose: { emoji: '🔴', color: '#be123c' },
  tie: { emoji: '🟡', color: '#b45309' },
  nodata: { emoji: '⚪', color: '#64748b' },
};

export default function MonthlyEvolution({ model, mode = 'chart' }) {
  const { monthlySeries, activeComps, nameOf, colorOf, filters } = model;
  const brands = [
    { key: POPSY_KEY, name: 'POPSY', color: POPSY_COLOR, isPopsy: true },
    ...activeComps.map((k) => ({ key: k, name: nameOf[k], color: colorOf[k], isPopsy: false })),
  ];

  const rows = monthlySeries.map((e, i) => {
    const p = e[POPSY_KEY] ?? 0;
    const c = activeComps.reduce((s, k) => s + (e[k] || 0), 0);
    const prevP = i > 0 ? monthlySeries[i - 1][POPSY_KEY] : null;
    const delta = (prevP != null && prevP > 0) ? ((p - prevP) / prevP) * 100 : null;
    const status = delta == null ? 'nodata' : delta > 5 ? 'win' : delta < -5 ? 'lose' : 'tie';
    return { label: e.label, popsy: p, comp: c, part: (p + c) > 0 ? (p / (p + c)) * 100 : null, delta, status };
  });

  const withPopsy = monthlySeries.filter((e) => e[POPSY_KEY] != null);
  const best = withPopsy.reduce((a, b) => (b[POPSY_KEY] > (a?.[POPSY_KEY] ?? -1) ? b : a), null);
  const worst = withPopsy.reduce((a, b) => (b[POPSY_KEY] < (a?.[POPSY_KEY] ?? Infinity) ? b : a), null);

  return (
    <PremiumSection
      title="06 · Evolución Mensual"
      sub={`Mes a mes durante ${filters.year} · ${filters.storeId === 'ALL' ? 'red completa' : filters.storeId}`}
      tip="Transacciones observadas de POPSY mes a mes. El estado de cada mes se calcula con un umbral de ±5% frente al mes anterior."
      delay={0.2} icon={CalendarDays}>
      {mode === 'chart' ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {best && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}>
                <TrendingUp className="w-3 h-3" style={{ color: '#059669' }} />
                <span className="text-[9px] font-bold text-slate-500">Mejor mes: <span className="text-slate-700 font-black">{best.label}</span> ({fmtInt(best[POPSY_KEY])} txn)</span>
              </div>
            )}
            {worst && best !== worst && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.12)' }}>
                <TrendingDown className="w-3 h-3" style={{ color: '#be123c' }} />
                <span className="text-[9px] font-bold text-slate-500">Más bajo: <span className="text-slate-700 font-black">{worst.label}</span> ({fmtInt(worst[POPSY_KEY])} txn)</span>
              </div>
            )}
          </div>
          {monthlySeries.length > 1 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySeries} margin={{ top: 8, right: 12, bottom: 4, left: -6 }}>
                  <defs>
                    <linearGradient id="popsyMonthlyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={POPSY_COLOR} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={POPSY_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} width={38} />
                  <Tooltip content={<CustomTooltip formatter={(v) => `${fmtInt(v)} txn`} />} />
                  <Area type="monotone" dataKey={POPSY_KEY} name="POPSY" stroke={POPSY_COLOR} strokeWidth={3}
                    fill="url(#popsyMonthlyFill)" dot={{ fill: POPSY_COLOR, r: 4, strokeWidth: 2, stroke: '#fff' }} connectNulls />
                  {brands.filter((b) => !b.isPopsy).map((b) => (
                    <Line key={b.key} type="monotone" dataKey={b.key} name={b.name} stroke={b.color} strokeWidth={1.8}
                      dot={{ fill: b.color, r: 3, strokeWidth: 2, stroke: '#fff' }} connectNulls />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-xs text-slate-300">Se necesitan al menos 2 meses con datos para ver la evolución anual.</p>
            </div>
          )}
        </>
      ) : (
        rows.length === 0 ? (
          <div className="py-8 text-center"><p className="text-xs text-slate-300">Sin datos mensuales en {filters.year}.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Mes', 'POPSY', 'Competencia', 'Participación', 'Δ vs mes anterior', 'Estado'].map((h) => (
                    <th key={h} className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const st = MONTH_STATE[r.status];
                  return (
                    <motion.tr key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      className="border-b border-slate-50">
                      <td className="py-2.5 pr-4 text-xs font-black text-slate-700">{r.label}</td>
                      <td className="py-2.5 pr-4 text-xs font-black tabular-nums" style={{ color: POPSY_COLOR }}>{fmtInt(r.popsy)}</td>
                      <td className="py-2.5 pr-4 text-xs font-bold tabular-nums text-slate-500">{fmtInt(r.comp)}</td>
                      <td className="py-2.5 pr-4 text-xs font-bold tabular-nums text-slate-600">{r.part != null ? `${r.part.toFixed(1)}%` : '—'}</td>
                      <td className="py-2.5 pr-4 text-xs font-black tabular-nums"
                        style={{ color: r.delta == null ? '#cbd5e1' : r.delta > 0 ? '#10b981' : r.delta < 0 ? '#e11d48' : '#f59e0b' }}>
                        {r.delta == null ? '—' : fmtPct(r.delta)}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-bold">{st.emoji} <span style={{ color: st.color }}>{r.delta == null ? 'Sin comparación' : r.status === 'win' ? 'Creció' : r.status === 'lose' ? 'Cayó' : 'Estable'}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </PremiumSection>
  );
}