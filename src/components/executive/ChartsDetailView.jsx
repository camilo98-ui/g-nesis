import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ComposedChart, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#8b5cf6', '#a78bfa', '#c4b5fd', '#fbbf24', '#fb923c'];

export default function ChartsDetailView({ storesAnalysis, formatCurrency, comparisonData }) {
  const salesTrendData = storesAnalysis.map(s => ({
    name: s.name,
    ventas: s.totalSales,
    proyeccion: s.projection,
    meta: s.salesBudget
  })).sort((a, b) => b.ventas - a.ventas);

  const efficiencyData = storesAnalysis.map(s => ({
    name: s.name,
    ticketPromedio: s.avgTicket,
    transacciones: s.totalTransactions,
    ventas: s.totalSales
  })).sort((a, b) => b.ticketPromedio - a.ticketPromedio).slice(0, 12);

  const complianceSegments = [
    { name: 'Críticas (<70%)', value: storesAnalysis.filter(s => s.salesCompliance < 70).length, color: '#ef4444' },
    { name: 'En Riesgo (70-90%)', value: storesAnalysis.filter(s => s.salesCompliance >= 70 && s.salesCompliance < 90).length, color: '#f59e0b' },
    { name: 'En Meta (90-100%)', value: storesAnalysis.filter(s => s.salesCompliance >= 90 && s.salesCompliance < 100).length, color: '#8b5cf6' },
    { name: 'Sobre Meta (+100%)', value: storesAnalysis.filter(s => s.salesCompliance >= 100).length, color: '#10b981' },
  ];

  const radarData = storesAnalysis.slice(0, 8).map(s => ({
    tienda: s.name,
    ventas: (s.salesCompliance / 100) * 100,
    tickets: (s.ticketsCompliance / 100) * 100,
    transacciones: (s.transactionsCompliance / 100) * 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Análisis Visual Avanzado</h1>
        <p className="text-sm text-gray-500">Gráficas ejecutivas para decisiones estratégicas</p>
      </div>

      {/* Ventas vs Proyección vs Meta */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Ventas · Proyección · Meta
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="ventas" fill="#3b82f6" name="Ventas Reales" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="proyeccion" stroke="#10b981" strokeWidth={2.5} name="Proyección" dot={{ fill: '#10b981', r: 3 }} />
              <Line type="monotone" dataKey="meta" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribución de Cumplimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complianceSegments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={{ stroke: '#9ca3af' }}
                >
                  {complianceSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Eficiencia por Tienda
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="ticketPromedio" fill="#3b82f6" name="Ticket Promedio" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Multivariable */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Análisis Multivariable - Top 8 Tiendas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="tienda" tick={{ fontSize: 11, fill: '#374151' }} />
              <PolarRadiusAxis angle={90} domain={[0, 120]} tick={{ fill: '#6b7280' }} />
              <Radar name="Ventas" dataKey="ventas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Tickets" dataKey="tickets" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Radar name="Transacciones" dataKey="transacciones" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ticket Promedio vs Transacciones */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900">Ticket Promedio vs Volumen</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={efficiencyData}>
              <defs>
                <linearGradient id="colorTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area yAxisId="left" type="monotone" dataKey="ticketPromedio" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTicket)" name="Ticket Promedio" />
              <Area yAxisId="right" type="monotone" dataKey="transacciones" stroke="#10b981" fillOpacity={1} fill="url(#colorTrans)" name="Transacciones" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}