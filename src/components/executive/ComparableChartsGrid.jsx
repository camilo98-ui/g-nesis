import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Percent, Activity, Target, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area, Cell } from 'recharts';

export default function ComparableChartsGrid({ chartData, totals, comparisonTotals, formatCurrency }) {
  
  // Análisis de eficiencia operativa
  const efficiencyData = useMemo(() => {
    const currentEfficiency = totals.transactions > 0 ? (totals.sales / totals.transactions) : 0;
    const previousEfficiency = comparisonTotals.transactions > 0 ? (comparisonTotals.sales / comparisonTotals.transactions) : 0;
    const efficiencyChange = previousEfficiency > 0 ? ((currentEfficiency - previousEfficiency) / previousEfficiency * 100) : 0;
    
    return {
      current: currentEfficiency,
      previous: previousEfficiency,
      change: efficiencyChange,
      conversionRate: totals.transactions > 0 ? (totals.suggested / totals.transactions * 100) : 0,
      previousConversionRate: comparisonTotals.transactions > 0 ? (comparisonTotals.suggested / comparisonTotals.transactions * 100) : 0
    };
  }, [totals, comparisonTotals]);

  // Datos diarios comparativos
  const dailyComparison = useMemo(() => {
    return chartData.filter(d => d.ventas > 0 || d.ventasComparacion > 0).map(d => ({
      date: d.date,
      ventaActual: d.ventas || 0,
      ventaAnterior: d.ventasComparacion || 0,
      variacion: d.ventasComparacion > 0 ? ((d.ventas - d.ventasComparacion) / d.ventasComparacion * 100) : 0,
      transActual: d.transactions || 0,
      transAnterior: d.transactionsComparacion || 0
    }));
  }, [chartData]);

  // KPIs de crecimiento
  const growthKPIs = useMemo(() => {
    const salesGrowth = comparisonTotals.sales > 0 ? ((totals.sales - comparisonTotals.sales) / comparisonTotals.sales * 100) : 0;
    const transGrowth = comparisonTotals.transactions > 0 ? ((totals.transactions - comparisonTotals.transactions) / comparisonTotals.transactions * 100) : 0;
    const ticketGrowth = comparisonTotals.transactions > 0 && totals.transactions > 0
      ? (((totals.sales / totals.transactions) - (comparisonTotals.sales / comparisonTotals.transactions)) / (comparisonTotals.sales / comparisonTotals.transactions) * 100)
      : 0;
    const suggestedGrowth = comparisonTotals.suggested > 0 ? ((totals.suggested - comparisonTotals.suggested) / comparisonTotals.suggested * 100) : 0;

    return [
      { name: 'Ventas', value: salesGrowth, color: salesGrowth >= 0 ? '#10b981' : '#ef4444' },
      { name: 'Tráfico', value: transGrowth, color: transGrowth >= 0 ? '#8b5cf6' : '#f97316' },
      { name: 'Ticket', value: ticketGrowth, color: ticketGrowth >= 0 ? '#3b82f6' : '#eab308' },
      { name: 'Sugeridos', value: suggestedGrowth, color: suggestedGrowth >= 0 ? '#ec4899' : '#ef4444' }
    ];
  }, [totals, comparisonTotals]);

  return (
    <div className="space-y-6 mt-6">
      {/* Sustentación */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-700 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-base">Análisis Detallado de Métricas Operativas</h4>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Conclusiones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1">
                <span className="text-blue-600">📊</span> Conclusiones
              </h5>
              <p className="text-xs text-blue-900 leading-relaxed">
                Estas gráficas muestran el comportamiento detallado de cada indicador entre períodos. Las variaciones día a día revelan consistencia o volatilidad operativa. La eficiencia por transacción indica qué tan bien convertimos cada cliente en ventas. Patrones irregulares sugieren problemas de ejecución que reducen resultados.
              </p>
            </div>

            {/* Plan de Acción */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <h5 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1">
                <span className="text-emerald-600">🎯</span> Plan de Acción
              </h5>
              <p className="text-xs text-emerald-900 leading-relaxed">
                1) Identificar días de mejor y peor desempeño - buscar causas específicas. 2) Si la variación diaria es alta, estandarizar procesos para reducir inconsistencia. 3) Usar métricas de eficiencia para establecer benchmarks por vendedor. 4) Variaciones mayores a 15% requieren revisión inmediata.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Crecimiento por KPI */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-500" />
              Crecimiento Comparativo por Indicador
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Compara el crecimiento porcentual de cada KPI. Un crecimiento balanceado indica salud operativa; 
              desbalances sugieren áreas que requieren atención prioritaria.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthKPIs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, 'Crecimiento']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {growthKPIs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Variación Diaria de Ventas */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Variación Diaria de Ventas (%)
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Fluctuación porcentual día a día entre períodos. Valores positivos consistentes indican mejora sostenida; 
              volatilidad alta sugiere inconsistencia operativa que requiere estandarización.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyComparison}>
                  <defs>
                    <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v}%`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, 'Variación']}
                  />
                  <Area type="monotone" dataKey="variacion" stroke="#6366f1" strokeWidth={2} fill="url(#varGrad)" name="% Cambio" />
                  <Line type="monotone" dataKey={() => 0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo Tráfico vs Venta */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Evolución de Tráfico vs Facturación
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Correlación entre volumen de clientes y ventas en ambos períodos. Divergencia entre líneas indica cambios en comportamiento de compra o efectividad comercial.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v, name) => [
                      name.includes('Venta') ? formatCurrency(v) : v.toLocaleString(), 
                      name
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="transActual" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tráfico Actual" opacity={0.8} />
                  <Bar yAxisId="left" dataKey="transAnterior" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Tráfico Anterior" opacity={0.5} />
                  <Line yAxisId="right" type="monotone" dataKey="ventaActual" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Venta Actual" />
                  <Line yAxisId="right" type="monotone" dataKey="ventaAnterior" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#94a3b8', r: 3 }} name="Venta Anterior" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Eficiencia */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Indicadores de Eficiencia Operativa
            </CardTitle>
            <p className="text-xs text-slate-300 mt-1">
              Métricas clave de productividad comercial. La eficiencia por transacción y tasa de conversión son drivers críticos de rentabilidad.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Venta por Transacción */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-300 font-medium">Venta / Transacción</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  efficiencyData.change >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {efficiencyData.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {efficiencyData.change >= 0 ? '+' : ''}{efficiencyData.change.toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Actual</p>
                  <p className="text-lg font-black text-white">{formatCurrency(efficiencyData.current)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Anterior</p>
                  <p className="text-lg font-bold text-slate-300">{formatCurrency(efficiencyData.previous)}</p>
                </div>
              </div>
            </div>

            {/* Tasa de Conversión Sugeridos */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-300 font-medium">Conversión de Sugeridos</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  efficiencyData.conversionRate >= efficiencyData.previousConversionRate 
                    ? 'bg-pink-500/20 text-pink-300' 
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {efficiencyData.conversionRate >= efficiencyData.previousConversionRate ? '+' : ''}
                  {(efficiencyData.conversionRate - efficiencyData.previousConversionRate).toFixed(1)}pp
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Actual</p>
                  <p className="text-lg font-black text-white">{efficiencyData.conversionRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Anterior</p>
                  <p className="text-lg font-bold text-slate-300">{efficiencyData.previousConversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Indicador de consistencia */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-4">
              <p className="text-xs text-cyan-200 font-bold mb-2">💡 Insight de Consistencia</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {Math.abs(efficiencyData.change) < 5 
                  ? 'Desempeño estable entre períodos. Mantener estrategias actuales y optimizar procesos existentes.'
                  : efficiencyData.change >= 5
                    ? `Mejora significativa de ${efficiencyData.change.toFixed(1)}% en eficiencia. Documentar mejores prácticas para replicación.`
                    : `Alerta: Deterioro de ${Math.abs(efficiencyData.change).toFixed(1)}% en eficiencia operativa. Requiere revisión urgente de procesos y capacitación.`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comparación día a día completa */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Ventas Diarias: Período Actual vs Anterior
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Comparación granular día por día. Identifique patrones: ¿los incrementos son consistentes o volátiles? 
              Consistencia indica estrategias sostenibles; volatilidad sugiere factores externos o ejecución irregular.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyComparison}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v, name) => [formatCurrency(v), name]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="ventaAnterior" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    fill="url(#previousGradient)" 
                    name="Período Anterior"
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ventaActual" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fill="url(#actualGradient)" 
                    name="Período Actual"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}