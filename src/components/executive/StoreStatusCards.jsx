import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, AlertTriangle, TrendingDown, Award, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STORES } from '@/components/StoreSelector';

const STORE_BADGES = {
  top_performer: { emoji: '⭐', label: 'Top Performer', color: 'amber' },
  best_trend: { emoji: '🚀', label: 'Mejor Tendencia', color: 'blue' },
  best_ticket: { emoji: '🧊', label: 'Mejor Ticket', color: 'purple' },
  recovery_star: { emoji: '🔁', label: 'En Recuperación', color: 'emerald' },
  efficiency_king: { emoji: '⚡', label: 'Eficiencia', color: 'cyan' },
  consistency: { emoji: '🎯', label: 'Consistencia', color: 'indigo' }
};

function StoreBadge({ type }) {
  const badge = STORE_BADGES[type];
  if (!badge) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`inline-flex items-center gap-1 px-2 py-1 bg-${badge.color}-100 text-${badge.color}-700 rounded-full text-[10px] font-bold border border-${badge.color}-200`}
    >
      <span>{badge.emoji}</span>
      <span>{badge.label}</span>
    </motion.div>
  );
}

export default function StoreStatusCards({ storesAnalysis, formatCurrency, zoneTotals }) {
  // Asignar badges automáticamente
  const storesWithBadges = React.useMemo(() => {
    const topPerformer = storesAnalysis.reduce((top, s) => !top || s.salesCompliance > top.salesCompliance ? s : top, null);
    const bestTicket = storesAnalysis.reduce((best, s) => !best || s.avgTicket > best.avgTicket ? s : best, null);
    const bestTrend = storesAnalysis.sort((a, b) => b.projectionCompliance - a.projectionCompliance)[0];
    const mostTransactions = storesAnalysis.reduce((best, s) => !best || s.totalTransactions > best.totalTransactions ? s : best, null);

    return storesAnalysis.map(store => {
      const badges = [];
      if (store.code === topPerformer?.code && store.salesCompliance >= 100) badges.push('top_performer');
      if (store.code === bestTicket?.code && store.avgTicket > zoneTotals.totalSales / storesAnalysis.reduce((sum, s) => sum + s.totalTransactions, 0) * 1.1) badges.push('best_ticket');
      if (store.code === bestTrend?.code && store.projectionCompliance >= 100) badges.push('best_trend');
      if (store.code === mostTransactions?.code && store.totalTransactions > 0) badges.push('efficiency_king');
      
      // Recovery star: tiendas que mejoraron mucho vs su histórico
      if (store.salesCompliance >= 85 && store.salesCompliance < 95 && store.projectionCompliance >= 100) {
        badges.push('recovery_star');
      }

      return { ...store, badges };
    });
  }, [storesAnalysis, zoneTotals]);

  const groupedStores = React.useMemo(() => ({
    positive: storesWithBadges.filter(s => s.status === 'positive'),
    negative: storesWithBadges.filter(s => s.status === 'negative'),
    critical: storesWithBadges.filter(s => s.status === 'critical')
  }), [storesWithBadges]);

  return (
    <div className="mb-6">
      <div className="mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">🏪 Clasificación de Tiendas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* En Meta */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-900 font-bold">En Meta (≥90%)</span>
              </div>
              <span className="text-2xl font-black text-emerald-600">{groupedStores.positive.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {groupedStores.positive.length === 0 ? (
              <p className="text-xs text-emerald-600 text-center py-4">Sin tiendas en este rango</p>
            ) : (
              groupedStores.positive.map((store) => (
                <Link 
                  key={store.code}
                  to={`${createPageUrl('Dashboard')}?store=${store.code}`}
                  onClick={() => localStorage.setItem('selectedStore', store.code)}
                >
                  <motion.div
                    whileHover={{ x: 3, scale: 1.01 }}
                    className="bg-white/60 hover:bg-white rounded-lg p-3 cursor-pointer transition-all border border-emerald-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900">{store.name}</p>
                      <span className="text-sm font-black text-emerald-600">{store.salesCompliance.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{formatCurrency(store.totalSales)}</span>
                      <span className="text-emerald-600 font-semibold">+{formatCurrency(store.totalSales - store.salesBudget)}</span>
                    </div>
                    {store.badges.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {store.badges.map(b => <StoreBadge key={b} type={b} />)}
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* En Alerta */}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-900 font-bold">En Alerta (70-89%)</span>
              </div>
              <span className="text-2xl font-black text-amber-600">{groupedStores.negative.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {groupedStores.negative.length === 0 ? (
              <p className="text-xs text-amber-600 text-center py-4">Sin tiendas en este rango</p>
            ) : (
              groupedStores.negative.map((store) => (
                <Link 
                  key={store.code}
                  to={`${createPageUrl('Dashboard')}?store=${store.code}`}
                  onClick={() => localStorage.setItem('selectedStore', store.code)}
                >
                  <motion.div
                    whileHover={{ x: 3, scale: 1.01 }}
                    className="bg-white/60 hover:bg-white rounded-lg p-3 cursor-pointer transition-all border border-amber-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900">{store.name}</p>
                      <span className="text-sm font-black text-amber-600">{store.salesCompliance.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{formatCurrency(store.totalSales)}</span>
                      <span className="text-amber-600 font-semibold">-{formatCurrency(store.salesBudget - store.totalSales)}</span>
                    </div>
                    {store.badges.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {store.badges.map(b => <StoreBadge key={b} type={b} />)}
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Críticas */}
        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-red-900 font-bold">Críticas ({'<'}70%)</span>
              </div>
              <span className="text-2xl font-black text-red-600">{groupedStores.critical.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {groupedStores.critical.length === 0 ? (
              <p className="text-xs text-red-600 text-center py-4">Sin tiendas en este rango</p>
            ) : (
              groupedStores.critical.map((store) => (
                <Link 
                  key={store.code}
                  to={`${createPageUrl('Dashboard')}?store=${store.code}`}
                  onClick={() => localStorage.setItem('selectedStore', store.code)}
                >
                  <motion.div
                    whileHover={{ x: 3, scale: 1.01 }}
                    className="bg-white/60 hover:bg-white rounded-lg p-3 cursor-pointer transition-all border border-red-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900">{store.name}</p>
                      <span className="text-sm font-black text-red-600">{store.salesCompliance.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{formatCurrency(store.totalSales)}</span>
                      <span className="text-red-600 font-semibold">-{formatCurrency(store.salesBudget - store.totalSales)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">Intervención requerida</span>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}