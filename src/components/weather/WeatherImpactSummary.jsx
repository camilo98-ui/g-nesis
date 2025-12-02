import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, CloudRain, Sun, Cloud, Calendar, Target, AlertTriangle, CheckCircle2, Zap, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Lógica corregida
const getWeatherType = (code, precipitation) => {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code >= 51) return 'rainy';
  if (precipitation > 5) return 'rainy';
  if (precipitation > 1) return 'cloudy';
  return 'sunny';
};

// Animated counter
const AnimatedNumber = ({ value, format: formatFn, duration = 1 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span>{formatFn ? formatFn(displayValue) : Math.round(displayValue)}</span>;
};

export default function WeatherImpactSummary({ weatherData, dailySales = [], dateRange, stats, formatCurrency }) {
  
  // Análisis detallado por tipo de clima con lógica corregida
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
      
      const type = getWeatherType(weatherCode, precipitation);
      
      summary[type].days++;
      summary[type].totalSales += sales;
      if (sales > 0) {
        summary[type].impact += (sales - avgSales);
        summary[type].dates.push({
          date: format(parseISO(date), 'EEE dd MMM', { locale: es }),
          fullDate: format(parseISO(date), "EEEE dd 'de' MMMM", { locale: es }),
          sales,
          diff: sales - avgSales,
          pct: ((sales - avgSales) / avgSales * 100)
        });
      }
    });
    
    return [
      { 
        type: 'sunny', 
        label: 'Soleados', 
        emoji: '☀️', 
        color: '#f59e0b',
        gradient: 'from-amber-400 to-yellow-500',
        bgLight: 'from-amber-50 to-yellow-100',
        ...summary.sunny,
        avgSales: summary.sunny.days > 0 ? summary.sunny.totalSales / Math.max(summary.sunny.dates.length, 1) : 0
      },
      { 
        type: 'cloudy', 
        label: 'Nublados', 
        emoji: '⛅', 
        color: '#6b7280',
        gradient: 'from-gray-400 to-slate-500',
        bgLight: 'from-gray-50 to-slate-100',
        ...summary.cloudy,
        avgSales: summary.cloudy.days > 0 ? summary.cloudy.totalSales / Math.max(summary.cloudy.dates.length, 1) : 0
      },
      { 
        type: 'rainy', 
        label: 'Lluviosos', 
        emoji: '🌧️', 
        color: '#3b82f6',
        gradient: 'from-blue-400 to-cyan-500',
        bgLight: 'from-blue-50 to-sky-100',
        ...summary.rainy,
        avgSales: summary.rainy.days > 0 ? summary.rainy.totalSales / Math.max(summary.rainy.dates.length, 1) : 0
      },
    ];
  }, [weatherData, dailySales]);

  // Top días con mayor/menor impacto
  const topDays = useMemo(() => {
    const allDays = weatherBreakdown.flatMap(w => w.dates);
    const sorted = [...allDays].sort((a, b) => b.diff - a.diff);
    return {
      best: sorted.filter(d => d.diff > 0).slice(0, 5),
      worst: sorted.filter(d => d.diff < 0).slice(-5).reverse()
    };
  }, [weatherBreakdown]);

  // Datos para gauge chart
  const gaugeData = useMemo(() => {
    const totalDays = weatherBreakdown.reduce((sum, w) => sum + w.days, 0);
    return weatherBreakdown.map(w => ({
      name: w.emoji,
      value: totalDays > 0 ? Math.round((w.days / totalDays) * 100) : 0,
      fill: w.color
    }));
  }, [weatherBreakdown]);

  // Calcular totales
  const totals = useMemo(() => {
    const totalGain = weatherBreakdown.reduce((sum, w) => sum + Math.max(w.impact, 0), 0);
    const totalLoss = weatherBreakdown.reduce((sum, w) => sum + Math.min(w.impact, 0), 0);
    const netImpact = totalGain + totalLoss;
    const totalDays = weatherBreakdown.reduce((sum, w) => sum + w.days, 0);
    const avgGeneral = dailySales.filter(s => s.total_sales > 0).reduce((sum, s) => sum + (s.total_sales || 0), 0) / Math.max(dailySales.filter(s => s.total_sales > 0).length, 1);
    
    return { totalGain, totalLoss, netImpact, totalDays, avgGeneral };
  }, [weatherBreakdown, dailySales]);

  if (!stats || !weatherBreakdown.length) {
    return (
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="p-12 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-500 text-lg">No hay datos suficientes para el análisis económico</p>
          <p className="text-gray-400 text-sm mt-2">Selecciona un período con datos de ventas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Impact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={`col-span-2 rounded-3xl p-6 shadow-xl ${
            totals.netImpact >= 0 
              ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
              : 'bg-gradient-to-br from-red-500 to-rose-600'
          } text-white relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: totals.netImpact >= 0 ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"
              >
                {totals.netImpact >= 0 ? (
                  <TrendingUp className="w-8 h-8" />
                ) : (
                  <TrendingDown className="w-8 h-8" />
                )}
              </motion.div>
              <div>
                <p className="text-white/80 text-sm font-medium">Impacto Neto del Clima</p>
                <p className="text-3xl font-black">
                  {totals.netImpact >= 0 ? '+' : ''}
                  <AnimatedNumber value={totals.netImpact} format={formatCurrency} />
                </p>
              </div>
            </div>
            <p className="text-white/70 text-sm mt-3">
              {totals.netImpact >= 0 
                ? '✨ El clima trabajó a tu favor este período' 
                : '⚡ El clima afectó tus ventas - considera estrategias de mitigación'}
            </p>
          </div>
        </motion.div>

        {/* Gain Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-3xl p-5 shadow-lg border border-amber-200"
        >
          <motion.span 
            className="text-4xl block mb-2"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ☀️
          </motion.span>
          <p className="text-xs text-amber-700 font-medium mb-1">Ganancia por buen clima</p>
          <p className="text-2xl font-black text-amber-800">
            +<AnimatedNumber value={totals.totalGain} format={formatCurrency} />
          </p>
          <p className="text-xs text-amber-600 mt-2">
            {weatherBreakdown.find(w => w.type === 'sunny')?.days || 0} días soleados
          </p>
        </motion.div>

        {/* Loss Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-3xl p-5 shadow-lg border border-blue-200"
        >
          <motion.span 
            className="text-4xl block mb-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🌧️
          </motion.span>
          <p className="text-xs text-blue-700 font-medium mb-1">Pérdida por mal clima</p>
          <p className="text-2xl font-black text-blue-800">
            <AnimatedNumber value={Math.abs(totals.totalLoss)} format={formatCurrency} />
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {weatherBreakdown.find(w => w.type === 'rainy')?.days || 0} días lluviosos
          </p>
        </motion.div>
      </div>

      {/* Weather Breakdown Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {weatherBreakdown.map((weather, idx) => (
          <motion.div
            key={weather.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className={`bg-gradient-to-br ${weather.bgLight} rounded-2xl p-5 shadow-lg border relative overflow-hidden`}
          >
            <div className="absolute -right-4 -top-4 opacity-20">
              <span className="text-8xl">{weather.emoji}</span>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.span 
                    className="text-3xl"
                    animate={
                      weather.type === 'sunny' ? { rotate: [0, 10, -10, 0] } :
                      weather.type === 'rainy' ? { y: [0, -3, 0] } :
                      { x: [-2, 2, -2] }
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {weather.emoji}
                  </motion.span>
                  <div>
                    <p className="font-bold text-gray-800">{weather.label}</p>
                    <p className="text-xs text-gray-500">{weather.days} días</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  weather.impact >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {weather.impact >= 0 ? '+' : ''}{((weather.avgSales - totals.avgGeneral) / totals.avgGeneral * 100).toFixed(1)}%
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Venta promedio</span>
                  <span className="font-bold text-gray-800">{formatCurrency(weather.avgSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Impacto total</span>
                  <span className={`font-bold ${weather.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weather.impact >= 0 ? '+' : ''}{formatCurrency(weather.impact)}
                  </span>
                </div>
                
                {/* Mini progress bar */}
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(weather.days / totals.totalDays) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${weather.gradient}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radial Chart */}
        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          <CardContent className="p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-violet-500" />
              Distribución Climática del Período
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="30%" 
                  outerRadius="90%" 
                  data={gaugeData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Legend 
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value, entry) => (
                      <span className="text-sm text-gray-600">{value} {entry.payload.value}%</span>
                    )}
                  />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Comparison Chart */}
        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          <CardContent className="p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Comparativo de Ventas por Clima
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherBreakdown.filter(w => w.avgSales > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="emoji" tick={{ fontSize: 20 }} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(v) => formatCurrency(v)}
                    labelFormatter={(label) => weatherBreakdown.find(w => w.emoji === label)?.label}
                  />
                  <Bar dataKey="avgSales" name="Venta Promedio" radius={[8, 8, 0, 0]}>
                    {weatherBreakdown.filter(w => w.avgSales > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Days */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Best Days */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-6 text-white shadow-xl"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            🏆 Top 5 Mejores Días
          </h3>
          <div className="space-y-3">
            {topDays.best.length > 0 ? topDays.best.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 5 }}
                className="flex items-center justify-between bg-white/15 backdrop-blur rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium capitalize">{day.fullDate}</p>
                    <p className="text-xs text-white/70">Venta: {formatCurrency(day.sales)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">+{formatCurrency(day.diff)}</p>
                  <p className="text-xs text-white/70">+{day.pct.toFixed(1)}%</p>
                </div>
              </motion.div>
            )) : (
              <p className="text-white/70 text-center py-4">No hay días con ganancia registrados</p>
            )}
          </div>
        </motion.div>

        {/* Worst Days */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Top 5 Días con Pérdida
          </h3>
          <div className="space-y-3">
            {topDays.worst.length > 0 ? topDays.worst.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: -5 }}
                className="flex items-center justify-between bg-white/15 backdrop-blur rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium capitalize">{day.fullDate}</p>
                    <p className="text-xs text-white/70">Venta: {formatCurrency(day.sales)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(day.diff)}</p>
                  <p className="text-xs text-white/70">{day.pct.toFixed(1)}%</p>
                </div>
              </motion.div>
            )) : (
              <p className="text-white/70 text-center py-4">No hay días con pérdida registrados</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Strategic Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6bTAtMTB2Nmg2di02aC02em0xMCAyMHY2aDZ2LTZoLTZ6bTAtMTB2Nmg2di02aC02em0wLTEwdjZoNnYtNmgtNnptMTAgMjB2Nmg2di02aC02em0wLTEwdjZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6 text-yellow-400" />
            </motion.div>
            Estrategias Recomendadas
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <span className="text-3xl mb-3 block">☀️</span>
              <h4 className="font-bold mb-2">Días Soleados</h4>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Combos familiares y porciones grandes</li>
                <li>• Promociones de 2x1 en horas pico</li>
                <li>• Activaciones en zonas de alto tráfico</li>
              </ul>
              <p className="text-xs text-amber-400 mt-3">
                💰 Potencial: +{Math.abs(weatherBreakdown.find(w => w.type === 'sunny')?.impact || 0) > 0 ? formatCurrency(weatherBreakdown.find(w => w.type === 'sunny')?.impact || 0) : '15%'} en ventas
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <span className="text-3xl mb-3 block">🌧️</span>
              <h4 className="font-bold mb-2">Días Lluviosos</h4>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Promoción "Día Lluvioso" con descuento</li>
                <li>• Potenciar delivery y pedidos para llevar</li>
                <li>• Ofertas en productos calientes</li>
              </ul>
              <p className="text-xs text-blue-400 mt-3">
                🛡️ Mitiga hasta el {Math.abs(stats?.impactPercentage || 20).toFixed(0)}% de pérdida
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4"
            >
              <span className="text-3xl mb-3 block">📊</span>
              <h4 className="font-bold mb-2">Planificación</h4>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Revisar pronóstico semanal</li>
                <li>• Ajustar inventario según clima</li>
                <li>• Programar campañas con anticipación</li>
              </ul>
              <p className="text-xs text-emerald-400 mt-3">
                📈 Optimiza recursos y maximiza ventas
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}