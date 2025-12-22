import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Semáforo Gerencial: Verde (sobre meta), Amarillo (en riesgo), Rojo (crítico)
export default function TrafficLight({ value, target, label, type = 'sales', compact = false }) {
  // Determinar estado basado en % de cumplimiento
  const percentage = target > 0 ? (value / target) * 100 : 0;
  
  let status = 'critical'; // 🔴
  let icon = AlertCircle;
  let color = 'red';
  let bgColor = 'bg-red-100';
  let textColor = 'text-red-700';
  let borderColor = 'border-red-300';
  
  if (percentage >= 90) {
    status = 'success'; // 🟢
    icon = CheckCircle;
    color = 'emerald';
    bgColor = 'bg-emerald-100';
    textColor = 'text-emerald-700';
    borderColor = 'border-emerald-300';
  } else if (percentage >= 70) {
    status = 'warning'; // 🟡
    icon = AlertTriangle;
    color = 'amber';
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-300';
  }

  const Icon = icon;
  const emoji = status === 'success' ? '🟢' : status === 'warning' ? '🟡' : '🔴';

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.15 }}
              className="cursor-pointer"
            >
              <motion.div
                animate={status === 'critical' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-lg"
              >
                {emoji}
              </motion.div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 border-none">
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">{label}</p>
              <p className="text-gray-300">
                {percentage.toFixed(0)}% de la meta
              </p>
              <p className={`font-semibold ${
                status === 'success' ? 'text-emerald-400' :
                status === 'warning' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {status === 'success' ? '✓ Sobre meta' : status === 'warning' ? '⚠ En riesgo' : '✗ Crítico'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`${bgColor} ${borderColor} border-2 rounded-xl p-3 shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={status === 'critical' ? { 
            scale: [1, 1.15, 1],
            rotate: [0, -5, 5, 0]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex-shrink-0"
        >
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${textColor} mb-1`}>{label}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentage)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full`}
              />
            </div>
            <span className={`text-xs font-black ${textColor}`}>{percentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="text-2xl flex-shrink-0">
          {emoji}
        </div>
      </div>
      
      {/* Insight rápido */}
      <div className="mt-2 pt-2 border-t border-white/50">
        <p className="text-[10px] text-gray-600">
          {status === 'success' && '✓ Excelente desempeño, mantener el ritmo'}
          {status === 'warning' && '⚠ Requiere impulso, enfocarse en esta métrica'}
          {status === 'critical' && '✗ Atención urgente, coaching prioritario'}
        </p>
      </div>
    </motion.div>
  );
}