import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import PremiumSparkline from './PremiumSparkline';

export default function KPICard({ label, value, change, color, delay = 0 }) {
  const isPos = change > 0;
  const isNeutral = change === 0;
  const sparkColor = isPos ? '#10b981' : isNeutral ? '#94a3b8' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="relative rounded-2xl p-4 cursor-default group"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)'
      }}>
      
      {/* Top row: icon + delta */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}0f` }}>
          <div style={{ color, width: 15, height: 15, opacity: 0.85, background: color, borderRadius: '4px' }} />
        </div>
        <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
          isNeutral ? 'text-slate-400' : isPos ? 'text-emerald-500' : 'text-rose-400'}`}>
          {isNeutral ? <Minus className="w-2.5 h-2.5" /> :
          isPos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {Math.abs(change)}%
        </span>
      </div>

      {/* Value */}
      <p className="text-[22px] font-black text-slate-800 leading-none tracking-tight mb-0.5 tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-slate-400 mb-3 tracking-wide">{label}</p>

      {/* Sparkline */}
      <div className="opacity-90">
        <PremiumSparkline data={[3, 4, 4, 5, 4, 6, 5, 7]} color={sparkColor} width={80} height={24} />
      </div>

      {/* Subtle bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />
    </motion.div>
  );
}