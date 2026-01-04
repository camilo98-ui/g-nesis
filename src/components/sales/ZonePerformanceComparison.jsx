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
  const [isExpanded, setIsExpanded] = React.useState(false);
  
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
    queryKey: ['zoneSales', zone, monthStart, monthEnd],
    queryFn: async () => {
      const sales = [];
      for (const store of zoneStores) {
        const storeSales = await base44.entities.DailySales.filter({ 
          store_id: store.code 
        });
        
        // Filtrar solo ventas del mes retail actual
        const monthSales = storeSales.filter(s => {
          const saleDate = s.date?.split('T')[0] || s.date;
          return saleDate >= monthStart && saleDate <= monthEnd;
        });
        
        if (monthSales.length > 0) {
          const total = monthSales.reduce((sum, s) => ({
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

  return (
    <div className="bg-gradient-to-br from-rose-50/40 via-pink-50/30 to-rose-50/40 rounded-3xl border-2 border-rose-200/30 shadow-2xl overflow-hidden">
      {/* Header clickeable */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-r from-rose-400/95 via-pink-400/95 to-rose-400/95 px-6 py-5 relative overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg"
              >
                <Trophy className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-black text-white mb-0.5">Ranking Zonal</h3>
                <p className="text-xs text-white/80 font-medium">Zona {zone} • {totalStores} tiendas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`px-4 py-2 rounded-full ${isTop3 ? 'bg-amber-400/90' : 'bg-white/20'} backdrop-blur-sm`}
              >
                <p className="text-2xl font-black text-white">#{position}</p>
              </motion.div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenido expandible */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Comparación vs Promedio de Zona */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 lg:p-6 bg-white/50 backdrop-blur-sm border-b border-rose-200/20"
            >
              <motion.div whileHover={{ scale: 1.05, y: -3 }} className={`text-center rounded-xl p-3 lg:p-4 border-2 shadow-md ${
                parseFloat(vsAvg.sales) >= 0 
                  ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300/50' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300/50'
              }`}>
                {parseFloat(vsAvg.sales) >= 0 ? <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-rose-600 mx-auto mb-1 lg:mb-2" /> : <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 mx-auto mb-1 lg:mb-2" />}
                <p className="text-[9px] lg:text-[10px] text-rose-700 mb-1 font-semibold">Ventas vs Zona</p>
                <p className={`text-lg lg:text-2xl font-black ${parseFloat(vsAvg.sales) >= 0 ? 'text-rose-900' : 'text-red-900'}`}>
                  {parseFloat(vsAvg.sales) >= 0 ? '+' : ''}{vsAvg.sales}%
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, y: -3 }} className={`text-center rounded-xl p-3 lg:p-4 border-2 shadow-md ${
                parseFloat(vsAvg.transactions) >= 0 
                  ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300/50' 
                  : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300/50'
              }`}>
                {parseFloat(vsAvg.transactions) >= 0 ? <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-rose-600 mx-auto mb-1 lg:mb-2" /> : <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600 mx-auto mb-1 lg:mb-2" />}
                <p className="text-[9px] lg:text-[10px] text-rose-700 mb-1 font-semibold">Tráfico vs Zona</p>
                <p className={`text-lg lg:text-2xl font-black ${parseFloat(vsAvg.transactions) >= 0 ? 'text-rose-900' : 'text-orange-900'}`}>
                  {parseFloat(vsAvg.transactions) >= 0 ? '+' : ''}{vsAvg.transactions}%
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, y: -3 }} className={`text-center rounded-xl p-3 lg:p-4 border-2 shadow-md ${
                parseFloat(vsAvg.avgTicket) >= 0 
                  ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300/50' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300/50'
              }`}>
                {parseFloat(vsAvg.avgTicket) >= 0 ? <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-rose-600 mx-auto mb-1 lg:mb-2" /> : <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 mx-auto mb-1 lg:mb-2" />}
                <p className="text-[9px] lg:text-[10px] text-rose-700 mb-1 font-semibold">Ticket vs Zona</p>
                <p className={`text-lg lg:text-2xl font-black ${parseFloat(vsAvg.avgTicket) >= 0 ? 'text-rose-900' : 'text-red-900'}`}>
                  {parseFloat(vsAvg.avgTicket) >= 0 ? '+' : ''}{vsAvg.avgTicket}%
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05, y: -3 }} className={`text-center rounded-xl p-3 lg:p-4 border-2 shadow-md ${
                parseFloat(vsAvg.suggested) >= 0 
                  ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300/50' 
                  : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300/50'
              }`}>
                {parseFloat(vsAvg.suggested) >= 0 ? <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-rose-600 mx-auto mb-1 lg:mb-2" /> : <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 mx-auto mb-1 lg:mb-2" />}
                <p className="text-[9px] lg:text-[10px] text-rose-700 mb-1 font-semibold">Sugeridos vs Zona</p>
                <p className={`text-lg lg:text-2xl font-black ${parseFloat(vsAvg.suggested) >= 0 ? 'text-rose-900' : 'text-red-900'}`}>
                  {parseFloat(vsAvg.suggested) >= 0 ? '+' : ''}{vsAvg.suggested}%
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
            >
              {/* Radar comparativo */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-rose-200/40 shadow-lg">
                <h4 className="text-xs lg:text-sm font-black text-rose-900 mb-3 lg:mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 lg:w-5 lg:h-5 text-rose-500" />
                  Performance vs Promedio Zona
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <defs>
                      <linearGradient id="radarCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#fda4af" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="radarZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fecdd3" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#ffe4e6" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#fecdd3" strokeWidth={1.5} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#be123c', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#fb7185', fontSize: 9 }} />
                    <Radar name="Tu Tienda" dataKey="tuTienda" stroke="#fb7185" strokeWidth={3} fill="url(#radarCurrent)" />
                    <Radar name="Promedio Zona" dataKey="promedio" stroke="#fecdd3" strokeWidth={2} fill="url(#radarZone)" strokeDasharray="5 5" />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-center text-rose-600 mt-2">Posición #{position} de {totalStores} en {zone}</p>
              </div>

              {/* Top 3 Tiendas */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 lg:p-5 border border-rose-200/40 shadow-lg">
                <h4 className="text-xs lg:text-sm font-black text-rose-900 mb-3 lg:mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
                  Top 3 Tiendas de {zone}
                </h4>
                <div className="space-y-3">
                  {top3.map((store, idx) => {
                    const isCurrentStore = store.storeCode === storeId;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <motion.div
                        key={store.storeCode}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.03, x: 5 }}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isCurrentStore 
                            ? 'bg-gradient-to-r from-rose-100 to-pink-100 border-rose-400 shadow-lg' 
                            : 'bg-white/50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{medals[idx]}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold truncate ${isCurrentStore ? 'text-rose-900' : 'text-slate-800'}`}>
                              {store.storeName}
                            </p>
                            <p className="text-xs text-slate-600">{formatCurrency(store.sales)}</p>
                          </div>
                        </div>
                        {isCurrentStore && (
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex-shrink-0 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs font-bold">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center">
                  {isTop3 
                    ? '🎉 ¡En el podio de la zona!' 
                    : `A ${formatCurrency(top3[2].sales - currentStoreData.sales)} de entrar al Top 3`}
                </p>
              </div>
            </motion.div>

            {/* Ranking completo de tiendas */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 lg:px-6 pb-4 lg:pb-6"
            >
              <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/70 rounded-2xl p-4 lg:p-5 border-2 border-rose-200/40 shadow-lg">
                <h4 className="text-xs lg:text-sm font-black text-slate-900 mb-3 lg:mb-4">
                  📊 Ranking Completo - Ventas del Mes
                </h4>
                <ResponsiveContainer width="100%" height={Math.max(200, allStores.length * 35)}>
                  <BarChart data={allStores} layout="vertical">
                    <defs>
                      <linearGradient id="barCurrent" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#fda4af" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="barOther" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fecdd3" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#ffe4e6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" fontSize={9} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="storeName" fontSize={10} fontWeight={600} width={100} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: '2px solid #fb7185', background: '#fff', fontSize: 11 }}
                      formatter={(v) => [formatCurrency(v), 'Ventas']}
                    />
                    <Bar dataKey="sales" radius={[0, 8, 8, 0]}>
                      {allStores.map((store, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={store.storeCode === storeId ? 'url(#barCurrent)' : 'url(#barOther)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Insights zonales */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 lg:px-6 pb-4 lg:pb-6"
            >
              <div className={`rounded-2xl p-4 border-2 ${
                isTop3 
                  ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-300' 
                  : position <= totalStores / 2
                  ? 'bg-gradient-to-r from-orange-50 to-rose-50 border-orange-300'
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
              }`}>
                <p className="text-xs font-bold mb-2 flex items-center gap-2">
                  {isTop3 ? '🎯' : position <= totalStores / 2 ? '⚠️' : '🚨'}
                  <span className={isTop3 ? 'text-rose-900' : position <= totalStores / 2 ? 'text-orange-900' : 'text-red-900'}>
                    Análisis de Posición
                  </span>
                </p>
                <p className={`text-xs leading-relaxed ${isTop3 ? 'text-rose-800' : position <= totalStores / 2 ? 'text-orange-800' : 'text-red-800'}`}>
                  {isTop3 
                    ? `Tu tienda está en el Top 3 de ${zone} con ${formatCurrency(currentStoreData.sales)}. Mantén el enfoque en ticket promedio (${parseFloat(vsAvg.avgTicket) >= 0 ? 'por encima' : 'por debajo'} del promedio en ${Math.abs(vsAvg.avgTicket)}%) y sugeridos para consolidar liderazgo.`
                    : position <= totalStores / 2
                    ? `Posición media-alta (#${position}/${totalStores}). Para subir al Top 3, necesitas ${formatCurrency(top3[2].sales - currentStoreData.sales)} más en ventas. Enfoca en ${parseFloat(vsAvg.avgTicket) < 0 ? 'mejorar ticket promedio' : 'aumentar tráfico'} para cerrar brecha.`
                    : `Posición ${position}/${totalStores} requiere acción urgente. Estás ${formatCurrency(Math.abs(currentStoreData.sales - zoneAvg.sales))} ${parseFloat(vsAvg.sales) >= 0 ? 'por encima' : 'por debajo'} del promedio. Prioriza ${parseFloat(vsAvg.transactions) < 0 ? 'recuperar tráfico con promociones' : 'mejorar conversión y ticket'}.`}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}