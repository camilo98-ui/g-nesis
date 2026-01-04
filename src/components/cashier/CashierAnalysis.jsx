import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, Target, BarChart3, 
  Sparkles, AlertTriangle, CheckCircle, Loader2, Users, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { startOfMonth, format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell
} from 'recharts';

export default function CashierAnalysis({ cashierId, cashierName, storeId }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: async () => {
      const records = await base44.entities.ShiftRecord.filter({ store_id: storeId });
      console.log('📊 ShiftRecords cargados en CashierAnalysis:', records.length, 'para store:', storeId);
      return records;
    },
    enabled: !!storeId,
    staleTime: 0,
    gcTime: 0, // Antes cacheTime, ahora gcTime en v5
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Calcular el inicio del mes retail (calendario ferial)
  const getRetailMonthStart = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    
    // Para enero, la semana 1 empieza el 29 de diciembre del año anterior
    if (currentMonth === 1) {
      return new Date(currentYear - 1, 11, 29); // 29 de diciembre del año anterior
    }
    
    // Para otros meses, comenzar desde el primer día del mes
    return new Date(currentYear, currentMonth - 1, 1);
  };

  // Datos del cajero desde el inicio del mes retail hasta hoy
  const trendData = useMemo(() => {
    const endDate = new Date();
    const startDate = getRetailMonthStart();
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const cashierRecords = shiftRecords.filter(r => r.cashier_id === cashierId);
    console.log('📈 Calculando trendData para cashier:', cashierId, 'desde mes retail:', format(startDate, 'yyyy-MM-dd'), 'registros encontrados:', cashierRecords.length);
    
    const result = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = cashierRecords.filter(r => r.date === dayStr);
      const sales = dayRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
      const transactions = dayRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
      const tickets = dayRecords.reduce((sum, r) => sum + (r.tickets || 0), 0);
      
      if (dayRecords.length > 0) {
        console.log(`  📅 ${dayStr}: ventas=${sales}, trans=${transactions}, tickets=${tickets}`);
      }
      
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd MMM', { locale: es }),
        ventas: sales,
        transacciones: transactions,
        ticketPromedio: transactions > 0 ? Math.round(sales / transactions) : 0
      };
    }).filter(d => d.ventas > 0 || d.transacciones > 0);
    
    console.log('✅ trendData final tiene', result.length, 'días con datos del mes retail');
    return result;
  }, [shiftRecords, cashierId]);

  // Estadísticas del cajero vs equipo (usando mes retail)
  const stats = useMemo(() => {
    const monthStart = getRetailMonthStart();
    const cashierRecords = shiftRecords.filter(r => {
      try {
        const date = new Date(r.date);
        return r.cashier_id === cashierId && !isNaN(date.getTime()) && date >= monthStart;
      } catch {
        return false;
      }
    });
    const allRecords = shiftRecords.filter(r => {
      try {
        const date = new Date(r.date);
        return !isNaN(date.getTime()) && date >= monthStart;
      } catch {
        return false;
      }
    });
    
    const cashierSales = cashierRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const cashierTrans = cashierRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const cashierTickets = cashierRecords.reduce((sum, r) => sum + (r.tickets || 0), 0);
    const cashierSuggested = cashierRecords.reduce((sum, r) => sum + (r.suggested_sales || 0), 0);
    const cashierDays = cashierRecords.length;
    
    const teamSales = allRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const teamTrans = allRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
    const activeCashiers = new Set(allRecords.map(r => r.cashier_id)).size;
    
    const avgTeamSales = activeCashiers > 0 ? teamSales / activeCashiers : 0;
    const avgTeamTicket = teamTrans > 0 ? teamSales / teamTrans : 0;
    
    const cashierTicket = cashierTrans > 0 ? cashierSales / cashierTrans : 0;
    
    // Tendencia (comparar primera mitad vs segunda mitad)
    const midPoint = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, midPoint);
    const secondHalf = trendData.slice(midPoint);
    const avgFirst = firstHalf.reduce((sum, d) => sum + d.ventas, 0) / Math.max(firstHalf.length, 1);
    const avgSecond = secondHalf.reduce((sum, d) => sum + d.ventas, 0) / Math.max(secondHalf.length, 1);
    const trend = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
    
    return {
      cashierSales,
      cashierTrans,
      cashierTickets,
      cashierSuggested,
      cashierDays,
      cashierTicket,
      avgTeamSales,
      avgTeamTicket,
      salesVsTeam: avgTeamSales > 0 ? ((cashierSales / avgTeamSales) * 100 - 100) : 0,
      ticketVsTeam: avgTeamTicket > 0 ? ((cashierTicket / avgTeamTicket) * 100 - 100) : 0,
      trend
    };
  }, [shiftRecords, cashierId, trendData]);

  // Generar análisis con IA
  const generateAnalysis = async () => {
    if (loadingAI || trendData.length < 3) return;
    setLoadingAI(true);
    
    try {
      const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiza el desempeño de este cajero de Popsy y genera un diagnóstico breve pero útil:

CAJERO: ${cashierName}

DATOS DEL MES:
- Ventas totales: ${formatCurrency(stats.cashierSales)}
- Transacciones: ${stats.cashierTrans}
- Ticket promedio: ${formatCurrency(stats.cashierTicket)}
- Sugeridos vendidos: ${stats.cashierSuggested}
- Días trabajados: ${stats.cashierDays}

COMPARACIÓN CON EQUIPO:
- Ventas vs promedio equipo: ${stats.salesVsTeam > 0 ? '+' : ''}${stats.salesVsTeam.toFixed(1)}%
- Ticket vs promedio equipo: ${stats.ticketVsTeam > 0 ? '+' : ''}${stats.ticketVsTeam.toFixed(1)}%
- Tendencia de ventas: ${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}%

INSTRUCCIONES:
1. Identifica el punto fuerte del cajero
2. Identifica el área de mejora principal
3. Da 2 acciones CONCRETAS y específicas para mejorar
4. Sé directo y motivador (máximo 100 palabras)`,
        response_json_schema: {
          type: "object",
          properties: {
            resumen: { type: "string", description: "Diagnóstico breve en 2-3 líneas" },
            punto_fuerte: { type: "string", description: "Fortaleza principal" },
            area_mejora: { type: "string", description: "Área a mejorar" },
            acciones: { type: "array", items: { type: "string" }, description: "2 acciones concretas" }
          }
        }
      });
      
      setAiAnalysis(result);
    } catch (e) {
      console.error(e);
    }
    setLoadingAI(false);
  };

  useEffect(() => {
    if (cashierId && trendData.length >= 3 && !aiAnalysis) {
      generateAnalysis();
    }
  }, [cashierId, trendData.length]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0 
  }).format(Math.round(val));

  if (trendData.length === 0) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="py-8 text-center text-gray-400">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Sin datos de turnos registrados</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular eficiencia del cajero
  const efficiencyData = useMemo(() => {
    if (!trendData.length) return [];
    
    // Calcular eficiencia diaria (ventas / transacciones) como proxy de productividad
    return trendData.map(d => ({
      ...d,
      eficiencia: d.transacciones > 0 ? Math.min(100, (d.ticketPromedio / 50000) * 100) : 0, // Normalizado a 100%
    }));
  }, [trendData]);

  // Comparación con otros cajeros (usando mes retail)
  const cashierComparison = useMemo(() => {
    const monthStart = getRetailMonthStart();
    const allRecords = shiftRecords.filter(r => {
      try {
        const date = new Date(r.date);
        return !isNaN(date.getTime()) && date >= monthStart;
      } catch {
        return false;
      }
    });
    
    // Agrupar por cajero
    const cashierGroups = {};
    allRecords.forEach(r => {
      if (!cashierGroups[r.cashier_id]) {
        cashierGroups[r.cashier_id] = { sales: 0, transactions: 0, days: 0 };
      }
      cashierGroups[r.cashier_id].sales += r.sales || 0;
      cashierGroups[r.cashier_id].transactions += r.transactions || 0;
      cashierGroups[r.cashier_id].days += 1;
    });

    // Calcular métricas para cada cajero
    const comparison = Object.entries(cashierGroups).map(([id, data]) => {
      const cashierInfo = allCashiers.find(c => c.id === id);
      const avgTicket = data.transactions > 0 ? data.sales / data.transactions : 0;
      const avgDaily = data.days > 0 ? data.sales / data.days : 0;
      
      return {
        id,
        name: cashierInfo?.name?.split(' ')[0] || 'N/A',
        sales: data.sales,
        avgTicket,
        avgDaily,
        days: data.days,
        isCurrentCashier: id === cashierId
      };
    }).sort((a, b) => b.sales - a.sales);

    return comparison;
  }, [shiftRecords, allCashiers, cashierId]);

  // Posición del cajero actual
  const currentPosition = cashierComparison.findIndex(c => c.isCurrentCashier) + 1;
  const totalCashiers = cashierComparison.length;

  return (
    <div className="space-y-4">
      {/* Gráfica de Tendencia - Más clara con gráfico de área */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-500" />
            Tendencia de Ventas - {cashierName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fill: '#6b7280', fontSize: 10 }} 
                  tickFormatter={(v) => `$${Math.round(v/1000000)}M`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => `$${Math.round(v/1000)}K`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(v, name) => {
                    if (name === 'Ventas') return [formatCurrency(v), '💰 Ventas'];
                    if (name === 'Ticket Promedio') return [formatCurrency(v), '🎫 Ticket'];
                    return [Math.round(v).toLocaleString(), name];
                  }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fill="url(#salesGradient)"
                  name="Ventas"
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="ticketPromedio" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  fill="url(#ticketGradient)"
                  name="Ticket Promedio"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica de Eficiencia */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Eficiencia del Cajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData}>
                <defs>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 10 }} 
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`${v.toFixed(0)}%`, 'Eficiencia']}
                />
                <Area 
                  type="monotone" 
                  dataKey="eficiencia" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fill="url(#efficiencyGradient)" 
                  name="Eficiencia"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparación con otros cajeros */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            Posición vs Equipo
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-bold">
              #{currentPosition} de {totalCashiers}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashierComparison.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${Math.round(v/1000000)}M`} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={60} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [formatCurrency(v), 'Ventas']}
                />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                  {cashierComparison.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrentCashier ? '#ec4899' : index === 0 ? '#fbbf24' : '#e5e7eb'}
                      opacity={entry.isCurrentCashier ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda */}
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-pink-500" />
              <span className="text-gray-600">{cashierName}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-gray-600">Top 1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-300" />
              <span className="text-gray-600">Otros</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis IA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h4 className="font-bold text-gray-700">Análisis de Gestión</h4>
          {loadingAI && <Loader2 className="w-4 h-4 animate-spin text-pink-500" />}
        </div>
        
        {aiAnalysis ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{aiAnalysis.resumen}</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium mb-1">
                  <CheckCircle className="w-3 h-3" /> Punto Fuerte
                </div>
                <p className="text-sm text-gray-600">{aiAnalysis.punto_fuerte}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mb-1">
                  <AlertTriangle className="w-3 h-3" /> A Mejorar
                </div>
                <p className="text-sm text-gray-600">{aiAnalysis.area_mejora}</p>
              </div>
            </div>
            
            {aiAnalysis.acciones?.length > 0 && (
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs font-medium text-purple-600 mb-2">🎯 Acciones Recomendadas</p>
                <ul className="space-y-1">
                  {aiAnalysis.acciones.map((accion, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-pink-500">•</span>
                      {accion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm">Cargando análisis...</p>
          </div>
        )}
      </motion.div>

      {/* Indicadores rápidos */}
      <div className="flex gap-2 text-xs">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stats.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {stats.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          Tendencia: {stats.trend >= 0 ? '+' : ''}{Math.round(stats.trend)}%
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stats.salesVsTeam >= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          <Target className="w-3 h-3" />
          vs Equipo: {stats.salesVsTeam >= 0 ? '+' : ''}{Math.round(stats.salesVsTeam)}%
        </div>
      </div>
    </div>
  );
}