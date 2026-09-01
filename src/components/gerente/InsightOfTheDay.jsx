import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';

export default function InsightOfTheDay({ insight }) {
  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(194,24,117,0.06) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.98) 100%)',
        border: '1px solid rgba(194,24,117,0.12)',
        boxShadow: '0 4px 20px rgba(194,24,117,0.05)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194,24,117,0.08) 0%, transparent 70%)', pointerEvents: 'none',
      }} />

      <div className="flex items-start gap-4 relative">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C21875, #8b5cf6)', boxShadow: '0 4px 14px rgba(194,24,117,0.25)' }}>
          <Lightbulb style={{ color: '#fff', width: 18, height: 18 }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">Insight del Día</p>
          <p className="text-[13px] lg:text-[14px] font-medium text-slate-600 leading-relaxed mb-2">
            {insight.text}
          </p>
          {insight.impactLabel && (
            <p className="text-[22px] font-black" style={{ color: '#C21875', letterSpacing: '-0.03em' }}>
              {insight.impactLabel}
            </p>
          )}
        </div>

        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C21875, #e91e8c)' }}
        >
          Ver oportunidades
          <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </motion.div>
  );
}