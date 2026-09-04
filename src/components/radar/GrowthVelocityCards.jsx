import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, ChevronDown, Check } from 'lucide-react';
import { PremiumSection, getInitial } from './RadarShared';

const OPTIONS = [5, 10, 0];
const labelFor = n => n === 0 ? 'Todas las tomas' : `Últimas ${n} tomas`;

export default function GrowthVelocityCards({ brandStats }) {
  const [open, setOpen] = useState(false);
  const [lastN, setLastN] = useState(5);

  const cards = (brandStats || []).filter(b => (b.growthSeries || []).length > 0).map(b => {
    const series = lastN > 0 ? b.growthSeries.slice(-lastN) : b.growthSeries;
    const avg = series.reduce((s, g) => s + g.pct, 0) / series.length;
    return { brand: b.brand, color: b.color, avg, last: b.growth };
  });
  const maxAbs = Math.max(10, ...cards.flatMap(c => [Math.abs(c.avg), Math.abs(c.last)]));

  return (
    <PremiumSection title="Velocidad de Crecimiento Promedio" sub="Tasa promedio histórica vs. última toma"
      tip="Compara el crecimiento promedio del período con el de la última toma. Detecta marcas acelerando o frenando."
      delay={0.30} className="h-full" icon={Gauge}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-[10px] font-semibold text-slate-400">Ritmo de cada marca en el período seleccionado</p>
        <div className="relative">
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-800 transition-all glass-card">
            {labelFor(lastN)}
            <ChevronDown className="w-3.5 h-3.5 text-rose-400" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18 }} className="absolute top-full right-0 mt-2 z-50 w-44 rounded-2xl p-1.5"
                style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 12px 40px rgba(194,24,117,0.15)' }}>
                {OPTIONS.map(n => (
                  <button key={n} onClick={() => { setLastN(n); setOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-rose-50/60 transition-all">
                    {labelFor(n)}
                    {lastN === n && <Check className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {cards.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((b, i) => (
            <motion.div key={b.brand} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl p-3.5 bg-white/90 border border-slate-100 hover-lift">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                  style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}40` }}>
                  {getInitial(b.brand)}
                </div>
                <p className="text-[11px] font-bold text-slate-600 truncate">{b.brand}</p>
              </div>
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Promedio</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: b.color }}>
                      {b.avg >= 0 ? '+' : ''}{b.avg.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.abs(b.avg) / maxAbs * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                      style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}50, ${b.color}90)` }}/>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Última toma</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: b.color }}>
                      {b.last >= 0 ? '+' : ''}{b.last.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(194,24,117,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.abs(b.last) / maxAbs * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.42 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                      style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}, ${b.color})` }}/>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center"><p className="text-xs text-slate-300">Sin datos de crecimiento</p></div>
      )}
    </PremiumSection>
  );
}