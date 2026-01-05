import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, TrendingUp, TrendingDown, Zap, AlertTriangle, 
  CheckCircle, Loader2, ChevronDown, ChevronUp, Target, Award 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AutoBudgetAdjuster() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleAdjust = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const response = await base44.functions.invoke('adjustBudgetsByPerformance', {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      
      setResults(response.data);
      setExpanded(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al ajustar presupuestos: ' + error.message);
    }
    setLoading(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', minimumFractionDigits: 0 
  }).format(val);

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'Excelente': return 'from-purple-500 to-pink-500';
      case 'Muy Bien': return 'from-green-500 to-emerald-500';
      case 'Bien': return 'from-blue-500 to-cyan-500';
      case 'Regular': return 'from-yellow-500 to-orange-500';
      default: return 'from-red-500 to-rose-500';
    }
  };

  const getClassificationBadge = (classification) => {
    switch (classification) {
      case 'Excelente': return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🏆' };
      case 'Muy Bien': return { bg: 'bg-green-100', text: 'text-green-700', icon: '⭐' };
      case 'Bien': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👍' };
      case 'Regular': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠️' };
      default: return { bg: 'bg-red-100', text: 'text-red-700', icon: '📉' };
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Ajuste Automático Inteligente
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Sistema que analiza el rendimiento y ajusta presupuestos automáticamente con incrementos progresivos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explicación */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            ¿Cómo funciona?
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-purple-600">🏆 Excelente (≥110%):</span>
              <span>+8% incremental diario para crear gran colchón</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-600">⭐ Muy Bien (100-109%):</span>
              <span>+5% incremental diario</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-600">👍 Bien (90-99%):</span>
              <span>+3% incremental diario</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-yellow-600">⚠️ Regular (80-89%):</span>
              <span>+1.5% incremental diario</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-red-600">📉 Mejorar (&lt;80%):</span>
              <span>Sin incremento (100% base)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 italic">
            💡 El incremento es progresivo: aumenta cada día del mes para crear un "súper hábito" de superación
          </p>
        </div>

        {/* Botón de acción */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleAdjust}
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analizando y ajustando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Ajustar Presupuestos Automáticamente
              </>
            )}
          </Button>
        </motion.div>

        {/* Resultados */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Resumen */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-bold text-green-900">{results.message}</h4>
                </div>
                <p className="text-sm text-green-700">
                  Los presupuestos se han ajustado automáticamente según el rendimiento de cada tienda
                </p>
              </div>

              {/* Toggle detalle */}
              <Button
                variant="outline"
                onClick={() => setExpanded(!expanded)}
                className="w-full"
              >
                {expanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                {expanded ? 'Ocultar Detalle' : 'Ver Detalle por Tienda'}
              </Button>

              {/* Detalle expandible */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 max-h-96 overflow-y-auto"
                  >
                    {results.results?.map((store, idx) => {
                      const badge = getClassificationBadge(store.classification);
                      const increaseNum = parseFloat(store.increase);
                      
                      return (
                        <motion.div
                          key={store.store}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`bg-gradient-to-r ${getClassificationColor(store.classification)} p-[2px] rounded-xl`}
                        >
                          <div className="bg-white rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-bold text-gray-800">{store.store}</h5>
                                  <Badge className={`${badge.bg} ${badge.text} border-0`}>
                                    {badge.icon} {store.classification}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{store.storeName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Rendimiento</p>
                                <p className={`text-2xl font-black ${
                                  parseFloat(store.performance) >= 100 ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {store.performance}%
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-1">Ppto Anterior</p>
                                <p className="text-sm font-bold text-gray-700">
                                  {formatCurrency(store.currentBudget)}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3">
                                <p className="text-xs text-purple-600 mb-1 font-bold">Nuevo Ppto</p>
                                <p className="text-sm font-black text-purple-700">
                                  {formatCurrency(store.newMonthlyBudget)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                {increaseNum > 0 ? (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="text-sm font-bold text-gray-700">Incremento</span>
                              </div>
                              <div className="text-right">
                                <p className={`text-xl font-black ${
                                  increaseNum > 0 ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {increaseNum > 0 ? '+' : ''}{store.increase}%
                                </p>
                                <p className="text-xs text-gray-500">
                                  {store.dailyIncrementPercentage}% diario progresivo
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}