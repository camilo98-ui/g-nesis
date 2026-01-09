import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Cloud, CloudRain, Droplets, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';

const METRIC_OPTIONS = [
  { id: 'sales', label: 'Barras', icon: BarChart3 },
  { id: 'temperature', label: 'Tendencia', icon: TrendingUp },
  { id: 'rainfall', label: 'Nublados', icon: Cloud },
  { id: 'humidity', label: 'Lluviosos', icon: CloudRain }
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
        <div className="flex items-center gap-3 flex-wrap">
          {METRIC_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMetrics.includes(option.id);

            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMetricToggle(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/50 text-blue-300'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </motion.button>
            );
          })}
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onViewModeChange(option.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                viewMode === option.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}