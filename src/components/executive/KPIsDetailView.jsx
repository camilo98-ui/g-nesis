import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Target, Users, Award, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

export default function KPIsDetailView({ storesAnalysis, formatCurrency, zoneTotals }) {
  const topPerformers = [...storesAnalysis].sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 5);
  const bottomPerformers = [...storesAnalysis].sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 5);

  const performanceDistribution = [
    { range: '0-50%', count: storesAnalysis.filter(s => s.salesCompliance < 50).length },
    { range: '50-70%', count: storesAnalysis.filter(s => s.salesCompliance >= 50 && s.salesCompliance < 70).length },
    { range: '70-90%', count: storesAnalysis.filter(s => s.salesCompliance >= 70 && s.salesCompliance < 90).length },
    { range: '90-100%', count: storesAnalysis.filter(s => s.salesCompliance >= 90 && s.salesCompliance < 100).length },
    { range: '+100%', count: storesAnalysis.filter(s => s.salesCompliance >= 100).length },
  ];

  const avgTicketData = storesAnalysis.map(s => ({
    name: s.name,
    ticket: s.avgTicket,
    transacciones: s.totalTransactions
  })).sort((a, b) => b.ticket - a.ticket).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">KPIs Ejecutivos</h1>
        <p className="text-sm text-gray-500">Análisis profundo de métricas clave de rendimiento</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Total Zona
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(zoneTotals.totalSales)}</p>
            <p className="text-sm text-gray-500">Ventas acumuladas</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Proyección
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(zoneTotals.totalProjection)}</p>
            <p className="text-sm text-gray-500">Estimado al cierre</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                ((zoneTotals.totalSales / zoneTotals.totalBudget) * 100) >= 90 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : ((zoneTotals.totalSales / zoneTotals.totalBudget) * 100) >= 70
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {((zoneTotals.totalSales / zoneTotals.totalBudget) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {((zoneTotals.totalSales / zoneTotals.totalBudget) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Cumplimiento zona</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900">Distribución de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Top 5 Tiendas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {topPerformers.map((store, idx) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900">{store.name}</span>
                    </div>
                    <span className="text-base font-bold text-emerald-600">
                      {store.salesCompliance.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Ventas: {formatCurrency(store.totalSales)}</span>
                    <span>Meta: {formatCurrency(store.salesBudget)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {bottomPerformers.map((store, idx) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-red-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-semibold flex items-center justify-center text-sm">
                        {storesAnalysis.length - idx}
                      </span>
                      <span className="font-semibold text-gray-900">{store.name}</span>
                    </div>
                    <span className="text-base font-bold text-red-600">
                      {store.salesCompliance.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Ventas: {formatCurrency(store.totalSales)}</span>
                    <span>Gap: {formatCurrency(store.salesBudget - store.totalSales)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Ticket Analysis */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Top 10 - Ticket Promedio
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={avgTicketData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#374151' }} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="ticket" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}