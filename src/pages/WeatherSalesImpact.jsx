import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cloud, CloudRain, Sun, Wind, Droplets, TrendingUp, Calendar, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeatherSalesHeader from '@/components/weather/WeatherSalesHeader';
import KPICard from '@/components/weather/KPICard';
import WeatherSalesMainChart from '@/components/weather/WeatherSalesMainChart';
import WeatherInsightsPanel from '@/components/weather/WeatherInsightsPanel';
import WeatherFilters from '@/components/weather/WeatherFilters';

export default function WeatherSalesImpact() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedMetrics, setSelectedMetrics] = useState(['sales', 'temperature', 'rainfall']);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly
  const [loading, setLoading] = useState(false);

  // Fetch weather data
  const { data: weatherData = [] } = useQuery({
    queryKey: ['weatherData'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getWeatherDataForBogota', {});
      return response.data || [];
    }
  });

  // Fetch sales data
  const { data: dailySalesData = [] } = useQuery({
    queryKey: ['allDailySales'],
    queryFn: () => base44.entities.DailySales.list()
  });

  // Process combined data
  const processedData = useMemo(() => {
    const combined = [];
    
    dailySalesData.forEach(sale => {
      const saleDate = parseISO(sale.date);
      if (!isWithinInterval(saleDate, { start: dateRange.from, end: dateRange.to })) return;

      const weatherRecord = weatherData.find(w => w.date === sale.date);
      
      combined.push({
        date: sale.date,
        displayDate: format(saleDate, 'd MMM', { locale: es }),
        sales: sale.total_sales || 0,
        temperature: weatherRecord?.temperature_mean || 0,
        precipitation: weatherRecord?.precipitation || 0,
        humidity: weatherRecord?.humidity || 0,
        weatherCode: weatherRecord?.weather_code || 0,
        tickets: sale.total_tickets || 0
      });
    });

    return combined.sort((a, b) => parseISO(a.date) - parseISO(b.date));
  }, [dailySalesData, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (processedData.length === 0) {
      return {
        avgSales: 0,
        avgTemp: 0,
        rainyDays: 0,
        correlation: 0
      };
    }

    const avgSales = processedData.reduce((sum, d) => sum + d.sales, 0) / processedData.length;
    const avgTemp = processedData.reduce((sum, d) => sum + d.temperature, 0) / processedData.length;
    const rainyDays = processedData.filter(d => d.precipitation > 1).length;
    
    // Calculate correlation
    const salesNorm = processedData.map(d => d.sales);
    const tempNorm = processedData.map(d => d.temperature);
    
    const meanSales = avgSales;
    const meanTemp = avgTemp;
    
    const covariance = processedData.reduce((sum, d, i) => 
      sum + (d.sales - meanSales) * (d.temperature - meanTemp), 0) / processedData.length;
    
    const stdSales = Math.sqrt(
      processedData.reduce((sum, d) => sum + Math.pow(d.sales - meanSales, 2), 0) / processedData.length
    );
    const stdTemp = Math.sqrt(
      processedData.reduce((sum, d) => sum + Math.pow(d.temperature - meanTemp, 2), 0) / processedData.length
    );
    
    const correlation = stdSales && stdTemp ? (covariance / (stdSales * stdTemp)) * 100 : 0;

    return {
      avgSales,
      avgTemp,
      rainyDays,
      correlation: Math.abs(correlation)
    };
  }, [processedData]);

  const handleReset = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date()
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <WeatherSalesHeader 
          dateRange={dateRange} 
          onDateChange={setDateRange}
          onReset={handleReset}
        />

        {/* Filters */}
        <WeatherFilters 
          selectedMetrics={selectedMetrics}
          onMetricsChange={setSelectedMetrics}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Venta Promedio"
              value={`$${(kpis.avgSales / 1000000).toFixed(1)}M`}
              change={12.5}
              icon={TrendingUp}
              gradient="from-blue-500/20 to-cyan-500/20"
              color="text-blue-400"
            />
            <KPICard
              title="Temperatura Promedio"
              value={`${kpis.avgTemp.toFixed(1)}°C`}
              change={-2.3}
              icon={Sun}
              gradient="from-amber-500/20 to-orange-500/20"
              color="text-amber-400"
            />
            <KPICard
              title="Días Lluviosos"
              value={kpis.rainyDays}
              subtext="del período"
              icon={CloudRain}
              gradient="from-slate-500/20 to-blue-500/20"
              color="text-slate-400"
            />
            <KPICard
              title="Correlación"
              value={`${kpis.correlation.toFixed(0)}%`}
              subtext="clima ↔ ventas"
              icon={Zap}
              gradient="from-purple-500/20 to-pink-500/20"
              color="text-purple-400"
            />
          </div>

          {/* Main Chart */}
          <div className="mb-8">
            <WeatherSalesMainChart 
              data={processedData}
              selectedMetrics={selectedMetrics}
            />
          </div>

          {/* Insights */}
          <WeatherInsightsPanel 
            data={processedData}
            kpis={kpis}
            dateRange={dateRange}
          />
        </div>
      </div>
    </div>
  );
}