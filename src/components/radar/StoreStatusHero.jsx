import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Trophy, Swords, Percent, Activity } from 'lucide-react';
import { fmtInt, fmtPct, POPSY_COLOR } from './radarModel';

const STATUS = {
  growing: { emoji: '🟢', label: 'Creciendo', tag: 'EN ASCENSO', color: '#34d399', icon: TrendingUp },
  sustained: { emoji: '🟡', label: 'Sostenida', tag: 'RITMO ESTABLE', color: '#fbbf24', icon: Minus },
  declining: { emoji: '🔴', label: 'Bajando', tag: 'EN RETROCESO', color: '#fb7185', icon: TrendingDown },
  insufficient: { emoji: '⚪', label: 'Sin tendencia', tag: 'DATOS INSUFICIENTES', color: '#e2d5e0', icon: Minus },
};

function StatBlock({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-3.5 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-white/50" />
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/50">{label}</p>
      </div>
      <p className="text-xl font-black text-white tabular-nums leading-none mb-1">{value}</p>
      <p className="text-[9px] font-bold text-white/45 leading-snug" style={accent ? { color: accent } : {}}>{sub}</p>
    </div>
  );
}

export default function StoreStatusHero({ model, trend, view }) {
  const st = STATUS[trend.status] || STATUS.insufficient;
  const { popsy, hero, participation, periodLabel, prevPeriodLabel, filters } = model;

  if (model.insufficient) {
    return (
      <div className="glass-card rounded-2xl p-8 mb-4 text-center">
        <p className="text-sm font-black text-slate-600 mb-1">Sin tomas registradas en {periodLabel}</p>
        <p className="text-xs text-slate-400">Ajusta el periodo o registra una nueva toma para activar el análisis de la tienda.</p>
      </div>
    );
  }

  const growthColor = popsy.growth == null ? 'rgba(255,255,255,0.45)'
    : popsy.growth > 0 ? '#bbf7d0' : popsy.growth < 0 ? '#fecdd3' : '#fde68a';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-3xl p-6 mb-4"
      style={{ background: 'linear-gradient(130deg, #C21875 0%, #a8135f 55%, #8a0f54 100%)', boxShadow: '0 20px 60px rgba(194,24,117,0.32)' }}>
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 left-1/3 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }} />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Estado de la tienda */}
        <div className="lg:col-span-5">
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-white/50 mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Estado de la tienda
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl leading-none">{st.emoji}</span>
            <div>
              <p className="text-2xl font-black text-white leading-tight tracking-tight">{st.label}</p>
              <p className="text-[9px] font-bold tracking-[0.16em] text-white/50 uppercase">
                {st.tag} · {view === 'takes' ? 'vista por tomas' : 'vista mensual'}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-white/85 font-medium leading-relaxed max-w-md">{trend.narrative}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="text-[10px] font-bold text-white/70">{filters.storeId === 'ALL' ? 'Red completa' : filters.storeId}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-[10px] font-black text-white">{periodLabel}</span>
          </div>
        </div>

        {/* Métricas clave */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBlock icon={Activity} label="Transacciones POPSY" value={fmtInt(popsy.total)}
            sub={popsy.growth != null ? `${fmtPct(popsy.growth)} vs ${prevPeriodLabel}` : `vs ${prevPeriodLabel}`}
            accent={growthColor} />
          <StatBlock icon={Trophy} label="Tomas ganadas" value={String(hero.won)}
            sub={`de ${hero.totalComparisons} comparables`} />
          <StatBlock icon={Swords} label="Tomas perdidas" value={String(hero.lost)}
            sub={hero.near > 0 ? `${hero.near} muy reñidas` : 'sin empates'} />
          <StatBlock icon={Percent} label="Participación" value={participation != null ? `${participation.toFixed(1)}%` : '—'}
            sub="del total observado" />
        </div>
      </div>
    </motion.div>
  );
}