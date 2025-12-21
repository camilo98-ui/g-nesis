import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, Users, Award, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

export default function KPIsDetailView({ storesAnalysis, formatCurrency, zoneTotals }) {
  const topPerformers = storesAnalysis.sort((a, b) => b.salesCompliance - a.salesCompliance).slice(0, 5);
  const bottomPerformers = storesAnalysis.sort((a, b) => a.salesCompliance - b.salesCompliance).slice(0, 5);

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
        <h1 className="text-3xl font-black text-slate-900 mb-2">KPIs Ejecutivos</h1>
        <p className="text-sm text-slate-500">Análisis profundo de métricas clave de rendimiento</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                Total Zona
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(zoneTotals.totalSales)}</p>
            <p className="text-sm text-slate-500">Ventas acumuladas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-violet-600" />
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
                Proyección
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{formatCurrency(zoneTotals.totalProjection)}</p>
            <p className="text-sm text-slate-500">Estimado al cierre</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-amber-600" />
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Promedio
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">
              {((zoneTotals.totalSales / zoneTotals.totalBudget) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-slate-500">Cumplimiento zona</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Distribución de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top & Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50/30 to-green-50/20">
          <CardHeader>
            <CardTitle className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top 5 Tiendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((store, idx) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-emerald-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{store.name}</span>
                    </div>
                    <span className="text-lg font-black text-emerald-600">
                      {store.salesCompliance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Ventas: {formatCurrency(store.totalSales)}</span>
                    <span>Meta: {formatCurrency(store.salesBudget)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm bg-gradient-to-br from-rose-50/30 to-red-50/20">
          <CardHeader>
            <CardTitle className="text-base font-bold text-rose-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 rotate-180" />
              Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomPerformers.map((store, idx) => (
                <motion.div
                  key={store.code}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-rose-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center text-sm">
                        {storesAnalysis.length - idx}
                      </span>
                      <span className="font-bold text-slate-900">{store.name}</span>
                    </div>
                    <span className="text-lg font-black text-rose-600">
                      {store.salesCompliance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
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
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            Top 10 - Ticket Promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={avgTicketData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="ticket" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}