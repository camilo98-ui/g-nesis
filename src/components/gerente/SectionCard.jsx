import React from 'react';
import { motion } from 'framer-motion';

export default function SectionCard({ icon: Icon, title, subtitle, color = '#C21875', right, children, delay = 0.1, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(40px) saturate(160%)',
        border: '1px solid rgba(226,232,240,0.8)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          {Icon && <Icon style={{ color, width: 14, height: 14 }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-slate-700" style={{ letterSpacing: '-0.02em' }}>{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}