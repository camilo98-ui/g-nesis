import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { computeInsight } from './computeInsight';

export default function ChartInsight({ data, metric, formatCurrency, comparisonData = null }) {
  const insight = useMemo(() => computeInsight(data, metric), [data, metric, formatCurrency, comparisonData]);

  if (!insight) return null;

  const statusConfig = {
    positive: {
      icon: CheckCircle2,
      bgColor: 'from-emerald-50/60 to-green-50/40',
      borderColor: 'border-emerald-200/50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-800'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'from-amber-50/60 to-orange-50/40',
      borderColor: 'border-amber-200/50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-800'
    },
    critical: {
      icon: AlertTriangle,
      bgColor: 'from-red-50/60 to-rose-50/40',
      borderColor: 'border-red-200/50',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    },
    neutral: {
      icon: Lightbulb,
      bgColor: 'from-slate-50/60 to-gray-50/40',
      borderColor: 'border-slate-200/50',
      iconColor: 'text-slate-600',
      textColor: 'text-slate-800'
    }
  };

  const config = statusConfig[insight.status] || statusConfig.neutral;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`mt-3 bg-gradient-to-br ${config.bgColor} border-2 ${config.borderColor} rounded-xl px-4 py-3 shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/50 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${config.textColor} mb-1 flex items-center gap-1.5`}>
            <span>📊</span> Insight Operativo
          </p>
          <div className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
            <p className="font-bold text-gray-900">{insight.keyData}</p>
            <p className="text-[11px] leading-snug">{insight.behavior}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}