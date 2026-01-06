import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Award, Target, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { STORES } from '@/components/StoreSelector';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ZonePerformanceComparison({ storeId, formatCurrency, currentDateRange }) {
  const [selectedMetric, setSelectedMetric] = React.useState(null);
  
  // Usar el rango de fechas del filtro activo
  const dateStart = currentDateRange?.from ? format(currentDateRange.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const dateEnd = currentDateRange?.to ? format(currentDateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

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
        
        // Filtrar solo ventas del rango de fechas seleccionado
        const periodSales = storeSales.filter(s => {
          const saleDate = s.date?.split('T')[0] || s.date;
          return saleDate >= dateStart && saleDate <= dateEnd;
        });
        
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

    const currentStoreData = allZoneSales.find(s => s.storeCode === storeId);
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

  const { currentStoreData, position, totalStores, top3, zoneAvg, vsAvg, radarData, allStores } = analysisData;
  const isTop3 = position <= 3;

  // Métricas disponibles
  const metrics = [
    { id: 'sales', label: 'Ventas', icon: DollarSign, getValue: (s) => s.sales, format: formatCurrency },
    { id: 'ticket', label: 'Ticket', icon: Receipt, getValue: (s) => s.avgTicket, format: formatCurrency },
    { id: 'transactions', label: 'Tráfico', icon: Zap, getValue: (s) => s.transactions, format: (v) => v.toLocaleString() },
    { id: 'suggested', label: 'Sugeridos', icon: Gift, getValue: (s) => s.suggested, format: (v) => v.toLocaleString() }
  ];

  // Datos ordenados según métrica seleccionada
  const rankedStores = useMemo(() => {
    if (!selectedMetric) return allStores;
    const metric = metrics.find(m => m.id === selectedMetric);
    return [...allStores].sort((a, b) => metric.getValue(b) - metric.getValue(a));
  }, [allStores, selectedMetric]);

  // Posición en la métrica seleccionada
  const currentPosition = rankedStores.findIndex(s => s.storeCode === storeId) + 1;
  const currentMetric = metrics.find(m => m.id === selectedMetric);

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
                  {currentMetric.label} vs Zona
                </span>
              </p>
              <p className={`text-sm leading-relaxed ${
                currentPosition <= 3 ? 'text-emerald-800' : 
                currentPosition <= totalStores / 2 ? 'text-amber-800' : 
                'text-red-800'
              }`}>
                Posición #{currentPosition} de {totalStores} en {currentMetric.label.toLowerCase()}. 
                {currentPosition <= 3 ? ` ¡Excelente! Estás en el Top 3 con ${currentMetric.format(currentMetric.getValue(currentStoreData))}. Mantén este nivel de desempeño.` :
                currentPosition <= totalStores / 2 ? ` Rendimiento medio-alto. Necesitas ${currentMetric.format(currentMetric.getValue(rankedStores[2]) - currentMetric.getValue(currentStoreData))} más para el Top 3.` :
                ` Requiere mejora urgente. Estás ${currentMetric.format(Math.abs(currentMetric.getValue(currentStoreData) - currentMetric.getValue({ sales: zoneAvg.sales, avgTicket: zoneAvg.avgTicket, transactions: zoneAvg.transactions, suggested: zoneAvg.suggested })))} ${currentMetric.getValue(currentStoreData) >= currentMetric.getValue({ sales: zoneAvg.sales, avgTicket: zoneAvg.avgTicket, transactions: zoneAvg.transactions, suggested: zoneAvg.suggested }) ? 'sobre' : 'bajo'} el promedio.`}
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
                {isTop3 ? '🎯 Excelente Desempeño' : position <= totalStores / 2 ? '⚠️ Buen Desempeño' : '🚨 Requiere Atención'}
              </p>
              <p className={`text-sm ${isTop3 ? 'text-emerald-800' : position <= totalStores / 2 ? 'text-amber-800' : 'text-red-800'}`}>
                {isTop3 
                  ? `¡Felicitaciones! Tu tienda está en el Top 3 de ${zone}. Mantén este rendimiento enfocándote en los indicadores que están por debajo del promedio.`
                  : position <= totalStores / 2
                  ? `Tu tienda tiene un desempeño medio-alto. Trabaja en mejorar las métricas que están por debajo del promedio para alcanzar el Top 3.`
                  : `Tu tienda requiere atención inmediata. Revisa cada métrica y crea un plan de acción para mejorar los indicadores críticos.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}