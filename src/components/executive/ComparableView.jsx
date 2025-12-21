import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { subDays, subWeeks, subMonths, subYears, format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ComparableView({ 
  storesAnalysis, 
  allDailySales, 
  activeRange, 
  formatCurrency 
}) {
  // Calcular período anterior basado en el rango seleccionado
  const previousPeriod = useMemo(() => {
    const daysDiff = differenceInDays(activeRange.to, activeRange.from);
    
    // Determinar el tipo de período
    let periodType = 'custom';
    let from, to;
    
    if (daysDiff <= 1) {
      periodType = 'day';
      from = subDays(activeRange.from, 1);
      to = subDays(activeRange.to, 1);
    } else if (daysDiff <= 7) {
      periodType = 'week';
      from = subWeeks(activeRange.from, 1);
      to = subWeeks(activeRange.to, 1);
    } else if (daysDiff <= 31) {
      periodType = 'month';
      from = subMonths(activeRange.from, 1);
      to = subMonths(activeRange.to, 1);
    } else {
      periodType = 'year';
      from = subYears(activeRange.from, 1);
      to = subYears(activeRange.to, 1);
    }
    
    return { from, to, periodType, daysDiff };
  }, [activeRange]);

  // Datos del período anterior
  const previousData = useMemo(() => {
    return storesAnalysis.map(store => {
      const prevSales = allDailySales.filter(s => {
        try {
          const d = new Date(s.date);
          return s.store_id === store.code && 
                 !isNaN(d.getTime()) && 
                 d >= previousPeriod.from && 
                 d <= previousPeriod.to;
        } catch {
          return false;
        }
      });

      const totalSales = Math.max(0, prevSales.reduce((sum, s) => sum + (s.total_sales || 0), 0));
      const totalTickets = Math.max(0, prevSales.reduce((sum, s) => sum + (s.total_tickets || 0), 0));
      const totalTransactions = Math.max(0, prevSales.reduce((sum, s) => sum + (s.total_transactions || 0), 0));
      const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        code: store.code,
        name: store.name,
        totalSales,
        totalTickets,
        totalTransactions,
        avgTicket
      };
    });
  }, [storesAnalysis, allDailySales, previousPeriod]);

  // Comparación consolidada
  const comparisonData = useMemo(() => {
    return storesAnalysis.map((current, idx) => {
      const previous = previousData[idx];
      
      const salesGrowth = previous.totalSales > 0 
        ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 
        : 0;
      
      const ticketGrowth = previous.avgTicket > 0 
        ? ((current.avgTicket - previous.avgTicket) / previous.avgTicket) * 100 
        : 0;
      
      const transactionsGrowth = previous.totalTransactions > 0 
        ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100 
        : 0;

      return {
        name: current.name,
        currentSales: current.totalSales,
        previousSales: previous.totalSales,
        salesGrowth,
        currentTicket: current.avgTicket,
        previousTicket: previous.avgTicket,
        ticketGrowth,
        currentTransactions: current.totalTransactions,
        previousTransactions: previous.totalTransactions,
        transactionsGrowth
      };
    });
  }, [storesAnalysis, previousData]);

  // Totales de zona
  const zoneTotals = useMemo(() => {
    const currentTotal = storesAnalysis.reduce((sum, s) => sum + s.totalSales, 0);
    const previousTotal = previousData.reduce((sum, s) => sum + s.totalSales, 0);
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    const currentTickets = storesAnalysis.reduce((sum, s) => sum + s.totalTickets, 0);
    const previousTickets = previousData.reduce((sum, s) => sum + s.totalTickets, 0);
    const ticketsGrowth = previousTickets > 0 ? ((currentTickets - previousTickets) / previousTickets) * 100 : 0;

    const currentTransactions = storesAnalysis.reduce((sum, s) => sum + s.totalTransactions, 0);
    const previousTransactions = previousData.reduce((sum, s) => sum + s.totalTransactions, 0);
    const transactionsGrowth = previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0;

    return {
      currentTotal,
      previousTotal,
      growth,
      currentTickets,
      previousTickets,
      ticketsGrowth,
      currentTransactions,
      previousTransactions,
      transactionsGrowth
    };
  }, [storesAnalysis, previousData]);

  const getPeriodLabel = () => {
    const labels = {
      day: 'vs Día Anterior',
      week: 'vs Semana Anterior',
      month: 'vs Mes Anterior',
      year: 'vs Año Anterior',
      custom: 'vs Período Anterior'
    };
    return labels[previousPeriod.periodType] || labels.custom;
  };

  const GrowthIndicator = ({ value }) => {
    if (Math.abs(value) < 0.5) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="w-4 h-4" />
          <span className="font-bold">{Math.abs(value).toFixed(0)}%</span>
        </div>
      );
    }
    
    return value > 0 ? (
      <div className="flex items-center gap-1 text-emerald-600">
        <ArrowUpRight className="w-4 h-4" />
        <span className="font-bold">+{value.toFixed(0)}%</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <ArrowDownRight className="w-4 h-4" />
        <span className="font-bold">{value.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Análisis Comparable</h1>
        <p className="text-sm text-gray-500">
          Período actual vs {format(previousPeriod.from, 'dd MMM', { locale: es })} - {format(previousPeriod.to, 'dd MMM', { locale: es })}
        </p>
      </motion.div>

      {/* KPIs de Zona Comparables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Ventas Totales</p>
              <GrowthIndicator value={zoneTotals.growth} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(zoneTotals.currentTotal)}</p>
            <p className="text-xs text-gray-400">Anterior: {formatCurrency(zoneTotals.previousTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Tickets</p>
              <GrowthIndicator value={zoneTotals.ticketsGrowth} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{zoneTotals.currentTickets.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Anterior: {zoneTotals.previousTickets.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Transacciones</p>
              <GrowthIndicator value={zoneTotals.transactionsGrowth} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{zoneTotals.currentTransactions.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Anterior: {zoneTotals.previousTransactions.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Comparación de Ventas */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            Comparación de Ventas por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-45} textAnchor="end" height={90} />
              <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip 
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="currentSales" fill="#3b82f6" name="Período Actual" radius={[6, 6, 0, 0]} />
              <Bar dataKey="previousSales" fill="#94a3b8" name="Período Anterior" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Crecimiento */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            % Crecimiento por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-45} textAnchor="end" height={90} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip 
                formatter={(v) => `${v.toFixed(1)}%`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="salesGrowth" fill="#10b981" name="Crecimiento Ventas" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="ticketGrowth" stroke="#f59e0b" strokeWidth={2} name="Crecimiento Ticket" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla Detallada */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            Detalle Comparativo por Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tienda</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ventas Actual</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ventas Anterior</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Δ Ventas</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Δ Ticket</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Δ Trans.</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData
                  .sort((a, b) => b.salesGrowth - a.salesGrowth)
                  .map((store) => (
                    <tr key={store.name} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{store.name}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(store.currentSales)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(store.previousSales)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <GrowthIndicator value={store.salesGrowth} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <GrowthIndicator value={store.ticketGrowth} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <GrowthIndicator value={store.transactionsGrowth} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}