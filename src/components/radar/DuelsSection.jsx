import { motion } from 'framer-motion';
import { Swords, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PremiumSection } from './RadarShared';
import { POPSY_COLOR, fmtInt } from './radarModel';

const RESULT = {
  popsy: { label: 'POPSY GANA', color: '#10b981', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.2)' },
  comp: { label: 'POPSY PIERDE', color: '#e11d48', bg: 'rgba(225,29,72,0.07)', border: 'rgba(225,29,72,0.16)' },
  tie: { label: 'MUY CERCA', color: '#f59e0b', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.22)' },
};

export default function DuelsSection({ model }) {
  const { duels, periodLabel } = model;
  const withData = duels.filter((d) => d.obs > 0);

  return (
    <PremiumSection
      title="04 · Duelos Competitivos"
      sub={`POPSY contra cada competidor · ${periodLabel}`}
      tip="Comparación directa de transacciones observadas entre POPSY y cada competidor, usando únicamente las tomas donde ambos fueron registrados."
      delay={0.14} icon={Swords}>
      {withData.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-300">No hay tomas comparables entre POPSY y sus competidores en este periodo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withData.map((d, i) => {
            const res = RESULT[d.winner] || RESULT.tie;
            const max = Math.max(d.popsy, d.comp, 1);
            const popsyPct = (d.popsy / max) * 100;
            const compPct = (d.comp / max) * 100;
            const last = d.last;
            return (
              <motion.div key={d.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                className="rounded-2xl p-4" style={{ background: '#fafafa', border: '1px solid #f1f5f9' }}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700">POPSY <span className="text-slate-300 font-bold">VS</span> {d.name}</span>
                    <span className="text-[8px] font-bold text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100">{d.obs} toma{d.obs !== 1 ? 's' : ''} comparable{d.obs !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-[8px] font-black px-2 py-1 rounded-full tracking-wider"
                    style={{ color: res.color, background: res.bg, border: `1px solid ${res.border}` }}>
                    {d.winner === 'popsy' ? '🟢' : d.winner === 'comp' ? '🔴' : '🟡'} {res.label}
                  </span>
                </div>

                {/* Barras enfrentadas */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black" style={{ color: POPSY_COLOR }}>POPSY</span>
                      <span className="text-xs font-black tabular-nums" style={{ color: POPSY_COLOR }}>{fmtInt(d.popsy)}</span>
                    </div>
                    <div className="h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${popsyPct}%` }}
                        transition={{ duration: 0.9, delay: 0.15 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${POPSY_COLOR}b0, ${POPSY_COLOR})` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black" style={{ color: d.color }}>{d.name}</span>
                      <span className="text-xs font-black tabular-nums" style={{ color: d.color }}>{fmtInt(d.comp)}</span>
                    </div>
                    <div className="h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${compPct}%` }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${d.color}a0, ${d.color})` }} />
                    </div>
                  </div>
                </div>

                {/* Pie del duelo */}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black tabular-nums"
                      style={{ color: d.diff > 0 ? '#10b981' : d.diff < 0 ? '#e11d48' : '#f59e0b' }}>
                      {d.diff > 0 ? `+${fmtInt(d.diff)} POPSY` : d.diff < 0 ? `-${fmtInt(Math.abs(d.diff))} COMPETENCIA` : 'Empate'}
                    </span>
                    {d.marginPct != null && (
                      <span className="text-[9px] font-bold text-slate-400 tabular-nums">({d.marginPct > 0 ? '+' : ''}{d.marginPct.toFixed(1)}%)</span>
                    )}
                  </div>
                  {last && (
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      Última toma ({last.date}): {fmtInt(last.p)} vs {fmtInt(last.c)} ·
                      <span style={{ color: last.result === 'popsy' ? '#10b981' : last.result === 'comp' ? '#e11d48' : '#f59e0b' }}>
                        {last.result === 'popsy' ? ' ganamos' : last.result === 'comp' ? ' perdimos' : ' muy cerca'}
                      </span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PremiumSection>
  );
}