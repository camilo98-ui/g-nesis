import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ProjectionCard({ currentSales, budget, daysElapsed, totalDays }) {
  // Calcular proyección considerando que los fines de semana venden más
  const daysRemaining = totalDays - daysElapsed;
  
  // Estimar días de fin de semana restantes (aprox 2/7 de los días)
  const weekendDaysRemaining = Math.round(daysRemaining * (2/7));
  const weekdayDaysRemaining = daysRemaining - weekendDaysRemaining;
  
  // Calcular promedio ajustado (asumiendo que fines de semana venden 40% más)
  const dailyAverage = daysElapsed > 0 ? currentSales / daysElapsed : 0;
  const weekdayAvg = dailyAverage * 0.9; // Entre semana un poco menos
  const weekendAvg = dailyAverage * 1.4; // Fin de semana +40%
  
  const projectedSales = currentSales + (weekdayAvg * weekdayDaysRemaining) + (weekendAvg * weekendDaysRemaining);
  const projectedPercentage = budget > 0 ? ((projectedSales / budget) * 100).toFixed(1) : 0;
  const remainingToGoal = budget - currentSales;
  
  // Calcular venta diaria necesaria (ajustada por días de semana)
  const totalMultiplier = weekdayDaysRemaining + (weekendDaysRemaining * 1.4);
  const dailyNeeded = totalMultiplier > 0 ? remainingToGoal / totalMultiplier : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const isOnTrack = projectedPercentage >= 100;
  const isCloseToGoal = projectedPercentage >= 90 && projectedPercentage < 100;
  const isAtRisk = projectedPercentage < 90;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className={`relative overflow-hidden bg-gradient-to-br ${
        isOnTrack ? 'from-green-500 to-emerald-600' :
        isCloseToGoal ? 'from-yellow-500 to-orange-500' :
        'from-red-500 to-rose-600'
      } rounded-2xl shadow-xl p-6 text-white`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Proyección de Cierre</h3>
            <p className="text-sm text-white/80">Día {daysElapsed} de {totalDays}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-white/70 mb-1">Proyectado</p>
            <p className="text-2xl md:text-3xl font-bold">{formatCurrency(projectedSales)}</p>
          </div>
          <div>
            <p className="text-sm text-white/70 mb-1">% vs Presupuesto</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl md:text-3xl font-bold">{projectedPercentage}%</p>
              {isOnTrack ? <CheckCircle2 className="w-6 h-6" /> : 
               isCloseToGoal ? <AlertTriangle className="w-6 h-6" /> : 
               <TrendingDown className="w-6 h-6" />}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Promedio diario actual</span>
            <span className="font-semibold">{formatCurrency(dailyAverage)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Faltante para meta</span>
            <span className="font-semibold">{formatCurrency(Math.max(0, remainingToGoal))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Diario requerido</span>
            <span className="font-semibold">{formatCurrency(Math.max(0, dailyNeeded))}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}