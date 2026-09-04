import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, CalendarDays, Lightbulb } from 'lucide-react';
import { PremiumSection, CustomTooltip } from './RadarShared';
import { POPSY_KEY, POPSY_COLOR, fmtInt } from './radarModel';

export default function TakesEvolution({ model }) {
  const { takesSeries, monthlySeries, activeComps, nameOf, colorOf, crossings, monthSel, prevPeriodLabel } = model;
  const [mode, setMode] = useState(monthSel ? 'takes' : 'monthly');

  useEffect(() => {
    setMode(monthSel ? 'takes' : 'monthly');
  }, [monthSel, model.periodLabel]);

  const series = mode === 'takes' ? takesSeries : monthlySeries;
  const brands = [
    { key: POPSY_KEY, name: 'POPSY', color: POPSY_COLOR, isPopsy: true },
    ...activeComps.map((k) => ({ key: k, name: nameOf[k], color: colorOf[k], isPopsy: false })),
  ];

  return (
    <PremiumSection
      title="03 · Evolución Competitiva"
      sub={mode === 'takes'
        ? `Comportamiento toma a toma · ${model.periodLabel}`
        : `Comportamiento mes a mes · ${model.filters.year}`}
      tip="Transacciones observadas por marca en cada medición. Detecta aceleraciones, caídas y cambios de tendencia."
      delay={0.1} icon={Activity}
      right={(
        <div className="flex rounded-xl p-0.5" style={{ background: '#f8fafc', border: '1px solid #fce7f3' }}>
          <button onClick={() => setMode('takes')} disabled={!monthSel}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${mode === 'takes' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            style={mode === 'takes' ? { background: 'linear-gradient(135deg, #C21875, #e11d48)' } : {}}>
            <Activity className="w-3 h-3" /> Por Tomas
          </button>
          <button onClick={() => setMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${mode === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            style={mode === 'monthly' ? { background: 'linear-gradient(135deg, #C21875, #e11d48)' } : {}}>
            <CalendarDays className="w-3 h-3" /> Mensual
          </button>
        </div>
      )}>
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
        <div className="h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(194,24,117,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} width={34} />
              <Tooltip content={<CustomTooltip formatter={(v) => `${fmtInt(v)} txn`} />} />
              {brands.map((b) => (
                <Line key={b.key} type="monotone" dataKey={b.key} name={b.name}
                  stroke={b.color} strokeWidth={b.isPopsy ? 3.5 : 2}
                  dot={{ fill: b.color, r: b.isPopsy ? 4 : 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <Activity className="w-6 h-6" style={{ color: '#fda4af' }} />
          <p className="text-xs text-slate-300 text-center">
            {mode === 'takes'
              ? 'Se necesitan al menos 2 tomas con datos en el mes para ver la evolución'
              : 'Se necesitan al menos 2 meses con datos para ver la evolución'}
          </p>
        </div>
      )}

      {crossings.length > 0 && (
        <div className="mt-4 space-y-2">
          {crossings.slice(0, 3).map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
              style={{
                background: c.type === 'up' ? 'rgba(16,185,129,0.06)' : 'rgba(225,29,72,0.05)',
                border: `1px solid ${c.type === 'up' ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.12)'}`,
              }}>
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: c.type === 'up' ? '#10b981' : '#e11d48' }} />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: c.type === 'up' ? '#059669' : '#be123c' }}>
                  Cambio Relevante Detectado
                </p>
                <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                  {c.type === 'up'
                    ? `POPSY superó a ${c.name} en la Toma ${c.take}${c.streak > 1 ? `, después de mantenerse por debajo durante ${c.streak} mediciones` : ' en la medición anterior'}.`
                    : `${c.name} recuperó la delantera sobre POPSY en la Toma ${c.take}, tras estar por debajo en la toma anterior.`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PremiumSection>
  );
}