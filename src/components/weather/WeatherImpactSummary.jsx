import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, CloudRain, Sun, Calendar, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WeatherImpactSummary({ weatherData, dailySales = [], dateRange, stats, formatCurrency }) {
  
  // Análisis detallado por tipo de clima
  const weatherBreakdown = useMemo(() => {
    if (!weatherData?.history?.time || !dailySales.length) return [];
    
    const salesByDate = {};
    dailySales.forEach(s => {
      const dateKey = s.date?.split('T')[0] || s.date;
      salesByDate[dateKey] = s.total_sales || 0;
    });
    
    const validSales = dailySales.filter(s => s.total_sales > 0);
    const avgSales = validSales.length > 0 
      ? validSales.reduce((sum, s) => sum + (s.total_sales || 0), 0) / validSales.length 
      : 0;
    
    const summary = {
      sunny: { days: 0, totalSales: 0, impact: 0, dates: [] },
      rainy: { days: 0, totalSales: 0, impact: 0, dates: [] },
      cloudy: { days: 0, totalSales: 0, impact: 0, dates: [] }
    };
    
    weatherData.history.time.forEach((date, idx) => {
      const weatherCode = weatherData.history.weathercode?.[idx] || 0;
      const precipitation = weatherData.history.precipitation_sum?.[idx] || 0;
      const sales = salesByDate[date] || 0;
      
      let type = 'cloudy';
      if (precipitation > 5 || (weatherCode >= 51 && weatherCode <= 99)) type = 'rainy';
      else if (weatherCode <= 2 && precipitation < 1) type = 'sunny';
      
      summary[type].days++;
      summary[type].totalSales += sales;
      if (sales > 0) {
        summary[type].impact += (sales - avgSales);
        summary[type].dates.push({
          date: format(parseISO(date), 'dd MMM', { locale: es }),
          sales,
          diff: sales - avgSales
        });
      }
    });
    
    return [
      { 
        type: 'sunny', 
        label: 'Días Soleados', 
        emoji: '☀️', 
        color: '#f59e0b',
        ...summary.sunny,
        avgSales: summary.sunny.days > 0 ? summary.sunny.totalSales / summary.sunny.days : 0
      },
      { 
        type: 'cloudy', 
        label: 'Días Nublados', 
        emoji: '⛅', 
        color: '#9ca3af',
        ...summary.cloudy,
        avgSales: summary.cloudy.days > 0 ? summary.cloudy.totalSales / summary.cloudy.days : 0
      },
      { 
        type: 'rainy', 
        label: 'Días Lluviosos', 
        emoji: '🌧️', 
        color: '#3b82f6',
        ...summary.rainy,
        avgSales: summary.rainy.days > 0 ? summary.rainy.totalSales / summary.rainy.days : 0
      },
    ];
  }, [weatherData, dailySales]);

  // Datos para gráfica de pastel
  const pieData = weatherBreakdown.map(w => ({
    name: w.label,
    value: w.days,
    color: w.color
  })).filter(d => d.value > 0);

  // Datos para gráfica de barras comparativa
  const barData = weatherBreakdown.filter(w => w.avgSales > 0).map(w => ({
    name: w.emoji,
    'Venta Promedio': w.avgSales,
    color: w.color
  }));

  // Top días con mayor/menor impacto
  const topDays = useMemo(() => {
    const allDays = weatherBreakdown.flatMap(w => w.dates);
    const sorted = [...allDays].sort((a, b) => b.diff - a.diff);
    return {
      best: sorted.slice(0, 3),
      worst: sorted.slice(-3).reverse()
    };
  }, [weatherBreakdown]);

  if (!stats) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos suficientes para el análisis económico</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Impact Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 ${stats.totalImpact >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stats.totalImpact >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
              {stats.totalImpact >= 0 ? (
                <TrendingUp className="w-7 h-7 text-green-700" />
              ) : (
                <TrendingDown className="w-7 h-7 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Impacto Total del Clima</p>
              <p className={`text-2xl font-bold ${stats.totalImpact >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {stats.totalImpact >= 0 ? '+' : ''}{formatCurrency(stats.totalImpact)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.totalImpact >= 0 
              ? '✅ El clima favoreció las ventas en este período' 
              : '⚠️ El clima afectó negativamente las ventas'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-200 flex items-center justify-center">
              <Sun className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ganancia en Días Soleados</p>
              <p className="text-2xl font-bold text-amber-700">
                +{formatCurrency(weatherBreakdown.find(w => w.type === 'sunny')?.impact || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.sunnyDays} días con sol = {stats.sunnyBoost >= 0 ? '+' : ''}{stats.sunnyBoost.toFixed(1)}% vs promedio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-200 flex items-center justify-center">
              <CloudRain className="w-7 h-7 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pérdida en Días Lluviosos</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(weatherBreakdown.find(w => w.type === 'rainy')?.impact || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.rainyDays} días con lluvia = {stats.impactPercentage.toFixed(1)}% vs promedio
          </p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribución de días */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              Distribución de Días por Clima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${value} días`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativa de ventas */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Venta Promedio por Tipo de Clima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <YAxis dataKey="name" type="category" width={40} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="Venta Promedio" radius={[0, 8, 8, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Days */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mejores días */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Top 3 Mejores Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDays.best.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-white rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-green-600">#{i + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800">{day.date}</p>
                      <p className="text-xs text-gray-500">Venta: {formatCurrency(day.sales)}</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold">+{formatCurrency(day.diff)}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peores días */}
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Top 3 Días con Mayor Pérdida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDays.worst.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between bg-white rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-red-500">#{i + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800">{day.date}</p>
                      <p className="text-xs text-gray-500">Venta: {formatCurrency(day.sales)}</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-bold">{formatCurrency(day.diff)}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Recommendation */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl border-0">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            💡 Recomendaciones Basadas en el Análisis
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="font-medium mb-2">☀️ Días Soleados</h4>
              <p className="text-sm text-white/80">
                Aprovecha para promociones de helados especiales y combos familiares. 
                Las ventas aumentan ~{Math.abs(stats.sunnyBoost).toFixed(0)}% en estos días.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="font-medium mb-2">🌧️ Días Lluviosos</h4>
              <p className="text-sm text-white/80">
                Considera promociones de "día lluvioso" para incentivar ventas. 
                Posible pérdida: ~{formatCurrency(Math.abs(weatherBreakdown.find(w => w.type === 'rainy')?.impact || 0) / Math.max(stats.rainyDays, 1))} por día.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}