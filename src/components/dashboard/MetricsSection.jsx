import React from 'react';
import { motion } from 'framer-motion';

export default function MetricsSection({ dynamicTotals, criticalKPI, formatKPI, getKPIInsight }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Venta */}
      <motion.div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-lg p-3 border border-blue-500/20">
        <div className="relative z-10">
          <p className="text-xs text-blue-300 mb-2 font-bold uppercase">💰 Venta</p>
          <p className="text-xl font-black text-white">{formatKPI(dynamicTotals.totalSales)}</p>
          <p className="text-xs text-slate-400 mt-2">{formatKPI(dynamicTotals.totalBudget)} meta</p>
          <p className={`text-2xl font-black mt-2 ${dynamicTotals.totalBudget > 0 && ((dynamicTotals.totalSales/dynamicTotals.totalBudget)*100) >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
            {dynamicTotals.totalBudget > 0 ? ((dynamicTotals.totalSales/dynamicTotals.totalBudget)*100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </motion.div>

      {/* Ticket */}
      <motion.div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-lg p-3 border border-purple-500/20">
        <div className="relative z-10">
          <p className="text-xs text-purple-300 mb-2 font-bold uppercase">🧊 Ticket</p>
          <p className="text-xl font-black text-white">{dynamicTotals.avgTicket > 0 ? formatKPI(dynamicTotals.avgTicket) : '$0'}</p>
          <p className="text-xs text-slate-400 mt-2">{dynamicTotals.totalTransactions.toLocaleString('es-CO')} transacciones</p>
        </div>
      </motion.div>

      {/* Promedio Diario */}
      <motion.div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-lg p-3 border border-amber-500/20">
        <div className="relative z-10">
          <p className="text-xs text-amber-300 mb-2 font-bold uppercase">📊 Promedio</p>
          <p className="text-xl font-black text-white">{dynamicTotals.avgDailySales > 0 ? formatKPI(dynamicTotals.avgDailySales) : '$0'}</p>
          <p className="text-xs text-slate-400 mt-2">{dynamicTotals.daysElapsedInRange} de {dynamicTotals.totalDaysInRange} días</p>
        </div>
      </motion.div>

      {/* Proyección */}
      <motion.div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl rounded-lg p-3 border border-emerald-500/20">
        <div className="relative z-10">
          <p className="text-xs text-emerald-300 mb-2 font-bold uppercase">📈 Proyección</p>
          <p className="text-xl font-black text-white">{formatKPI(dynamicTotals.monthProjection)}</p>
          <p className={`text-sm font-bold mt-2 ${dynamicTotals.totalMonthBudget > 0 && ((dynamicTotals.monthProjection/dynamicTotals.totalMonthBudget)*100) >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
            {dynamicTotals.totalMonthBudget > 0 ? ((dynamicTotals.monthProjection/dynamicTotals.totalMonthBudget)*100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </motion.div>
    </div>
  );
}