import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, BarChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const SalesVsBudgetChart = ({ todaySales = 0, budget = {}, shiftRecords = [], dailySales = [] }) => {
  const [filterType, setFilterType] = useState('daily'); // daily, projection, weekly
  const [expandedDay, setExpandedDay] = useState(null);

  // Procesar datos de ventas diarias
  const salesByDay = useMemo(() => {
    if (!dailySales || dailySales.length === 0) return [];
    
    return dailySales.map(sale => {
      const budgetAmount = budget.sales_budget ? (budget.sales_budget / 30) : 0; // Presupuesto diario aproximado
      const compliance = budgetAmount > 0 ? (sale.total_sales / budgetAmount) * 100 : 0;
      return {
        date: sale.date,
        sales: sale.total_sales || 0,
        budget: budgetAmount,
        compliance: Math.round(compliance),
        day: format(new Date(sale.date), 'EEE dd', { locale: es })
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dailySales, budget]);

  // Proyección a cierre
  const projectionData = useMemo(() => {
    if (salesByDay.length === 0) return [];
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    
    const totalSalesUntilNow = salesByDay.reduce((sum, d) => sum + d.sales, 0);
    const dailyAverage = dayOfMonth > 0 ? totalSalesUntilNow / dayOfMonth : 0;
    const projectedTotal = totalSalesUntilNow + (dailyAverage * daysRemaining);
    const monthlyBudget = budget.sales_budget || 0;
    const projectionCompliance = monthlyBudget > 0 ? (projectedTotal / monthlyBudget) * 100 : 0;

    return [
      {
        label: 'Venta hasta hoy',
        value: totalSalesUntilNow,
        percentage: monthlyBudget > 0 ? (totalSalesUntilNow / monthlyBudget) * 100 : 0
      },
      {
        label: 'Proyección a cierre',
        value: projectedTotal,
        percentage: projectionCompliance
      },
      {
        label: 'Presupuesto mensual',
        value: monthlyBudget,
        percentage: 100
      }
    ];
  }, [salesByDay, budget]);

  // Datos por semana
  const weeklyData = useMemo(() => {
    if (salesByDay.length === 0) return [];
    
    const grouped = {};
    salesByDay.forEach(day => {
      const date = new Date(day.date);
      const week = getWeek(date);
      const weekKey = `Semana ${week}`;
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = { week: weekKey, sales: 0, budget: 0, days: 0 };
      }
      grouped[weekKey].sales += day.sales;
      grouped[weekKey].budget += day.budget;
      grouped[weekKey].days += 1;
    });

    return Object.values(grouped).map(w => ({
      ...w,
      compliance: w.budget > 0 ? Math.round((w.sales / w.budget) * 100) : 0
    }));
  }, [salesByDay]);

  const dailyBudget = budget.sales_budget ? (budget.sales_budget / 30) : 0;
  const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="text-[11px] font-semibold">
            {entry.name}: {fmt(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full mb-7"
    >
      {/* Header con filtros */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Venta vs Presupuesto</h2>
          <p className="text-[12px] text-slate-400 font-medium">Análisis de desempeño y proyecciones</p>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'daily', label: 'Diario' },
            { id: 'projection', label: 'Proyección' },
            { id: 'weekly', label: 'Semanal' }
          ].map(f => (
            <Button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              variant={filterType === f.id ? 'default' : 'outline'}
              className={`text-[11px] font-semibold px-4 py-1.5 rounded-lg transition-all ${
                filterType === f.id
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Gráfica */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm overflow-hidden">
        
        {filterType === 'daily' && (
          <div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={salesByDay} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#e2e8f0"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#e2e8f0"
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  fill="url(#salesGrad)" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5}
                  name="Venta"
                  isAnimationActive
                />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Presupuesto"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Detalles diarios */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: 'Hoy (Venta)', value: fmt(todaySales) },
                { label: 'Presupuesto diario', value: fmt(dailyBudget) },
                { label: 'Cumplimiento hoy', value: `${dailyBudget > 0 ? Math.round((todaySales / dailyBudget) * 100) : 0}%` },
                { label: 'Diferencia', value: fmt(todaySales - dailyBudget), color: todaySales >= dailyBudget ? 'text-emerald-500' : 'text-rose-500' }
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase mb-1">{stat.label}</p>
                  <p className={`text-[14px] font-black text-slate-800 ${stat.color || ''}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {filterType === 'projection' && (
          <div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { name: 'Venta actual', value: projectionData[0]?.value || 0, fill: '#f43f5e', comp: projectionData[0]?.percentage || 0 },
                  { name: 'Proyección', value: projectionData[1]?.value || 0, fill: '#ec4899', comp: projectionData[1]?.percentage || 0 },
                  { name: 'Presupuesto', value: projectionData[2]?.value || 0, fill: '#64748b', comp: 100 }
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Resumen de proyección */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {projectionData.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                >
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">{item.label}</p>
                  <p className="text-[18px] font-black text-slate-800 mb-1">{fmt(item.value)}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <motion.div
                        className="h-full bg-rose-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 1 }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 min-w-fit">{Math.round(item.percentage)}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {filterType === 'weekly' && (
          <div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="weekSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#e2e8f0"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#e2e8f0"
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  fill="url(#weekSalesGrad)" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  name="Venta semana"
                />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Presupuesto semana"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Tarjetas de semanas */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {weeklyData.map((week, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200"
                >
                  <p className="text-[9px] font-bold text-purple-600 mb-2 uppercase">{week.week}</p>
                  <p className="text-[13px] font-black text-slate-800 mb-1">{fmt(week.sales)}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">{week.days}d</span>
                    <span className={`font-bold ${week.compliance >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {week.compliance}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SalesVsBudgetChart;