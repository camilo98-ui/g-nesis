import { motion } from 'framer-motion';
import { Table2, Sparkles, Flame, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { PremiumSection, TrendBadge, InfoTooltip, getInitial } from './RadarShared';

export function CompetitiveTable({ brandStats, totalAll }) {
  return (
    <PremiumSection title="Tablero Competitivo" sub="Métricas clave por marca"
      tip="Resumen ejecutivo: volumen, crecimiento, cuota y momentum en una sola vista."
      delay={0.4} className="mb-4" icon={Table2}>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(194,24,117,0.08)' }}>
              <th className="text-left py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Marca</th>
              <th className="text-right py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Transacciones</th>
              <th className="text-right py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Cuota</th>
              <th className="text-right py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Crecimiento</th>
              <th className="text-right py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Última Toma</th>
              <th className="text-center py-3 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Momentum</th>
            </tr>
          </thead>
          <tbody>
            {brandStats.map((b, i) => {
              const share = (b.total / totalAll) * 100;
              const isLeader = i === 0;
              const isAccelerating = b.growth > 5;
              const isDecelerating = b.growth < -5;
              return (
                <tr key={b.brand} className="transition-all hover:bg-rose-50/40" style={{ borderBottom: '1px solid rgba(194,24,117,0.04)' }}>
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[11px] flex-shrink-0" style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}30` }}>{getInitial(b.brand)}</div>
                      <span className="font-bold text-slate-700">{b.brand}</span>
                      {isLeader && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>LÍDER</span>}
                    </div>
                  </td>
                  <td className="text-right py-3.5 px-2 font-bold text-slate-600 tabular-nums">{b.total.toLocaleString('es-CO')}</td>
                  <td className="text-right py-3.5 px-2">
                    <span className="font-black tabular-nums" style={{ color: b.color }}>{share.toFixed(1)}%</span>
                  </td>
                  <td className="text-right py-3.5 px-2">
                    {b.onlyOneReading ? <span className="text-[9px] text-slate-300 italic">—</span> : <TrendBadge pct={b.growth}/>}
                  </td>
                  <td className="text-right py-3.5 px-2 font-semibold text-slate-500 tabular-nums">{b.lastTxn.toLocaleString('es-CO')}</td>
                  <td className="text-center py-3.5 px-2">
                    {b.onlyOneReading ? <span className="text-[9px] text-slate-300">—</span> :
                      isAccelerating ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.15)' }}><Flame className="w-2.5 h-2.5"/> Acelerando</span> :
                      isDecelerating ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(225,29,72,0.1)', color: '#e11d48', border: '1px solid rgba(225,29,72,0.15)' }}><TrendingDown className="w-2.5 h-2.5"/> Frenando</span> :
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(148,163,184,0.1)', color: '#64748b', border: '1px solid rgba(148,163,184,0.15)' }}><Minus className="w-2.5 h-2.5"/> Estable</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PremiumSection>
  );
}

export function RadarInsights({ insights }) {
  if (insights.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5, ease: [0.23,1,0.32,1] }}
      className="glass-card relative overflow-hidden rounded-2xl p-6">
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.08) 0%, transparent 70%)' }}/>
      <div className="flex items-center gap-2.5 mb-4 relative">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
          <Sparkles className="w-4 h-4" style={{ color: '#C21875' }}/>
        </div>
        <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">Insights Automáticos · Nova AI</p>
        <InfoTooltip text="Alertas generadas automáticamente: marcas en aceleración, desaceleración o alta presión competitiva."/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl p-4 transition-all hover-lift"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(194,24,117,0.06)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white btn-glow"
              style={{ background: 'linear-gradient(135deg, #C21875, #e11d48)', boxShadow: '0 4px 12px rgba(194,24,117,0.2)' }}>{i+1}</div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed flex-1">{ins}</p>
            <ChevronRight className="w-3.5 h-3.5 text-rose-200 flex-shrink-0 mt-0.5"/>
          </div>
        ))}
      </div>
    </motion.div>
  );
}