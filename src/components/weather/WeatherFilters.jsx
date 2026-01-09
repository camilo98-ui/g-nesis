import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Cloud, CloudRain } from 'lucide-react';

const METRIC_OPTIONS = [
  { id: 'sales', label: 'Ventas', icon: BarChart3, color: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'temperature', label: 'Temperatura', icon: CloudRain, color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'rainfall', label: 'Precipitación', icon: Cloud, color: 'from-slate-500/20 to-blue-500/20' }
];

export default function WeatherFilters({ 
  selectedMetrics, 
  onMetricsChange
}) {
  const handleMetricToggle = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(m => m !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 py-4"
    >
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Métricas:</p>
        <div className="flex items-center gap-2 flex-wrap">
          {METRIC_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMetrics.includes(option.id);

            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMetricToggle(option.id)}
                className={`relative group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300`}
                style={{
                  background: isSelected 
                    ? `linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: '1px'
                }}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className={isSelected ? 'text-blue-300' : 'text-slate-400'}>
                  {option.label}
                </span>
                
                {isSelected && (
                  <motion.div
                    layoutId="active-metric"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}