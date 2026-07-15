import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, TrendingUp, TrendingDown } from 'lucide-react';

export const AUTO_COLORS = ['#e11d48','#C21875','#f43f5e','#fb7185','#ec4899','#f472b6','#db2777','#be185d','#fda4af','#f9a8d4'];
export const SOFT_PINK = '#fff0f5';

export function getInitial(name) { return name ? name.trim()[0].toUpperCase() : '?'; }

export function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={(e) => { e.stopPropagation(); setShow(s => !s); }}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black cursor-help select-none transition-all hover:scale-110"
        style={{ background: 'rgba(194,24,117,0.06)', color: '#C21875', border: '1px solid rgba(194,24,117,0.15)' }}>?</span>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-2xl p-3 text-xs text-slate-500 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', boxShadow: '0 12px 40px rgba(194,24,117,0.15)' }}>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return <span className="text-xs text-slate-300 font-medium">—</span>;
  const pos = pct > 0, neu = pct === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${neu ? 'text-slate-500 bg-slate-100' : pos ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-500 bg-rose-50 border border-rose-100'}`}>
      {neu ? <Minus className="w-2.5 h-2.5"/> : pos ? <TrendingUp className="w-2.5 h-2.5"/> : <TrendingDown className="w-2.5 h-2.5"/>}
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

export const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(194,24,117,0.12)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 12px 40px rgba(194,24,117,0.15)', fontSize: 11, minWidth: 120 }}>
      {label && <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.stroke, flexShrink: 0 }}/>
          <span style={{ color: '#64748b', fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: p.color || p.stroke, fontWeight: 800, marginLeft: 'auto' }}>
            {formatter ? formatter(p.value) : p.value?.toLocaleString('es-CO')}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PremiumSection({ title, sub, tip, children, delay = 0, className = '', icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.23,1,0.32,1] }}
      className={`glass-card card-accent-top relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.05) 0%, transparent 70%)' }}/>
      <div className="p-5 pb-0 relative">
        <div className="flex items-center gap-2.5 mb-0.5">
          {Icon && (
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.1), rgba(194,24,117,0.03))', border: '1px solid rgba(194,24,117,0.1)' }}>
              <Icon className="w-3.5 h-3.5" style={{ color: '#C21875' }}/>
            </div>
          )}
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black tracking-[0.16em] uppercase text-slate-500">{title}</p>
            {tip && <InfoTooltip text={tip}/>}
          </div>
        </div>
        {sub && <p className="text-[11px] text-slate-400 ml-9">{sub}</p>}
      </div>
      <div className="p-5 pt-3 relative">{children}</div>
    </motion.div>
  );
}