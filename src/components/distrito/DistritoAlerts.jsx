import { motion } from 'framer-motion';
import { AlertTriangle, Zap, TrendingDown, TrendingUp } from 'lucide-react';

export function DistritoAlerts({ alerts }) {
  if (alerts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-black text-slate-700">Alertas del Distrito</p>
        </div>
        <div className="py-6 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-400">El distrito opera sin alertas activas</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-black text-slate-700">Alertas del Distrito</p>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
          {alerts.length} activas
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const bg = a.type === 'danger' ? 'rgba(225,29,72,0.06)' : a.type === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)';
          const border = a.type === 'danger' ? 'rgba(225,29,72,0.15)' : a.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';
          const color = a.type === 'danger' ? '#e11d48' : a.type === 'warning' ? '#d97706' : '#10b981';
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + i * 0.03 }}
              className="flex items-start gap-2 p-2.5 rounded-xl border" style={{ background: bg, borderColor: border }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
              <p className="text-xs text-slate-600 leading-relaxed">{a.msg}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function NovaSummary({ summary }) {
  if (!summary) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,117,0.08) 0%, transparent 70%)' }} />
      <div className="flex items-center gap-2 mb-3 relative">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(194,24,117,0.12), rgba(194,24,117,0.04))', border: '1px solid rgba(194,24,117,0.1)' }}>
          <Zap className="w-4 h-4" style={{ color: '#C21875' }} />
        </div>
        <div>
          <p className="text-[8px] font-black tracking-widest uppercase text-slate-400">NOVA AI · RESUMEN EJECUTIVO</p>
          <p className="text-sm font-black text-slate-700">Análisis Automático del Distrito</p>
        </div>
      </div>
      <div className="space-y-2 relative">
        {summary.map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 + i * 0.04 }}
            className="text-xs text-slate-600 leading-relaxed pl-3 border-l-2 border-rose-200">
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}