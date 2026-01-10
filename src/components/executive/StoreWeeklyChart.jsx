import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Cell, LineChart, Line } from 'recharts';
import { ArrowUpDown, X, TrendingUp, Download } from 'lucide-react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export default function StoreWeeklyChart({ storesAnalysis, allDailySales, dateRange, formatCurrency, formatShort }) {
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortBy, setSortBy] = useState('compliance'); // 'compliance' o 'sales'
  const [selectedStore, setSelectedStore] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Obtener colores profesionales según cumplimiento
  const getBarColor = (compliance) => {
    if (compliance >= 100) return { main: '#10b981', light: '#34d399', dark: '#059669' }; // Verde éxito
    if (compliance >= 85) return { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' }; // Azul en meta
    if (compliance >= 70) return { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' }; // Ámbar alerta
    return { main: '#ef4444', light: '#f87171', dark: '#dc2626' }; // Rojo crítico
  };

  // Ordenar tiendas por cumplimiento o ventas
  const chartData = useMemo(() => {
    const data = storesAnalysis
      .filter(s => s.hasData)
      .map(s => ({
        name: s.name.substring(0, 10),
        fullName: s.name,
        code: s.code,
        venta: s.weekTotalSales / 1000000,
        presupuesto: s.weeklyBudget / 1000000,
        proyeccion: s.weekProjection / 1000000,
        cumplimiento: s.weekCompliance,
        proyeccionCompliance: s.weekProjectionCompliance,
        colors: getBarColor(s.weekCompliance)
      }));
    
    const sortKey = sortBy === 'compliance' ? 'cumplimiento' : 'venta';
    return data.sort((a, b) => 
      sortOrder === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );
  }, [storesAnalysis, sortOrder, sortBy]);

  // Dividir en dos columnas con altura uniforme
  const halfLength = Math.ceil(chartData.length / 2);
  const firstColumn = chartData.slice(0, halfLength);
  const secondColumn = chartData.slice(halfLength);
  const maxRows = Math.max(firstColumn.length, secondColumn.length);
  const chartHeight = Math.max(maxRows * 35, 420);

  // Datos por día de la semana para la tienda seleccionada
  const weekDaysData = useMemo(() => {
    if (!selectedStore) return null;

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const storeSales = allDailySales.filter(s => s.store_id === selectedStore.code);

    return days.map(day => {
      const daySale = storeSales.find(s => {
        try {
          const saleDate = parseISO(s.date);
          return saleDate.toDateString() === day.toDateString();
        } catch {
          return false;
        }
      });

      return {
        day: format(day, 'EEEE', { locale: es }),
        date: format(day, 'dd MMM'),
        sales: daySale ? daySale.total_sales / 1000000 : 0,
        transactions: daySale ? daySale.total_transactions : 0
      };
    });
  }, [selectedStore, allDailySales, dateRange]);

  const handleBarClick = (data) => {
    const store = storesAnalysis.find(s => s.code === data.code);
    setSelectedStore(store);
  };

  const exportToExcel = () => {
    const getEstado = (cumplimiento) => {
      if (cumplimiento >= 100) return 'Excelente';
      if (cumplimiento >= 85) return 'En Meta';
      if (cumplimiento >= 70) return 'Alerta';
      return 'Crítico';
    };

    // Preparar datos en formato estructurado
    const excelData = chartData.map(store => ({
      'Nombre de Tienda': store.fullName,
      '% Cumplimiento': store.cumplimiento / 100, // Como decimal para formato porcentaje
      'Venta Real': Math.round(store.venta * 1000000), // Valor completo sin decimales
      'Presupuesto': Math.round(store.presupuesto * 1000000), // Valor completo sin decimales
      'Estado': getEstado(store.cumplimiento)
    }));

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 25 }, // Nombre de Tienda
      { wch: 18 }, // % Cumplimiento
      { wch: 18 }, // Venta Real
      { wch: 18 }, // Presupuesto
      { wch: 15 }  // Estado
    ];

    // Aplicar formato a las celdas
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // Formato para encabezados (fila 0)
        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: 'E0E7FF' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }

        // Formato para % Cumplimiento (columna B)
        if (C === 1 && R > 0) {
          ws[cellAddress].z = '0.00%';
          ws[cellAddress].t = 'n';
        }

        // Formato para Venta Real y Presupuesto (columnas C y D)
        if ((C === 2 || C === 3) && R > 0) {
          ws[cellAddress].z = '#,##0';
          ws[cellAddress].t = 'n';
        }
      }
    }

    // Habilitar filtros en encabezados
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cumplimiento Tiendas');

    // Exportar archivo
    XLSX.writeFile(wb, `Tiendas_Cumplimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-lg p-5 border border-white/10 shadow-xl">
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.75;
          }
        }
        @keyframes gentleGlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
        .critical-bar {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .warning-bar {
          animation: gentleGlow 3s ease-in-out infinite;
        }
        .bar-hovered {
          filter: brightness(1.2);
          transform: scaleX(1.02);
          transition: all 0.3s ease;
        }
        .bar-dimmed {
          opacity: 0.3;
          filter: grayscale(0.5);
          transition: all 0.3s ease;
        }
      `}</style>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Tiendas vs PPT Semanal</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
              title="Exportar a Excel"
            >
              <Download className="w-3 h-3" />
              Excel
            </button>
            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {chartData.length} Tiendas
            </span>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-all"
          >
            <option value="compliance">% Cumplimiento</option>
            <option value="sales">$ Ventas</option>
          </select>
          
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-all"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortOrder === 'desc' ? 'Mayor → Menor' : 'Menor → Mayor'}
          </button>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-slate-300">≥100% Excelente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-slate-300">85-99% En Meta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs text-slate-300">70-84% Alerta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-slate-300">&lt;70% Crítico</span>
        </div>
      </div>

      {/* Dos columnas de gráficas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Primera Columna */}
        <div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart 
              data={firstColumn}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
            >
              <defs>
                {firstColumn.map((item, idx) => (
                  <linearGradient key={idx} id={`gradient-col1-${idx}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={item.colors.main} stopOpacity={0.8} />
                    <stop offset="50%" stopColor={item.colors.light} stopOpacity={1} />
                    <stop offset="100%" stopColor={item.colors.dark} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#6b7280" 
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(1)}M`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={10} 
                width={70}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0].payload;
                  const gap = (data.presupuesto - data.venta) * 1000000;
                  
                  return (
                    <div className="bg-slate-900/98 backdrop-blur-xl border-2 border-white/20 rounded-xl p-4 shadow-2xl max-w-xs">
                      <div className="border-b border-white/10 pb-2 mb-3">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {data.fullName}
                        </p>
                      </div>
                      <div className="space-y-1.5 mb-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">💰 Venta:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(data.venta * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🎯 Meta:</span>
                          <span className="font-bold text-indigo-400">
                            {formatCurrency(data.presupuesto * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📊 Cumplimiento:</span>
                          <span className={`font-bold ${
                            data.cumplimiento >= 100 ? 'text-emerald-400' : 
                            data.cumplimiento >= 90 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {data.cumplimiento.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📈 Proyección:</span>
                          <span className="font-bold text-purple-400">
                            {formatCurrency(data.proyeccion * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📊 Proy %:</span>
                          <span className={`font-bold ${
                            data.proyeccionCompliance >= 100 ? 'text-emerald-400' : 
                            data.proyeccionCompliance >= 90 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {data.proyeccionCompliance.toFixed(1)}%
                          </span>
                        </div>
                        {gap !== 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{gap > 0 ? '⚠️ Gap:' : '✅ Exceso:'}</span>
                            <span className={`font-bold ${gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {formatCurrency(Math.abs(gap))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">
                          💡 Acción
                        </p>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {data.cumplimiento >= 100 
                            ? 'Excelente desempeño. Click para ver detalle diario.' 
                            : data.cumplimiento >= 90 
                            ? 'Cerca de la meta. Click para analizar días críticos.'
                            : 'Requiere atención. Click para plan de acción diario.'}
                        </p>
                      </div>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar 
                dataKey="venta" 
                radius={[0, 8, 8, 0]} 
                maxBarSize={18}
                onClick={handleBarClick}
                cursor="pointer"
                onMouseEnter={(_, index) => setHoveredIndex(`col1-${index}`)}
                onMouseLeave={() => setHoveredIndex(null)}
                isAnimationActive={isLoaded}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {firstColumn.map((entry, index) => {
                  const isCritical = entry.cumplimiento < 70;
                  const isWarning = entry.cumplimiento >= 70 && entry.cumplimiento < 85;
                  const isHovered = hoveredIndex === `col1-${index}`;
                  const isDimmed = hoveredIndex && !isHovered;
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-col1-${index})`}
                      className={`
                        ${isCritical ? 'critical-bar' : isWarning ? 'warning-bar' : ''}
                        ${isHovered ? 'bar-hovered' : ''}
                        ${isDimmed ? 'bar-dimmed' : ''}
                      `}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  );
                })}
              </Bar>
              <Bar 
                dataKey="proyeccion" 
                radius={[0, 8, 8, 0]} 
                maxBarSize={18}
                onClick={handleBarClick}
                cursor="pointer"
                onMouseEnter={(_, index) => setHoveredIndex(`col1-${index}`)}
                onMouseLeave={() => setHoveredIndex(null)}
                isAnimationActive={isLoaded}
                animationBegin={100}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {firstColumn.map((entry, index) => {
                  const isHovered = hoveredIndex === `col1-${index}`;
                  const isDimmed = hoveredIndex && !isHovered;
                  const projColor = entry.proyeccionCompliance >= 100 ? '#10b981' : 
                                    entry.proyeccionCompliance >= 90 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <Cell 
                      key={`cell-proj-${index}`} 
                      fill={projColor}
                      opacity={0.6}
                      className={`
                        ${isHovered ? 'bar-hovered' : ''}
                        ${isDimmed ? 'bar-dimmed' : ''}
                      `}
                      style={{
                        animationDelay: `${index * 100 + 100}ms`
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segunda Columna */}
        <div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart 
              data={secondColumn}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
            >
              <defs>
                {secondColumn.map((item, idx) => (
                  <linearGradient key={idx} id={`gradient-col2-${idx}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={item.colors.main} stopOpacity={0.8} />
                    <stop offset="50%" stopColor={item.colors.light} stopOpacity={1} />
                    <stop offset="100%" stopColor={item.colors.dark} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#6b7280" 
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(1)}M`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={10} 
                width={70}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0].payload;
                  const gap = (data.presupuesto - data.venta) * 1000000;
                  
                  return (
                    <div className="bg-slate-900/98 backdrop-blur-xl border-2 border-white/20 rounded-xl p-4 shadow-2xl max-w-xs">
                      <div className="border-b border-white/10 pb-2 mb-3">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {data.fullName}
                        </p>
                      </div>
                      <div className="space-y-1.5 mb-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">💰 Venta:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(data.venta * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🎯 Meta:</span>
                          <span className="font-bold text-indigo-400">
                            {formatCurrency(data.presupuesto * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📊 Cumplimiento:</span>
                          <span className={`font-bold ${
                            data.cumplimiento >= 100 ? 'text-emerald-400' : 
                            data.cumplimiento >= 90 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {data.cumplimiento.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📈 Proyección:</span>
                          <span className="font-bold text-purple-400">
                            {formatCurrency(data.proyeccion * 1000000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📊 Proy %:</span>
                          <span className={`font-bold ${
                            data.proyeccionCompliance >= 100 ? 'text-emerald-400' : 
                            data.proyeccionCompliance >= 90 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {data.proyeccionCompliance.toFixed(1)}%
                          </span>
                        </div>
                        {gap !== 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{gap > 0 ? '⚠️ Gap:' : '✅ Exceso:'}</span>
                            <span className={`font-bold ${gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {formatCurrency(Math.abs(gap))}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5">
                          💡 Acción
                        </p>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {data.cumplimiento >= 100 
                            ? 'Excelente desempeño. Click para ver detalle diario.' 
                            : data.cumplimiento >= 90 
                            ? 'Cerca de la meta. Click para analizar días críticos.'
                            : 'Requiere atención. Click para plan de acción diario.'}
                        </p>
                      </div>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar 
                dataKey="venta" 
                radius={[0, 8, 8, 0]} 
                maxBarSize={18}
                onClick={handleBarClick}
                cursor="pointer"
                onMouseEnter={(_, index) => setHoveredIndex(`col2-${index}`)}
                onMouseLeave={() => setHoveredIndex(null)}
                isAnimationActive={isLoaded}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {secondColumn.map((entry, index) => {
                  const isCritical = entry.cumplimiento < 70;
                  const isWarning = entry.cumplimiento >= 70 && entry.cumplimiento < 85;
                  const isHovered = hoveredIndex === `col2-${index}`;
                  const isDimmed = hoveredIndex && !isHovered;
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-col2-${index})`}
                      className={`
                        ${isCritical ? 'critical-bar' : isWarning ? 'warning-bar' : ''}
                        ${isHovered ? 'bar-hovered' : ''}
                        ${isDimmed ? 'bar-dimmed' : ''}
                      `}
                      style={{
                        animationDelay: `${(firstColumn.length + index) * 100}ms`
                      }}
                    />
                  );
                })}
              </Bar>
              <Bar 
                dataKey="proyeccion" 
                radius={[0, 8, 8, 0]} 
                maxBarSize={18}
                onClick={handleBarClick}
                cursor="pointer"
                onMouseEnter={(_, index) => setHoveredIndex(`col2-${index}`)}
                onMouseLeave={() => setHoveredIndex(null)}
                isAnimationActive={isLoaded}
                animationBegin={100}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {secondColumn.map((entry, index) => {
                  const isHovered = hoveredIndex === `col2-${index}`;
                  const isDimmed = hoveredIndex && !isHovered;
                  const projColor = entry.proyeccionCompliance >= 100 ? '#10b981' : 
                                    entry.proyeccionCompliance >= 90 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <Cell 
                      key={`cell-proj-${index}`} 
                      fill={projColor}
                      opacity={0.6}
                      className={`
                        ${isHovered ? 'bar-hovered' : ''}
                        ${isDimmed ? 'bar-dimmed' : ''}
                      `}
                      style={{
                        animationDelay: `${(firstColumn.length + index) * 100 + 100}ms`
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Podio Top 3 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-amber-300">🏆 Top 3 Rendimiento</h4>
        </div>
        <div className="flex items-end justify-center gap-2">
          {chartData.slice(0, 3).map((store, idx) => {
            const position = idx === 0 ? 1 : idx === 1 ? 2 : 3;
            const heights = { 1: 'h-16', 2: 'h-12', 3: 'h-10' };
            const colors = {
              1: 'from-yellow-500/30 to-amber-500/30 border-yellow-500/40',
              2: 'from-gray-400/30 to-slate-400/30 border-gray-400/40',
              3: 'from-amber-600/30 to-orange-600/30 border-amber-600/40'
            };
            
            return (
              <motion.div
                key={store.code}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex-1 ${heights[position]} bg-gradient-to-br ${colors[position]} border rounded-t-lg flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all`}
                onClick={() => handleBarClick(store)}
              >
                <span className="text-lg font-black text-white">{position}</span>
                <p className="text-[8px] text-white font-bold text-center px-1 truncate w-full">{store.name}</p>
                <p className="text-[9px] font-black text-emerald-300">{store.cumplimiento.toFixed(0)}%</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal de días de la semana - Pantalla Completa con Portal */}
      {selectedStore && weekDaysData && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-[9999] overflow-y-auto"
            style={{ margin: 0, padding: 0 }}
          >
            <div className="min-h-screen w-full">
              {/* Header Flotante */}
              <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border-b border-white/10 p-6 shadow-lg">
                <div className="w-full px-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">{selectedStore.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedStore.weekCompliance >= 100 ? 'bg-emerald-500/20 text-emerald-300' :
                        selectedStore.weekCompliance >= 85 ? 'bg-blue-500/20 text-blue-300' :
                        selectedStore.weekCompliance >= 70 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {selectedStore.weekCompliance.toFixed(1)}% Cumplimiento
                      </span>
                      <span className="text-sm text-slate-400">
                        {formatShort(selectedStore.weekTotalSales)} / {formatShort(selectedStore.weeklyBudget)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content - Pantalla Completa */}
              <div className="w-full px-8 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                  {/* Gráfica Comparativa Venta vs PPT */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-bold text-white">Venta vs PPT Diario</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={600}>
                      <BarChart 
                        data={weekDaysData.map(day => ({
                          ...day,
                          ppt: selectedStore.getDailyBudget ? 
                            selectedStore.getDailyBudget(parseISO(day.date.split(' ')[0] + '-2025')) / 1000000 : 
                            (selectedStore.weeklyBudget / weekDaysData.length) / 1000000
                        }))}
                      >
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                          </linearGradient>
                          <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6}/>
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                        <XAxis 
                          dataKey="day" 
                          stroke="#9ca3af" 
                          fontSize={10}
                          tickLine={false}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(v) => `$${v.toFixed(1)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '2px solid #475569',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                          }}
                          formatter={(value, name) => {
                            const label = name === 'sales' ? 'Venta' : name === 'ppt' ? 'PPT' : name;
                            return [formatCurrency(value * 1000000), label];
                          }}
                        />
                        <Bar dataKey="ppt" fill="url(#budgetGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} name="PPT" />
                        <Bar dataKey="sales" fill="url(#salesGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} name="Venta" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cumplimiento por Día */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <h4 className="text-lg font-bold text-white">% Cumplimiento Diario</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={600}>
                      <BarChart 
                        data={weekDaysData.map(day => {
                          const ppt = selectedStore.getDailyBudget ? 
                            selectedStore.getDailyBudget(parseISO(day.date.split(' ')[0] + '-2025')) / 1000000 : 
                            (selectedStore.weeklyBudget / weekDaysData.length) / 1000000;
                          const compliance = ppt > 0 ? (day.sales / ppt) * 100 : 0;
                          return { ...day, compliance, ppt };
                        })}
                      >
                        <defs>
                          <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                        <XAxis 
                          dataKey="day" 
                          stroke="#9ca3af" 
                          fontSize={10}
                          tickLine={false}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(v) => `${v.toFixed(0)}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '2px solid #475569',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                          }}
                          formatter={(value) => [`${value.toFixed(1)}%`, 'Cumplimiento']}
                        />
                        <Bar dataKey="compliance" fill="url(#complianceGrad)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {weekDaysData.map((entry, index) => {
                            const ppt = selectedStore.getDailyBudget ? 
                              selectedStore.getDailyBudget(parseISO(entry.date.split(' ')[0] + '-2025')) / 1000000 : 
                              (selectedStore.weeklyBudget / weekDaysData.length) / 1000000;
                            const compliance = ppt > 0 ? (entry.sales / ppt) * 100 : 0;
                            const color = compliance >= 100 ? '#10b981' : compliance >= 85 ? '#3b82f6' : compliance >= 70 ? '#f59e0b' : '#ef4444';
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Desglose Detallado */}
                <div className="mt-6 bg-white/5 rounded-xl p-5 border border-white/10">
                  <h4 className="text-lg font-bold text-white mb-4">Desglose Detallado</h4>
                  <div className="space-y-3">
                    {weekDaysData.map((day, idx) => {
                      const ppt = selectedStore.getDailyBudget ? 
                        selectedStore.getDailyBudget(parseISO(day.date.split(' ')[0] + '-2025')) / 1000000 : 
                        (selectedStore.weeklyBudget / weekDaysData.length) / 1000000;
                      const compliance = ppt > 0 ? (day.sales / ppt) * 100 : 0;
                      const avgTicket = day.transactions > 0 ? (day.sales * 1000000) / day.transactions : 0;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-white capitalize">{day.day}</p>
                              <p className="text-xs text-slate-400">{day.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              compliance >= 100 ? 'bg-emerald-500/20 text-emerald-300' :
                              compliance >= 85 ? 'bg-blue-500/20 text-blue-300' :
                              compliance >= 70 ? 'bg-amber-500/20 text-amber-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {compliance.toFixed(1)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Venta</p>
                              <p className="text-sm font-bold text-emerald-400">{formatShort(day.sales * 1000000)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">PPT</p>
                              <p className="text-sm font-bold text-indigo-400">{formatShort(ppt * 1000000)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Tickets</p>
                              <p className="text-sm font-bold text-purple-400">{day.transactions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Ticket Prom</p>
                              <p className="text-sm font-bold text-pink-400">{formatCurrency(avgTicket)}</p>
                            </div>
                          </div>
                          <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden mt-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(compliance, 100)}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05 }}
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                compliance >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                compliance >= 85 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                compliance >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats Resumen */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                    <p className="text-xs text-blue-300 mb-1">Promedio Diario</p>
                    <p className="text-xl font-black text-white">
                      {formatShort((selectedStore.weekTotalSales / weekDaysData.length))}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <p className="text-xs text-emerald-300 mb-1">Mejor Día</p>
                    <p className="text-xl font-black text-white">
                      {formatShort(Math.max(...weekDaysData.map(d => d.sales)) * 1000000)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-xs text-purple-300 mb-1">Total Tickets</p>
                    <p className="text-xl font-black text-white">
                      {weekDaysData.reduce((sum, d) => sum + d.transactions, 0)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                    <p className="text-xs text-amber-300 mb-1">Ticket Promedio</p>
                    <p className="text-xl font-black text-white">
                      {formatCurrency(
                        weekDaysData.reduce((sum, d) => sum + d.sales, 0) * 1000000 / 
                        weekDaysData.reduce((sum, d) => sum + d.transactions, 0)
                      )}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-xl p-4 border border-rose-500/20">
                    <p className="text-xs text-rose-300 mb-1">Días en Meta</p>
                    <p className="text-xl font-black text-white">
                      {weekDaysData.filter(d => {
                        const ppt = selectedStore.getDailyBudget ? 
                          selectedStore.getDailyBudget(parseISO(d.date.split(' ')[0] + '-2025')) / 1000000 : 
                          (selectedStore.weeklyBudget / weekDaysData.length) / 1000000;
                        return (d.sales / ppt) * 100 >= 100;
                      }).length} / {weekDaysData.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}