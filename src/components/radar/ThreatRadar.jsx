import { motion } from 'framer-motion';
import { Siren, Eye, Gem, TrendingUp, TrendingDown } from 'lucide-react';
import { PremiumSection } from './RadarShared';
import { fmtInt, fmtPct } from './radarModel';

const LEVELS = {
  threat: { label: 'Amenaza Alta', dot: '🔴', color: '#e11d48', bg: 'rgba(225,29,72,0.05)', border: 'rgba(225,29,72,0.14)', icon: Siren },
  watch: { label: 'Vigilancia', dot: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.16)', icon: Eye },
  opportunity: { label: 'Oportunidad', dot: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.14)', icon: Gem },
};

export default function ThreatRadar({ model }) {
  const { threats, periodLabel, prevPeriodLabel } = model;
  const order = ['threat', 'watch', 'opportunity'];
  const groups = order
    .map((lvl) => ({ lvl, items: threats.filter((t) => t.level === lvl) }))
    .filter((g) => g.items.length > 0);

  return (
    <PremiumSection
      title="05 · Radar de Amenazas"
      sub={`Clasificación automática de competidores · ${periodLabel} vs ${prevPeriodLabel}`}
      tip="Clasificación calculada con datos reales: volumen del periodo, crecimiento vs periodo anterior y resultado del duelo directo contra POPSY."
      delay={0.18} icon={Siren}>
      {groups.length === 0 ? (
        <div className="py-8 text-center"><p className="text-xs text-slate-300">Sin competidores con datos en el periodo seleccionado.</p></div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const cfg = LEVELS[g.lvl];
            const Icon = cfg.icon;
            return (
              <div key={g.lvl}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: cfg.color }}>
                    {g.items.length} en {cfg.label}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {g.items.map((t, i) => (
                    <motion.div key={t.key}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }}
                      className="rounded-2xl p-4 hover-lift relative overflow-hidden"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                            style={{ background: t.color, boxShadow: `0 3px 10px ${t.color}35` }}>
                            {t.name?.trim()?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-black text-slate-700 truncate">{t.name}</span>
                        </div>
                        {t.growth != null && (
                          <span className="text-[10px] font-black tabular-nums flex items-center gap-0.5"
                            style={{ color: t.growth > 0 ? '#e11d48' : '#10b981' }}>
                            {t.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {fmtPct(t.growth, 0)}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-wider mb-0.5" style={{ color: cfg.color }}>
                        {cfg.dot} {cfg.label}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{t.reason}</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1.5">
                        {fmtInt(t.total)} txn observadas en el periodo
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PremiumSection>
  );
}