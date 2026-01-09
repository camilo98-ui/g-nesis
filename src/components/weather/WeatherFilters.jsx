import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Cloud, CloudRain } from 'lucide-react';

const METRIC_OPTIONS = [
  { id: 'sales', label: 'Ventas', icon: BarChart3 },
  { id: 'temperature', label: 'Temperatura', icon: TrendingUp },
  { id: 'rainfall', label: 'Precipitación', icon: CloudRain },
  { id: 'humidity', label: 'Humedad', icon: Cloud }
];

const VIEW_OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' }
];

export default function WeatherFilters({ 
  selectedMetrics, 
  onMetricsChange, 
  viewMode, 
  onViewModeChange 
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
      className="max-w-7xl mx-auto px-4 py-6 border-b border-white/5"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
        {/* Metrics Selection */}
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 
                  backdrop-blur-xl border
                  ${isSelected
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </motion.button>
            );
          })}
        </div>

        {/* View Mode */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1 bg-white/5 rounded-xl p-1.5 border border-white/10 backdrop-blur-xl"
        >
          {VIEW_OPTIONS.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange(option.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                viewMode === option.id
                  ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}