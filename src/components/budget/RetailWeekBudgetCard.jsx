import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RetailWeekBudgetCard({ dailySales, activeBudget, storeId, formatCurrency, onConfigureBudget, currentDateRange }) {
  if (!activeBudget?.sales_budget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
              >
                <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
                <p className="text-xs text-slate-600 font-normal mt-0.5">
                  {format(new Date(), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={onConfigureBudget}
              className="w-full bg-gradient-to-br from-amber-400/80 to-orange-400/80 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6 border border-amber-300/40 relative overflow-hidden cursor-pointer"
            >
              <div className="relative z-10 text-center">
                <Target className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
                <p className="text-lg md:text-2xl font-black text-white mb-2">
                  Configura el Presupuesto
                </p>
                <p className="text-xs md:text-sm text-white/80 mb-4">
                  Para ver el presupuesto del día y el calendario retail, primero configura el presupuesto mensual de esta tienda.
                </p>
                <div className="inline-block px-4 py-2 bg-white/20 rounded-lg text-white text-xs md:text-sm font-bold">
                  👆 Haz clic aquí para configurar
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Si hay presupuesto, mostrar card simple con información básica
  const dailyBudget = activeBudget.sales_budget / 30;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-purple-50/20 border border-rose-200/40 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-100/20 to-pink-100/20 border-b border-rose-200/30 pb-4 px-4 md:px-6">
          <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-rose-400/60 to-pink-400/60 flex items-center justify-center shadow-md flex-shrink-0"
            >
              <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-xl md:text-2xl truncate">Presupuesto del Día</p>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                {format(new Date(), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onConfigureBudget}
            className="w-full bg-gradient-to-br from-rose-400/80 to-pink-400/80 rounded-2xl shadow-md p-6 lg:p-8 border border-rose-300/40 relative overflow-hidden cursor-pointer"
          >
            <div className="relative z-10">
              <div className="text-center">
                <p className="text-sm lg:text-base text-white/90 font-semibold mb-3">
                  Meta del Día
                </p>
                <motion.p
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-none mb-2"
                >
                  {formatCurrency(dailyBudget)}
                </motion.p>
                <p className="text-xs lg:text-sm text-white/70">
                  Presupuesto mensual: {formatCurrency(activeBudget.sales_budget)}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}