import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function RadarFooter() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.6 }}
      className="mt-4 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 glass-card">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
          <Zap className="w-4 h-4 text-white"/>
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
            Datos en tiempo real
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot inline-block"/>
          </p>
          <p className="text-[10px] text-slate-400">Monitorea el comportamiento del mercado en tiempo real</p>
        </div>
      </div>
      <p className="text-xs italic text-rose-400 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
        “Juntos hacemos más dulce el mañana”
      </p>
    </motion.div>
  );
}