import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Thermometer, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesVsTemperatureChart({ weatherData, dailySales = [], loading }) {
  // Combinar datos de clima y ventas
  const chartData = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    return weatherData.history.time.slice(-14).map((date, idx) => {
      const actualIdx = weatherData.history.time.length - 14 + idx;
      const temp = weatherData.history.temperature_2m_mean?.[actualIdx] || 0;
      const sales = salesByDate[date] || 0;
      
      return {
        date: format(parseISO(date), 'dd', { locale: es }),
        fullDate: format(parseISO(date), 'EEEE dd MMM', { locale: es }),
        temperature: Math.round(temp * 10) / 10,
        sales,
        weatherCode: weatherData.history.weathercode?.[actualIdx]
      };
    });
  }, [weatherData, dailySales]);

  // Calcular insight automático
  const insight = useMemo(() => {
    if (chartData.length < 3) return null;
    
    const dataWithSales = chartData.filter(d => d.sales > 0);
    if (dataWithSales.length < 2) return 'No hay suficientes datos de ventas para analizar la correlación.';
    
    // Encontrar cambios significativos
    let maxIncrease = { tempChange: 0, salesChange: 0, from: null, to: null };
    
    for (let i = 1; i < dataWithSales.length; i++) {
      const tempChange = dataWithSales[i].temperature - dataWithSales[i-1].temperature;
      const salesChange = ((dataWithSales[i].sales - dataWithSales[i-1].sales) / dataWithSales[i-1].sales) * 100;
      
      if (tempChange > 0 && salesChange > maxIncrease.salesChange) {
        maxIncrease = {
          tempChange: Math.round(tempChange * 10) / 10,
          salesChange: Math.round(salesChange),
          from: dataWithSales[i-1],
          to: dataWithSales[i]
        };
      }
    }
    
    // Calcular correlación general
    const avgTempHigh = dataWithSales.filter(d => d.temperature >= 20);
    const avgTempLow = dataWithSales.filter(d => d.temperature < 20);
    
    const avgSalesHigh = avgTempHigh.length ? avgTempHigh.reduce((s, d) => s + d.sales, 0) / avgTempHigh.length : 0;
    const avgSalesLow = avgTempLow.length ? avgTempLow.reduce((s, d) => s + d.sales, 0) / avgTempLow.length : 0;
    
    let correlationText = '';
    if (avgSalesHigh > avgSalesLow && avgSalesLow > 0) {
      const diff = ((avgSalesHigh - avgSalesLow) / avgSalesLow * 100).toFixed(0);
      correlationText = `En promedio, los días cálidos (≥20°C) generan ${diff}% más ventas que los días frescos.`;
    }
    
    if (maxIncrease.tempChange > 0 && maxIncrease.salesChange > 5) {
      return `📈 Cuando la temperatura subió de ${maxIncrease.from?.temperature}°C a ${maxIncrease.to?.temperature}°C, las ventas aumentaron un ${maxIncrease.salesChange}%. ${correlationText}`;
    }
    
    return correlationText || 'La temperatura tiene un impacto moderado en las ventas de esta tienda.';
  }, [chartData]);

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <TrendingUp className="w-4 h-4 text-pink-500" />
          </motion.div>
          Ventas vs Temperatura
          <span className="text-[10px] bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full ml-2">
            Últimos 14 días
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                yAxisId="sales"
                orientation="left"
                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                tick={{ fontSize: 10, fill: '#ec4899' }}
                axisLine={{ stroke: '#ec4899' }}
                label={{ value: 'Ventas', angle: -90, position: 'insideLeft', fill: '#ec4899', fontSize: 11 }}
              />
              <YAxis 
                yAxisId="temp"
                orientation="right"
                domain={[10, 30]}
                tickFormatter={(v) => `${v}°C`}
                tick={{ fontSize: 10, fill: '#0ea5e9' }}
                axisLine={{ stroke: '#0ea5e9' }}
                label={{ value: 'Temp', angle: 90, position: 'insideRight', fill: '#0ea5e9', fontSize: 11 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                      <p className="font-bold text-gray-800 mb-2 capitalize">{data?.fullDate}</p>
                      <div className="space-y-1">
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pink-400" />
                          <span className="text-gray-500">Ventas:</span>
                          <span className="font-bold text-pink-600">
                            ${(data?.sales / 1000000).toFixed(2)}M
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span className="text-gray-500">Temperatura:</span>
                          <span className="font-bold text-sky-600">{data?.temperature}°C</span>
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => value === 'sales' ? 'Ventas' : 'Temperatura'}
              />
              <Area 
                yAxisId="sales"
                type="monotone" 
                dataKey="sales" 
                fill="url(#salesGrad)" 
                stroke="#ec4899" 
                strokeWidth={2}
                name="sales"
              />
              <Line 
                yAxisId="temp"
                type="monotone" 
                dataKey="temperature" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#0ea5e9' }}
                name="temperature"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda visual */}
        <div className="flex justify-center gap-6 mt-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-gradient-to-t from-pink-100 to-pink-400" />
            <span className="text-gray-600">Área rosa = <strong>Ventas del día</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-sky-500 rounded" />
            <span className="text-gray-600">Línea azul = <strong>Temperatura °C</strong></span>
          </div>
        </div>

        {/* Insight automático */}
        {insight && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-50 to-sky-50 rounded-xl p-4 border border-pink-100"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-bold text-pink-600">📊 Análisis:</span> {insight}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}