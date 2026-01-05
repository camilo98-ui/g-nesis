import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, PackageX, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GOURMET_FLAVORS = ['Limón N.', 'Maracuyá N.', 'Mandarina N.', 'Vainilla', 'V. Francesa', 'V. Chips', 'Chocolate', 'Belga', 'Frutos', 'Fresa', 'Arequipe', 'Ron'];
const EXCLUSIVO_FLAVORS = ['Cherry', 'Arroz', 'Chicle', 'Brownie', 'Crema Limón', 'M&M', 'Milky', 'Oreo', 'Macadamia', 'Café', 'Yogurt C.'];

export default function InventoryStatusOverview({ allFreezersSlots = [], rotationAnalysis = {} }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Análisis completo de inventario
  const inventoryAnalysis = useMemo(() => {
    if (!allFreezersSlots || allFreezersSlots.length === 0) {
      return { outOfStock: [], belowMinimum: [], total: 0 };
    }

    const analysis = {};

    // Analizar todos los slots
    allFreezersSlots.forEach((slot) => {
      if (slot.is_empty || !slot.flavor_name) return;

      const key = slot.flavor_name.toLowerCase().trim();
      if (!analysis[key]) {
        analysis[key] = {
          name: slot.flavor_name,
          type: slot.flavor_type,
          totalCount: 0,
          fullCount: 0,
          mediumCount: 0,
          lowCount: 0,
          emptyCount: 0,
          freezers: new Set(),
          rows: new Set()
        };
      }

      analysis[key].totalCount++;
      analysis[key].freezers.add(slot.store_id?.split('_F')[1] || '1');
      analysis[key].rows.add(slot.row);

      if (slot.stock_level === 'full') analysis[key].fullCount++;
      else if (slot.stock_level === 'medium') analysis[key].mediumCount++;
      else if (slot.stock_level === 'low') analysis[key].lowCount++;
      else if (slot.stock_level === 'empty') analysis[key].emptyCount++;
    });

    // Calcular recomendaciones y estado para cada sabor
    const flavorsArray = Object.values(analysis);
    flavorsArray.forEach(flavor => {
      const historicalData = rotationAnalysis[flavor.name.toLowerCase().trim()];
      const stockValue = (flavor.fullCount * 100 + flavor.mediumCount * 60 + flavor.lowCount * 30) / flavor.totalCount;
      flavor.avgStock = stockValue;

      // Calcular mínimos y máximos recomendados
      if (historicalData && historicalData.timesRemoved > 0 && historicalData.avgDaysPerRotation) {
        flavor.avgDaysPerRotation = historicalData.avgDaysPerRotation;
        
        if (historicalData.avgDaysPerRotation <= 3) {
          flavor.maxRecommended = Math.ceil((7 / historicalData.avgDaysPerRotation) * 1.2);
          flavor.minRecommended = Math.ceil((3 / historicalData.avgDaysPerRotation) * 1.1);
        } else if (historicalData.avgDaysPerRotation <= 6) {
          flavor.maxRecommended = Math.ceil((10 / historicalData.avgDaysPerRotation) * 1.15);
          flavor.minRecommended = Math.ceil((4 / historicalData.avgDaysPerRotation));
        } else {
          flavor.maxRecommended = Math.ceil((12 / historicalData.avgDaysPerRotation));
          flavor.minRecommended = Math.ceil((5 / historicalData.avgDaysPerRotation));
        }
      } else {
        flavor.maxRecommended = Math.ceil(flavor.totalCount * 1.5);
        flavor.minRecommended = Math.max(2, Math.ceil(flavor.totalCount * 0.5));
      }

      // Determinar estado
      if (flavor.totalCount > flavor.maxRecommended) {
        flavor.stockStatus = 'exceso';
      } else if (flavor.totalCount < flavor.minRecommended) {
        flavor.stockStatus = 'bajo';
      } else {
        flavor.stockStatus = 'optimo';
      }

      // Determinar línea (Gourmet o Exclusivo)
      if (GOURMET_FLAVORS.includes(flavor.name)) {
        flavor.line = 'gourmet';
      } else if (EXCLUSIVO_FLAVORS.includes(flavor.name)) {
        flavor.line = 'exclusivo';
      } else {
        flavor.line = 'otro';
      }
    });

    // Filtrar sabores agotados (0 unidades en todas las neveras)
    const outOfStock = flavorsArray.filter(f => f.totalCount === 0);

    // Filtrar sabores por debajo del mínimo
    const belowMinimum = flavorsArray.filter(f => f.stockStatus === 'bajo' && f.totalCount > 0);

    return {
      outOfStock,
      belowMinimum,
      total: outOfStock.length + belowMinimum.length
    };
  }, [allFreezersSlots, rotationAnalysis]);

  const { outOfStock, belowMinimum } = inventoryAnalysis;

  // Si no hay problemas, no mostrar nada
  if (outOfStock.length === 0 && belowMinimum.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4">
      <Card className="border-2 border-red-200 shadow-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 p-4 hover:from-red-600 hover:to-orange-600 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-white">⚠️ Alertas de Inventario</h3>
                <p className="text-xs text-white/80">
                  {inventoryAnalysis.total} problema{inventoryAnalysis.total !== 1 ? 's' : ''} detectado{inventoryAnalysis.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}>
              <CardContent className="p-4 space-y-4">
          {/* Sabores Agotados */}
          {outOfStock.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PackageX className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-700">
                  Sabores Agotados ({outOfStock.length})
                </h4>
              </div>
              <div className="space-y-2">
                {outOfStock.map((flavor, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-red-900 text-sm">{flavor.name}</span>
                      <Badge className={flavor.line === 'gourmet' ? 'bg-blue-500' : 'bg-pink-500'}>
                        {flavor.line === 'gourmet' ? '🍦 Gourmet' : '✨ Exclusivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-700">
                      ❌ Sin stock en ninguna nevera • Mínimo recomendado: <span className="font-bold">{flavor.minRecommended}</span> cubetas
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Sabores Por Debajo del Mínimo */}
          {belowMinimum.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                <h4 className="text-sm font-bold text-orange-700">
                  Por Debajo del Mínimo ({belowMinimum.length})
                </h4>
              </div>
              <div className="space-y-2">
                {belowMinimum.map((flavor, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-orange-900 text-sm">{flavor.name}</span>
                      <Badge className={flavor.line === 'gourmet' ? 'bg-blue-500' : 'bg-pink-500'}>
                        {flavor.line === 'gourmet' ? '🍦 Gourmet' : '✨ Exclusivo'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-orange-700">
                        📍 Nevera {Array.from(flavor.freezers).join(', ')} • Bajada {Array.from(flavor.rows).join(', ')}
                      </p>
                      <p className="text-xs text-orange-700">
                        📊 Tienes <span className="font-bold text-red-600">{flavor.totalCount}</span> cubetas • 
                        Mínimo: <span className="font-bold text-orange-600">{flavor.minRecommended}</span> • 
                        Máximo: <span className="font-bold text-green-600">{flavor.maxRecommended}</span>
                      </p>
                      {flavor.avgDaysPerRotation && (
                        <p className="text-xs text-gray-600">
                          🔄 Rotación: {flavor.avgDaysPerRotation.toFixed(1)} días
                        </p>
                      )}
                      <p className="text-xs text-orange-600 font-semibold">
                        ⚠️ Necesitas <span className="font-bold">{flavor.minRecommended - flavor.totalCount}</span> cubetas más
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}