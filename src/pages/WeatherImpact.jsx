import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import StoreSelector from '@/components/StoreSelector';

import TodayWeatherCard from '@/components/weather/TodayWeatherCard';
import SalesVsTemperatureChart from '@/components/weather/SalesVsTemperatureChart';
import WeatherInsightsCards from '@/components/weather/WeatherInsightsCards';
import TomorrowPrediction from '@/components/weather/TomorrowPrediction';

export default function WeatherImpact() {
  const [selectedStore, setSelectedStore] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

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
    queryFn: () => base44.entities.DailySales.filter({ store_id: selectedStore }, '-date', 30),
    enabled: !!selectedStore
  });

  // Fetch weather data from Open-Meteo
  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const lat = 4.6097;
      const lon = -74.0817;
      
      // Current weather
      const currentRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,uv_index&timezone=America%2FBogota`
      );
      const currentData = await currentRes.json();
      
      // Historical (last 14 days)
      const startDate = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const historyRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weathercode&timezone=America%2FBogota`
      );
      const historyData = await historyRes.json();
      
      // Forecast (next 3 days)
      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=America%2FBogota&forecast_days=3`
      );
      const forecastData = await forecastRes.json();
      
      setWeatherData({
        current: currentData.current,
        history: historyData.daily,
        forecast: forecastData.daily
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-sky-100">
                <ArrowLeft className="w-5 h-5 text-sky-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                Impacto del Clima vs Ventas
              </h1>
              <p className="text-sm text-gray-500">Análisis meteorológico para tu tienda</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector selectedStore={selectedStore} onStoreChange={handleStoreChange} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWeatherData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
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
              <span className="text-4xl">🌤️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecciona una tienda</h2>
            <p className="text-gray-500">Para ver el análisis de clima y ventas</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Today's Weather + Tomorrow Prediction */}
            <div className="grid md:grid-cols-2 gap-6">
              <TodayWeatherCard 
                weatherData={weatherData} 
                loading={loading} 
              />
              <TomorrowPrediction 
                weatherData={weatherData}
                dailySales={dailySales}
                loading={loading}
              />
            </div>

            {/* Row 2: Main Chart */}
            <SalesVsTemperatureChart 
              weatherData={weatherData}
              dailySales={dailySales}
              loading={loading}
            />

            {/* Row 3: Insights */}
            <WeatherInsightsCards 
              weatherData={weatherData}
              dailySales={dailySales}
            />
          </div>
        )}
      </div>
    </div>
  );
}