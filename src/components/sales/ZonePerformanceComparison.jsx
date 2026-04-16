import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Award, Target, MapPin, DollarSign, Receipt, Zap, Gift } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { STORES } from '@/components/StoreSelector';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ZonePerformanceComparison({ storeId, formatCurrency, currentDateRange, gregorianMode }) {
  const [selectedMetric, setSelectedMetric] = React.useState(null);
  
  // Determinar rango de fechas según modo gregoriano o filtro activo
  const now = new Date();
  const monthStart = gregorianMode ? startOfMonth(now) : new Date(now.getFullYear(), now.getMonth() - 1, 29);
  const monthEnd = gregorianMode ? endOfMonth(now) : new Date(now.getFullYear(), now.getMonth(), 28);
  
  const dateStart = currentDateRange?.from 
    ? format(currentDateRange.from, 'yyyy-MM-dd') 
    : format(monthStart, 'yyyy-MM-dd');
  
  const dateEnd = currentDateRange?.to 
    ? format(currentDateRange.to, 'yyyy-MM-dd') 
    : format(monthEnd, 'yyyy-MM-dd');

  // Determinar zona basada en código de tienda
  const currentStore = STORES.find(s => s.code === storeId);
  const zone = currentStore?.code.startsWith('BTA') ? 'Bogotá' : currentStore?.code.startsWith('TUNJA') ? 'Tunja' : 'Otra';
  
  // Filtrar tiendas de la misma zona
  const zoneStores = STORES.filter(s => {
    if (zone === 'Bogotá') return s.code.startsWith('BTA');
    if (zone === 'Tunja') return s.code.startsWith('TUNJA');
    return false;
  });

  // Fetch ventas de todas las tiendas de la zona
  const { data: allZoneSales = [], isLoading } = useQuery({
    queryKey: ['zoneSales', zone, dateStart, dateEnd],
    queryFn: async () => {
      const sales = [];
      for (const store of zoneStores) {
        const storeSales = await base44.entities.DailySales.filter({ 
          store_id: store.code 
        });
        
        // Intentar filtrar por rango, si no hay datos usar todo lo disponible
        let periodSales = storeSales.filter(s => {
          const saleDate = s.date?.split('T')[0] || s.date;
          return saleDate >= dateStart && saleDate <= dateEnd;
        });
        
        // Si no hay datos en el período, usar todos los registros disponibles
        if (periodSales.length === 0 && storeSales.length > 0) {
          periodSales = storeSales;
        }
        
        if (periodSales.length > 0) {
          const total = periodSales.reduce((sum, s) => ({
            sales: sum.sales + (s.total_sales || 0),
            transactions: sum.transactions + (s.total_transactions || 0),
            tickets: sum.tickets + (s.total_tickets || 0),
            suggested: sum.suggested + (s.total_suggested || 0)
          }), { sales: 0, transactions: 0, tickets: 0, suggested: 0 });
          
          sales.push({
            storeCode: store.code,
            storeName: store.displayName,
            ...total,
            avgTicket: total.transactions > 0 ? total.sales / total.transactions : 0
          });
        }
      }
      return sales;
    },
    enabled: !!storeId && zoneStores.length > 0,
    staleTime: 5 * 60 * 1000
  });

  const analysisData = useMemo(() => {
    if (!allZoneSales.length) return null;

    const currentStoreData = allZoneSales.find(s => s.storeCode === storeId) || allZoneSales[0];
    if (!currentStoreData) return null;

    // Ordenar tiendas por ventas
    const ranked = [...allZoneSales].sort((a, b) => b.sales - a.sales);
    const position = ranked.findIndex(s => s.storeCode === storeId) + 1;
    
    // Top 3 tiendas
    const top3 = ranked.slice(0, 3);
    
    // Promedio de la zona
    const zoneAvg = {
      sales: allZoneSales.reduce((s, store) => s + store.sales, 0) / allZoneSales.length,
      transactions: allZoneSales.reduce((s, store) => s + store.transactions, 0) / allZoneSales.length,
      avgTicket: allZoneSales.reduce((s, store) => s + store.avgTicket, 0) / allZoneSales.length,
      suggested: allZoneSales.reduce((s, store) => s + store.suggested, 0) / allZoneSales.length
    };

    // Comparación vs promedio
    const vsAvg = {
      sales: ((currentStoreData.sales - zoneAvg.sales) / zoneAvg.sales * 100).toFixed(1),
      transactions: ((currentStoreData.transactions - zoneAvg.transactions) / zoneAvg.transactions * 100).toFixed(1),
      avgTicket: ((currentStoreData.avgTicket - zoneAvg.avgTicket) / zoneAvg.avgTicket * 100).toFixed(1),
      suggested: ((currentStoreData.suggested - zoneAvg.suggested) / zoneAvg.suggested * 100).toFixed(1)
    };

    // Datos para radar comparativo
    const radarData = [
      { 
        metric: 'Ventas', 
        tuTienda: Math.min((currentStoreData.sales / Math.max(...allZoneSales.map(s => s.sales))) * 100, 100),
        promedio: (zoneAvg.sales / Math.max(...allZoneSales.map(s => s.sales))) * 100
      },
      { 
        metric: 'Tráfico', 
        tuTienda: Math.min((currentStoreData.transactions / Math.max(...allZoneSales.map(s => s.transactions))) * 100, 100),
        promedio: (zoneAvg.transactions / Math.max(...allZoneSales.map(s => s.transactions))) * 100
      },
      { 
        metric: 'Ticket', 
        tuTienda: Math.min((currentStoreData.avgTicket / Math.max(...allZoneSales.map(s => s.avgTicket))) * 100, 100),
        promedio: (zoneAvg.avgTicket / Math.max(...allZoneSales.map(s => s.avgTicket))) * 100
      },
      { 
        metric: 'Sugeridos', 
        tuTienda: Math.min((currentStoreData.suggested / Math.max(...allZoneSales.map(s => s.suggested))) * 100, 100),
        promedio: (zoneAvg.suggested / Math.max(...allZoneSales.map(s => s.suggested))) * 100
      }
    ];

    return {
      currentStoreData,
      position,
      totalStores: allZoneSales.length,
      top3,
      zoneAvg,
      vsAvg,
      radarData,
      allStores: ranked
    };
  }, [allZoneSales, storeId]);

  // Generar chartData con fechas formateadas para gráficas
  const chartData = useMemo(() => {
    if (!allZoneSales.length) return [];
    
    const startDate = currentDateRange?.from || monthStart;
    const endDate = currentDateRange?.to || now;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = allZoneSales.find(s => {
        const saleDate = s.date?.split('T')[0] || s.date;
        return saleDate === dayStr;
      }) || {};
      
      return {
        date: format(day, 'dd MMM', { locale: es }),
        fullDate: format(day, 'EEEE dd MMMM yyyy', { locale: es }),
        dayName: format(day, 'EEEE', { locale: es }),
        ventas: dayData.total_sales || 0,
        tickets: dayData.total_tickets || 0,
        ticketPromedio: dayData.total_transactions > 0 ? dayData.total_sales / dayData.total_transactions : 0,
        transactions: dayData.total_transactions || 0,
        suggested: dayData.total_suggested || 0
      };
    });
  }, [allZoneSales, currentDateRange, monthStart, now]);

  // Métricas disponibles - SIEMPRE se ejecuta
  const metrics = React.useMemo(() => [
    { id: 'sales', label: 'Ventas', icon: DollarSign, getValue: (s) => s.sales, format: formatCurrency },
    { id: 'ticket', label: 'Ticket', icon: Receipt, getValue: (s) => s.avgTicket, format: formatCurrency },
    { id: 'transactions', label: 'Tráfico', icon: Zap, getValue: (s) => s.transactions, format: (v) => v.toLocaleString() },
    { id: 'suggested', label: 'Sugeridos', icon: Gift, getValue: (s) => s.suggested, format: (v) => v.toLocaleString() }
  ], [formatCurrency]);

  // Datos ordenados según métrica seleccionada - SIEMPRE se ejecuta
  const rankedStores = useMemo(() => {
    if (!analysisData || !selectedMetric) return analysisData?.allStores || [];
    const metric = metrics.find(m => m.id === selectedMetric);
    if (!metric) return analysisData.allStores;
    return [...analysisData.allStores].sort((a, b) => metric.getValue(b) - metric.getValue(a));
  }, [analysisData, selectedMetric, metrics]);

  // Posición en la métrica seleccionada - SIEMPRE se ejecuta
  const currentPosition = rankedStores.findIndex(s => s.storeCode === storeId) + 1;
  const currentMetric = metrics.find(m => m.id === selectedMetric);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-rose-50/40 via-pink-50/30 to-rose-50/40 rounded-3xl border-2 border-rose-200/30 shadow-2xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400" />
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="bg-gradient-to-br from-slate-50/40 to-gray-50/40 rounded-3xl border-2 border-slate-200/30 shadow-2xl p-8 text-center">
        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">No hay datos de la zona disponibles</p>
      </div>
    );
  }

  const { currentStoreData, position, totalStores, top3, zoneAvg, vsAvg, radarData } = analysisData;
  const isTop3 = position <= 3;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-rose-200/50 shadow-xl overflow-hidden">
      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-base font-black text-white">Ranking Zonal</h3>
              <p className="text-xs text-white/80">Zona {zone} • {totalStores} tiendas</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            <p className="text-xl font-black text-white">#{selectedMetric ? currentPosition : position}</p>
          </div>
        </div>
      </div>

      {/* Botones de Métricas */}
      <div className="p-4 bg-gradient-to-br from-rose-50/50 to-pink-50/50 border-b border-rose-200/30">
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((metric) => {
            const MetricIcon = metric.icon;
            const isActive = selectedMetric === metric.id;
            const vsAvgValue = vsAvg[metric.id === 'ticket' ? 'avgTicket' : metric.id];
            const isPositive = parseFloat(vsAvgValue) >= 0;
            
            return (
              <motion.button
                key={metric.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedMetric(isActive ? null : metric.id)}
                className={`p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-white hover:bg-rose-50 text-gray-700 border-2 border-rose-200/50'
                }`}
              >
                <MetricIcon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : 'text-rose-500'}`} />
                <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{metric.label}</p>
                <p className={`text-lg font-black ${isActive ? 'text-white' : isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{vsAvgValue}%
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Contenido según selección */}
      <AnimatePresence mode="wait">
        {selectedMetric ? (
          <motion.div
            key={selectedMetric}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5"
          >
            {/* Insight Operativo */}
            <div className={`rounded-xl p-4 mb-4 ${
              currentPosition <= 3 ? 'bg-emerald-50 border-2 border-emerald-300' : 
              currentPosition <= totalStores / 2 ? 'bg-amber-50 border-2 border-amber-300' : 
              'bg-red-50 border-2 border-red-300'
            }`}>
              <p className="text-xs font-bold mb-2 flex items-center gap-2">
                {currentPosition <= 3 ? '🎯' : currentPosition <= totalStores / 2 ? '⚠️' : '🚨'}
                <span className={currentPosition <= 3 ? 'text-emerald-900' : currentPosition <= totalStores / 2 ? 'text-amber-900' : 'text-red-900'}>
                  {currentMetric.label} vs Zona - Análisis Detallado
                </span>
              </p>
              <p className={`text-sm leading-relaxed ${
                currentPosition <= 3 ? 'text-emerald-800' : 
                currentPosition <= totalStores / 2 ? 'text-amber-800' : 
                'text-red-800'
              }`}>
                {(() => {
                  const currentValue = currentMetric.getValue(currentStoreData);
                  const firstPlaceValue = currentMetric.getValue(rankedStores[0]);
                  const secondPlaceValue = rankedStores[1] ? currentMetric.getValue(rankedStores[1]) : 0;
                  const thirdPlaceValue = rankedStores[2] ? currentMetric.getValue(rankedStores[2]) : 0;
                  const gap = firstPlaceValue - currentValue;
                  const gapPercent = ((gap / firstPlaceValue) * 100).toFixed(1);
                  const avgZone = { sales: zoneAvg.sales, avgTicket: zoneAvg.avgTicket, transactions: zoneAvg.transactions, suggested: zoneAvg.suggested };
                  const avgValue = currentMetric.getValue(avgZone);
                  const vsAvgValue = parseFloat(vsAvg[currentMetric.id === 'ticket' ? 'avgTicket' : currentMetric.id]);
                  
                  if (currentPosition === 1) {
                    const advantage = currentValue - secondPlaceValue;
                    const advantagePercent = ((advantage / currentValue) * 100).toFixed(1);
                    return `🏆 ¡PRIMER LUGAR! Eres el líder de la zona con ${currentMetric.format(currentValue)}. Tienes una ventaja de ${currentMetric.format(advantage)} (${advantagePercent}%) sobre el segundo lugar (${rankedStores[1]?.storeName}: ${currentMetric.format(secondPlaceValue)}). Estás ${vsAvgValue >= 0 ? '+' : ''}${vsAvgValue}% ${vsAvgValue >= 0 ? 'sobre' : 'bajo'} el promedio zonal de ${currentMetric.format(avgValue)}. ESTRATEGIA: Mantén este liderazgo enfocándote en la consistencia diaria y protegiendo tu ventaja competitiva.`;
                  } else if (currentPosition === 2) {
                    const gapToFirst = firstPlaceValue - currentValue;
                    const gapPercent = ((gapToFirst / currentValue) * 100).toFixed(1);
                    return `🥈 SEGUNDO LUGAR con ${currentMetric.format(currentValue)}. El líder (${rankedStores[0]?.storeName}) tiene ${currentMetric.format(firstPlaceValue)}. NECESITAS GENERAR ${currentMetric.format(gapToFirst)} ADICIONALES (${gapPercent}% más) para alcanzar el primer lugar. Estás ${vsAvgValue >= 0 ? '+' : ''}${vsAvgValue}% ${vsAvgValue >= 0 ? 'sobre' : 'bajo'} el promedio de ${currentMetric.format(avgValue)}. ACCIÓN INMEDIATA: Si mantienes tu ritmo actual y aumentas ${gapPercent}% tu desempeño diario, alcanzarás el #1 en días. Analiza qué hace diferente el líder.`;
                  } else if (currentPosition === 3) {
                    const gapToFirst = firstPlaceValue - currentValue;
                    const gapToSecond = secondPlaceValue - currentValue;
                    return `🥉 TERCER LUGAR con ${currentMetric.format(currentValue)}. Estás en el podio pero NECESITAS ${currentMetric.format(gapToFirst)} ADICIONALES para el #1 (${rankedStores[0]?.storeName}: ${currentMetric.format(firstPlaceValue)}) y ${currentMetric.format(gapToSecond)} para el #2 (${rankedStores[1]?.storeName}: ${currentMetric.format(secondPlaceValue)}). Promedio zonal: ${currentMetric.format(avgValue)} (tú: ${vsAvgValue >= 0 ? '+' : ''}${vsAvgValue}%). PLAN: Incrementa ${((gapToFirst / currentValue) * 100).toFixed(1)}% tu ${currentMetric.label.toLowerCase()} para alcanzar el liderazgo.`;
                  } else if (currentPosition <= totalStores / 2) {
                    const gapToThird = thirdPlaceValue - currentValue;
                    const gapToFirst = firstPlaceValue - currentValue;
                    return `⚠️ POSICIÓN ${currentPosition} de ${totalStores}. Tu ${currentMetric.label.toLowerCase()}: ${currentMetric.format(currentValue)}. NECESITAS ${currentMetric.format(gapToFirst)} MÁS para el #1 (${rankedStores[0]?.storeName}: ${currentMetric.format(firstPlaceValue)}). Para entrar al Top 3 necesitas ${currentMetric.format(gapToThird)} adicionales (${((gapToThird / currentValue) * 100).toFixed(1)}% de incremento). Promedio zonal: ${currentMetric.format(avgValue)} - Estás ${vsAvgValue >= 0 ? '+' : ''}${Math.abs(vsAvgValue)}% ${vsAvgValue >= 0 ? 'arriba' : 'abajo'}. META REALISTA: Aumenta ${((gapToThird / currentValue) * 100 / 7).toFixed(1)}% diario durante 7 días para alcanzar el Top 3.`;
                  } else {
                    const gapToAvg = avgValue - currentValue;
                    const gapToFirst = firstPlaceValue - currentValue;
                    const gapToThird = thirdPlaceValue - currentValue;
                    return `🚨 POSICIÓN ${currentPosition} de ${totalStores} - REQUIERE ACCIÓN URGENTE. Tu ${currentMetric.label.toLowerCase()}: ${currentMetric.format(currentValue)}. El líder tiene ${currentMetric.format(firstPlaceValue)} - NECESITAS ${currentMetric.format(gapToFirst)} ADICIONALES (${((gapToFirst / currentValue) * 100).toFixed(1)}% de incremento) para el #1. Estás ${currentMetric.format(Math.abs(gapToAvg))} ${gapToAvg >= 0 ? 'BAJO' : 'sobre'} el promedio zonal de ${currentMetric.format(avgValue)} (${vsAvgValue}%). PLAN DE RECUPERACIÓN: 1) Alcanza el promedio generando ${currentMetric.format(Math.abs(gapToAvg))} más. 2) Luego necesitas ${currentMetric.format(gapToThird - Math.abs(gapToAvg))} adicionales para el Top 3. META: Incrementa ${((Math.abs(gapToAvg) / currentValue) * 100 / 3).toFixed(1)}% diario los próximos 3 días para salir de la zona crítica.`;
                  }
                })()}
              </p>
            </div>

            {/* Ranking */}
            <ResponsiveContainer width="100%" height={Math.min(400, rankedStores.length * 40)}>
              <BarChart data={rankedStores} layout="vertical" margin={{ left: 5, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={10} tickFormatter={currentMetric.format} />
                <YAxis 
                  type="category" 
                  dataKey="storeName" 
                  fontSize={11} 
                  fontWeight={600}
                  width={90}
                  tick={(props) => {
                    const isCurrentStore = rankedStores[props.index]?.storeCode === storeId;
                    return (
                      <g transform={`translate(${props.x},${props.y})`}>
                        <text 
                          x={-8} 
                          y={0} 
                          dy={4} 
                          textAnchor="end" 
                          fill={isCurrentStore ? '#be123c' : '#64748b'}
                          fontSize={isCurrentStore ? 12 : 10}
                          fontWeight={isCurrentStore ? 900 : 600}
                        >
                          {props.payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: '2px solid #fb7185', background: '#fff', fontSize: 11 }}
                  formatter={(v) => [currentMetric.format(v), currentMetric.label]}
                />
                <Bar dataKey={selectedMetric === 'ticket' ? 'avgTicket' : selectedMetric} radius={[0, 8, 8, 0]}>
                  {rankedStores.map((store, index) => (
                    <Cell 
                      key={index} 
                      fill={store.storeCode === storeId ? '#fb7185' : '#cbd5e1'}
                      opacity={store.storeCode === storeId ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla de Ranking Detallada */}
            <div className="mt-4 space-y-2">
              {rankedStores.slice(0, 5).map((store, idx) => {
                const isCurrentStore = store.storeCode === storeId;
                const position = idx + 1;
                return (
                  <div 
                    key={store.storeCode}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isCurrentStore ? 'bg-rose-100 border-2 border-rose-300' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isCurrentStore ? 'text-rose-700' : 'text-gray-500'}`}>
                        #{position}
                      </span>
                      <span className={`text-xs font-medium ${isCurrentStore ? 'text-rose-900' : 'text-gray-700'}`}>
                        {store.storeName}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isCurrentStore ? 'text-rose-700' : 'text-gray-600'}`}>
                      {currentMetric.format(currentMetric.getValue(store))}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            <p className="text-sm text-gray-600 mb-4 text-center">
              Selecciona una métrica para ver el ranking detallado
            </p>
            
            {/* Resumen General */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl p-4 text-center">
                <p className="text-xs text-rose-700 font-bold mb-1">Posición General</p>
                <p className="text-3xl font-black text-rose-900">#{position}</p>
                <p className="text-xs text-rose-600 mt-1">de {totalStores} tiendas</p>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-700 font-bold mb-1">Ventas vs Zona</p>
                <p className={`text-3xl font-black ${parseFloat(vsAvg.sales) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {parseFloat(vsAvg.sales) >= 0 ? '+' : ''}{vsAvg.sales}%
                </p>
                <p className="text-xs text-slate-600 mt-1">{formatCurrency(currentStoreData.sales)}</p>
              </div>
            </div>

            {/* Insight General */}
            <div className={`rounded-xl p-4 ${
              isTop3 ? 'bg-emerald-50 border-2 border-emerald-300' : 
              position <= totalStores / 2 ? 'bg-amber-50 border-2 border-amber-300' : 
              'bg-red-50 border-2 border-red-300'
            }`}>
              <p className="text-xs font-bold mb-2">
                {isTop3 ? '🎯 Análisis de Liderazgo' : position <= totalStores / 2 ? '⚠️ Análisis de Oportunidad' : '🚨 Análisis Crítico - Plan de Acción'}
              </p>
              <p className={`text-sm leading-relaxed ${isTop3 ? 'text-emerald-800' : position <= totalStores / 2 ? 'text-amber-800' : 'text-red-800'}`}>
                {(() => {
                  const leader = top3[0];
                  const second = top3[1];
                  const third = top3[2];
                  const gapToLeader = leader.sales - currentStoreData.sales;
                  const gapPercent = ((gapToLeader / currentStoreData.sales) * 100).toFixed(1);
                  const vsAvgSales = parseFloat(vsAvg.sales);
                  
                  if (position === 1) {
                    const advantage = currentStoreData.sales - (second?.sales || 0);
                    const advantagePercent = ((advantage / currentStoreData.sales) * 100).toFixed(1);
                    return `🏆 ¡LÍDER DE LA ZONA ${zone.toUpperCase()}! Posición #1 de ${totalStores} tiendas. Ventas: ${formatCurrency(currentStoreData.sales)} - Tienes ${formatCurrency(advantage)} (${advantagePercent}%) de ventaja sobre el segundo lugar (${second?.storeName || 'N/A'}: ${formatCurrency(second?.sales || 0)}). Promedio zonal: ${formatCurrency(zoneAvg.sales)} - Estás +${Math.abs(vsAvgSales).toFixed(1)}% sobre el promedio. ESTRATEGIA: Protege tu liderazgo manteniendo esta diferencia. Identifica qué métricas específicas (ticket, tráfico, sugeridos) están impulsando tu éxito y refuérzalas.`;
                  } else if (position === 2) {
                    const gapToFirst = leader.sales - currentStoreData.sales;
                    const advantage = currentStoreData.sales - (third?.sales || 0);
                    return `🥈 SEGUNDO LUGAR en ${zone} (${position}/${totalStores}). Ventas actuales: ${formatCurrency(currentStoreData.sales)}. El líder (${leader.storeName}) tiene ${formatCurrency(leader.sales)}. NECESITAS VENDER ${formatCurrency(gapToFirst)} ADICIONALES (${gapPercent}% de incremento) para alcanzar el #1. Tienes ${formatCurrency(advantage)} de ventaja sobre el tercer lugar (${third?.storeName || 'N/A'}). Promedio: ${formatCurrency(zoneAvg.sales)} (${vsAvgSales >= 0 ? '+' : ''}${vsAvgSales}%). ACCIÓN: Incrementa ${(parseFloat(gapPercent) / 7).toFixed(1)}% tus ventas diarias durante 7 días para alcanzar el liderazgo.`;
                  } else if (position === 3) {
                    const gapToFirst = leader.sales - currentStoreData.sales;
                    const gapToSecond = second.sales - currentStoreData.sales;
                    return `🥉 TERCER LUGAR en ${zone} (${position}/${totalStores}). Ventas: ${formatCurrency(currentStoreData.sales)}. PARA ALCANZAR EL #1 (${leader.storeName}: ${formatCurrency(leader.sales)}) NECESITAS ${formatCurrency(gapToFirst)} MÁS (${gapPercent}% de crecimiento). Para el #2 (${second.storeName}): ${formatCurrency(gapToSecond)} adicionales. Promedio zonal: ${formatCurrency(zoneAvg.sales)} - Estás ${vsAvgSales >= 0 ? '+' : ''}${vsAvgSales}%. PLAN: Analiza las 3 métricas donde estás más débil vs los líderes y crea un plan de mejora. Necesitas crecer ${(parseFloat(gapPercent) / 14).toFixed(1)}% diario por 14 días.`;
                  } else if (position <= totalStores / 2) {
                    const gapToThird = third.sales - currentStoreData.sales;
                    const gapToFirst = leader.sales - currentStoreData.sales;
                    return `⚠️ POSICIÓN ${position} de ${totalStores} en ${zone}. Ventas: ${formatCurrency(currentStoreData.sales)}. PARA EL #1 (${leader.storeName}: ${formatCurrency(leader.sales)}) NECESITAS ${formatCurrency(gapToFirst)} ADICIONALES (${gapPercent}% más). Para entrar al Top 3 necesitas ${formatCurrency(gapToThird)} (${((gapToThird / currentStoreData.sales) * 100).toFixed(1)}% de incremento). Promedio: ${formatCurrency(zoneAvg.sales)} (${vsAvgSales >= 0 ? '+' : ''}${vsAvgSales}%). META INMEDIATA: Selecciona cada botón de métrica para identificar dónde tienes mayor brecha. PLAN: Incrementa ${((gapToThird / currentStoreData.sales) * 100 / 7).toFixed(1)}% diario por 7 días para alcanzar Top 3, luego ${((gapToFirst / currentStoreData.sales) * 100 / 14).toFixed(1)}% adicional por 14 días para el liderazgo.`;
                  } else {
                    const gapToAvg = zoneAvg.sales - currentStoreData.sales;
                    const gapToFirst = leader.sales - currentStoreData.sales;
                    const gapToThird = third.sales - currentStoreData.sales;
                    return `🚨 POSICIÓN ${position} de ${totalStores} - ZONA CRÍTICA. Ventas: ${formatCurrency(currentStoreData.sales)}. Estás ${formatCurrency(Math.abs(gapToAvg))} BAJO el promedio zonal de ${formatCurrency(zoneAvg.sales)} (${vsAvgSales}%). El líder (${leader.storeName}) tiene ${formatCurrency(leader.sales)} - BRECHA DE ${formatCurrency(gapToFirst)} (${gapPercent}%). PLAN DE RECUPERACIÓN URGENTE: FASE 1 (Días 1-5): Alcanza el promedio vendiendo ${formatCurrency(Math.abs(gapToAvg) / 5)} adicionales diarios (${((Math.abs(gapToAvg) / currentStoreData.sales) * 100 / 5).toFixed(1)}% incremento). FASE 2 (Días 6-15): Genera ${formatCurrency((gapToThird - Math.abs(gapToAvg)) / 10)} extra diarios para Top 3. FASE 3 (Días 16-30): Añade ${formatCurrency((gapToFirst - gapToThird) / 15)} diarios para el #1. Selecciona cada métrica para ver brechas específicas y crear plan de acción detallado.`;
                  }
                })()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}