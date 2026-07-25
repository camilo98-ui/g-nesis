import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Crown, Flame } from 'lucide-react';
import { getInitial } from './RadarShared';

const STATUS_CONFIG = {
  lider: { label: 'LÍDER DEL MERCADO', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  creciendo: { label: 'EN CRECIMIENTO', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  estable: { label: 'ESTABLE', color: '#64748b', bg: 'rgba(100,116,139,0.06)' },
  caida: { label: 'EN DESACELERACIÓN', color: '#e11d48', bg: 'rgba(225,29,72,0.06)' },
  pendiente: { label: 'DATOS INSUFICIENTES', color: '#94a3b8', bg: 'rgba(148,163,184,0.06)' },
};

function getStatus(brand, isTopBrand) {
  if (brand.onlyOneReading) return 'pendiente';
  if (isTopBrand) return 'lider';
  if (brand.growth > 5) return 'creciendo';
  if (brand.growth < -5) return 'caida';
  return 'estable';
}

function formatTxn(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('es-CO');
}

export default function CompetitorCards({ brandStats, totalAll }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      {brandStats.map((b, i) => {
        const share = ((b.total / totalAll) * 100).toFixed(1);
        const status = getStatus(b, i === 0);
        const cfg = STATUS_CONFIG[status];
        const isPositive = b.growth > 0;
        const GrowthIcon = b.onlyOneReading ? Minus : b.growth > 5 ? TrendingUp : b.growth < -5 ? TrendingDown : Minus;

        return (
          <motion.div key={b.brand}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="glass-card card-accent-top relative overflow-hidden rounded-2xl p-4 hover-lift">

            {/* Top gradient strip */}
            <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${b.color}, transparent)` }}/>

            {/* Header: avatar + name + status badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[11px] flex-shrink-0"
                  style={{ background: b.color, boxShadow: `0 4px 12px ${b.color}40` }}>
                  {getInitial(b.brand)}
                </div>
                <span className="text-sm font-bold text-slate-700 truncate">{b.brand}</span>
              </div>
              {i === 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                  <Crown className="w-3 h-3 text-white"/>
                </div>
              )}
            </div>

            {/* Status pill */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-3"
              style={{ background: cfg.bg }}>
              {status === 'creciendo' && <Flame className="w-2.5 h-2.5" style={{ color: cfg.color }}/>}
              <span className="text-[8px] font-black tracking-wider uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>

            {/* Main metrics */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Transacciones</p>
                <p className="text-lg font-black tabular-nums text-slate-700">{formatTxn(b.total)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Cuota</p>
                <p className="text-lg font-black tabular-nums" style={{ color: b.color }}>{share}%</p>
              </div>
            </div>

            {/* Share progress bar */}
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(194,24,117,0.06)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(parseFloat(share), 1)}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                style={{ height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${b.color}90, ${b.color})` }}/>
            </div>

            {/* Footer: last reading + growth */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Última toma</p>
                <p className="text-xs font-bold tabular-nums text-slate-600">{formatTxn(b.lastTxn)} txn</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Crecimiento</p>
                <div className="flex items-center gap-1 justify-end">
                  <GrowthIcon className="w-3 h-3" style={{ color: cfg.color }}/>
                  <span className="text-xs font-black tabular-nums" style={{ color: cfg.color }}>
                    {b.onlyOneReading ? '—' : `${isPositive ? '+' : ''}${b.growth.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}