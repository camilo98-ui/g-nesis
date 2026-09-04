import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Users, Swords, Target, Crown } from 'lucide-react';
import { POPSY_KEY, fmtInt, fmtPct } from './radarModel';

const VERDICTS = {
  winning: { emoji: '🏆', title: 'POPSY ESTÁ GANANDO', color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.18)' },
  losing: { emoji: '⚠️', title: 'POPSY ESTÁ PERDIENDO', color: '#e11d48', bg: 'rgba(225,29,72,0.06)', border: 'rgba(225,29,72,0.16)' },
  close: { emoji: '⚖️', title: 'COMPETENCIA MUY CERCANA', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
};

function KpiCard({ label, value, sub, subColor, tip, delay, accent, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card card-accent-top relative overflow-hidden rounded-2xl p-4 hover-lift flex flex-col justify-between min-h-[118px]"
      title={tip}>
      <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}12`, border: `1px solid ${accent}18` }}>
            <Icon className="w-3 h-3" style={{ color: accent }} />
          </div>
        )}
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400 leading-tight">{label}</p>
      </div>
      <p className="text-xl font-black tracking-tight tabular-nums truncate" style={{ color: '#1e293b' }}>{value}</p>
      {sub && (
        <p className="text-[9px] font-bold mt-1 tabular-nums flex items-center gap-1" style={{ color: subColor || '#94a3b8' }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export default function PositionHero({ model }) {
  const { hero, popsy, competition, participation, mainComp, periodLabel, comparisonLabel } = model;
  const v = VERDICTS[hero.verdict] || null;

  const Var = ({ growth, colorGood = '#10b981' }) => {
    if (growth == null) return <span>sin comparación disponible</span>;
    const pos = growth > 0, neu = growth === 0;
    const Icon = neu ? Minus : pos ? TrendingUp : TrendingDown;
    const color = neu ? '#94a3b8' : pos ? colorGood : '#e11d48';
    return (
      <span style={{ color }}>
        <Icon className="w-2.5 h-2.5 inline" />
        {` ${pos ? '+' : ''}${growth.toFixed(1)}% ${comparisonLabel}`}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      {/* ── HERO: POSICIÓN COMPETITIVA ── */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card card-elevated relative overflow-hidden rounded-3xl p-6 lg:row-span-1 flex flex-col justify-between min-h-[210px]"
        style={{ gridColumn: 'span 1' }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${v ? v.color + '14' : 'rgba(194,24,117,0.06)'} 0%, transparent 70%)` }} />
        <div className="flex items-center gap-2 relative">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">01 · Posición Competitiva</p>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full text-slate-400 bg-slate-50 border border-slate-100">{periodLabel}</span>
        </div>

        {v ? (
          <>
            <div className="relative my-3">
              <p className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2" style={{ color: v.color }}>
                <span className="text-3xl">{v.emoji}</span> {v.title}
              </p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2" style={{ color: hero.advantagePct == null ? '#94a3b8' : hero.advantagePct >= 0 ? '#10b981' : '#e11d48' }}>
                {hero.advantagePct == null ? '—' : `${hero.advantagePct > 0 ? '+' : ''}${hero.advantagePct.toFixed(1)}%`}
                <span className="text-xs font-bold text-slate-400 ml-2">vs ritmo promedio de competidores</span>
              </p>
            </div>
            <div className="rounded-xl px-3 py-2 relative" style={{ background: v.bg, border: `1px solid ${v.border}` }}>
              <p className="text-[11px] font-semibold leading-relaxed" style={{ color: '#475569' }}>{hero.text}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-start justify-center gap-2 my-3">
            <p className="text-xl font-black text-slate-300">Sin comparación disponible</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {model.noPopsy
                ? 'Registra tomas de POPSY en el periodo para calcular la posición competitiva.'
                : 'No hay tomas comparables entre POPSY y sus competidores en el periodo seleccionado. Ajusta los filtros o registra nuevas tomas.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* ── KPIs ── */}
      <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard delay={0.06} accent="#C21875" icon={Swords}
          label="Transacciones Popsy" value={fmtInt(popsy.total)}
          sub={<Var growth={popsy.growth} />} tip={`Transacciones observadas de POPSY ${comparisonLabel}`} />

        <KpiCard delay={0.1} accent="#f43f5e" icon={Users}
          label="Transacciones Competencia" value={fmtInt(competition.total)}
          sub={<Var growth={competition.growth} />} tip={`Suma de competidores monitoreados ${comparisonLabel}`} />

        <KpiCard delay={0.14} accent="#8b5cf6" icon={Target}
          label="Participación Observada"
          value={participation == null ? '—' : `${participation.toFixed(1)}%`}
          sub={<span>de transacciones observadas</span>}
          tip="POPSY sobre el total de transacciones observadas en los estudios (no es market share del centro comercial)." />

        <KpiCard delay={0.18} accent={hero.won > hero.lost ? '#10b981' : hero.lost > hero.won ? '#e11d48' : '#f59e0b'} icon={Trophy}
          label="Tomas Ganadas"
          value={hero.totalComparisons > 0 ? `${hero.won} / ${hero.totalComparisons}` : '—'}
          sub={hero.totalComparisons > 0
            ? <span style={{ color: '#475569' }}>{((hero.won / hero.totalComparisons) * 100).toFixed(0)}% de las tomas comparables</span>
            : <span>sin tomas comparables</span>}
          tip="Tomas donde POPSY superó el ritmo promedio de sus competidores. Empates por diferencia < 5% se cuentan aparte." />

        <KpiCard delay={0.22} accent="#f59e0b" icon={Crown}
          label="Principal Competidor"
          value={mainComp ? mainComp.name : '—'}
          sub={mainComp && mainComp.share != null
            ? <span style={{ color: '#475569' }}>{mainComp.share.toFixed(1)}% del volumen competidor · {fmtInt(mainComp.total)} txn</span>
            : <span>sin competencia registrada</span>}
          tip="Competidor con mayor volumen transaccional observado en el periodo." />
      </div>
    </div>
  );
}