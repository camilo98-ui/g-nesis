import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, addWeeks, startOfYear, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, TrendingDown, CloudRain, Sun, Cloud, Thermometer, MapPin, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StoreSelector, { STORES } from '@/components/StoreSelector';

import WeatherMainChart from '@/components/weather/WeatherMainChart';
import WeatherRegionMap from '@/components/weather/WeatherRegionMap';
import WeatherImpactSummary from '@/components/weather/WeatherImpactSummary';

export default function WeatherImpact() {
  const [selectedStore, setSelectedStore] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Generar semanas del año
  const weekOptions = useMemo(() => {
    const weeks = [];
    const year = new Date().getFullYear();
    const yearStart = startOfYear(new Date(year, 0, 1));
    const currentWeek = getWeek(new Date(), { weekStartsOn: 1 });
    
    for (let i = 1; i <= 52; i++) {
      const weekStart = startOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: String(i),
        label: `Sem ${i} (${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })})`,
        from: weekStart,
        to: weekEnd,
        isCurrent: i === currentWeek
      });
    }
    return weeks;
  }, []);

  const handleWeekChange = (weekNum) => {
    setSelectedWeek(weekNum);
    const week = weekOptions.find(w => w.value === weekNum);
    if (week) {
      setDateRange({ from: week.from, to: week.to });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('selectedStore');
    if (saved) setSelectedStore(saved);
  }, []);

  const handleStoreChange = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', store);
  };

  // Fetch sales data
  const { data: dailySales = [] } = useQuery({
    queryKey: ['dailySales', selectedStore],
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }, '-date', 90),
    enabled: !!selectedStore
  });

  // Fetch weather data from Open-Meteo based on date range
  const fetchWeatherData = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setLoading(true);
    try {
      const lat = 4.6097;
      const lon = -74.0817;
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Historical weather
      const historyRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weathercode&timezone=America%2FBogota`
      );
      const historyData = await historyRes.json();
      
      // Current weather
      const currentRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=America%2FBogota`
      );
      const currentData = await currentRes.json();
      
      setWeatherData({
        current: currentData.current,
        history: historyData.daily
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [dateRange]);

  // Filtrar ventas por rango de fecha
  const filteredSales = useMemo(() => {
    return dailySales.filter(s => {
      const date = new Date(s.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [dailySales, dateRange]);

  // Calcular estadísticas generales
  const stats = useMemo(() => {
    if (!filteredSales.length || !weatherData?.history?.time) return null;
    
    const salesByDate = {};
    filteredSales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    const validSales = filteredSales.filter(s => s.total_sales > 0);
    const avgSales = validSales.length > 0 
      ? validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0) / validSales.length 
      : 0;
    
    let totalImpact = 0;
    let rainyDays = 0;
    let sunnyDays = 0;
    let totalSalesRainy = 0;
    let totalSalesSunny = 0;
    
    weatherData.history.time.forEach((date, idx) => {
      const weatherCode = weatherData.history.weathercode?.[idx] || 0;
      const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
      const sales = salesByDate[date] || 0;
      
      const isRainy = precipitation > 5 || (weatherCode >= 51 && weatherCode <= 99);
      const isSunny = weatherCode <= 2 && precipitation < 1;
      
      if (isRainy) {
        rainyDays++;
        totalSalesRainy += sales;
        if (sales > 0 && avgSales > 0) {
          totalImpact += sales - avgSales;
        }
      }
      if (isSunny) {
        sunnyDays++;
        totalSalesSunny += sales;
      }
    });
    
    const avgSalesRainy = rainyDays > 0 ? totalSalesRainy / rainyDays : 0;
    const avgSalesSunny = sunnyDays > 0 ? totalSalesSunny / sunnyDays : 0;
    
    return {
      avgSales,
      rainyDays,
      sunnyDays,
      avgSalesRainy,
      avgSalesSunny,
      totalImpact,
      impactPercentage: avgSales > 0 ? ((avgSalesRainy - avgSales) / avgSales * 100) : 0,
      sunnyBoost: avgSales > 0 ? ((avgSalesSunny - avgSales) / avgSales * 100) : 0
    };
  }, [filteredSales, weatherData]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 
  }).format(Math.round(val || 0));

  const storeName = STORES.find(s => s.code === selectedStore)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-sky-100">
                <ArrowLeft className="w-5 h-5 text-sky-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CloudRain className="w-6 h-6 text-sky-500" />
                Análisis Clima y Ventas
              </h1>
              <p className="text-sm text-gray-500">
                {selectedStore ? `${selectedStore} - ${storeName}` : 'Selecciona una tienda'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            
            {/* Week Selector */}
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-[200px] h-10 bg-white shadow-sm">
                <Calendar className="w-4 h-4 text-sky-500 mr-2" />
                <SelectValue placeholder="Semana del año" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {weekOptions.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    <span className={week.isCurrent ? 'font-bold text-sky-600' : ''}>
                      {week.label} {week.isCurrent && '(Actual)'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 bg-white shadow-sm">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span className="text-sm">
                    {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM', { locale: es })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to || range.from });
                      setSelectedWeek('');
                    }
                  }}
                  numberOfMonths={2}
                />
                <div className="p-3 border-t flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => {
                    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
                    setSelectedWeek('');
                  }}>Últimos 7 días</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                    setSelectedWeek('');
                  }}>Últimos 30 días</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setDateRange({ from: startOfMonth(new Date()), to: new Date() });
                    setSelectedWeek('');
                  }}>Este mes</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchWeatherData}
              disabled={loading}
              className="h-10 w-10 bg-white shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {!selectedStore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center">
              <CloudRain className="w-12 h-12 text-sky-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500">Para ver el análisis de clima y ventas</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary Cards */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Días Soleados</p>
                      <p className="text-xl font-bold text-gray-800">{stats.sunnyDays}</p>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className={`font-bold ${stats.sunnyBoost >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats.sunnyBoost >= 0 ? '+' : ''}{stats.sunnyBoost.toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">vs promedio</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CloudRain className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Días Lluviosos</p>
                      <p className="text-xl font-bold text-gray-800">{stats.rainyDays}</p>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className={`font-bold ${stats.impactPercentage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats.impactPercentage >= 0 ? '+' : ''}{stats.impactPercentage.toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-1">vs promedio</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`rounded-2xl p-5 shadow-sm border ${stats.totalImpact >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.totalImpact >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {stats.totalImpact >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Impacto Total</p>
                      <p className={`text-lg font-bold ${stats.totalImpact >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {stats.totalImpact >= 0 ? '+' : ''}{formatCurrency(stats.totalImpact)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {stats.totalImpact >= 0 ? 'Ganancia extra por buen clima' : 'Pérdida por mal clima'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Venta Promedio</p>
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.avgSales)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Base de comparación
                  </p>
                </motion.div>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white shadow-sm border p-1 rounded-xl">
                <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                  📊 Análisis Detallado
                </TabsTrigger>
                <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                  🗺️ Mapa Regional
                </TabsTrigger>
                <TabsTrigger value="impact" className="rounded-lg data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                  💰 Resumen Económico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="mt-4">
                <WeatherMainChart 
                  weatherData={weatherData}
                  dailySales={filteredSales}
                  dateRange={dateRange}
                  loading={loading}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <WeatherRegionMap 
                  dateRange={dateRange}
                  dailySales={filteredSales}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>

              <TabsContent value="impact" className="mt-4">
                <WeatherImpactSummary 
                  weatherData={weatherData}
                  dailySales={filteredSales}
                  dateRange={dateRange}
                  stats={stats}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}