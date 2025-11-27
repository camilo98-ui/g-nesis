import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreSelector, { STORES } from '@/components/StoreSelector';
import DateFilter from '@/components/DateFilter';
import StatsCard from '@/components/dashboard/StatsCard';
import SalesChart from '@/components/dashboard/SalesChart';
import ComparisonChart from '@/components/dashboard/ComparisonChart';
import ProjectionCard from '@/components/dashboard/ProjectionCard';
import { 
  DollarSign, Receipt, Zap, Gift, TrendingUp, ArrowLeft,
  BarChart3, PieChart, Activity, Target
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { startOfMonth, endOfMonth, differenceInDays, format, eachDayOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#f97316', '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [selectedStore, setSelectedStore] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  // Fetch data
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', selectedStore],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', selectedStore],
    queryFn: () => base44.entities.Budget.filter({ store_id: selectedStore }),
    enabled: !!selectedStore
  });

  // Current month budget
  const currentBudget = useMemo(() => {
    const now = new Date();
    return budgets.find(b => b.month === now.getMonth() + 1 && b.year === now.getFullYear()) || {};
  }, [budgets]);

  // Filter data by date range
  const filteredSales = useMemo(() => {
    return dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [dailySales, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      sales: acc.sales + (s.total_sales || 0),
      tickets: acc.tickets + (s.total_tickets || 0),
      transactions: acc.transactions + (s.total_transactions || 0),
      suggested: acc.suggested + (s.total_suggested || 0)
    }), { sales: 0, tickets: 0, transactions: 0, suggested: 0 });
  }, [filteredSales]);

  // Chart data
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const dailyBudget = currentBudget.sales_budget ? currentBudget.sales_budget / 30 : 0;
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = dailySales.find(s => s.date === dayStr) || {};
      return {
        date: format(day, 'dd MMM', { locale: es }),
        sales: dayData.total_sales || 0,
        budget: dailyBudget
      };
    });
  }, [dateRange, dailySales, currentBudget]);

  // Comparison data (current vs previous period)
  const comparisonData = useMemo(() => {
    const currentMonth = new Date();
    const prevMonth = subMonths(currentMonth, 1);
    
    const currentMonthSales = dailySales
      .filter(s => new Date(s.date).getMonth() === currentMonth.getMonth())
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);
    
    const prevMonthSales = dailySales
      .filter(s => new Date(s.date).getMonth() === prevMonth.getMonth())
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);

    return [
      { period: 'Ventas', current: currentMonthSales, previous: prevMonthSales },
      { 
        period: 'Tickets', 
        current: dailySales.filter(s => new Date(s.date).getMonth() === currentMonth.getMonth())
          .reduce((sum, s) => sum + (s.total_tickets || 0), 0),
        previous: dailySales.filter(s => new Date(s.date).getMonth() === prevMonth.getMonth())
          .reduce((sum, s) => sum + (s.total_tickets || 0), 0)
      }
    ];
  }, [dailySales]);

  // Shift distribution for pie chart
  const shiftDistribution = useMemo(() => {
    const distribution = { morning: 0, afternoon: 0, night: 0 };
    shiftRecords.forEach(r => {
      distribution[r.shift] = (distribution[r.shift] || 0) + (r.sales || 0);
    });
    return [
      { name: 'Mañana', value: distribution.morning, color: '#fbbf24' },
      { name: 'Tarde', value: distribution.afternoon, color: '#f97316' },
      { name: 'Noche', value: distribution.night, color: '#6366f1' }
    ].filter(d => d.value > 0);
  }, [shiftRecords]);

  // Calculate days elapsed and total for projection
  const daysElapsed = differenceInDays(new Date(), startOfMonth(new Date())) + 1;
  const totalDays = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;

  // Month total sales for projection
  const monthTotalSales = useMemo(() => {
    const now = new Date();
    return dailySales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, s) => sum + (s.total_sales || 0), 0);
  }, [dailySales]);

  const selectedStoreName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                Dashboard
              </h1>
              {selectedStore && (
                <p className="text-sm text-gray-500 mt-1">{selectedStore} - {selectedStoreName}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <DateFilter dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        {selectedStore ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard 
                title="Ventas" 
                value={totals.sales}
                budget={currentBudget.sales_budget || 0}
                icon={DollarSign}
                color="orange"
                format="currency"
                delay={0}
              />
              <StatsCard 
                title="Tickets" 
                value={totals.tickets}
                budget={currentBudget.tickets_budget || 0}
                icon={Receipt}
                color="blue"
                delay={0.1}
              />
              <StatsCard 
                title="Transacciones" 
                value={totals.transactions}
                budget={currentBudget.transactions_budget || 0}
                icon={Zap}
                color="purple"
                delay={0.2}
              />
              <StatsCard 
                title="Sugeridos" 
                value={totals.suggested}
                budget={currentBudget.suggested_budget || 0}
                icon={Gift}
                color="green"
                delay={0.3}
              />
            </div>

            {/* Projection Card */}
            <ProjectionCard 
              currentSales={monthTotalSales}
              budget={currentBudget.sales_budget || 0}
              daysElapsed={daysElapsed}
              totalDays={totalDays}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart 
                data={chartData} 
                title="Ventas vs Presupuesto" 
                showBudget={!!currentBudget.sales_budget}
              />
              <ComparisonChart 
                data={comparisonData} 
                title="Comparación con Mes Anterior" 
              />
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shift Distribution */}
              {shiftDistribution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-orange-500" />
                    Distribución por Turno
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={shiftDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {shiftDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(value)}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  Métricas Clave
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl">
                    <span className="text-gray-600">Ticket Promedio</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(totals.tickets > 0 ? totals.sales / totals.tickets : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl">
                    <span className="text-gray-600">Trans. por Ticket</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {totals.tickets > 0 ? (totals.transactions / totals.tickets).toFixed(2) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl">
                    <span className="text-gray-600">Sugeridos por Ticket</span>
                    <span className="text-2xl font-bold text-green-600">
                      {totals.tickets > 0 ? (totals.suggested / totals.tickets).toFixed(2) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl">
                    <span className="text-gray-600">Días Registrados</span>
                    <span className="text-2xl font-bold text-purple-600">{filteredSales.length}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-orange-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500">Para ver el dashboard de estadísticas</p>
          </div>
        )}
      </div>
    </div>
  );
}