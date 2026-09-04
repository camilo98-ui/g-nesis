import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { PremiumSection } from './RadarShared';
import { POPSY_KEY, POPSY_COLOR, fmtInt } from './radarModel';

const WINNER = {
  popsy: { label: 'POPSY GANA', emoji: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.2)' },
  comp: { label: 'POPSY PIERDE', emoji: '🔴', color: '#e11d48', bg: 'rgba(225,29,72,0.07)', border: 'rgba(225,29,72,0.16)' },
  tie: { label: 'MUY CERCA', emoji: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.22)' },
};

export default function CompetitiveCompare({ model }) {
  const withData = model.duels.filter((d) => d.obs > 0);

  const takeChips = (k) => model.takesSeries
    .filter((e) => e[POPSY_KEY] != null && e[k] != null)
    .map((e) => {
      const p = e[POPSY_KEY];
      const c = e[k];
      const status = p > c * 1.05 ? 'popsy' : p < c * 0.95 ? 'comp' : 'tie';
      return { label: `T${e.take}`, status };
    });

  return (
    <PremiumSection
      title="04 · Comparativo Competitivo"
      sub={`POPSY contra cada competidor · ${model.periodLabel}`}
      tip="Duelo directo de transacciones observadas usando solo las tomas donde ambas marcas fueron registradas. Los chips muestran el resultado de cada toma individual."
      delay={0.1} icon={Swords}>
      {withData.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-300">No hay tomas comparables entre POPSY y sus competidores en este periodo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withData.map((d, i) => {
            const res = WINNER[d.winner] || WINNER.tie;
            const max = Math.max(d.popsy, d.comp, 1);
            const chips = takeChips(d.key);
            return (
              <motion.div key={d.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.4 }}
                className="rounded-2xl p-4" style={{ background: '#fafafa', border: '1px solid #f1f5f9' }}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                      style={{ background: d.color, boxShadow: `0 3px 10px ${d.color}35` }}>
                      {d.name?.trim()?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-xs font-black text-slate-700">POPSY <span className="text-slate-300 font-bold">VS</span> {d.name}</span>
                    <span className="text-[8px] font-bold text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100">
                      {d.obs} toma{d.obs !== 1 ? 's' : ''} comparable{d.obs !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-[8px] font-black px-2 py-1 rounded-full tracking-wider"
                    style={{ color: res.color, background: res.bg, border: `1px solid ${res.border}` }}>
                    {res.emoji} {res.label}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black" style={{ color: POPSY_COLOR }}>POPSY</span>
                      <span className="text-xs font-black tabular-nums" style={{ color: POPSY_COLOR }}>{fmtInt(d.popsy)}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(d.popsy / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${POPSY_COLOR}b0, ${POPSY_COLOR})` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black" style={{ color: d.color }}>{d.name}</span>
                      <span className="text-xs font-black tabular-nums" style={{ color: d.color }}>{fmtInt(d.comp)}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(d.comp / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${d.color}a0, ${d.color})` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-slate-100">
                  <span className="text-[11px] font-black tabular-nums"
                    style={{ color: d.diff > 0 ? '#10b981' : d.diff < 0 ? '#e11d48' : '#f59e0b' }}>
                    {d.diff > 0 ? `+${fmtInt(d.diff)} POPSY` : d.diff < 0 ? `-${fmtInt(Math.abs(d.diff))} COMPETENCIA` : 'Empate'}
                    {d.marginPct != null && (
                      <span className="text-[9px] font-bold text-slate-400 ml-1">({d.marginPct > 0 ? '+' : ''}{d.marginPct.toFixed(1)}%)</span>
                    )}
                  </span>
                  {chips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {chips.map((c, j) => (
                        <span key={j} className="text-[8px] font-black px-1.5 py-0.5 rounded-md"
                          style={{ background: WINNER[c.status].bg, color: WINNER[c.status].color, border: `1px solid ${WINNER[c.status].border}` }}>
                          {c.label} {WINNER[c.status].emoji}
                        </span>
                      ))}
                    </div>
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