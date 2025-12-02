import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Cloud, Thermometer, TrendingUp, TrendingDown, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const getWeatherType = (code, precipitation) => {
  if (precipitation > 5 || (code >= 51 && code <= 99)) return 'rainy';
  if (code <= 2) return 'sunny';
  return 'cloudy';
};

const getWeatherEmoji = (type) => {
  switch(type) {
    case 'sunny': return '☀️';
    case 'rainy': return '🌧️';
    default: return '⛅';
  }
};

const getWeatherColor = (type) => {
  switch(type) {
    case 'sunny': return '#f59e0b';
    case 'rainy': return '#3b82f6';
    default: return '#9ca3af';
  }
};

export default function WeatherMainChart({ weatherData, dailySales = [], dateRange, loading, formatCurrency }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Combinar datos de clima y ventas
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    // Calcular promedio para comparar
    const validSales = dailySales.filter(s => s.total_sales > 0);
    const avgSales = validSales.length > 0 
      ? validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0) / validSales.length 
      : 0;
    
    return weatherData.history.time.map((date, idx) => {
      const temp = weatherData.history.temperature_2m_mean?.[idx] || 0;
      const tempMax = weatherData.history.temperature_2m_max?.[idx] || 0;
      const tempMin = weatherData.history.temperature_2m_min?.[idx] || 0;
      const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
      const weatherCode = weatherData.history.weathercode?.[idx] || 0;
      const sales = salesByDate[date] || 0;
      const weatherType = getWeatherType(weatherCode, precipitation);
      
      // Calcular impacto vs promedio
      const impact = sales > 0 && avgSales > 0 ? sales - avgSales : 0;
      const impactPct = avgSales > 0 ? ((sales - avgSales) / avgSales * 100) : 0;
      
      return {
        date: format(parseISO(date), 'dd', { locale: es }),
        fullDate: format(parseISO(date), "EEEE dd 'de' MMMM", { locale: es }),
        shortDate: format(parseISO(date), 'dd MMM', { locale: es }),
        dateStr: date,
        temperature: Math.round(temp * 10) / 10,
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        sales,
        avgSales,
        weatherType,
        weatherEmoji: getWeatherEmoji(weatherType),
        weatherColor: getWeatherColor(weatherType),
        impact,
        impactPct: Math.round(impactPct * 10) / 10
      };
    });
  }, [weatherData, dailySales]);

  // Estadísticas del día seleccionado
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return chartData.find(d => d.dateStr === selectedDay);
  }, [selectedDay, chartData]);

  if (loading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
          <p className="text-gray-500">Cargando datos del clima...</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos disponibles para este período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border-0 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-sky-50 to-blue-50 border-b">
        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-sky-500" />
          Ventas vs Clima - Análisis Diario
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Haz clic en una barra para ver el detalle del día
        </p>
      </CardHeader>
      <CardContent className="p-4">
        {/* Selected Day Detail */}
        {selectedDayInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedDayInfo.weatherEmoji}</span>
                <div>
                  <h4 className="font-bold text-gray-800 capitalize">{selectedDayInfo.fullDate}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedDayInfo.tempMin}°C - {selectedDayInfo.tempMax}°C | Lluvia: {selectedDayInfo.precipitation}mm
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Venta del Día</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(selectedDayInfo.sales)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Promedio Período</p>
                <p className="text-lg font-semibold text-gray-600">{formatCurrency(selectedDayInfo.avgSales)}</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${selectedDayInfo.impact >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-500 mb-1">
                  {selectedDayInfo.impact >= 0 ? '📈 Vendí de más' : '📉 Dejé de vender'}
                </p>
                <p className={`text-xl font-bold ${selectedDayInfo.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedDayInfo.impact >= 0 ? '+' : ''}{formatCurrency(selectedDayInfo.impact)}
                </p>
                <p className={`text-xs ${selectedDayInfo.impact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({selectedDayInfo.impactPct >= 0 ? '+' : ''}{selectedDayInfo.impactPct}%)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData}
              onClick={(e) => {
                if (e?.activePayload?.[0]?.payload?.dateStr) {
                  setSelectedDay(e.activePayload[0].payload.dateStr);
                }
              }}
            >
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#666' }}
                interval={chartData.length > 15 ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                yAxisId="sales"
                orientation="left"
                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                tick={{ fontSize: 10, fill: '#666' }}
                width={60}
              />
              <YAxis 
                yAxisId="temp"
                orientation="right"
                domain={[10, 30]}
                tickFormatter={(v) => `${v}°C`}
                tick={{ fontSize: 10, fill: '#f97316' }}
                width={45}
              />
              
              {/* Reference line for average */}
              <ReferenceLine 
                yAxisId="sales" 
                y={chartData[0]?.avgSales || 0} 
                stroke="#9ca3af" 
                strokeDasharray="5 5"
                label={{ value: 'Promedio', fontSize: 10, fill: '#9ca3af', position: 'insideTopLeft' }}
              />
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl border text-sm min-w-[200px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <span className="text-2xl">{data?.weatherEmoji}</span>
                        <div>
                          <p className="font-bold text-gray-800 capitalize">{data?.fullDate}</p>
                          <p className="text-xs text-gray-500">{data?.tempMin}°C - {data?.tempMax}°C</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="flex justify-between">
                          <span className="text-gray-500">💰 Venta:</span>
                          <span className="font-bold">{formatCurrency(data?.sales)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-500">🌡️ Temp:</span>
                          <span className="font-bold text-orange-500">{data?.temperature}°C</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-500">🌧️ Lluvia:</span>
                          <span className="font-semibold">{data?.precipitation}mm</span>
                        </p>
                        <hr className="my-2" />
                        <p className={`flex justify-between font-bold ${data?.impact >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{data?.impact >= 0 ? '📈 Ganancia:' : '📉 Pérdida:'}</span>
                          <span>{data?.impact >= 0 ? '+' : ''}{formatCurrency(data?.impact)}</span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              
              {/* Sales bars with weather-colored */}
              <Bar 
                yAxisId="sales"
                dataKey="sales" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.weatherColor}
                    opacity={selectedDay === entry.dateStr ? 1 : 0.7}
                    stroke={selectedDay === entry.dateStr ? '#1f2937' : 'none'}
                    strokeWidth={selectedDay === entry.dateStr ? 2 : 0}
                  />
                ))}
              </Bar>
              
              {/* Temperature line */}
              <Area 
                yAxisId="temp"
                type="monotone" 
                dataKey="temperature" 
                stroke="#f97316" 
                strokeWidth={2.5}
                fill="url(#tempGradient)"
                dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-gray-600">☀️ Día Soleado</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-600">🌧️ Día Lluvioso</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <span className="text-gray-600">⛅ Día Nublado</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-orange-500 rounded" />
            <span className="text-gray-600">🌡️ Temperatura</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-gray-400 rounded border-dashed border border-gray-400" />
            <span className="text-gray-600">📊 Promedio</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}