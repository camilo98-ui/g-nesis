import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Crown, Layers } from 'lucide-react';
import { getInitial } from './RadarShared';

const STATUS_CONFIG = {
  lider: { label: 'LÍDER', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  creciendo: { label: 'CRECIENDO', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
  estable: { label: 'ESTABLE', color: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.12)' },
  caida: { label: 'DESACELERANDO', color: '#e11d48', bg: 'rgba(225,29,72,0.06)', border: 'rgba(225,29,72,0.15)' },
  pendiente: { label: 'SIN DATOS', color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.12)' },
};

function getStatus(brand, isTopBrand) {
  if (brand.onlyOneReading) return 'pendiente';
  if (isTopBrand) return 'lider';
  if (brand.growth > 5) return 'creciendo';
  if (brand.growth < -5) return 'caida';
  return 'estable';
}

export default function CompetitorCards({ brandStats, totalAll }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl p-4 sm:p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
          <Layers className="w-4 h-4" style={{ color: '#C21875' }}/>
        </div>
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">Panorama Competitivo</p>
          <p className="text-[9px] text-slate-400 font-medium">Estado y volumen de cada marca monitoreada</p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(194,24,117,0.08)' }}>
              <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Marca</th>
              <th className="text-left py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Estado</th>
              <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Transacciones</th>
              <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Cuota</th>
              <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Crecimiento</th>
              <th className="text-right py-2.5 px-2 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Última Toma</th>
            </tr>
          </thead>
          <tbody>
            {brandStats.map((b, i) => {
              const share = (b.total / totalAll) * 100;
              const status = getStatus(b, i === 0);
              const cfg = STATUS_CONFIG[status];
              const GrowthIcon = b.onlyOneReading ? Minus : b.growth > 5 ? TrendingUp : b.growth < -5 ? TrendingDown : Minus;
              return (
                <tr key={b.brand} className="transition-all hover:bg-rose-50/40" style={{ borderBottom: '1px solid rgba(194,24,117,0.04)' }}>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[11px] flex-shrink-0"
                        style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}30` }}>
                        {getInitial(b.brand)}
                      </div>
                      <span className="font-bold text-slate-700">{b.brand}</span>
                      {i === 0 && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                          <Crown className="w-2.5 h-2.5 text-white"/>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2 font-bold text-slate-600 tabular-nums">{b.total.toLocaleString('es-CO')}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="h-1.5 w-16 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(194,24,117,0.06)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(share, 1)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                          style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}90, ${b.color})` }}/>
                      </div>
                      <span className="font-black tabular-nums" style={{ color: b.color }}>{share.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">
                    {b.onlyOneReading ? (
                      <span className="text-[9px] text-slate-300 italic">—</span>
                    ) : (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <GrowthIcon className="w-3 h-3" style={{ color: cfg.color }}/>
                        <span className="font-black tabular-nums" style={{ color: cfg.color }}>
                          {b.growth > 0 ? '+' : ''}{b.growth.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="text-right py-3 px-2 font-semibold text-slate-500 tabular-nums">{b.lastTxn.toLocaleString('es-CO')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}