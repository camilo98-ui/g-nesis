import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, Target, BarChart3, 
  Sparkles, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';

export default function CashierAnalysis({ cashierId, cashierName, storeId }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: shiftRecords = [] } = useQuery({
    queryKey: ['shiftRecords', storeId],
    queryFn: () => base44.entities.ShiftRecord.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  const { data: allCashiers = [] } = useQuery({
    queryKey: ['cashiers', storeId],
    queryFn: () => base44.entities.Cashier.filter({ store_id: storeId }),
    enabled: !!storeId
  });

  // Datos del cajero en los últimos 30 días
  const trendData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const cashierRecords = shiftRecords.filter(r => r.cashier_id === cashierId);
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = cashierRecords.filter(r => r.date === dayStr);
      const sales = dayRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
      const transactions = dayRecords.reduce((sum, r) => sum + (r.transactions || 0), 0);
      const tickets = dayRecords.reduce((sum, r) => sum + (r.tickets || 0), 0);
      
      return {
        date: format(day, 'dd', { locale: es }),
        fullDate: format(day, 'EEE dd MMM', { locale: es }),
        ventas: sales,
        transacciones: transactions,
        ticketPromedio: transactions > 0 ? Math.round(sales / transactions) : 0
      };
    }).filter(d => d.ventas > 0 || d.transacciones > 0);
  }, [shiftRecords, cashierId]);

  // Estadísticas del cajero vs equipo
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const cashierRecords = shiftRecords.filter(r => 
      r.cashier_id === cashierId && new Date(r.date) >= monthStart
    );
    const allRecords = shiftRecords.filter(r => new Date(r.date) >= monthStart);
    
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
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

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

  return (
    <div className="space-y-4">
      {/* Gráfica de Tendencia */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-500" />
            Tendencia de Gestión - {cashierName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fill: '#6b7280', fontSize: 10 }} 
                  tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  formatter={(v, name) => {
                    if (name === 'Ventas') return [formatCurrency(v), name];
                    if (name === 'Ticket Prom.') return [formatCurrency(v), name];
                    return [v.toLocaleString(), name];
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#10b981' }}
                  name="Ventas"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="transacciones" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#8b5cf6' }}
                  name="Transacciones"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="ticketPromedio" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="Ticket Prom."
                />
              </LineChart>
            </ResponsiveContainer>
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
          Tendencia: {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stats.salesVsTeam >= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          <Target className="w-3 h-3" />
          vs Equipo: {stats.salesVsTeam >= 0 ? '+' : ''}{stats.salesVsTeam.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}