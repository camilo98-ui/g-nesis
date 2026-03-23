import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function BudgetMetricsModal({ isOpen, onClose, selectedMetric, budgetData, activeBudget, dailySales, formatCurrency, gregorianMode }) {
  if (!budgetData || budgetData.noBudget) return null;

  const getTitle = () => {
    switch (selectedMetric) {
      case 'base': return '📊 Presupuesto Base vs Ajustado';
      case 'remaining': return '📅 Proyección de Días Restantes';
      case 'pending': return '💰 Análisis de Venta Pendiente';
      case 'compliance': return '📈 Evolución del Cumplimiento';
      case 'weekly-budget': return '🎯 Desglose de Meta Semanal';
      case 'weekly-sales': return '💵 Ventas de la Semana';
      case 'weekly-projection': return '🚀 Proyección de Cierre Semanal';
      case 'month-projection': return '📊 Proyección de Cierre Mensual';
      case 'recovery-plan': return '⚠️ Plan de Recuperación';
      case 'on-track': return '✅ Rendimiento en Meta';
      default:
        if (selectedMetric?.startsWith('top-day-')) {
          const idx = parseInt(selectedMetric.split('-')[2]);
          return `${budgetData.topDays[idx]?.dayFull} - Día Estratégico`;
        }
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {selectedMetric === 'base' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-xs text-rose-600 mb-1">Base Diaria</p>
                  <p className="text-lg font-black text-rose-700">{formatCurrency(budgetData.dailyBaseBudget)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">Meta Ajustada Hoy</p>
                  <p className="text-lg font-black text-amber-700">{formatCurrency(budgetData.adjustedDailyBudget)}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { name: 'Base', value: budgetData.dailyBaseBudget },
                  { name: 'Ajustado', value: budgetData.adjustedDailyBudget }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill="#fda4af" />
                    <Cell fill="#fbbf24" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {budgetData.gapRecoveryIncrement > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 mb-1">📊 Desglose de la meta de hoy:</p>
                  <ul className="text-xs text-amber-800 space-y-1 ml-3">
                    <li>• PPT Excel del día: {formatCurrency(budgetData.excelBudgetForToday)}</li>
                    <li>• Recuperación de brecha: +{formatCurrency(budgetData.gapRecoveryIncrement)}</li>
                    <li>• Total meta del día: {formatCurrency(budgetData.adjustedDailyBudget)}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedMetric === 'month-projection' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200/50">
                  <p className="text-xs text-indigo-600 mb-1">Proyección de Cierre</p>
                  <p className="text-xl font-black text-indigo-900">{formatCurrency(budgetData.monthProjection)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center border border-purple-200/50">
                  <p className="text-xs text-purple-600 mb-1">Meta Mensual</p>
                  <p className="text-xl font-black text-purple-900">{formatCurrency(budgetData.monthlyBudget)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 mb-1">Vendido Hasta Hoy</p>
                  <p className="text-lg font-bold text-emerald-900">{formatCurrency(budgetData.totalMonthSales)}</p>
                  <p className="text-[10px] text-emerald-600 mt-1">{budgetData.daysElapsed} días</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">Promedio Diario</p>
                  <p className="text-lg font-bold text-amber-900">{formatCurrency(budgetData.avgDailySales)}</p>
                  <p className="text-[10px] text-amber-600 mt-1">Ritmo actual</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-indigo-200/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-indigo-900">Cumplimiento Proyectado</span>
                  <span className={`text-3xl font-black ${budgetData.monthProjectionCompliance >= 100 ? 'text-emerald-600' : budgetData.monthProjectionCompliance >= 90 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {budgetData.monthProjectionCompliance.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetData.monthProjectionCompliance, 100)}%` }}
                    transition={{ duration: 1.5 }}
                    className={`h-full rounded-full ${budgetData.monthProjectionCompliance >= 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : budgetData.monthProjectionCompliance >= 90 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`}
                  />
                </div>
              </div>
              <ul className={`text-xs space-y-1 ml-4 ${budgetData.monthProjectionCompliance >= 100 ? 'text-emerald-800' : budgetData.monthProjectionCompliance >= 90 ? 'text-amber-800' : 'text-rose-800'}`}>
                <li>• Ventas acumuladas: {formatCurrency(budgetData.totalMonthSales)} ({(budgetData.totalMonthSales / budgetData.monthlyBudget * 100).toFixed(1)}%)</li>
                <li>• Ritmo diario actual: {formatCurrency(budgetData.avgDailySales)}</li>
                <li>• Días restantes: {budgetData.remainingDays} días</li>
                <li>• {budgetData.monthProjectionCompliance >= 100 ? `Proyectas superar la meta en ${formatCurrency(budgetData.monthProjection - budgetData.monthlyBudget)}` : `Necesitas ${formatCurrency(budgetData.monthlyBudget - budgetData.monthProjection)} adicionales al ritmo actual`}</li>
              </ul>
            </div>
          )}

          {selectedMetric === 'recovery-plan' && (
            <div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                  <span className="text-xs text-rose-700">Brecha acumulada</span>
                  <span className="font-bold text-rose-900">{formatCurrency(budgetData.accumulatedGap)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-700">PPT Excel del día</span>
                  <span className="font-bold text-blue-900">{formatCurrency(budgetData.excelBudgetForToday)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                  <span className="text-xs text-amber-700">Incremento por recuperación (+)</span>
                  <span className="font-bold text-amber-900">+{formatCurrency(budgetData.gapRecoveryIncrement)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="text-xs text-purple-700 font-bold">Meta total del día</span>
                  <span className="font-black text-purple-900 text-base">{formatCurrency(budgetData.adjustedDailyBudget)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xs text-emerald-700">Días para recuperar</span>
                  <span className="font-bold text-emerald-900">{budgetData.remainingDays} días</span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-bold text-amber-900 mb-2">📊 Estrategia de recuperación:</p>
                <ul className="text-xs text-amber-800 space-y-1 ml-4">
                  <li>• El PPT del día viene exactamente del Excel importado: {formatCurrency(budgetData.excelBudgetForToday)}</li>
                  <li>• Se añade un incremento del 50% de la brecha distribuido proporcionalmente</li>
                  <li>• El incremento máximo está limitado al 40% del PPT base</li>
                  <li>• Esto hace la recuperación realista y alcanzable</li>
                </ul>
              </div>
            </div>
          )}

          {selectedMetric === 'on-track' && (
            <div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xs text-emerald-700">Cumplimiento actual</span>
                  <span className="font-bold text-emerald-900">{budgetData.compliance.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xs text-emerald-700">Vendido hasta hoy</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(budgetData.salesUntilYesterday + budgetData.todayActualSales)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-700">PPT del día (Excel)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(budgetData.excelBudgetForToday)}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={budgetData.dailyTrendData}>
                  <defs>
                    <linearGradient id="onTrackGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={9} angle={-45} textAnchor="end" height={50} />
                  <YAxis fontSize={10} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v, name) => [formatCurrency(v), name === 'ventas' ? '💰 Venta' : '🎯 Meta']} />
                  <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} fill="url(#onTrackGradient)" name="ventas" />
                  <Area type="monotone" dataKey="presupuesto" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="none" name="presupuesto" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}