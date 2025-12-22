import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, AlertCircle, CheckCircle, Calendar, Zap, BarChart3, Sparkles, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const GOURMET_FLAVORS = ['Limón N.', 'Maracuyá N.', 'Mandarina N.', 'Vainilla', 'V. Francesa', 'V. Chips', 'Chocolate', 'Belga', 'Frutos', 'Fresa', 'Arequipe', 'Ron'];
const EXCLUSIVO_FLAVORS = ['Cherry', 'Arroz', 'Chicle', 'Brownie', 'Crema Limón', 'M&M', 'Milky', 'Oreo', 'Macadamia', 'Café', 'Yogurt C.'];

export default function SmartOrderPrediction({ allFreezersSlots = [], currentFreezer }) {
  const [activeTab, setActiveTab] = useState('semanal'); // semanal o adicional

  // Análisis completo de todas las neveras
  const fullAnalysis = useMemo(() => {
    if (!allFreezersSlots || allFreezersSlots.length === 0) return { flavors: {}, total: 0, low: 0, empty: 0 };
    
    const analysis = {};
    let totalFilled = 0;
    let lowStock = 0;
    let emptyStock = 0;
    
    allFreezersSlots.forEach(slot => {
      if (slot.is_empty || !slot.flavor_name) return;
      
      const key = slot.flavor_name.toLowerCase().trim();
      if (!analysis[key]) {
        analysis[key] = {
          name: slot.flavor_name,
          type: slot.flavor_type,
          totalCount: 0,
          lowCount: 0,
          emptyCount: 0,
          freezers: new Set()
        };
      }
      
      analysis[key].totalCount++;
      analysis[key].freezers.add(slot.store_id?.split('_F')[1] || '1');
      totalFilled++;
      
      if (slot.stock_level === 'low') {
        analysis[key].lowCount++;
        lowStock++;
      }
      if (slot.stock_level === 'empty') {
        analysis[key].emptyCount++;
        emptyStock++;
      }
    });
    
    return { 
      flavors: Object.values(analysis), 
      total: totalFilled, 
      low: lowStock, 
      empty: emptyStock 
    };
  }, [allFreezersSlots]);

  // Clasificar por rotación y urgencia
  const { urgent, highRotation, mediumRotation, lowRotation } = useMemo(() => {
    const flavors = fullAnalysis.flavors;
    
    return {
      urgent: flavors.filter(f => f.emptyCount > 0 || f.lowCount >= 2).sort((a, b) => b.emptyCount - a.emptyCount),
      highRotation: flavors.filter(f => f.totalCount >= 4 && f.emptyCount === 0).sort((a, b) => (b.lowCount + b.totalCount) - (a.lowCount + a.totalCount)),
      mediumRotation: flavors.filter(f => f.totalCount >= 2 && f.totalCount < 4 && f.emptyCount === 0 && f.lowCount < 2),
      lowRotation: flavors.filter(f => f.totalCount === 1 && f.emptyCount === 0 && f.lowCount === 0)
    };
  }, [fullAnalysis]);

  // Pedido Semanal (robusto)
  const weeklyOrder = useMemo(() => {
    const gourmet = [...urgent.filter(f => GOURMET_FLAVORS.includes(f.name)), ...highRotation.filter(f => GOURMET_FLAVORS.includes(f.name))];
    const exclusivo = [...urgent.filter(f => EXCLUSIVO_FLAVORS.includes(f.name)), ...highRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name))];
    
    // Agregar algunos de rotación media para tener variedad
    const additionalGourmet = mediumRotation.filter(f => GOURMET_FLAVORS.includes(f.name)).slice(0, 2);
    const additionalExclusivo = mediumRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name)).slice(0, 2);
    
    return {
      gourmet: [...gourmet, ...additionalGourmet],
      exclusivo: [...exclusivo, ...additionalExclusivo],
      total: gourmet.length + exclusivo.length + additionalGourmet.length + additionalExclusivo.length
    };
  }, [urgent, highRotation, mediumRotation]);

  // Pedido Adicional (complemento)
  const additionalOrder = useMemo(() => {
    // Solo los que ya se están acabando pero no son urgentes
    const gourmet = mediumRotation.filter(f => GOURMET_FLAVORS.includes(f.name) && f.lowCount === 1);
    const exclusivo = mediumRotation.filter(f => EXCLUSIVO_FLAVORS.includes(f.name) && f.lowCount === 1);
    
    return {
      gourmet,
      exclusivo,
      total: gourmet.length + exclusivo.length
    };
  }, [mediumRotation]);

  const currentOrder = activeTab === 'semanal' ? weeklyOrder : additionalOrder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header con pestañas */}
      <Card className="border-2 border-purple-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">📦 Pronóstico de Pedido</h3>
                <p className="text-xs text-white/80">Análisis inteligente de {fullAnalysis.flavors.length} sabores</p>
              </div>
            </div>
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('semanal')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'semanal' 
                  ? 'bg-white text-purple-600 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Pedido Semanal
            </button>
            <button
              onClick={() => setActiveTab('adicional')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'adicional' 
                  ? 'bg-white text-pink-600 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-1" />
              Adicional
            </button>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Resumen ejecutivo */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <ShoppingCart className="w-5 h-5 text-purple-600 mb-1" />
              <p className="text-2xl font-black text-purple-700">{currentOrder.total}</p>
              <p className="text-[10px] text-purple-600 font-medium">Total Cubetas</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200">
              <Package className="w-5 h-5 text-blue-600 mb-1" />
              <p className="text-2xl font-black text-blue-700">{currentOrder.gourmet.length}</p>
              <p className="text-[10px] text-blue-600 font-medium">Gourmet</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200">
              <Sparkles className="w-5 h-5 text-pink-600 mb-1" />
              <p className="text-2xl font-black text-pink-700">{currentOrder.exclusivo.length}</p>
              <p className="text-[10px] text-pink-600 font-medium">Exclusivo</p>
            </motion.div>
          </div>

          {/* Descripción del pedido */}
          <div className={`p-3 rounded-xl border-2 ${
            activeTab === 'semanal' 
              ? 'bg-purple-50 border-purple-300' 
              : 'bg-pink-50 border-pink-300'
          }`}>
            <p className="text-xs font-bold mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {activeTab === 'semanal' ? 'Pedido Semanal - Robusto' : 'Pedido Adicional - Complemento'}
            </p>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              {activeTab === 'semanal' 
                ? 'Incluye sabores urgentes, alta rotación y variedad estratégica para cubrir toda la semana. Este es tu pedido principal.' 
                : 'Complemento mid-week para reponer lo que ya se está acabando. Mantiene frescura sin sobrestockear.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {/* Sabores Gourmet */}
              {currentOrder.gourmet.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1">
                      🍦 Gourmet ({currentOrder.gourmet.length})
                    </h4>
                    <Progress value={(currentOrder.gourmet.length / GOURMET_FLAVORS.length) * 100} className="h-1.5 w-24" />
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {currentOrder.gourmet.map((flavor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-800 text-sm">{flavor.name}</span>
                          <div className="flex items-center gap-2">
                            {flavor.emptyCount > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                URGENTE
                              </span>
                            )}
                            {flavor.lowCount > 0 && !flavor.emptyCount && (
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                                BAJO
                              </span>
                            )}
                            <span className="font-black text-blue-600">{flavor.totalCount}x</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <span>En {flavor.freezers.size} nevera{flavor.freezers.size > 1 ? 's' : ''}</span>
                          {(flavor.lowCount > 0 || flavor.emptyCount > 0) && (
                            <span className="text-red-600 font-medium">
                              {flavor.emptyCount > 0 ? `${flavor.emptyCount} vacío${flavor.emptyCount > 1 ? 's' : ''}` : ''}
                              {flavor.lowCount > 0 ? ` ${flavor.lowCount} bajo${flavor.lowCount > 1 ? 's' : ''}` : ''}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sabores Exclusivo */}
              {currentOrder.exclusivo.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-pink-700 flex items-center gap-1">
                      ✨ Exclusivo ({currentOrder.exclusivo.length})
                    </h4>
                    <Progress value={(currentOrder.exclusivo.length / EXCLUSIVO_FLAVORS.length) * 100} className="h-1.5 w-24" />
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {currentOrder.exclusivo.map((flavor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-2.5 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-pink-800 text-sm">{flavor.name}</span>
                          <div className="flex items-center gap-2">
                            {flavor.emptyCount > 0 && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                URGENTE
                              </span>
                            )}
                            {flavor.lowCount > 0 && !flavor.emptyCount && (
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                                BAJO
                              </span>
                            )}
                            <span className="font-black text-pink-600">{flavor.totalCount}x</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <span>En {flavor.freezers.size} nevera{flavor.freezers.size > 1 ? 's' : ''}</span>
                          {(flavor.lowCount > 0 || flavor.emptyCount > 0) && (
                            <span className="text-red-600 font-medium">
                              {flavor.emptyCount > 0 ? `${flavor.emptyCount} vacío${flavor.emptyCount > 1 ? 's' : ''}` : ''}
                              {flavor.lowCount > 0 ? ` ${flavor.lowCount} bajo${flavor.lowCount > 1 ? 's' : ''}` : ''}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {currentOrder.total === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-green-600">
                    {activeTab === 'semanal' ? 'Stock completo' : 'No se requiere pedido adicional'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Insights footer */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-start gap-2 text-[10px] text-gray-600 bg-gray-50 rounded-lg p-2">
              <TrendingUp className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-gray-700">Análisis de {fullAnalysis.total} cubetas:</span>{' '}
                {urgent.length > 0 && <span className="text-red-600 font-medium">{urgent.length} urgente{urgent.length > 1 ? 's' : ''}</span>}
                {urgent.length > 0 && highRotation.length > 0 && ', '}
                {highRotation.length > 0 && <span className="text-emerald-600 font-medium">{highRotation.length} alta rotación</span>}
                {(urgent.length > 0 || highRotation.length > 0) && mediumRotation.length > 0 && ', '}
                {mediumRotation.length > 0 && <span className="text-amber-600 font-medium">{mediumRotation.length} media</span>}
                {lowRotation.length > 0 && `, ${lowRotation.length} baja.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}