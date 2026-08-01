import { motion } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';

const fmt = (v) => {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1_000_000) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Math.round(v)}`;
};
const fmtPct = (v) => (v == null || isNaN(v) ? '—' : `${v.toFixed(1)}%`);
const cardColor = (c) => {
  if (!c || c <= 0) return { bg: '#f1f5f9', border: '#e2e8f0', label: 'Sin datos', text: '#94a3b8' };
  if (c >= 100) return { bg: '#dcfce7', border: '#86efac', label: '≥ 100%', text: '#15803d' };
  if (c >= 95) return { bg: '#fef9c3', border: '#fde047', label: '95-99%', text: '#a16207' };
  return { bg: '#fee2e2', border: '#fca5a5', label: '< 95%', text: '#b91c1c' };
};

export default function StoreMapGrid({ stores, onStoreClick }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(194,24,117,0.08)', border: '1px solid rgba(194,24,117,0.12)' }}>
            <Grid3x3 className="w-4 h-4" style={{ color: '#C21875' }} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700">Mapa de Tiendas</p>
            <p className="text-[10px] text-slate-400">Cumplimiento por tienda · click para ver detalle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { c: '#dcfce7', l: '≥100%' }, { c: '#fef9c3', l: '95-99%' }, { c: '#fee2e2', l: '<95%' },
          ].map((x, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.c, border: '1px solid #e2e8f0' }} />
              <span className="text-[8px] font-bold text-slate-500">{x.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {stores.map((s, i) => {
          const cfg = cardColor(s.compliance);
          return (
            <motion.button key={s.code}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 + i * 0.02 }}
              onClick={() => onStoreClick(s)}
              whileHover={{ y: -2 }}
              className="rounded-2xl p-3 text-left transition-all hover:shadow-md"
              style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-700 truncate">{s.code}</span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: cfg.text + '20', color: cfg.text }}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 truncate mb-2 leading-tight">{s.name}</p>
              <p className="text-base font-black tabular-nums" style={{ color: cfg.text }}>{fmtPct(s.compliance)}</p>
              <p className="text-[9px] text-slate-500 tabular-nums">{fmt(s.totalSales)}</p>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#ffffff60' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(s.compliance, 100)}%` }}
                  transition={{ delay: 0.1 + i * 0.02, duration: 0.8 }}
                  style={{ height: '100%', borderRadius: 9999, background: cfg.text }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}