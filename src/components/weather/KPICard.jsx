import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  subtext,
  change, 
  icon: Icon, 
  gradient, 
  color 
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`group relative bg-gradient-to-br ${gradient} backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300`}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" 
        style={{ background: `radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent)` }} 
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ${color}`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-2xl font-black text-white mb-1">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-500">{subtext}</p>
          )}
        </motion.div>

        {/* Change indicator */}
        {change !== undefined && (
          <motion.div
            className={`mt-3 flex items-center gap-1 text-sm font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </motion.div>
        )}
      </div>

      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 rounded-2xl" 
          style={{ animation: 'shimmer 3s infinite' }} 
        />
      </div>
    </motion.div>
  );
}