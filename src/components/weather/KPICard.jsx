import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  gradient, 
  color,
  subtext 
}) {
  const isPositive = change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {/* Gradient Border Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
        style={{
          backgroundImage: gradient
            ? `linear-gradient(135deg, ${gradient})`
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2))'
        }}
      />

      <div className={`relative h-full rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300
        backdrop-blur-xl overflow-hidden group`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.1), transparent 50%)'
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                backdrop-blur-xl border border-white/10 ${color} group-hover:scale-110`}
              style={{
                background: gradient 
                  ? `linear-gradient(135deg, ${gradient})`
                  : 'rgba(59, 130, 246, 0.1)'
              }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>

            {/* Change Indicator */}
            {change !== undefined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold
                  ${isPositive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
            {title}
          </p>

          {/* Value */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black text-white mb-2"
          >
            {value}
          </motion.p>

          {/* Subtext */}
          {subtext && (
            <p className="text-xs text-slate-500">
              {subtext}
            </p>
          )}
        </div>

        {/* Shimmer Effect on Hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'shimmer 2s infinite'
          }}
        />
      </div>
    </motion.div>
  );
}