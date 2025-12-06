import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DailyBudgetCard({ dailySales = [], budgets = [], storeId, formatCurrency }) {
  // Calcular presupuesto diario (presupuesto mensual / 30)
  const currentBudget = useMemo(() => {
    const now = new Date();
    const monthBudget = budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear());
    return monthBudget ? monthBudget.sales_budget / 30 : 0;
  }, [budgets]);

  // Datos de últimos 7 días
  const chartData = useMemo(() => {
    const last7Days = dailySales.slice(-7);
    return last7Days.map(day => ({
      date: format(parseISO(day.date), 'dd', { locale: es }),
      fullDate: format(parseISO(day.date), 'EEEE dd MMM', { locale: es }),
      real: day.total_sales || 0,
      presupuesto: currentBudget,
      diferencia: (day.total_sales || 0) - currentBudget,
      cumplimiento: currentBudget > 0 ? ((day.total_sales || 0) / currentBudget) * 100 : 0
    }));
  }, [dailySales, currentBudget]);

  // Datos del día actual
  const today = chartData[chartData.length - 1];
  const compliance = today?.cumplimiento || 0;

  return (
    <Card className="bg-white shadow-xl border-0">
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
        <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          Presupuesto del Día
        </CardTitle>
        <p className="text-xs text-gray-500">Últimos 7 días vs Meta diaria</p>
      </CardHeader>
      <CardContent className="p-4">
        {/* Stats rápidas del día actual */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-3 text-center"
          >
            <p className="text-xs text-gray-600 mb-1">💰 Real</p>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(today?.real || 0)}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-3 text-center"
          >
            <p className="text-xs text-gray-600 mb-1">🎯 Meta</p>
            <p className="text-lg font-black text-violet-600">{formatCurrency(currentBudget)}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`rounded-xl p-3 text-center ${
              compliance >= 100 
                ? 'bg-gradient-to-br from-green-50 to-emerald-100' 
                : 'bg-gradient-to-br from-amber-50 to-orange-100'
            }`}
          >
            <p className="text-xs text-gray-600 mb-1">📊 %</p>
            <p className={`text-lg font-black ${compliance >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
              {compliance.toFixed(0)}%
            </p>
          </motion.div>
        </div>

        {/* Gráfica de presupuesto vs real */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                formatter={(v, name) => {
                  if (name === 'Cumplimiento') return [`${v.toFixed(0)}%`, name];
                  return [formatCurrency(v), name === 'real' ? 'Real' : 'Presupuesto'];
                }}
              />
              <ReferenceLine y={currentBudget} stroke="#8b5cf6" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Meta Diaria', fill: '#8b5cf6', fontSize: 10 }} />
              <Bar dataKey="real" fill="#10b981" radius={[6, 6, 0, 0]} name="Real" />
              <Line type="monotone" dataKey="presupuesto" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Presupuesto" />
              <Area type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} fill="url(#realGrad)" name="Real" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen visual */}
        <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Comparativa Hoy</span>
            <motion.span 
              animate={compliance >= 100 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`text-xl font-black ${compliance >= 100 ? 'text-green-600' : 'text-amber-600'}`}
            >
              {today?.diferencia >= 0 ? '+' : ''}{formatCurrency(today?.diferencia || 0)}
            </motion.span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${compliance >= 100 ? 'bg-green-400' : 'bg-amber-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(compliance, 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {compliance >= 100 
              ? '🎉 ¡Superaste el presupuesto del día!' 
              : `💪 Te falta ${formatCurrency(currentBudget - (today?.real || 0))} para cumplir la meta diaria`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}