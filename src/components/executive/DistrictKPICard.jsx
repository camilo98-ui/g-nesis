import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function DistrictKPICard({ 
  icon, 
  label, 
  value, 
  budget, 
  format = 'currency',
  unit = '',
  isCritical = false,
  trend = null 
}) {
  const compliance = budget > 0 ? (value / budget) * 100 : 0;
  const isAboveTarget = compliance >= 100;
  const isMedium = compliance >= 85;

  const formatValue = (num) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    }
    if (format === 'number') {
      return num.toLocaleString('es-CO');
    }
    return num;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl p-4 border backdrop-blur-xl ${
        isCritical
          ? 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30'
          : isAboveTarget
          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30'
          : isMedium
          ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30'
          : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/30'
      }`}
    >
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          </div>
          {isCritical && (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </motion.div>
          )}
        </div>

        <div>
          <motion.p 
            className={`text-2xl font-black tabular-nums ${
              isAboveTarget ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-red-400'
            }`}
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatValue(value)}
          </motion.p>
          {unit && <p className="text-xs text-slate-500">{unit}</p>}
        </div>

        {budget > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">PPT</span>
              <span className="text-[10px] text-slate-400">{formatValue(budget)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isAboveTarget ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(compliance, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className={`text-xs font-bold tabular-nums ${
              isAboveTarget ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-red-400'
            }`}>
              {compliance.toFixed(1)}%
            </p>
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}