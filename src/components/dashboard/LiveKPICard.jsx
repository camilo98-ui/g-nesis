import React from 'react';
import { motion } from 'framer-motion';
import { useAnimatedNumber } from '@/components/animations/LiveGraphicAnimation';
import { useInfinitePulse, useBreathingGlow } from '@/components/animations/LiveDashboardAnimations';

/**
 * KPI Card con animaciones vivas continuas
 */
export default function LiveKPICard({ 
  title, 
  value, 
  format = 'number',
  icon: Icon,
  color = 'orange',
  trend = null,
  subtitle = null,
  delay = 0 
}) {
  const animatedValue = useAnimatedNumber(value, 0.8);

  const colorConfig = {
    orange: { 
      bg: 'from-orange-500 to-red-500',
      light: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200',
      glow: '#f97316',
    },
    blue: { 
      bg: 'from-blue-500 to-indigo-500',
      light: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
      glow: '#3b82f6',
    },
    green: { 
      bg: 'from-green-500 to-emerald-500',
      light: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
      glow: '#22c55e',
    },
    purple: { 
      bg: 'from-purple-500 to-pink-500',
      light: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
      glow: '#a855f7',
    },
  };

  const cfg = colorConfig[color] || colorConfig.orange;

  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (format === 'percentage') {
      return `${Math.round(val)}%`;
    }
    return new Intl.NumberFormat('es-CO').format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className={`relative overflow-hidden bg-white rounded-2xl shadow-lg border ${cfg.border} p-6 hover:shadow-2xl transition-all`}
    >
      {/* Background animated glow */}
      <motion.div 
        className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${cfg.bg} rounded-full blur-3xl opacity-0`}
        animate={{
          opacity: [0.06, 0.12, 0.06],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Top breathing line */}
      <motion.div 
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.bg}`}
        animate={{
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-xl ${cfg.light}`}
            whileHover={{ scale: 1.1 }}
            animate={{
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon className={`w-6 h-6 ${cfg.text}`} />
          </motion.div>

          {/* Pulsing indicator */}
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cfg.glow }}
            animate={{
              opacity: [1, 0.4, 1],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Title */}
        <motion.p 
          className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
          animate={{
            opacity: [1, 1.08, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {title}
        </motion.p>

        {/* Main value with continuous pulse */}
        <motion.div
          animate={{
            opacity: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <p className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {formatValue(animatedValue)}
          </p>
        </motion.div>

        {/* Subtitle if provided */}
        {subtitle && (
          <motion.p 
            className="text-xs text-gray-400 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Trend indicator */}
        {trend && (
          <motion.div
            className="mt-3 flex items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.4 }}
          >
            <motion.div
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {trend.text}
            </motion.div>
          </motion.div>
        )}

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${cfg.glow}15, transparent)`,
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['-200% 0', '200% 0'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </motion.div>
  );
}