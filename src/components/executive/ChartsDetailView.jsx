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
        <h1 className="text-3xl font-black text-slate-900 mb-2">Análisis Visual Avanzado</h1>
        <p className="text-sm text-slate-500">Gráficas ejecutivas para decisiones estratégicas</p>
      </div>

      {/* Ventas vs Proyección vs Meta */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Ventas · Proyección · Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="ventas" fill="#ec4899" name="Ventas Reales" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="proyeccion" stroke="#8b5cf6" strokeWidth={3} name="Proyección" />
              <Line type="monotone" dataKey="meta" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" name="Meta" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribución de Cumplimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-pink-600" />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  labelLine={{ stroke: '#94a3b8' }}
                >
                  {complianceSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Eficiencia por Tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="ticketPromedio" fill="#10b981" name="Ticket Promedio" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análisis Multivariable */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            Análisis Multivariable - Top 8 Tiendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="tienda" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 120]} />
              <Radar name="Ventas" dataKey="ventas" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
              <Radar name="Tickets" dataKey="tickets" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              <Radar name="Transacciones" dataKey="transacciones" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ticket Promedio vs Transacciones */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Ticket Promedio vs Volumen</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={efficiencyData}>
              <defs>
                <linearGradient id="colorTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="ticketPromedio" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTicket)" name="Ticket Promedio" />
              <Area yAxisId="right" type="monotone" dataKey="transacciones" stroke="#ec4899" fillOpacity={1} fill="url(#colorTrans)" name="Transacciones" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}