import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WeatherSalesHeader({ dateRange, onDateChange, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Title & Subtitle */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white">Clima & Ventas</h1>
            </div>
            <p className="text-sm text-slate-400 ml-13">Análisis de correlación inteligente</p>
          </motion.div>

          {/* Right: Date Range & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 flex-wrap sm:justify-end"
          >
            {/* Date Display */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  {format(dateRange.from, 'd MMM', { locale: es })} — {format(dateRange.to, 'd MMM', { locale: es })}
                </span>
              </div>
            </motion.div>

            {/* Reset Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-300 transition-all duration-300 group"
              title="Resetear período"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}