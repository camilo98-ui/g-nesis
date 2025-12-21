import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Search, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StoresDetailView({ storesAnalysis, formatCurrency }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('salesCompliance');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredStores = storesAnalysis
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mult = sortOrder === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Detalle por Tienda</h1>
        <p className="text-sm text-slate-500">Análisis completo de métricas por punto de venta</p>
      </div>

      {/* Search & Filters */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tienda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600 font-medium">Ordenar por:</span>
              <Button
                size="sm"
                variant={sortBy === 'salesCompliance' ? 'default' : 'outline'}
                onClick={() => handleSort('salesCompliance')}
              >
                Cumplimiento
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'totalSales' ? 'default' : 'outline'}
                onClick={() => handleSort('totalSales')}
              >
                Ventas
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'avgTicket' ? 'default' : 'outline'}
                onClick={() => handleSort('avgTicket')}
              >
                Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map((store, idx) => (
          <motion.div
            key={store.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
              store.status === 'positive' ? 'border-emerald-100 hover:border-emerald-200' :
              store.status === 'negative' ? 'border-amber-100 hover:border-amber-200' :
              'border-rose-100 hover:border-rose-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      store.status === 'positive' ? 'bg-emerald-100' :
                      store.status === 'negative' ? 'bg-amber-100' :
                      'bg-rose-100'
                    }`}>
                      <Store className={`w-5 h-5 ${
                        store.status === 'positive' ? 'text-emerald-600' :
                        store.status === 'negative' ? 'text-amber-600' :
                        'text-rose-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black text-slate-900">{store.name}</CardTitle>
                      <p className="text-xs text-slate-500">{store.code}</p>
                    </div>
                  </div>
                  {store.status === 'positive' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {store.status === 'negative' && <TrendingDown className="w-5 h-5 text-amber-600" />}
                  {store.status === 'critical' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ventas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium">Ventas</span>
                    <span className={`text-sm font-black ${
                      store.salesCompliance >= 90 ? 'text-emerald-600' :
                      store.salesCompliance >= 70 ? 'text-amber-600' :
                      'text-rose-600'
                    }`}>
                      {store.salesCompliance.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(store.totalSales)}</p>
                  <p className="text-xs text-slate-500">Meta: {formatCurrency(store.salesBudget)}</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all ${
                        store.salesCompliance >= 90 ? 'bg-emerald-500' :
                        store.salesCompliance >= 70 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, store.salesCompliance)}%` }}
                    />
                  </div>
                </div>

                {/* Proyección */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Proyección</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      store.projectionCompliance >= 95 ? 'bg-emerald-100 text-emerald-700' :
                      store.projectionCompliance >= 85 ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {store.projectionCompliance.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-1">{formatCurrency(store.projection)}</p>
                </div>

                {/* Ticket & Transacciones */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Ticket Promedio</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(store.avgTicket)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Transacciones</p>
                    <p className="text-sm font-bold text-slate-900">{store.totalTransactions.toLocaleString()}</p>
                  </div>
                </div>

                {/* Días trabajados */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Días trabajados:</span>
                    <span className="font-bold text-slate-700">{store.daysElapsed}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">Ritmo diario:</span>
                    <span className="font-bold text-slate-700">{formatCurrency(store.dailyAvg)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">No se encontraron tiendas con "{search}"</p>
        </div>
      )}
    </motion.div>
  );
}