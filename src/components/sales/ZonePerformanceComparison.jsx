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

            {/* Gráfica comparativa sofisticada de ventas por tienda */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 lg:p-6"
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-rose-200/40 shadow-lg">
                <h4 className="text-sm font-black text-rose-900 mb-4 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-rose-500" />
                  Comparación de Ventas - Todas las Tiendas de {zone}
                </h4>
                
                <ResponsiveContainer width="100%" height={Math.max(300, allStores.length * 50)}>
                  <BarChart data={allStores} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <defs>
                      <linearGradient id="barCurrentStore" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                        <stop offset="100%" stopColor="#fda4af" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barOtherStore" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      fontSize={11} 
                      fontWeight={600}
                      tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                      stroke="#9f1239"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="storeName" 
                      fontSize={12} 
                      fontWeight={700}
                      width={120}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const store = allStores.find(s => s.storeName === payload.value);
                        const isCurrentStore = store?.storeCode === storeId;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text 
                              x={-10} 
                              y={0} 
                              dy={4} 
                              textAnchor="end" 
                              fill={isCurrentStore ? '#be123c' : '#64748b'}
                              fontSize={isCurrentStore ? 13 : 11}
                              fontWeight={isCurrentStore ? 900 : 600}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 16, 
                        border: '2px solid #fb7185', 
                        background: 'linear-gradient(135deg, #fff 0%, #ffe4e6 100%)',
                        boxShadow: '0 10px 40px rgba(251,113,133,0.3)',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                      formatter={(v, name, props) => {
                        const store = props.payload;
                        return [
                          <div key="tooltip-content" className="space-y-1">
                            <div className="font-black text-rose-900">{formatCurrency(v)}</div>
                            <div className="text-[10px] text-slate-600">
                              Tickets: {store.tickets?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              Transacciones: {store.transactions?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              Ticket Prom: {formatCurrency(store.avgTicket)}
                            </div>
                          </div>,
                          ''
                        ];
                      }}
                      labelFormatter={(label) => {
                        const store = allStores.find(s => s.storeName === label);
                        const pos = allStores.indexOf(store) + 1;
                        return (
                          <div className="font-black text-rose-700 mb-1">
                            {pos === 1 && '🥇 '}
                            {pos === 2 && '🥈 '}
                            {pos === 3 && '🥉 '}
                            {label}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="sales" radius={[0, 12, 12, 0]}>
                      {allStores.map((store, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={store.storeCode === storeId ? 'url(#barCurrentStore)' : 'url(#barOtherStore)'}
                          stroke={store.storeCode === storeId ? '#fb7185' : 'transparent'}
                          strokeWidth={store.storeCode === storeId ? 3 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Leyenda y estadísticas clave */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-xl p-3 border-2 border-rose-300">
                    <p className="text-[10px] text-rose-700 font-bold mb-1">Tu Posición</p>
                    <p className="text-2xl font-black text-rose-900">#{position}</p>
                    <p className="text-[9px] text-rose-600 mt-1">de {totalStores} tiendas</p>
                  </div>
                  <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl p-3 border-2 border-slate-300">
                    <p className="text-[10px] text-slate-700 font-bold mb-1">Promedio Zona</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(zoneAvg.sales)}</p>
                    <p className={`text-[9px] font-bold mt-1 ${parseFloat(vsAvg.sales) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {parseFloat(vsAvg.sales) >= 0 ? '↑' : '↓'} {parseFloat(vsAvg.sales) >= 0 ? '+' : ''}{vsAvg.sales}% vs zona
                    </p>
                  </div>
                </div>
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
                  📊 Ranking Completo - Período Seleccionado
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