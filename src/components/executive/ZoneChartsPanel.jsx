import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, Activity, DollarSign, Target } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ZoneChartsPanel({ 
  allDailySales, 
  storesAnalysis, 
  dateRange, 
  zoneTotals,
  zoneBudget 
}) {
  const formatCurrency = (v) => `$${(v / 1000000).toFixed(1)}M`;

  // Datos de ventas diarias de la zona
  const dailyZoneSales = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const daySales = allDailySales
        .filter(s => {
          try {
            const d = new Date(s.date);
            return d.toDateString() === day.toDateString();
          } catch {
            return false;
          }
        })
        .reduce((sum, s) => sum + (s.total_sales || 0), 0);

      return {
        date: format(day, 'dd MMM', { locale: es }),
        sales: daySales / 1000000,
        budget: zoneBudget ? (zoneBudget.sales_budget / 30) / 1000000 : 0
      };
    });
  }, [allDailySales, dateRange, zoneBudget]);

  // Top y Bottom tiendas
  const storesPerformance = useMemo(() => {
    return storesAnalysis
      .filter(s => s.hasData)
      .sort((a, b) => b.salesCompliance - a.salesCompliance)
      .map(s => ({
        name: s.name.substring(0, 10),
        compliance: s.salesCompliance,
        sales: s.totalSales / 1000000
      }));
  }, [storesAnalysis]);

  // Distribución de cumplimiento
  const complianceDistribution = useMemo(() => {
    const ranges = [
      { name: '0-50%', count: 0, color: '#ef4444' },
      { name: '50-70%', count: 0, color: '#f59e0b' },
      { name: '70-90%', count: 0, color: '#eab308' },
      { name: '90-110%', count: 0, color: '#10b981' },
      { name: '+110%', count: 0, color: '#06b6d4' }
    ];

    storesAnalysis.filter(s => s.hasData).forEach(s => {
      if (s.salesCompliance < 50) ranges[0].count++;
      else if (s.salesCompliance < 70) ranges[1].count++;
      else if (s.salesCompliance < 90) ranges[2].count++;
      else if (s.salesCompliance <= 110) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges.filter(r => r.count > 0);
  }, [storesAnalysis]);

  // Métricas vs presupuesto
  const budgetComparison = useMemo(() => {
    if (!zoneBudget) return null;
    
    const actual = zoneTotals.totalSales / 1000000;
    const budget = zoneBudget.sales_budget / 1000000;
    const gap = actual - budget;
    
    return {
      actual,
      budget,
      gap,
      compliance: (actual / budget) * 100
    };
  }, [zoneTotals, zoneBudget]);

  return (
    <div className="space-y-6">
      {/* Comparación Zona vs Presupuesto */}
      {budgetComparison && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Zona vs Presupuesto</h3>
              <p className="text-sm text-slate-400">Comparación del período</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-2">Venta Real</p>
              <p className="text-2xl font-black text-white">{formatCurrency(budgetComparison.actual * 1000000)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-2">Presupuesto</p>
              <p className="text-2xl font-black text-white">{formatCurrency(budgetComparison.budget * 1000000)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-2">Brecha</p>
              <p className={`text-2xl font-black ${budgetComparison.gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {budgetComparison.gap >= 0 ? '+' : ''}{formatCurrency(budgetComparison.gap * 1000000)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-2">Cumplimiento</p>
              <p className={`text-2xl font-black ${
                budgetComparison.compliance >= 100 ? 'text-emerald-400' :
                budgetComparison.compliance >= 90 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {budgetComparison.compliance.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ventas Diarias de la Zona */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ventas Diarias de la Zona</h3>
            <p className="text-xs text-slate-400">Tendencia del período</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={dailyZoneSales}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#salesGradient)" />
            {zoneBudget && (
              <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Tiendas */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ranking de Tiendas</h3>
              <p className="text-xs text-slate-400">Por cumplimiento</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storesPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="compliance" fill="#8b5cf6" radius={[0, 8, 8, 0]}>
                {storesPerformance.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.compliance >= 100 ? '#10b981' :
                      entry.compliance >= 90 ? '#eab308' :
                      entry.compliance >= 70 ? '#f59e0b' : '#ef4444'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de Cumplimiento */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Distribución de Cumplimiento</h3>
              <p className="text-xs text-slate-400">Por rangos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={complianceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {complianceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}