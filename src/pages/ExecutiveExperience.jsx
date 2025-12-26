import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, TrendingUp, Award, Target, Store as StoreIcon, Calendar, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function ExecutiveExperience() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => base44.entities.Store.filter({ is_active: true }),
    staleTime: 10 * 60 * 1000
  });

  const { data: allFeedback = [] } = useQuery({
    queryKey: ['allCustomerFeedback'],
    queryFn: () => base44.entities.CustomerFeedback.list('-created_date'),
    staleTime: 2 * 60 * 1000
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['allCashiers'],
    queryFn: () => base44.entities.Cashier.filter({ is_active: true }),
    staleTime: 5 * 60 * 1000
  });

  const filteredFeedback = useMemo(() => {
    if (selectedPeriod === 'month') {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      return allFeedback.filter(f => f.date >= start && f.date <= end);
    } else if (selectedPeriod === 'week') {
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      return allFeedback.filter(f => f.date >= start && f.date <= end);
    }
    return allFeedback;
  }, [allFeedback, selectedPeriod]);

  const storesData = useMemo(() => {
    return stores.map(store => {
      const storeFeedback = filteredFeedback.filter(f => f.store_id === store.code);
      
      const totalSurveys = storeFeedback.length;
      const totalPoints = storeFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
      
      const npsData = storeFeedback.reduce((acc, f) => {
        acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
        return acc;
      }, {});
      
      const promotores = npsData.promotor || 0;
      const detractores = npsData.detractor || 0;
      const nps = totalSurveys > 0 ? Math.round(((promotores - detractores) / totalSurveys) * 100) : 0;
      
      const suggestedSales = storeFeedback.filter(f => f.has_suggested_sale).length;
      const totalSuggested = storeFeedback.reduce((sum, f) => sum + (f.suggested_sale_amount || 0), 0);
      
      const avgPoints = totalSurveys > 0 ? (totalPoints / totalSurveys).toFixed(1) : 0;
      
      return {
        code: store.code,
        name: store.name,
        totalSurveys,
        totalPoints,
        avgPoints,
        nps,
        promotores,
        pasivos: npsData.pasivo || 0,
        detractores,
        suggestedSales,
        totalSuggested,
        hasFeedback: totalSurveys > 0
      };
    }).filter(s => s.hasFeedback).sort((a, b) => b.nps - a.nps);
  }, [stores, filteredFeedback]);

  const overallStats = useMemo(() => {
    const totalSurveys = filteredFeedback.length;
    const totalPoints = filteredFeedback.reduce((sum, f) => sum + (f.points || 0), 0);
    const suggestedSales = filteredFeedback.filter(f => f.has_suggested_sale).length;
    
    const npsData = filteredFeedback.reduce((acc, f) => {
      acc[f.nps_type] = (acc[f.nps_type] || 0) + 1;
      return acc;
    }, {});
    
    const promotores = npsData.promotor || 0;
    const detractores = npsData.detractor || 0;
    const nps = totalSurveys > 0 ? Math.round(((promotores - detractores) / totalSurveys) * 100) : 0;
    
    return {
      totalSurveys,
      totalPoints,
      nps,
      promotores,
      pasivos: npsData.pasivo || 0,
      detractores,
      suggestedSales,
      avgPoints: totalSurveys > 0 ? (totalPoints / totalSurveys).toFixed(1) : 0
    };
  }, [filteredFeedback]);

  const topCashiers = useMemo(() => {
    const cashierStats = {};
    
    filteredFeedback.forEach(f => {
      if (!f.cashier_id) return;
      
      if (!cashierStats[f.cashier_id]) {
        const cashier = cashiers.find(c => c.id === f.cashier_id);
        const store = stores.find(s => s.code === f.store_id);
        cashierStats[f.cashier_id] = {
          name: cashier?.name || 'Desconocido',
          store: store?.code || 'N/A',
          points: 0,
          surveys: 0,
          nps: 0,
          promotores: 0
        };
      }
      
      cashierStats[f.cashier_id].points += f.points || 0;
      cashierStats[f.cashier_id].surveys += 1;
      if (f.nps_type === 'promotor') cashierStats[f.cashier_id].promotores += 1;
    });
    
    return Object.entries(cashierStats)
      .map(([id, data]) => ({
        id,
        ...data,
        nps: data.surveys > 0 ? Math.round((data.promotores / data.surveys) * 100) : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [filteredFeedback, cashiers, stores]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-pink-500" />
                Experiencia Gerencial
              </h1>
              <p className="text-slate-600 text-sm">Vista consolidada por tiendas</p>
            </div>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem('selectedStore');
              localStorage.removeItem('popsySession');
              localStorage.removeItem('userRole');
              window.location.href = createPageUrl('Home');
            }}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'week', label: 'Esta Semana' },
            { value: 'month', label: 'Este Mes' },
            { value: 'all', label: 'Todo' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedPeriod === period.value
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: Sparkles, label: 'Encuestas', value: overallStats.totalSurveys, color: 'pink' },
            { icon: Target, label: 'NPS Global', value: overallStats.nps, color: 'purple' },
            { icon: TrendingUp, label: 'Puntos Totales', value: overallStats.totalPoints, color: 'blue' },
            { icon: Award, label: 'Ventas Sugeridas', value: overallStats.suggestedSales, color: 'emerald' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-lg"
              >
                <Icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* NPS Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg">
            <h3 className="text-lg font-black text-slate-800 mb-4">Distribución NPS Global</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Promotores', value: overallStats.promotores, color: '#10b981' },
                      { name: 'Pasivos', value: overallStats.pasivos, color: '#f59e0b' },
                      { name: 'Detractores', value: overallStats.detractores, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg">
            <h3 className="text-lg font-black text-slate-800 mb-4">Top 10 Anfitriones</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topCashiers.map((cashier, idx) => (
                <div
                  key={cashier.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      idx < 3 ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{cashier.name}</p>
                      <p className="text-xs text-slate-600">{cashier.store}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-purple-600">{cashier.points}</p>
                    <p className="text-xs text-slate-500">NPS: {cashier.nps}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-lg">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-pink-500" />
            Ranking de Tiendas por NPS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-3 text-sm font-bold text-slate-700">#</th>
                  <th className="text-left p-3 text-sm font-bold text-slate-700">Tienda</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Encuestas</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">NPS</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Puntos</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Prom.</th>
                  <th className="text-center p-3 text-sm font-bold text-slate-700">Sugeridos</th>
                </tr>
              </thead>
              <tbody>
                {storesData.map((store, idx) => (
                  <motion.tr
                    key={store.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all"
                  >
                    <td className="p-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                        idx < 3 ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{store.code}</p>
                      <p className="text-xs text-slate-600">{store.name}</p>
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">{store.totalSurveys}</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full font-black text-sm ${
                        store.nps >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        store.nps >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {store.nps}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-purple-600">{store.totalPoints}</td>
                    <td className="p-3 text-center font-semibold text-slate-700">{store.avgPoints}</td>
                    <td className="p-3 text-center">
                      <span className="text-emerald-600 font-bold">{store.suggestedSales}</span>
                      <p className="text-xs text-slate-500">${store.totalSuggested.toLocaleString()}</p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {storesData.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-semibold">No hay datos de experiencia en este período</p>
          </div>
        )}
      </div>
    </div>
  );
}