import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Receipt, Gift, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ScoreBreakdown({ salesScore, ticketScore, suggestedScore, overallScore, compact = false }) {
  const components = [
    { label: 'Ventas', score: salesScore, weight: '50%', icon: DollarSign, color: 'from-blue-500 to-indigo-600' },
    { label: 'Ticket', score: ticketScore, weight: '30%', icon: Receipt, color: 'from-purple-500 to-pink-600' },
    { label: 'Sugeridos', score: suggestedScore, weight: '20%', icon: Gift, color: 'from-emerald-500 to-green-600' }
  ];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-black text-purple-700">{overallScore.toFixed(0)}</span>
              <span className="text-xs text-purple-500">pts</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 border-purple-400">
            <div className="p-2 space-y-2">
              <p className="text-xs font-bold text-white mb-2">Desglose del Score</p>
              {components.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <c.icon className="w-3 h-3 text-gray-300" />
                  <span className="text-gray-300">{c.label}:</span>
                  <span className="font-bold text-white">{c.score.toFixed(0)}</span>
                  <span className="text-gray-400">({c.weight})</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Score Total</p>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          {overallScore.toFixed(0)}
        </motion.div>
      </div>

      {/* Barras de componentes */}
      <div className="space-y-2">
        {components.map((component, idx) => {
          const Icon = component.icon;
          const percentage = (component.score / overallScore) * 100;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-medium text-gray-700">{component.label}</span>
                  <span className="text-gray-400">({component.weight})</span>
                </div>
                <span className="font-bold text-gray-900">{component.score.toFixed(0)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.15 }}
                  className={`h-full bg-gradient-to-r ${component.color} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Explicación */}
      <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <p className="text-[10px] text-purple-700 text-center font-medium">
          💡 Score calculado: Ventas (50%) + Ticket Prom (30%) + Sugeridos (20%)
        </p>
      </div>
    </div>
  );
}