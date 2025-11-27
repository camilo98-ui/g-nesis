import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Calendar, User, Star, TrendingUp, Clock } from 'lucide-react';
import { format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function CashierRecommendation({ cashiers, shiftRecords, selectedDate }) {
  // Analyze performance by day of week
  const analyzePerformance = () => {
    if (!cashiers.length || !shiftRecords.length) return [];

    const cashierDayPerformance = {};

    // Group performance by cashier and day of week
    shiftRecords.forEach(record => {
      const dayOfWeek = getDay(new Date(record.date));
      const key = `${record.cashier_id}-${dayOfWeek}`;
      
      if (!cashierDayPerformance[key]) {
        cashierDayPerformance[key] = {
          cashier_id: record.cashier_id,
          dayOfWeek,
          totalSales: 0,
          totalSuggested: 0,
          count: 0
        };
      }
      
      cashierDayPerformance[key].totalSales += record.sales || 0;
      cashierDayPerformance[key].totalSuggested += record.suggested_sales || 0;
      cashierDayPerformance[key].count += 1;
    });

    // Calculate averages and find best cashier for each day
    const bestByDay = {};
    
    Object.values(cashierDayPerformance).forEach(perf => {
      const avgSales = perf.count > 0 ? perf.totalSales / perf.count : 0;
      const avgSuggested = perf.count > 0 ? perf.totalSuggested / perf.count : 0;
      const cashier = cashiers.find(c => c.id === perf.cashier_id);
      
      if (!cashier) return;

      const score = avgSales * 0.7 + avgSuggested * 1000 * 0.3; // Weighted score

      if (!bestByDay[perf.dayOfWeek] || bestByDay[perf.dayOfWeek].score < score) {
        bestByDay[perf.dayOfWeek] = {
          cashier,
          avgSales,
          avgSuggested,
          shiftsCount: perf.count,
          score,
          dayOfWeek: perf.dayOfWeek
        };
      }
    });

    return Object.values(bestByDay).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  };

  const recommendations = analyzePerformance();
  const todayRecommendation = recommendations.find(r => r.dayOfWeek === getDay(selectedDate || new Date()));

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border-fuchsia-200 shadow-xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-gradient-to-br from-fuchsia-400 to-pink-500 rounded-xl text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            Sugerencias de Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Today's recommendation */}
          {todayRecommendation && (
            <div className="bg-white rounded-xl p-4 shadow-md border border-fuchsia-100">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gradient-to-r from-fuchsia-400 to-pink-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Recomendación para Hoy
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-400 to-pink-500 rounded-full flex items-center justify-center text-white">
                  <span className="text-2xl">🍦</span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-gray-800">{todayRecommendation.cashier.name}</h4>
                  <p className="text-sm text-gray-500">
                    Mejor rendimiento histórico para {DAY_NAMES[todayRecommendation.dayOfWeek]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(todayRecommendation.avgSales)}</p>
                  <p className="text-xs text-gray-400">promedio/turno</p>
                </div>
              </div>
            </div>
          )}

          {/* Weekly recommendations */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mejor cajero por día de la semana
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.dayOfWeek}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    rec.dayOfWeek === getDay(selectedDate || new Date())
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                    rec.dayOfWeek === 0 || rec.dayOfWeek === 6
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {DAY_NAMES[rec.dayOfWeek].slice(0, 3)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-gray-800 truncate">{rec.cashier.name}</p>
                    <p className="text-xs text-gray-400">{rec.shiftsCount} turnos analizados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(rec.avgSales)}</p>
                    <p className="text-xs text-gray-400">{rec.avgSuggested.toFixed(0)} sug.</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Se necesitan más datos para generar recomendaciones</p>
              <p className="text-sm">Registra turnos para ver sugerencias personalizadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}