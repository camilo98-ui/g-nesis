import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getInitial } from './RadarShared';

export default function BrandSummaryCards({ brandStats }) {
  if (!brandStats?.length) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {brandStats.map((b, i) => {
        const up = b.growth > 0;
        const neu = b.growth === 0;
        return (
          <motion.div key={b.brand}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + i * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card card-accent-top rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}CC)`, boxShadow: `0 4px 14px ${b.color}40` }}>
                {getInitial(b.brand)}
              </div>
              <p className="text-[10px] font-black tracking-[0.14em] uppercase text-slate-500 truncate">{b.brand}</p>
            </div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-2xl font-black text-slate-800 tabular-nums tracking-tight leading-none">
                {b.total.toLocaleString('es-CO')}
              </p>
              {!b.onlyOneReading ? (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums border
                  ${neu ? 'text-slate-500 bg-slate-50 border-slate-100' : up ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-500 bg-rose-50 border-rose-100'}`}>
                  {neu ? '' : up ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
                  {up ? '+' : ''}{b.growth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[9px] text-slate-300 italic font-semibold">2ª toma pendiente</span>
              )}
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Transacciones</p>
          </motion.div>
        );
      })}
    </div>
  );
}