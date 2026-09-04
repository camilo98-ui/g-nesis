import { motion } from 'framer-motion';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Lightbulb } from 'lucide-react';
import { PremiumSection, CustomTooltip } from './RadarShared';
import { POPSY_KEY, POPSY_COLOR, fmtInt, fmtPct } from './radarModel';

const TREND = {
  growing: { emoji: '📈', color: '#059669', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.16)' },
  sustained: { emoji: '➡️', color: '#b45309', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.16)' },
  declining: { emoji: '📉', color: '#be123c', bg: 'rgba(225,29,72,0.05)', border: 'rgba(225,29,72,0.14)' },
  insufficient: { emoji: '⚪', color: '#64748b', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.16)' },
};

const CHIP = {
  win: { emoji: '🟢', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.16)', color: '#059669' },
  lose: { emoji: '🔴', bg: 'rgba(225,29,72,0.06)', border: 'rgba(225,29,72,0.14)', color: '#be123c' },
  tie: { emoji: '🟡', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', color: '#b45309' },
  nodata: { emoji: '⚪', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.14)', color: '#64748b' },
};

export default function TakesMainChart({ model, trend, view }) {
  const series = view === 'takes' ? model.takesSeries : model.monthlySeries;
  const brands = [
    { key: POPSY_KEY, name: 'POPSY', color: POPSY_COLOR, isPopsy: true },
    ...model.activeComps.map((k) => ({ key: k, name: model.nameOf[k], color: model.colorOf[k], isPopsy: false })),
  ];
  const t = TREND[trend.status] || TREND.insufficient;

  // Ganador de cada medición: POPSY vs promedio de competidores registrados
  const winners = series.map((e) => {
    const p = e[POPSY_KEY];
    const cv = model.activeComps.map((k) => e[k]).filter((v) => v != null);
    const avg = cv.length ? cv.reduce((a, b) => a + b, 0) / cv.length : null;
    const status = (p == null || avg == null) ? 'nodata' : p > avg * 1.05 ? 'win' : p < avg * 0.95 ? 'lose' : 'tie';
    return { label: e.label, status, pct: (p != null && avg) ? ((p - avg) / avg) * 100 : null };
  });

  return (
    <PremiumSection
      title={`03 · Evolución ${view === 'takes' ? 'por Tomas' : 'Mensual'}`}
      sub={view === 'takes'
        ? `Toma a toma · ${model.periodLabel} · POPSY vs competidores`
        : `Mes a mes · ${model.filters.year} · POPSY vs competidores`}
      tip="Transacciones observadas por marca en cada medición (diferencia de seriales). La lectura de tendencia se calcula con un umbral de ±5%."
      delay={0.06} icon={Activity}>
      {/* Lectura de tendencia automática */}
      <div className="flex items-start gap-3 rounded-2xl p-3.5 mb-4"
        style={{ background: t.bg, border: `1px solid ${t.border}` }}>
        <span className="text-xl leading-none flex-shrink-0">{t.emoji}</span>
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] mb-0.5" style={{ color: t.color }}>
            Lectura de tendencia automática
          </p>
          <p className="text-[12px] font-bold text-slate-600 leading-relaxed">{trend.narrative}</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-3">
        {brands.map((b) => (
          <div key={b.key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${b.color}0a` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            <span className="text-[10px] font-semibold text-slate-500">{b.name}</span>
            {b.isPopsy && <span className="text-[7px] font-black px-1 py-0.5 rounded text-white" style={{ background: POPSY_COLOR }}>NOSOTROS</span>}
          </div>
        ))}
      </div>

      {series.length > 1 ? (
        <div className="h-[320px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: -6 }}>
              <defs>
                <linearGradient id="popsyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={POPSY_COLOR} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={POPSY_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} width={38} />
              <Tooltip content={<CustomTooltip formatter={(v) => `${fmtInt(v)} txn`} />} />
              <Area type="monotone" dataKey={POPSY_KEY} name="POPSY" stroke={POPSY_COLOR} strokeWidth={3.5}
                fill="url(#popsyFill)" dot={{ fill: POPSY_COLOR, r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} connectNulls />
              {brands.filter((b) => !b.isPopsy).map((b) => (
                <Line key={b.key} type="monotone" dataKey={b.key} name={b.name} stroke={b.color} strokeWidth={2}
                  dot={{ fill: b.color, r: 3, strokeWidth: 2, stroke: '#fff' }} connectNulls />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-44 flex flex-col items-center justify-center gap-2">
          <Activity className="w-6 h-6" style={{ color: '#fda4af' }} />
          <p className="text-xs text-slate-300 text-center">
            {view === 'takes'
              ? 'Se necesitan al menos 2 tomas con datos en el mes para ver la evolución'
              : 'Se necesitan al menos 2 meses con datos para ver la evolución'}
          </p>
        </div>
      )}

      {/* Ganador por medición */}
      {series.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 flex items-center gap-1 w-full mb-0.5">
            <Lightbulb className="w-3 h-3" style={{ color: '#C21875' }} /> POPSY vs promedio de competencia por medición
          </p>
          {winners.map((w, i) => {
            const c = CHIP[w.status];
            return (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <span className="text-[10px] font-black text-slate-600">{w.label}</span>
                <span className="text-[10px] leading-none">{c.emoji}</span>
                {w.pct != null && (
                  <span className="text-[9px] font-bold tabular-nums" style={{ color: c.color }}>{fmtPct(w.pct, 0)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PremiumSection>
  );
}