import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, ChevronRight } from 'lucide-react';
import SectionCard from './SectionCard';

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

export default function IntegralRanking({ ranking }) {
  if (!ranking || ranking.length === 0) {
    return (
      <SectionCard icon={Trophy} title="Ranking Integral" subtitle="Performance score" color="#f59e0b" delay={0.3}>
        <p className="text-[11px] text-slate-400 text-center py-6">Sin datos suficientes para generar ranking</p>
      </SectionCard>
    );
  }

  const top3 = ranking.slice(0, 3);
  const intervention = ranking.filter(r => (r.score || 0) < 70).slice(0, 4);

  return (
    <SectionCard icon={Trophy} title="Ranking Integral de Tiendas" subtitle="Performance score consolidado" color="#f59e0b" delay={0.3}>
      {/* Top 3 */}
      <div className="space-y-2 mb-4">
        {top3.map((s, i) => (
          <motion.div
            key={s.code}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:shadow-md transition-all"
            style={{ background: `${MEDAL_COLORS[i]}08`, border: `1px solid ${MEDAL_COLORS[i]}15` }}
          >
            <span className="text-[22px] flex-shrink-0">{MEDAL_EMOJI[i]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-slate-700 truncate">{s.name}</p>
              <p className="text-[9px] text-slate-400">{s.code} · Score {s.score}/100</p>
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: `${MEDAL_COLORS[i]}15` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score}%` }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: MEDAL_COLORS[i] }}
                />
              </div>
            </div>
            <p className="text-[20px] font-black tabular-nums" style={{ color: MEDAL_COLORS[i] }}>{s.score}</p>
          </motion.div>
        ))}
      </div>

      {/* Intervention stores */}
      {intervention.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle style={{ width: 11, height: 11, color: '#ef4444' }} />
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Necesitan Intervención</p>
          </div>
          <div className="space-y-1">
            {intervention.map((s, i) => (
              <motion.div
                key={s.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-red-50/50 transition-colors"
                style={{ background: 'rgba(239,68,68,0.03)' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <span className="text-[9px] font-black text-red-500">{i + 1}</span>
                </div>
                <p className="flex-1 text-[11px] font-bold text-slate-600 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-400">{s.code}</p>
                <p className="text-[14px] font-black tabular-nums" style={{ color: '#ef4444' }}>{s.score}</p>
                <ChevronRight style={{ width: 12, height: 12, color: '#cbd5e1' }} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <button className="w-full mt-3 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-pink-500 hover:bg-pink-50/50 transition-colors">
        Ver ranking completo →
      </button>
    </SectionCard>
  );
}